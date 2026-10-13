"""Static PostgreSQL parsing/dependency evidence only, NOT a DB replay."""
import hashlib
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

from pglast import ast, parse_sql, split
from pglast.parser import parse_plpgsql_json

ROOT = Path(__file__).resolve().parents[2]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('baseline_builder', ROOT / 'scripts/db/build-migration-baseline.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
snapshot = json.loads((ROOT / 'docs/db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json').read_text(encoding='utf-8'))
extras = json.loads((ROOT / 'docs/db-baseline/AND_OS_PROD_APP_EXTRAS_2026-10-13.json').read_text(encoding='utf-8'))
assert extras['capture_kind'] == 'POSTGRES_APP_CATALOG_EXTRAS_ONLY'
assert all(extras[k] == 0 for k in ('procedures', 'foreign_tables', 'composite_types', 'custom_rules', 'custom_collations', 'custom_operators'))
files = sorted((ROOT / 'supabase/migrations').glob('*.sql'))
assert [p.name for p in files] == ['20261013000000_prod_baseline.sql', '20261013000100_auth_account_boundary.sql',
                                  '20261013000200_estimate_role_boundary.sql', '20261013000300_contract_integrity.sql',
                                  '20261013000400_cost_rpc_canonical.sql']
baseline = files[0].read_text(encoding='utf-8')
assert baseline == builder.generate_baseline(snapshot), 'Baseline differs from exact capture generator'
known = {t['name'] for t in snapshot['tables']} | {f['name'] for f in snapshot['functions']} | {'staff_estimates_view', 'and_os_contract_manifest_guard'}
checks = []
seen_tables = set()
seen_functions = set()
function_counts = Counter()
for file in files:
    sql = file.read_text(encoding='utf-8')
    assert not re.search(r'\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_[A-Za-z0-9_-]+|sbp_[A-Za-z0-9]{20,}', sql)
    assert 'and_os_2b_test_marker' not in sql and 'test_cost_mutation_gate' not in sql
    parsed = parse_sql(sql)
    assert parsed[0].stmt.kind.name == 'TRANS_STMT_BEGIN' and parsed[-1].stmt.kind.name == 'TRANS_STMT_COMMIT'
    per_file_functions = set()
    body_count = 0
    for statement in split(sql):
        node = parse_sql(statement)[0].stmt
        assert not isinstance(node, (ast.InsertStmt, ast.UpdateStmt, ast.DeleteStmt, ast.TruncateStmt)), 'Top-level business DML forbidden'
        if isinstance(node, ast.CreateStmt):
            assert node.relation.relname not in seen_tables
            seen_tables.add(node.relation.relname)
        if isinstance(node, ast.CreateFunctionStmt):
            name = node.funcname[-1].sval
            signature = (name, tuple(str(p.argType) for p in (node.parameters or ()) if p.mode.name in ('FUNC_PARAM_IN', 'FUNC_PARAM_INOUT', 'FUNC_PARAM_DEFAULT')))
            assert signature not in per_file_functions, 'Duplicate function signature in one migration'
            per_file_functions.add(signature)
            function_counts[name] += 1
            options = {o.defname: o.arg for o in node.options}
            body = options['as'][0].sval
            language = options['language'].sval
            if language == 'plpgsql':
                parse_plpgsql_json(statement)
            elif language == 'sql':
                parse_sql(body)
            else:
                raise AssertionError('Unreviewed function language')
            body_count += 1
            if options.get('security'):
                assert 'search_path' in statement.lower(), 'Definer missing explicit search_path'
            refs = set(re.findall(r'\bpublic\.([A-Za-z_][A-Za-z_0-9]*)', body))
            assert refs <= known, f'Unresolved named public references: {refs-known}'
            # All tables precede RPC declarations; SQL helper callees must exist.
            assert (refs & {t['name'] for t in snapshot['tables']}) <= seen_tables
            if language == 'sql':
                assert (refs & {f['name'] for f in snapshot['functions']}) <= seen_functions
            seen_functions.add(name)
    checks.append({'file': file.name, 'statements': len(parsed), 'parsed_function_bodies': body_count,
                   'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'result': 'PASS'})
assert seen_tables == {t['name'] for t in snapshot['tables']}
roles = files[2].read_text(encoding='utf-8')
assert 'DROP POLICY "authenticated estimates access"' in roles
assert 'DROP POLICY "profiles_select_own"' in roles
assert 'test_estimate' not in roles and 'test_profile' not in roles
assert 'staff_estimates_view' in roles and 'security_barrier = true' in roles
assert 'REVOKE ALL ON public.cost_item_history, public.cost_publish_log' in roles
contract = files[3].read_text(encoding='utf-8')
assert 'and_os_contract_manifest_guard' in contract and "'CHANGE_PENDING'" in contract
assert 'extensions.digest' in contract and "'sha256'::text" in contract
cost = files[4].read_text(encoding='utf-8')
assert 'for update' in cost and "'NaN','Infinity','-Infinity'" in cost
assert "hashtext('and_os_cost_publish')" in cost and 'v_sequence > 999' in cost
for name, expected in {'cost_items_v2_3.sql': '2d8e57d464a5a1a942d816b8f419ec98cc4f8a78ef83eb8293c732af5c3e3ccf',
                       'rfc_003a_user_profiles.sql': 'fb2d2249a6271cb8f8f90aaf89b832770ece52b43ef57531c2864e56e6f11fdf'}.items():
    assert hashlib.sha256((ROOT / 'supabase/archive' / name).read_bytes()).hexdigest() == expected
    assert not (ROOT / 'supabase' / name).exists()
# Audit all historical and test SQL with the same SQL parser, without executing.
historical = sorted((ROOT / 'supabase').rglob('*.sql')) + [p for p in sorted((ROOT / 'tests/os/db').rglob('*.sql'))
    if 'rebuild/supabase/migrations/' not in p.as_posix() and '/artifacts/' not in p.as_posix()]
for path in historical:
    parse_sql(path.read_text(encoding='utf-8-sig'))
for query in (ROOT / 'scripts/db').glob('capture-*.sql'):
    assert all(isinstance(s.stmt, ast.SelectStmt) for s in parse_sql(query.read_text(encoding='utf-8'))), 'Capture must remain SELECT-only'
report = {'result': 'PASS', 'mode': 'OFFLINE STATIC ONLY; no SQL/database execution', 'checks': checks,
          'historical_and_test_sql_parsed': len(historical), 'baseline_tables': len(seen_tables),
          'baseline_functions': len(snapshot['functions']), 'function_definitions': dict(function_counts),
          'unresolved_named_public_references': [], 'archive_hashes_unchanged': True,
          'unsupported_production_object_classes': 'all zero in supplemental catalog capture',
          'limitations': ['No relation/type/ACL execution resolution until Phase 4C.',
                          'PL/pgSQL syntax parsed, not run; no claim of blank replay or runtime security PASS.',
                          'New captured legacy-table closures and exact Production policy removals require 4C tests.',
                          'Managed Supabase auth/roles/extensions/default privileges are prerequisites, not app-owned objects.']}
(ROOT / 'docs/db-baseline/AND_OS_MIGRATION_STATIC_REVIEW_2026-10-13.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(report, indent=2))

"""Promote reviewed candidate statements offline; no database connections."""
import hashlib
import json
from pathlib import Path

from pglast import ast, parse_sql, split

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'supabase/migrations'
CAPTURE = json.loads((ROOT / 'docs/db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json').read_text(encoding='utf-8'))


def statements(path):
    return list(split((ROOT / path).read_text(encoding='utf-8-sig')))


def function_name(statement):
    node = parse_sql(statement)[0].stmt
    return node.funcname[-1].sval if isinstance(node, ast.CreateFunctionStmt) else None


def write(name, purpose, items):
    source = '-- Forward migration: ' + purpose + '\n-- Not applied to Production; Phase 4C replay required.\nBEGIN;\nSET LOCAL search_path = pg_catalog, public, extensions;\n\n'
    cleaned = []
    for item in items:
        lines = item.strip().splitlines()
        while lines and (not lines[0].strip() or lines[0].lstrip().startswith('--')):
            lines.pop(0)
        cleaned.append('\n'.join(lines).rstrip(';') + ';')
    source += '\n\n'.join(cleaned) + '\n\nCOMMIT;\n'
    parse_sql(source)
    (OUT / name).write_text(source, encoding='utf-8', newline='\n')


role_source = statements('tests/os/db/patches/role-boundaries.PROPOSED.sql')
first_table = next(i for i, s in enumerate(role_source) if isinstance(parse_sql(s)[0].stmt, ast.AlterTableStmt))
auth = role_source[:first_table]
write('20261013000100_auth_account_boundary.sql', 'account-state-aware helper before all dependent policies/RPCs', auth)

roles = []
# Remove actual Production policies, not only fixture policy names. Permissive
# policies OR together: leaving the original ALL/true policy would bypass hardening.
for table in CAPTURE['tables']:
    if table['name'] in ('profiles', 'estimates'):
        roles += [f'DROP POLICY "{p["policyname"]}" ON public."{table["name"]}"' for p in table['policies']]
for stmt in role_source[first_table:]:
    node = parse_sql(stmt)[0].stmt
    if isinstance(node, ast.DropStmt):
        continue
    stmt = stmt.replace('CREATE OR REPLACE VIEW', 'CREATE VIEW').replace('create or replace view', 'create view')
    for old, new in [('test_profile_self_read', 'and_os_profile_self_read'), ('test_estimate_read', 'and_os_estimate_read'),
                     ('test_estimate_insert', 'and_os_estimate_insert'), ('test_estimate_update', 'and_os_estimate_update'),
                     ('test_estimate_delete', 'and_os_estimate_delete')]:
        stmt = stmt.replace(old, new)
    if isinstance(node, ast.CreatePolicyStmt) and node.table.relname == 'cost_items':
        # The captured select policy already has the same role predicate.
        continue
    roles.append(stmt)
roles += ['ALTER VIEW public.staff_estimates_view OWNER TO postgres',
          'REVOKE ALL ON public.cost_item_history, public.cost_publish_log FROM PUBLIC, anon, authenticated',
          'GRANT SELECT ON public.cost_item_history, public.cost_publish_log TO authenticated']
# Captured legacy relations expose sensitive costs/memos through ALL/true RLS.
# No current app reads/writes these relations (targeted runtime search). Preserve
# rows/schema, allow internal role reads, reserve writes to service_role.
for table in CAPTURE['tables']:
    if table['name'] not in ('customers', 'projects', 'estimate_items'):
        continue
    target = 'public.' + table['name']
    roles += [f'DROP POLICY "{p["policyname"]}" ON {target}' for p in table['policies']]
    roles += [f'REVOKE ALL ON {target} FROM PUBLIC, anon, authenticated',
              f'GRANT SELECT ON {target} TO authenticated', f'GRANT ALL ON {target} TO service_role',
              f"CREATE POLICY and_os_{table['name']}_internal_read ON {target} FOR SELECT TO authenticated USING (public.current_and_os_role() IN ('admin','manager'))"]
write('20261013000200_estimate_role_boundary.sql', 'actual Production policies + verified staff whitelist and legacy raw-REST closure', roles)

contract = [s for s in statements('tests/os/db/patches/contract-manifest-lock.PROPOSED.sql')
            if not isinstance(parse_sql(s)[0].stmt, (ast.DoStmt, ast.DropStmt))]
contract = [s.replace('proposed_contract_manifest_guard', 'and_os_contract_manifest_guard')
              .replace('create or replace function', 'create function') for s in contract]
contract += ['ALTER FUNCTION public.and_os_contract_manifest_guard() OWNER TO postgres',
             'REVOKE ALL ON FUNCTION public.and_os_contract_manifest_guard() FROM service_role']
# These three tracked, Phase-2-tested RPCs differ from Production only in explicit
# pgcrypto qualification/type casts. Keep the body/data/hash inputs unchanged.
contract += [s for s in statements('supabase/rfc_006_contract_documents.sql')
             if function_name(s) in ('create_contract_package_snapshot', 'create_contract_change_order', 'approve_contract_change_order')]
write('20261013000300_contract_integrity.sql', 'verified immutable manifest guard and qualified pgcrypto RPC bodies', contract)

cost = []
for stmt in statements('tests/os/db/patches/cost-rpc.PROPOSED_CANONICAL.sql'):
    if isinstance(parse_sql(stmt)[0].stmt, (ast.DoStmt, ast.DropStmt)):
        continue
    cost.append(stmt)
write('20261013000400_cost_rpc_canonical.sql', 'captured behavior plus verified row lock/finite validation/version lock/ACL hardening', cost)

manifest = []
for file in sorted(OUT.glob('*.sql')):
    manifest.append({'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
                     'statements': len(parse_sql(file.read_text(encoding='utf-8')))})
(ROOT / 'docs/db-baseline/AND_OS_MIGRATION_MANIFEST_2026-10-13.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(manifest, indent=2))

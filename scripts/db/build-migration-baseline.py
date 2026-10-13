"""Offline, fail-closed generation from a user-exported catalog-only CSV.

Requires pglast (PostgreSQL parser). Never connects to a database.
"""
import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

from pglast import ast, parse_sql, split


def ident(value):
    return '"' + value.replace('"', '""') + '"'


def normalize(value):
    return re.sub(r"\s+", " ", value.replace("\r\n", "\n")).strip()


def function_body(statement):
    node = parse_sql(statement)[0].stmt
    assert isinstance(node, ast.CreateFunctionStmt)
    return next(o.arg[0].sval for o in node.options if o.defname == 'as')


def acl(target, entries, owner):
    # Managed Supabase roles exist already. Explicit reset also removes ambient defaults.
    roles = {'PUBLIC', 'anon', 'authenticated', 'service_role', owner}
    parsed = []
    names = {'a': 'INSERT', 'r': 'SELECT', 'w': 'UPDATE', 'd': 'DELETE',
             'D': 'TRUNCATE', 'x': 'REFERENCES', 't': 'TRIGGER', 'm': 'MAINTAIN',
             'X': 'EXECUTE', 'U': 'USAGE', 'C': 'CREATE'}
    for entry in entries:
        match = re.fullmatch(r'([A-Za-z0-9_]*)=([A-Za-z*]+)/([A-Za-z0-9_]+)', entry)
        assert match, f'Unsupported ACL: {entry}'
        role, privileges, grantor = match.groups()
        assert grantor == owner, 'Non-owner grant provenance needs explicit review'
        role = role or 'PUBLIC'
        roles.add(role)
        assert '*' not in privileges, 'Grant options need explicit review'
        parsed.append((role, [names[p] for p in privileges]))
    quote_role = lambda r: 'PUBLIC' if r == 'PUBLIC' else ident(r)
    output = [f'REVOKE ALL ON {target} FROM ' + ', '.join(quote_role(r) for r in sorted(roles)) + ';']
    for role, privileges in parsed:
        output.append(f'GRANT {", ".join(privileges)} ON {target} TO {quote_role(role)};')
    return output


def generate_baseline(snapshot):
    assert snapshot['capture_kind'] == 'POSTGRES_APP_CATALOG_ONLY'
    assert snapshot['server_version'].startswith('17.'), 'PG17 MAINTAIN is intentionally preserved'
    assert not snapshot['types'] and not snapshot['views'] and not snapshot['sequences'], 'New object classes require generator review'
    expected = {'customers', 'projects', 'estimate_items', 'estimates', 'profiles',
                'cost_items', 'cost_item_history', 'cost_publish_log', 'os_audit_logs',
                'estimate_document_options', 'standard_spec_catalog', 'contract_package_snapshots',
                'contract_document_versions', 'change_orders', 'change_order_approvals'}
    assert {t['name'] for t in snapshot['tables']} == expected
    assert len(snapshot['functions']) == 24
    output = ['-- Exact app-owned Production baseline; schema only, not a security upgrade.',
              '-- Captured ' + snapshot['captured_at'] + '; managed Supabase PostgreSQL 17 required.',
              '-- Existing Production must ADOPT this version, never replay this CREATE baseline.',
              '-- Auth/storage schemas and platform default privileges remain managed prerequisites.',
              'BEGIN;', 'SET LOCAL search_path = pg_catalog, public, extensions;',
              "DO $$ BEGIN IF current_setting('server_version_num')::integer < 170000 THEN RAISE EXCEPTION 'PostgreSQL 17+ required'; END IF; END $$;",
              'CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;',
              'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;']
    # Defaults may call app functions, while RPC return types depend on tables.
    # Create all row types first, then functions, then defaults and constraints.
    for table in snapshot['tables']:
        assert table['schema'] == 'public' and table['kind'] == 'r' and not table['options'] and not table['parents']
        columns = []
        for col in table['columns']:
            assert not col['identity'] and not col['generated'] and not col['acl'] and not col['collation']
            columns.append(f"{ident(col['name'])} {col['type']}" + ('' if col['nullable'] else ' NOT NULL'))
        output.append(f"CREATE TABLE public.{ident(table['name'])} (\n  " + ',\n  '.join(columns) + '\n);')
        output.append(f"ALTER TABLE public.{ident(table['name'])} OWNER TO {ident(table['owner'])};")
    for function in snapshot['functions']:
        definition = function['definition'].replace('CREATE OR REPLACE FUNCTION', 'CREATE FUNCTION', 1).rstrip().rstrip(';')
        output.append(definition + ';')
        output.append(f"ALTER FUNCTION public.{ident(function['name'])}({function['identity_arguments']}) OWNER TO {ident(function['owner'])};")
    for table in snapshot['tables']:
        target = f"public.{ident(table['name'])}"
        for col in table['columns']:
            if col['default'] is not None:
                output.append(f"ALTER TABLE {target} ALTER COLUMN {ident(col['name'])} SET DEFAULT {col['default']};")
    for foreign in (False, True):
        for table in snapshot['tables']:
            for con in table['constraints']:
                if (con['type'] == 'f') != foreign:
                    continue
                assert con['validated'], 'Unvalidated constraints require review'
                output.append(f"ALTER TABLE public.{ident(table['name'])} ADD CONSTRAINT {ident(con['name'])} {con['definition']};")
    for table in snapshot['tables']:
        target = f"public.{ident(table['name'])}"
        for index in table['indexes']:
            assert index['valid']
            if not index['constraint_backed']:
                output.append(index['definition'] + ';')
        for trigger in table['triggers']:
            assert trigger['enabled'] == 'O', 'Non-default trigger state requires review'
            output.append(trigger['definition'] + ';')
        output.extend([f"ALTER TABLE {target} {'ENABLE' if table['rls_enabled'] else 'DISABLE'} ROW LEVEL SECURITY;",
                       f"ALTER TABLE {target} {'FORCE' if table['rls_forced'] else 'NO FORCE'} ROW LEVEL SECURITY;"])
        for policy in table['policies']:
            stmt = f"CREATE POLICY {ident(policy['policyname'])} ON {target} AS {policy['permissive']} FOR {policy['cmd']} TO "
            stmt += ', '.join('PUBLIC' if r == 'public' else ident(r) for r in policy['roles'])
            if policy['qual'] is not None:
                stmt += f" USING ({policy['qual']})"
            if policy['with_check'] is not None:
                stmt += f" WITH CHECK ({policy['with_check']})"
            output.append(stmt + ';')
        output.extend(acl('TABLE ' + target, table['effective_acl'], table['owner']))
    for function in snapshot['functions']:
        target = f"FUNCTION public.{ident(function['name'])}({function['identity_arguments']})"
        output.extend(acl(target, function['effective_acl'], function['owner']))
    output.append('COMMIT;')
    return ('\n\n'.join(output) + '\n').replace('\r\n', '\n')


def build_inventory(root, snapshot):
    files = sorted((root / 'supabase').glob('*.sql')) + sorted((root / 'supabase/archive').glob('*.sql'))
    definitions = {}
    file_inventory = []
    for path in files:
        source = path.read_text(encoding='utf-8-sig')
        statements = split(source)
        for statement in statements:
            node = parse_sql(statement)[0].stmt
            if isinstance(node, ast.CreateFunctionStmt):
                name = node.funcname[-1].sval
                definitions.setdefault(name, []).append((str(path.relative_to(root)).replace('\\', '/'), function_body(statement)))
        file_inventory.append({'file': str(path.relative_to(root)).replace('\\', '/'),
                               'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'statements': len(statements)})
    functions = []
    for f in snapshot['functions']:
        matches = [p for p, body in definitions.get(f['name'], []) if normalize(body) == normalize(function_body(f['definition']))]
        functions.append({'name': f['name'], 'arguments': f['identity_arguments'],
                          'classification': 'REPO_MATCH' if matches else 'REPO_MISSING',
                          'body_matches': matches, 'repository_definitions': [p for p, _ in definitions.get(f['name'], [])],
                          'security_definer': f['security_definer'], 'owner': f['owner'],
                          'search_path': f['proconfig'], 'effective_acl': f['effective_acl']})
    objects = []
    for table in snapshot['tables']:
        objects.append({'object': 'public.' + table['name'], 'kind': 'table', 'classification': 'PROD_BASELINE', 'canonical': '20261013000000_prod_baseline.sql'})
        for collection in ('columns', 'constraints', 'indexes', 'triggers', 'policies'):
            for child in table[collection]:
                objects.append({'object': 'public.' + table['name'] + '.' + child.get('name', child.get('policyname')),
                                'kind': collection, 'classification': 'PROD_BASELINE', 'canonical': '20261013000000_prod_baseline.sql'})
        objects.append({'object': 'public.' + table['name'] + ':ACL/RLS', 'kind': 'table_security', 'classification': 'PROD_BASELINE', 'canonical': '20261013000000_prod_baseline.sql'})
    for f in functions:
        objects.append({'object': 'public.' + f['name'] + '(' + f['arguments'] + ')', 'kind': 'function',
                        'classification': f['classification'], 'comparison_scope': 'normalized body only; exact headers/ACLs retained in capture',
                        'canonical': '20261013000000_prod_baseline.sql'})
    for name, kind, source in [('current_and_os_role', 'function replacement', 'auth_account_boundary'),
                               ('staff_estimates_view', 'view', 'estimate_role_boundary'),
                               ('and_os_contract_manifest_guard', 'function/trigger', 'contract_integrity'),
                               ('save_cost_item_draft', 'function replacement', 'cost_rpc_canonical'),
                               ('next_cost_publish_version', 'function replacement', 'cost_rpc_canonical')]:
        objects.append({'object': 'public.' + name, 'kind': kind, 'classification': 'LOCAL_CANDIDATE', 'canonical': source})
    return {'captured_at': snapshot['captured_at'], 'files': file_inventory, 'functions': functions, 'objects': objects,
            'tables': [{'name': t['name'], 'classification': 'PROD_BASELINE',
                        'columns': len(t['columns']), 'constraints': len(t['constraints']),
                        'indexes': len(t['indexes']), 'triggers': len(t['triggers']), 'policies': len(t['policies']),
                        'rls_enabled': t['rls_enabled'], 'rls_forced': t['rls_forced'], 'effective_acl': t['effective_acl']}
                       for t in snapshot['tables']]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_csv', type=Path)
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    csv.field_size_limit(10_000_000)
    with args.input_csv.open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    assert len(rows) == 1 and set(rows[0]) == {'metadata_snapshot'}
    snapshot = json.loads(rows[0]['metadata_snapshot'])
    raw = json.dumps(snapshot, ensure_ascii=False)
    assert not re.search(r'\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_[A-Za-z0-9_-]+', raw), 'Possible credential'
    out = args.root / 'docs/db-baseline'
    out.mkdir(parents=True, exist_ok=True)
    capture = out / 'AND_OS_PROD_APP_SCHEMA_2026-10-13.json'
    capture.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    migration = args.root / 'supabase/migrations/20261013000000_prod_baseline.sql'
    migration.write_text(generate_baseline(snapshot), encoding='utf-8', newline='\n')
    inventory = build_inventory(args.root, snapshot)
    inventory['capture_sha256'] = hashlib.sha256(capture.read_bytes()).hexdigest()
    (out / 'AND_OS_DB_OBJECT_INVENTORY_2026-10-13.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    parse_sql(migration.read_text(encoding='utf-8'))
    print(json.dumps({'tables': len(snapshot['tables']), 'functions': len(snapshot['functions']),
                      'capture_sha256': inventory['capture_sha256'], 'migration': str(migration)}, ensure_ascii=False))


if __name__ == '__main__':
    main()

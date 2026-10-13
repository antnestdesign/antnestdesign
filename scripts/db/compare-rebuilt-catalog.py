"""Compare owned runtime catalog with captured baseline and reviewed forwards."""
import argparse
import hashlib
import json
from pathlib import Path

from pglast import ast, parse_sql, split

ROOT = Path(__file__).resolve().parents[2]


def clean(value):
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items() if k not in ('oid', 'index_oid', 'captured_at', 'server_version')}
    if isinstance(value, list):
        return [clean(v) for v in value]
    if isinstance(value, str):
        return value.replace('\r\n', '\n')
    return value


def app_catalog(s):
    result = {k: clean(s[k]) for k in ('tables', 'functions', 'views', 'sequences', 'types')}
    for table in result['tables']:
        table['effective_acl'].sort()
    for f in result['functions']:
        f['effective_acl'].sort()
    return result


def body(statement):
    node = parse_sql(statement)[0].stmt
    return '\n'.join(line.strip() for line in next(o.arg[0].sval for o in node.options if o.defname == 'as').replace('\r\n', '\n').splitlines()).strip()


def type_name(node):
    return '.'.join(n.sval for n in node.names if n.sval not in ('public', 'pg_catalog'))


def function_model(statement):
    node = parse_sql(statement)[0].stmt
    opts = {o.defname: o.arg for o in node.options}
    config = []
    for o in node.options:
        if o.defname == 'set':
            config.append(o.arg.name + '=' + ', '.join(v.val.sval for v in o.arg.args))
    return {'body': body(statement), 'language': opts['language'].sval,
            'security_definer': bool(opts.get('security', False)),
            'volatility': opts['volatility'].sval[0] if 'volatility' in opts else 'v',
            'config': config or None, 'return_type': type_name(node.returnType),
            'parameters': [(p.name, type_name(p.argType), p.mode.name) for p in (node.parameters or ())]}


def fingerprint(s):
    return hashlib.sha256(json.dumps(app_catalog(s), ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def verify(actual, baseline, final):
    if not final:
        for kind in ('tables', 'functions', 'views', 'sequences', 'types'):
            assert app_catalog(actual)[kind] == app_catalog(baseline)[kind], f'Exact baseline {kind} differs'
        return
    assert len(actual['tables']) == 15 and len(actual['functions']) == 25 and len(actual['views']) == 1
    assert not actual['sequences'] and not actual['types']
    expected_functions = {f['name']: f['definition'] for f in baseline['functions']}
    for file in sorted((ROOT / 'supabase/migrations').glob('*.sql'))[1:]:
        for stmt in split(file.read_text(encoding='utf-8')):
            node = parse_sql(stmt)[0].stmt
            if isinstance(node, ast.CreateFunctionStmt):
                expected_functions[node.funcname[-1].sval] = stmt
    assert set(expected_functions) == {f['name'] for f in actual['functions']}
    for f in actual['functions']:
        assert function_model(f['definition']) == function_model(expected_functions[f['name']]), f'Canonical function differs: {f["name"]}'
        assert f['owner'] == 'postgres'
        assert f['security_definer'] == function_model(expected_functions[f['name']])['security_definer']
    by_name = {t['name']: t for t in actual['tables']}
    mutable_security = {'profiles', 'estimates', 'customers', 'projects', 'estimate_items', 'cost_items', 'cost_item_history', 'cost_publish_log'}
    for before in baseline['tables']:
        after = by_name[before['name']]
        for key in ('columns', 'constraints', 'indexes', 'rls_enabled', 'rls_forced', 'owner', 'options', 'parents', 'partition_key', 'partition_bound'):
            assert clean(before[key]) == clean(after[key]), f'Table {before["name"]} {key} changed unexpectedly'
        if before['name'] not in mutable_security:
            assert clean(before['policies']) == clean(after['policies'])
            assert sorted(before['effective_acl']) == sorted(after['effective_acl'])
        else:
            names = {p['policyname'] for p in after['policies']}
            if before['name'] == 'estimates':
                assert names == {'and_os_estimate_read', 'and_os_estimate_insert', 'and_os_estimate_update', 'and_os_estimate_delete'}
            elif before['name'] == 'profiles':
                assert names == {'and_os_profile_self_read'}
            elif before['name'] in ('customers', 'projects', 'estimate_items'):
                assert names == {'and_os_' + before['name'] + '_internal_read'}
            else:
                assert clean(before['policies']) == clean(after['policies'])
            expected_acl = {'postgres=arwdDxtm/postgres', 'service_role=arwdDxtm/postgres',
                            'authenticated=arwd/postgres' if before['name'] == 'estimates' else 'authenticated=r/postgres'}
            assert set(after['effective_acl']) == expected_acl, before['name'] + ' ACL drift'
        triggers = [g for g in after['triggers'] if g['name'] != 'and_os_contract_manifest_guard']
        assert clean(before['triggers']) == clean(triggers), before['name'] + ' trigger drift'
    guard = next(g for g in by_name['contract_package_snapshots']['triggers'] if g['name'] == 'and_os_contract_manifest_guard')
    assert guard['enabled'] == 'O' and guard['called_function'] == 'and_os_contract_manifest_guard()'
    assert 'BEFORE UPDATE' in guard['definition']
    assert actual['views'][0]['name'] == 'staff_estimates_view' and 'security_barrier=true' in actual['views'][0]['options']
    prior = {f['name']: f for f in baseline['functions']}
    for f in actual['functions']:
        if f['name'] in ('and_os_contract_manifest_guard', 'and_os_require_cost_rpc_mutation'):
            assert set(f['effective_acl']) == {'postgres=X/postgres'}
        elif f['name'] in ('current_and_os_role', 'is_and_os_admin'):
            assert set(f['effective_acl']) == {'postgres=X/postgres', 'authenticated=X/postgres', 'service_role=X/postgres'}
        else:
            assert sorted(f['effective_acl']) == sorted(prior[f['name']]['effective_acl'])


parser = argparse.ArgumentParser()
parser.add_argument('capture', type=Path)
parser.add_argument('--final', action='store_true')
args = parser.parse_args()
actual = json.loads(args.capture.read_text(encoding='utf-8-sig'))
baseline = json.loads((ROOT / 'docs/db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json').read_text(encoding='utf-8'))
verify(actual, baseline, args.final)
print(json.dumps({'result':'PASS', 'phase':'final' if args.final else 'baseline', 'fingerprint':fingerprint(actual),
                  'tables':len(actual['tables']), 'functions':len(actual['functions']),
                  'columns':sum(len(t['columns']) for t in actual['tables']), 'constraints':sum(len(t['constraints']) for t in actual['tables']),
                  'indexes':sum(len(t['indexes']) for t in actual['tables']), 'triggers':sum(len(t['triggers']) for t in actual['tables']),
                  'policies':sum(len(t['policies']) for t in actual['tables']), 'views':len(actual['views'])}))

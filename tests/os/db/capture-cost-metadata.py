"""Convert the catalog-only Dashboard CSV to credential-free baseline artifacts."""
import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("input_csv", type=Path)
parser.add_argument("--root", type=Path, required=True)
args = parser.parse_args()
with args.input_csv.open(encoding="utf-8-sig", newline="") as stream:
    rows = list(csv.DictReader(stream))
assert len(rows) == 1 and set(rows[0]) == {"metadata_snapshot"}
snapshot = json.loads(rows[0]["metadata_snapshot"])
assert snapshot["capture_kind"] == "POSTGRES_CATALOG_ONLY"
assert {t["name"] for t in snapshot["tables"]} == {"cost_items", "cost_item_history", "cost_publish_log"}
raw = json.dumps(snapshot, ensure_ascii=False)
assert not re.search(r"\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_[A-Za-z0-9_-]+", raw), "Possible credential: do not export"
output = args.root / "docs/db-baseline"
output.mkdir(parents=True, exist_ok=True)
base = "AND_OS_PROD_COST_SCHEMA_2026-10-12"
snapshot_path = output / f"{base}.json"
snapshot_path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

def ident(value):
    return '"' + value.replace('"', '""') + '"'

def literal(value):
    return "'" + value.replace("'", "''") + "'"

def acl_sql(target, acl, function=False):
    statements = [f"revoke all on {target} from public, anon, authenticated, service_role;"]
    for item in acl:
        match = re.fullmatch(r"([A-Za-z0-9_]*)=([A-Za-z*]+)/([A-Za-z0-9_]+)", item)
        assert match, "Unsupported ACL representation"
        role, privileges, _ = match.groups()
        role = ident(role) if role else "public"
        if function:
            assert set(privileges) <= {"X", "*"}
            if "X" in privileges:
                statements.append(f"grant execute on {target} to {role};")
        else:
            names = {"a":"insert", "r":"select", "w":"update", "d":"delete", "D":"truncate", "x":"references", "t":"trigger"}
            assert "*" not in privileges, "Grant-option ACL requires separate review"
            if "m" in privileges:
                statements.append("-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.")
            statements.append(f"grant {', '.join(names[p] for p in privileges if p != 'm')} on {target} to {role};")
    return statements

install = ["-- CAPTURED PRODUCTION METADATA; LOCAL TEST INSTALL ONLY. NO PRICE SEEDS OR BUSINESS ROWS.",
           "-- Generated from the JSON baseline; not a production migration.",
           "do $$ begin if not exists(select 1 from public.and_os_2b_test_marker where project_id='and-os-security-test') then raise exception 'Owned local test DB required'; end if; end $$;"]
for table in snapshot["tables"]:
    target = f"public.{ident(table['name'])}"
    columns = []
    for col in table["columns"]:
        assert not col["identity"] and not col["generated"] and col["acl"] is None
        declaration = f"{ident(col['name'])} {col['type']}"
        if col["default"] is not None:
            declaration += f" default {col['default']}"
        if not col["nullable"]:
            declaration += " not null"
        columns.append(declaration)
    install.append(f"create table if not exists {target} (\n  " + ",\n  ".join(columns) + "\n);")
    for col, declaration in zip(table["columns"], columns):
        install.append(f"alter table {target} add column if not exists {declaration};")
        install.append(f"alter table {target} alter column {ident(col['name'])} " + ("drop not null;" if col["nullable"] else "set not null;"))
        install.append(f"alter table {target} alter column {ident(col['name'])} " + ("drop default;" if col["default"] is None else f"set default {col['default']};"))
for table in snapshot["tables"]:
    target = f"public.{ident(table['name'])}"
    for constraint in table["constraints"]:
        install.append(f"do $$ begin if not exists(select 1 from pg_constraint where conrelid={literal(target)}::regclass and conname={literal(constraint['name'])}) then alter table {target} add constraint {ident(constraint['name'])} {constraint['definition']}; end if; end $$;")
    for index in table["indexes"]:
        assert index["valid"]
        install.append(index["definition"].replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ", 1).replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ", 1) + ";")
    install.append(f"alter table {target} " + ("enable" if table["rls_enabled"] else "disable") + " row level security;")
    install.append(f"alter table {target} " + ("force" if table["rls_forced"] else "no force") + " row level security;")
    install.append(f"do $$ declare p record; begin for p in select polname from pg_policy where polrelid={literal(target)}::regclass loop execute format('drop policy %I on {target}',p.polname); end loop; end $$;")
    for policy in table["policies"]:
        install.append(f"drop policy if exists {ident(policy['policyname'])} on {target};")
        statement = f"create policy {ident(policy['policyname'])} on {target} as {policy['permissive']} for {policy['cmd']} to " + ",".join("public" if r == "public" else ident(r) for r in policy["roles"])
        if policy["qual"] is not None:
            statement += f" using ({policy['qual']})"
        if policy["with_check"] is not None:
            statement += f" with check ({policy['with_check']})"
        install.append(statement + ";")
    install.extend(acl_sql(f"table {target}", table["effective_acl"]))
for function in snapshot["functions"]:
    install.append(function["definition"].rstrip() + ";")
    install.extend(acl_sql(f"function public.{ident(function['name'])}({function['identity_arguments']})", function["effective_acl"], True))
for table in snapshot["tables"]:
    for trigger in table["triggers"]:
        assert trigger["enabled"] == "O"
        install.append(f"drop trigger if exists {ident(trigger['name'])} on public.{ident(table['name'])};")
        install.append(trigger["definition"] + ";")
replay_dir = args.root / "tests/os/db/production"
replay_dir.mkdir(parents=True, exist_ok=True)
replay_path = replay_dir / "cost-schema.CAPTURED.sql"
replay_path.write_text("\n\n".join(install) + "\n", encoding="utf-8", newline="\n")

md = ["# AND OS Production Cost Schema Capture", "", "Capture: " + snapshot["captured_at"],
      "Project: lzsxboaqliuwjzwsnnwf / antnest-estimate / main", "",
      "Source: user-authenticated Supabase Dashboard SQL Editor; one PostgreSQL catalog SELECT.",
      "No business table rows, Auth users, prices, customer data or credentials were queried/exported.",
      "Only catalog inspection helpers (pg_get_functiondef/pg_get_* etc.) were called; no application RPC was executed.",
      "The SQL Editor created its platform query draft automatically; no explicit Save was requested.",
      "Production business data/schema/ACLs/functions were not changed.", "",
      "JSON is the exact captured metadata. Local replay SQL is generated and TEST ONLY; it is not a migration.", "",
      "Snapshot SHA256: " + hashlib.sha256(snapshot_path.read_bytes()).hexdigest(), "",
      "## Function Definitions", ""]
for f in snapshot["functions"]:
    md.extend([f"### public.{f['name']}({f['identity_arguments']})", "",
               f"OID: {f['oid']}; returns: {f['return_type']}; language: {f['language']}; volatility: {f['volatility']}; SECURITY DEFINER: {f['security_definer']}; owner: {f['owner']}",
               "Arguments: `" + f["arguments"] + "`", "Config/search_path: `" + json.dumps(f["proconfig"]) + "`",
               "EXECUTE ACL: `" + json.dumps(f["effective_acl"]) + "`", "", "```sql", f["definition"].rstrip(), "```", ""])
md.extend(["## Table Metadata", ""])
for t in snapshot["tables"]:
    md.extend(["### public." + t["name"], "", f"RLS enabled: {t['rls_enabled']}; forced: {t['rls_forced']}; owner: {t['owner']}",
               "ACL: `" + json.dumps(t["effective_acl"]) + "`", "", "```json", json.dumps(t, ensure_ascii=False, indent=2), "```", ""])
(output / f"{base}.md").write_text("\n".join(md), encoding="utf-8", newline="\n")
print(json.dumps({"functions": len(snapshot["functions"]), "tables": len(snapshot["tables"]), "json": str(snapshot_path), "replay": str(replay_path)}, ensure_ascii=False))

"""Offline comparison of captured definitions; never connects to any DB."""
import difflib
import hashlib
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[3]
capture = json.loads((root / "docs/db-baseline/AND_OS_PROD_COST_SCHEMA_2026-10-12.json").read_text(encoding="utf-8"))
tracked = subprocess.check_output(["git", "ls-files", "supabase"], cwd=root, text=True).splitlines()
paths = [root / name for name in tracked if name.endswith(".sql") and "cost" in Path(name).name]
paths += [root / "supabase/cost_items_v2_3.sql", root / "tests/os/db/patches/cost-rpc.PROPOSED_CANONICAL.sql"]
pattern = re.compile(r"create\s+or\s+replace\s+function\s+public\.([a-z_0-9]+)\s*\(([\s\S]*?)\)\s*([\s\S]*?)as\s*(\$[a-z_0-9]*\$)([\s\S]*?)\4\s*;", re.I)
definitions = []
for path in paths:
    if not path.is_file():
        continue
    text = path.read_text(encoding="utf-8-sig")
    for match in pattern.finditer(text):
        definitions.append({"path":path.relative_to(root).as_posix(), "name":match[1], "arguments":match[2],
                            "header":match[3], "body":match[5], "definition":match[0],
                            "source_kind":"UNTRACKED_REFERENCE_ONLY" if path.name == "cost_items_v2_3.sql" else "CANONICAL" if "PROPOSED_CANONICAL" in path.name else "TRACKED"})

def lines(text):
    return [line.strip() for line in text.replace("\r\n","\n").strip().splitlines() if line.strip()]

report = []
for function in capture["functions"]:
    body = function["definition"].split("AS $function$",1)[1].rsplit("$function$",1)[0]
    matches = []
    for local in definitions:
        if local["name"] != function["name"]:
            continue
        identical_body = body.replace("\r\n","\n").strip() == local["body"].replace("\r\n","\n").strip()
        cosmetic_body_match = lines(body) == lines(local["body"])
        matches.append({"path":local["path"], "source_kind":local["source_kind"], "arguments":local["arguments"].strip(),
                        "body_exact":identical_body,"body_indentation_only":cosmetic_body_match,
                        "production_body_sha256":hashlib.sha256(body.encode()).hexdigest(),
                        "local_body_sha256":hashlib.sha256(local["body"].encode()).hexdigest(),
                        "diff":list(difflib.unified_diff(local["definition"].splitlines(),function["definition"].splitlines(),
                              fromfile=local["path"],tofile="CAPTURED_PRODUCTION",lineterm=""))})
    report.append({"function":function["name"],"identity_arguments":function["identity_arguments"],"production_oid":function["oid"],"matches":matches})
destination = root / "docs/db-baseline/AND_OS_PROD_COST_COMPARISON_2026-10-12.json"
if destination.exists():
    previous = json.loads(destination.read_text(encoding="utf-8"))
else:
    previous = None
data = {"normalization":"Only line indentation/blank lines ignored for cosmetic body match; not an automatic semantic proof.", "objects":report}
if previous:
    data["previous_canonical_comparison"] = previous.get("previous_canonical_comparison", previous["objects"])
destination.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
for row in report:
    print(row["function"] + ": " + "; ".join(m["source_kind"]+" "+m["path"]+" body="+("EXACT" if m["body_exact"] else "INDENTATION_ONLY" if m["body_indentation_only"] else "DIFFERENT") for m in row["matches"]))

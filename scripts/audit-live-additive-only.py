"""Fail-closed audit for additive-only Netlify publication.

This script is intentionally read-only against Netlify. It compares the current
published deployment with the frozen deployment receipt and refuses to treat a
deployment as additive when any frozen path is missing or function digests
change. It also verifies the Simulated Native pilot is reachable.
"""
from pathlib import Path
import argparse
import hashlib
import json
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs/reporting-library/deployment-2026-10-23"
BASELINE = ROOT / "docs/reporting-library/deployment-2026-10-13/live-baseline.json"
SITE_ID = "ed44f609-8ec1-4403-908e-5ca0fffe520f"
DOMAIN = "https://simulator.savafinlab.com.vn"

import importlib.util

spec = importlib.util.spec_from_file_location(
    "reporting_deployment", ROOT / "scripts/deploy-reporting-library.py"
)
api = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(api)


def function_list(value):
    return value.get("functions", []) if isinstance(value, dict) else value


def public_json(path):
    status, _ctype, body = api.public_get(DOMAIN + path)
    if status != 200:
        return {"http_status": status}
    try:
        value = json.loads(body.decode("utf-8-sig"))
    except Exception:
        value = None
    return {"http_status": status, "json": value}


def audit():
    before = json.loads(BASELINE.read_text(encoding="utf-8"))
    site = api.request("/sites/" + SITE_ID)
    published = site.get("published_deploy") or {}
    current_id = published.get("id")
    if not current_id:
        raise RuntimeError("Netlify site has no published deployment")
    current_files = api.request("/deploys/" + current_id + "/files")
    current_functions = api.request("/deploys/" + current_id + "/functions")

    old_files = {item["path"].lower(): item for item in before.get("files", [])}
    new_files = {item["path"].lower(): item for item in current_files}
    missing = sorted(set(old_files) - set(new_files))
    added = sorted(set(new_files) - set(old_files))

    old_functions = {item.get("n", item.get("name")): item for item in function_list(before.get("functions", []))}
    new_functions = {item.get("n", item.get("name")): item for item in function_list(current_functions)}
    function_names_equal = set(old_functions) == set(new_functions)
    function_digest_changes = {
        name: {"before": old_functions[name].get("d"), "after": new_functions[name].get("d")}
        for name in sorted(set(old_functions) & set(new_functions))
        if old_functions[name].get("d") != new_functions[name].get("d")
    }
    function_runtime_changes = {
        name: {
            key: {"before": old_functions[name].get(key), "after": new_functions[name].get(key)}
            for key in ["bd", "p", "im", "m", "r", "rg"]
            if old_functions[name].get(key) != new_functions[name].get(key)
        }
        for name in sorted(set(old_functions) & set(new_functions))
    }
    function_runtime_changes = {k: v for k, v in function_runtime_changes.items() if v}

    manifest = public_json("/sap-reporting/simulated-native/manifest.json")
    route_status, _ctype, route_body = api.public_get(DOMAIN + "/sap-reporting/simulated-native/")
    route_text = route_body.decode("utf-8", errors="replace")
    manifest_json = manifest.get("json") or {}
    ready = manifest_json.get("ready_pilot_count")
    blocked = manifest_json.get("blocked_pilot_count")
    if blocked is None and isinstance(manifest_json.get("blocked_pilots"), list):
        blocked = len(manifest_json["blocked_pilots"])

    checks = {
        "published_state_ready": published.get("state") == "ready",
        "all_frozen_paths_present": not missing,
        "function_names_unchanged": function_names_equal,
        "function_runtime_config_unchanged": not function_runtime_changes,
        "function_digests_unchanged": not function_digest_changes,
        "simulated_native_route_200": route_status == 200,
        "simulated_native_ready_section": "Ready" in route_text,
        "simulated_native_blocked_section": "Blocked" in route_text,
        "simulated_native_manifest_8_ready_4_blocked": ready == 8 and blocked == 4,
    }
    result = {
        "status": "PASS" if all(checks.values()) else "AUDIT_OPEN",
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site_id": SITE_ID,
        "domain": DOMAIN,
        "baseline_deploy_id": before.get("published_deploy_id"),
        "current_live_deploy_id": current_id,
        "current_live_state": published.get("state"),
        "baseline_file_count": len(old_files),
        "current_file_count": len(new_files),
        "missing_frozen_paths": missing,
        "added_paths_count": len(added),
        "added_paths_sample": added[:30],
        "function_digest_changes": function_digest_changes,
        "function_runtime_config_changes": function_runtime_changes,
        "checks": checks,
        "simulated_native_manifest": {
            "http_status": manifest.get("http_status"),
            "ready_pilot_count": ready,
            "blocked_pilot_count": blocked,
            "provenance": manifest_json.get("provenance") or manifest_json.get("provenance_class"),
        },
        "mutations_called": False,
        "deletions_called": False,
    }
    output = DOC / "live-additive-only-audit.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "PASS" else 2


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--read-only", action="store_true", help="Document intent; no write is sent to Netlify")
    args = parser.parse_args()
    if not args.read_only:
        parser.error("This audit is read-only; pass --read-only explicitly")
    sys.exit(audit())

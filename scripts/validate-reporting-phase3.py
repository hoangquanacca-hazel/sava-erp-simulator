"""Validate Phase 3 pilot contract safety and Phase 2 remediation linkage."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHASE2 = ROOT / "docs/reporting-library/phase-2-gap-closure"
PHASE3 = ROOT / "docs/reporting-library/phase-3"
INTAKE = PHASE2 / "native-evidence-intake.json"


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


registry = read(PHASE2 / "registry.json")
remediation = read(PHASE2 / "remediation-plan.json")
contract = read(PHASE3 / "entry-contract.json")
intake = read(INTAKE)

assert registry["unique_profile_ids"] == 160
assert registry["variant_evidence"]["unique_variant_ids"] == 227
assert registry["authoring_ready_count"] == 137
assert registry["phase2_ready_count"] == 0
assert len(registry["remediation_queue"]["queues"]) == 4
assert remediation["ordering"] == ["IDENTITY", "SEMANTICS_AND_RECONCILIATION", "LAYOUT", "EXTERNAL_ACCEPTANCE"]

pilots = contract["pilot"]
pilot_ids = [row["report_id"] for row in pilots]
assert len(pilot_ids) == 12 and len(set(pilot_ids)) == 12
assert all(row["present_in_library"] for row in pilots)
assert all(row["phase3_status"] == "PILOT_CANDIDATE_PENDING_NATIVE_INPUT" for row in pilots)
assert all(row["required_evidence"] for row in pilots)

joins = contract["join_matrix"]
assert len(joins) == 9
assert all(not row["direct_join_allowed"] for row in joins)
required = {"native export for both sides", "same cutoff and scope", "approved key/cardinality test", "owner sign-off"}
assert all(required.issubset(set(row["required_before_use"])) for row in joins)
assert all(row["status"] == "CANDIDATE_RECONCILIATION_BRIDGE" for row in joins)
assert all(row["left"] in pilot_ids and row["right"] in pilot_ids for row in joins)

assert intake["status"] == "INTAKE_CONTRACT_ONLY"
assert intake["pilot_ids"] == pilot_ids
assert len(intake["reports"]) == len(pilot_ids)
assert all(row["status"] == "WAITING_FOR_AUTHORIZED_NATIVE_INPUT" for row in intake["reports"])
assert all(not any(row["acceptance"].values()) for row in intake["reports"])
required_artifacts = {item["artifact"] for item in intake["artifact_contract"]}
assert all(required_artifacts.issubset(set(row["required_artifacts"])) for row in intake["reports"])

print(json.dumps({
    "status": "PASS",
    "phase2_profiles": registry["unique_profile_ids"],
    "phase2_authoring_ready": registry["authoring_ready_count"],
    "phase2_external_ready": registry["phase2_ready_count"],
    "remediation_queues": len(remediation["queues"]),
    "phase3_pilots": len(pilots),
    "join_candidates": len(joins),
    "direct_joins_allowed": sum(row["direct_join_allowed"] for row in joins),
    "native_intake_status": intake["status"],
}, ensure_ascii=False, indent=2))

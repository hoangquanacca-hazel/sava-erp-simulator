"""Build an evidence-bound Phase 2 audit and a Phase 3 entry contract.

This script only reads the existing reporting library and writes additive
audit/contract artifacts. It never promotes synthetic samples to native SAP
acceptance and never changes the runtime application.
"""
from __future__ import annotations

import collections
import hashlib
import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public" / "sap-reporting"
DOC = ROOT / "docs" / "reporting-library"
OUT2 = DOC / "phase-2-gap-closure"
OUT3 = DOC / "phase-3"


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def dump(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


dictionary = read(PUB / "report-master-dictionary.json")
progress = read(PUB / "progress.json")
raw_register = read(PUB / "raw-input-register.json")
format_profiles = read(PUB / "sap-export-format-profiles.json")
priority = read(PUB / "priority-24.json")
reports = dictionary["all_reports"]

# All package JSONs are inspected for variant evidence, but variants are never
# promoted to report profiles by this audit.
variant_models = []
for path in sorted(PUB.glob("*.json")):
    try:
        model = read(path)
    except (json.JSONDecodeError, UnicodeDecodeError):
        continue
    if isinstance(model, dict) and isinstance(model.get("variants"), list):
        variant_models.append((path.name, model))
variants = [variant for _, model in variant_models for variant in model["variants"]]

priority_validation = DOC / "priority-24" / "validation.json"
arithmetic_ids = set()
if priority_validation.is_file():
    validation = read(priority_validation)
    arithmetic_ids = set(validation.get("independent_arithmetic_fixtures", []))


def searchable(report):
    return json.dumps(report, ensure_ascii=False).lower()


def gate_row(report):
    text = searchable(report)
    has_identity = bool(report.get("id") and report.get("module") and report.get("title"))
    has_entrypoint = bool(report.get("tcode") or report.get("fiori_app"))
    has_source_evidence = bool(report.get("source_evidence") or report.get("source_ids"))
    identity = has_identity and (has_entrypoint or has_source_evidence)

    semantic_fields = ["selection", "reading", "reconciliation", "control", "lineage", "grain", "keys", "columns"]
    missing_semantic_fields = [key for key in semantic_fields if not report.get(key)]
    semantics = not missing_semantic_fields
    layout_signal = any(key in text for key in (
        "source_layout_examples", "source_screen_reconstruction", "source_layout",
        "visible_source_label", "visible_screen_label", "source_labels_complete",
    ))
    proposed_signal = any(key in text for key in ("sava_proposed", "synthetic", "proposed"))
    target_unknown = progress.get("target_release", "UNKNOWN") in (None, "", "UNKNOWN")
    native = bool(report.get("native_export")) or '"native_export": true' in text
    # Native and target/SME gates are deliberately conservative. This package
    # has no accepted native exports, so a string in a teaching sample cannot
    # satisfy them.
    next_actions = []
    if not identity:
        next_actions.append("VERIFY_IDENTITY_TCODE_APP_OR_SOURCE")
    if not semantics:
        next_actions.append("COMPLETE_GRAIN_KEYS_COLUMNS_RECONCILIATION_CONTROL")
    if not layout_signal:
        next_actions.append("CAPTURE_AUTHORIZED_NATIVE_LAYOUT_OR_KEEP_PROPOSED_LABEL")
    next_actions.append("OBTAIN_AUTHORIZED_NATIVE_EXPORT")
    next_actions.append("RECORD_TARGET_EDITION_RELEASE_CLIENT")
    next_actions.append("RUN_SAP_SME_AND_IFRS_BUSINESS_REVIEW")
    return {
        "report_id": report["id"],
        "module": report.get("module"),
        "identity_evidence": {
            "has_id_module_title": has_identity,
            "has_entrypoint": has_entrypoint,
            "has_source_evidence": has_source_evidence,
        },
        "missing_semantic_fields": missing_semantic_fields,
        "identity_gate": "PASS" if identity else "GAP",
        "layout_gate": "OBSERVED_OR_RECONSTRUCTED" if layout_signal else "PROPOSED_ONLY",
        "semantics_gate": "PASS" if semantics else "GAP",
        "reconciliation_gate": "MACHINE_FIXTURE" if report["id"] in arithmetic_ids else ("DECLARED" if report.get("reconciliation") else "GAP"),
        "native_export_gate": "PASS" if native else "NOT_VERIFIED",
        "target_release_gate": "PASS" if not target_unknown else "UNKNOWN",
        "sme_ifrs_gate": "NOT_RUN",
        "proposed_or_synthetic_signal": proposed_signal,
        "phase2_ready": bool(identity and semantics and report["id"] in arithmetic_ids and native and not target_unknown),
        "next_actions": next_actions,
    }


report_gates = [gate_row(report) for report in reports]
gate_counts = {}
for key in ("identity_gate", "layout_gate", "semantics_gate", "reconciliation_gate", "native_export_gate", "target_release_gate", "sme_ifrs_gate"):
    gate_counts[key] = dict(collections.Counter(row[key] for row in report_gates))

authoring_ready = [
    row["report_id"] for row in report_gates
    if row["identity_gate"] == "PASS"
    and row["semantics_gate"] == "PASS"
    and row["reconciliation_gate"] != "GAP"
]

variant_summary = {
    "variants_seen": len(variants),
    "unique_variant_ids": len({variant.get("id") for variant in variants if variant.get("id")}),
    "native_export_true": sum(bool(v.get("native_export")) for v in variants),
    "full_sap_catalog_verified_true": sum(bool(v.get("full_sap_catalog_verified")) for v in variants),
    "source_labels_complete_true": sum(bool(v.get("source_labels_complete")) for v in variants),
    "observed_source_fields_positive": sum((v.get("observed_source_field_count") or 0) > 0 for v in variants),
}

raw_records = raw_register.get("records", [])
format_records = format_profiles.get("profiles", [])
phase2 = {
    "as_of": str(date.today()),
    "status": "PHASE2_EVIDENCE_CLOSURE_IN_PROGRESS",
    "scope": "160 authored profiles and 227 variants already present in public/sap-reporting",
    "counting_rule": "Profiles are unique authored IDs. Variants, technical extracts and synthetic rows never become profiles by arithmetic.",
    "profiles": len(reports),
    "unique_profile_ids": len({report.get("id") for report in reports}),
    "variants": len(variants),
    "profile_module_counts": dict(collections.Counter(report.get("module") for report in reports)),
    "gate_counts": gate_counts,
    "phase2_ready_profiles": [row["report_id"] for row in report_gates if row["phase2_ready"]],
    "phase2_ready_count": sum(row["phase2_ready"] for row in report_gates),
    "authoring_ready_profiles": authoring_ready,
    "authoring_ready_count": len(authoring_ready),
    "variant_evidence": variant_summary,
    "native_exports": progress.get("native_exports", 0),
    "target_release": progress.get("target_release"),
    "full_company_catalog_verified": progress.get("full_company_catalog_verified", False),
    "sap_sme_acceptance": progress.get("sap_sme_acceptance"),
    "raw_input_register_records": len(raw_records),
    "raw_input_received": sum(r.get("raw_export_status") == "RECEIVED" for r in raw_records),
    "format_profiles": len(format_records),
    "format_profiles_with_native_sample": sum(bool(p.get("source_file")) for p in format_records),
    "external_blockers": [
        "SAP edition/release and client are unknown",
        "No authorized native SAP export is present",
        "No full technical field catalog is verified",
        "SAP SME and IFRS/business acceptance have not run",
        "Excel desktop and live target-system reconciliation remain unverified",
    ],
    "source_hashes": {
        "progress.json": sha(PUB / "progress.json"),
        "report-master-dictionary.json": sha(PUB / "report-master-dictionary.json"),
        "raw-input-register.json": sha(PUB / "raw-input-register.json"),
        "sap-export-format-profiles.json": sha(PUB / "sap-export-format-profiles.json"),
        "priority-24.json": sha(PUB / "priority-24.json"),
    },
    "report_gates": report_gates,
}

semantics_gap_ids = [row["report_id"] for row in report_gates if row["semantics_gate"] == "GAP"]
identity_gap_ids = [row["report_id"] for row in report_gates if row["identity_gate"] == "GAP"]
layout_gap_ids = [row["report_id"] for row in report_gates if row["layout_gate"] == "PROPOSED_ONLY"]
gate_by_id = {row["report_id"]: row for row in report_gates}
remediation = {
    "as_of": str(date.today()),
    "status": "INTERNAL_REMEDIATION_QUEUE_EXTERNAL_EVIDENCE_BLOCKED",
    "principle": "Close repository-level contract gaps first; do not mark native/release/SME gates complete from synthetic data.",
    "queues": [
        {
            "gate": "IDENTITY",
            "count": len(identity_gap_ids),
            "report_ids": identity_gap_ids,
            "items": [
                {
                    "report_id": report_id,
                    "identity_evidence": gate_by_id[report_id]["identity_evidence"],
                }
                for report_id in identity_gap_ids
            ],
            "action": "Verify T-code/Fiori/source identity and preserve explicit UNKNOWN where no entrypoint is proven.",
        },
        {
            "gate": "SEMANTICS_AND_RECONCILIATION",
            "count": len(semantics_gap_ids),
            "report_ids": semantics_gap_ids,
            "items": [
                {
                    "report_id": report_id,
                    "missing_semantic_fields": gate_by_id[report_id]["missing_semantic_fields"],
                }
                for report_id in semantics_gap_ids
            ],
            "action": "Complete grain, keys, columns, reconciliation and control; add a negative/cutoff fixture where a valid source rule exists.",
        },
        {
            "gate": "LAYOUT",
            "count": len(layout_gap_ids),
            "report_ids": layout_gap_ids,
            "items": [{"report_id": report_id, "layout_gate": gate_by_id[report_id]["layout_gate"]} for report_id in layout_gap_ids],
            "action": "Keep proposed labels explicit until an authorized native layout or a bounded source reconstruction is read back.",
        },
        {
            "gate": "EXTERNAL_ACCEPTANCE",
            "count": len(reports),
            "report_ids": [report["id"] for report in reports],
            "action": "Obtain native export, target release/client, technical catalog, Excel readback and SME/IFRS review.",
        },
    ],
    "ordering": ["IDENTITY", "SEMANTICS_AND_RECONCILIATION", "LAYOUT", "EXTERNAL_ACCEPTANCE"],
}
phase2["remediation_queue"] = remediation
dump(OUT2 / "registry.json", phase2)
dump(OUT2 / "remediation-plan.json", remediation)

phase3_pilot = [
    ("FI01", "GL entry and ledger bridge", "FI document line -> ledger balance"),
    ("FI02", "GL ledger view", "ledger line -> trial balance"),
    ("FI06", "Supplier line items", "AP line -> aging/payment"),
    ("FI15", "GR/IR reconciliation monitor", "GR/IR cases -> MM history and FI"),
    ("CO01", "Actual cost center detail", "CO actual -> plan/variance"),
    ("CO15", "CO-PA actual line items", "CO-PA line -> margin bridge"),
    ("MM01", "Material document items", "movement -> stock/order"),
    ("MM08", "Purchase order history", "PO item -> GR/IR"),
    ("PP01", "Production order views", "order -> operations/components"),
    ("SD01", "Sales order/delivery chain", "order -> delivery/billing"),
    ("QM01", "Inspection lot/worklist", "inspection -> usage decision"),
    ("PM01", "Maintenance order list", "order -> downtime/spend"),
]
known_ids = {report["id"] for report in reports}
pilot_rows = []
for report_id, purpose, join in phase3_pilot:
    source = next((report for report in reports if report["id"] == report_id), None)
    pilot_rows.append({
        "report_id": report_id,
        "purpose": purpose,
        "integration_join": join,
        "present_in_library": report_id in known_ids,
        "module": source.get("module") if source else None,
        "grain": source.get("grain") if source else None,
        "keys": source.get("keys") if source else [],
        "columns": source.get("columns") if source else [],
        "contract_status": source.get("status") if source else "ID_REQUIRES_REVIEW",
        "phase3_status": "PILOT_CANDIDATE_PENDING_NATIVE_INPUT" if report_id in known_ids else "ID_REQUIRES_REVIEW",
        "required_evidence": [
            "system/product/release/client/language",
            "selection variant and cutoff",
            "original export plus SHA-256",
            "ordered header and technical field catalog",
            "grain/key/currency/UoM and control totals",
            "reconciliation owner and SME sign-off",
        ],
    })

pilot_by_id = {row["report_id"]: row for row in pilot_rows}
join_specs = [
    ("FI01", "FI02", "DOCUMENT_LINE_BRIDGE", ["company", "year", "doc", "line"], False, "FI01 entry versus FI02 ledger; ledger and currency scope must be identical."),
    ("FI01", "FI06", "FI_PARTNER_LINE_BRIDGE", ["company", "year", "doc", "line"], False, "Same document line shape does not prove AP partner semantics or account scope."),
    ("CO01", "CO15", "CO_TO_COPA_BRIDGE", ["co_area", "year", "doc", "line"], False, "CO actual line and CO-PA line may use different document namespaces and profitability grains."),
    ("MM01", "MM08", "PO_HISTORY_MOVEMENT_BRIDGE", ["year", "po", "item", "currency"], False, "PO history events and material movements are not one-to-one; preserve event and reversal keys."),
    ("FI15", "MM08", "GRIR_TO_PO_HISTORY_CONTROL", ["currency"], False, "GR/IR monitor is an aggregate control view; do not join it to PO rows without an approved bridge."),
    ("PP01", "MM01", "ORDER_COMPONENT_MOVEMENT_BRIDGE", ["order", "material"], False, "Production order, component and movement grains differ; aggregate only through approved order/item keys."),
    ("SD01", "MM01", "SALES_TO_MOVEMENT_BRIDGE", ["material", "plant"], False, "Material/plant is a contextual bridge, not a sales-item identity."),
    ("QM01", "MM01", "INSPECTION_TO_MOVEMENT_BRIDGE", ["material", "plant"], False, "Inspection lot and movement events need lot/batch and cutoff evidence before any bridge."),
    ("PM01", "MM01", "MAINTENANCE_TO_MOVEMENT_BRIDGE", ["order", "material"], False, "Maintenance consumption and material movements require order/component evidence."),
]
join_matrix = []
for left, right, relation, bridge_fields, direct_allowed, risk in join_specs:
    left_row = pilot_by_id[left]
    right_row = pilot_by_id[right]
    left_columns = set(left_row.get("columns") or [])
    right_columns = set(right_row.get("columns") or [])
    join_matrix.append({
        "left": left,
        "right": right,
        "relation": relation,
        "known_common_columns": sorted(left_columns & right_columns),
        "declared_bridge_fields": bridge_fields,
        "direct_join_allowed": direct_allowed,
        "status": "CANDIDATE_RECONCILIATION_BRIDGE",
        "risk": risk,
        "required_before_use": ["native export for both sides", "same cutoff and scope", "approved key/cardinality test", "owner sign-off"],
    })

phase3 = {
    "as_of": str(date.today()),
    "status": "PHASE3_DESIGN_STARTED_SOURCE_BLOCKED",
    "objective": "Prepare cross-report lineage, reconciliation and analytics adapters without claiming production integration.",
    "quantity_boundary": {
        "current_authored_profiles": len(reports),
        "entry_threshold": 200,
        "upper_planning_limit": 250,
        "new_profiles_needed_for_entry": max(0, 200 - len(reports)),
        "do_not_count": ["variants", "technical extracts", "filter variants", "synthetic rows", "duplicate purposes"],
    },
    "pilot": pilot_rows,
    "join_matrix": join_matrix,
    "integration_layers": [
        {"name": "RAW", "contract": "Original bytes, source coordinates, immutable SHA-256"},
        {"name": "CLEAN", "contract": "Profile-specific parsing; preserve original and exceptions"},
        {"name": "CONTROL", "contract": "Row/key/amount/quantity/currency tie-outs and exception log"},
        {"name": "MART", "contract": "Grain-safe facts and dimensions; no mixed-cutoff joins"},
        {"name": "ANALYTICS", "contract": "Power BI/Fiori/API adapters consume approved MART views only"},
    ],
    "entry_gates": [
        "Target SAP edition/release and client are known",
        "At least one authorized native export per pilot profile",
        "Field order and technical catalog read back from the export",
        "Reconciliation pack has valid/invalid/cutoff/reversal cases",
        "Business owner and SAP SME approve semantics",
        "Runtime integration is separately approved and regression-tested",
    ],
    "not_yet_claimed": ["Power BI production dataset", "Fiori production app mapping", "Simulator runtime report integration", "200 accepted reports"],
    "pilot_ids": [row["report_id"] for row in pilot_rows if row["present_in_library"]],
    "source_hashes": phase2["source_hashes"],
}
dump(OUT3 / "entry-contract.json", phase3)

out2_md = f"# Đóng khoảng trống Giai đoạn 2 — {date.today()}\n\n"
out2_md += "Audit này kiểm tra 160 hồ sơ/227 biến thể đã có trong thư viện. Nó không nâng synthetic/proposed thành SAP-native.\n\n"
out2_md += f"- Hồ sơ duy nhất: **{phase2['unique_profile_ids']}**; biến thể duy nhất: **{variant_summary['unique_variant_ids']}**.\n"
out2_md += f"- Hồ sơ đạt gate authoring (identity/semantics/reconciliation khai báo): **{phase2['authoring_ready_count']}**; hồ sơ đạt toàn bộ gate gồm native/release/SME: **{phase2['phase2_ready_count']}**.\n"
out2_md += f"- Native exports: **{phase2['native_exports']}**; target release: **{phase2['target_release']}**; SME: **{phase2['sap_sme_acceptance']}**.\n\n"
out2_md += "## Gate\n\n"
for key, counts in gate_counts.items():
    out2_md += f"- `{key}`: " + ", ".join(f"{name}={count}" for name, count in sorted(counts.items())) + "\n"
out2_md += "\nCác blocker còn lại là bằng chứng ngoài repository: release/client, original export, technical field catalog, SME/IFRS sign-off, Excel desktop và reconciliation trên hệ mục tiêu. Chi tiết theo hồ sơ nằm trong `registry.json`.\n"
out2_md += f"\n## Remediation queue\n\nIdentity gap: **{len(identity_gap_ids)}** ({', '.join(identity_gap_ids) or 'none'}); semantics/reconciliation gaps: **{len(semantics_gap_ids)}**; proposed-only layouts: **{len(layout_gap_ids)}**. Xử lý theo thứ tự trong `remediation-plan.json`; external acceptance vẫn bị chặn bởi bằng chứng SAP/SME.\n"
(OUT2 / "README.md").write_text(out2_md, encoding="utf-8")

out3_md = f"# Giai đoạn 3 — hợp đồng vào pilot ({date.today()})\n\n"
out3_md += "Giai đoạn 3 đã bắt đầu ở mức thiết kế có kiểm soát: 12 hồ sơ hiện có được chọn làm pilot cho lineage/reconciliation/analytics adapters. Chưa có tuyên bố Power BI, Fiori hoặc simulator runtime đã tích hợp production.\n\n"
out3_md += "`entry-contract.json` ghi lại module, grain, keys, columns và `join_matrix` của từng pilot. Các quan hệ trực tiếp bị chặn mặc định; quan hệ còn lại chỉ là `CANDIDATE_RECONCILIATION_BRIDGE` với field cầu nối, rủi ro và điều kiện cần trước khi dùng.\n\n"
out3_md += "## Pilot\n\n"
for row in pilot_rows:
    out3_md += f"- **{row['report_id']}** — {row['purpose']}; `{row['phase3_status']}`.\n"
out3_md += "\n## Điều kiện mở rộng\n\n"
out3_md += "Chỉ tạo profile mới khi có business question khác, owner, nguồn được phép dùng và grain không trùng. Mốc 200–250 là ngân sách planning; không dùng để thay thế native export, đối soát hoặc SME acceptance. Xem `entry-contract.json`.\n"
(OUT3 / "README.md").write_text(out3_md, encoding="utf-8")

print(json.dumps({
    "phase2_profiles": phase2["unique_profile_ids"],
    "phase2_variants": variant_summary["unique_variant_ids"],
    "authoring_ready": phase2["authoring_ready_count"],
    "phase2_ready_all_external_gates": phase2["phase2_ready_count"],
    "native_exports": phase2["native_exports"],
    "phase3_pilot": len(phase3["pilot_ids"]),
    "phase3_new_profiles_needed_for_entry": phase3["quantity_boundary"]["new_profiles_needed_for_entry"],
    "outputs": [
        str(OUT2 / "registry.json"),
        str(OUT2 / "remediation-plan.json"),
        str(OUT2 / "README.md"),
        str(OUT3 / "entry-contract.json"),
        str(OUT3 / "README.md"),
    ],
}, ensure_ascii=False, indent=2))

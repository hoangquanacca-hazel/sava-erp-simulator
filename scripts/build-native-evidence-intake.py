"""Build a bounded intake pack for the Phase 2/3 native-evidence handoff.

The pack is a request/validation contract only. It never marks an export as
received and never promotes synthetic samples to SAP evidence.
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public" / "sap-reporting"
DOC = ROOT / "docs" / "reporting-library"
PHASE2 = DOC / "phase-2-gap-closure"
PHASE3 = DOC / "phase-3"


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def dump(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


raw = read(PUB / "raw-input-register.json")
formats = read(PUB / "sap-export-format-profiles.json")
contract = read(PHASE3 / "entry-contract.json")
raw_by_id = {row["report_id"]: row for row in raw.get("records", [])}
format_by_id = {row["report_id"]: row for row in formats.get("profiles", [])}
pilot_ids = contract["pilot_ids"]

required_context = [
    "system/product/release/client/language",
    "program or Fiori app id",
    "selection filters and period/key date",
    "layout name and column catalog",
    "amount/currency and quantity/unit pairs",
    "number/date/decimal conventions",
    "subtotal/total/duplicate-header rows",
    "full-export vs row-limit/paging evidence",
    "control totals and authorisation scope",
]
artifact_contract = [
    {
        "artifact": "ORIGINAL_NATIVE_EXPORT",
        "required": True,
        "acceptable_examples": ["XLSX", "CSV", "TXT", "PDF layout plus raw export"],
        "prohibited_substitute": "synthetic teaching sample or reconstructed public layout",
    },
    {
        "artifact": "CAPTURE_CONTEXT_MANIFEST",
        "required": True,
        "required_fields": required_context,
    },
    {
        "artifact": "TECHNICAL_FIELD_CATALOG",
        "required": True,
        "required_fields": ["original column order", "technical field name", "label", "data type", "unit/currency", "hidden or calculated flag"],
    },
    {
        "artifact": "CONTROL_TOTAL_AND_SCOPE_CHECK",
        "required": True,
        "required_fields": ["row count", "control total", "scope", "cutoff", "paging/row limit", "authorisation scope"],
    },
    {
        "artifact": "OWNER_AND_SME_REVIEW",
        "required": True,
        "required_fields": ["business owner", "SAP key user", "IFRS/business reviewer", "decision", "review date", "exceptions"],
    },
]

rows = []
for report_id in pilot_ids:
    raw_row = raw_by_id.get(report_id, {})
    format_row = format_by_id.get(report_id, {})
    rows.append({
        "report_id": report_id,
        "module": raw_row.get("module"),
        "title": raw_row.get("title"),
        "tcode": raw_row.get("tcode"),
        "priority": raw_row.get("priority"),
        "raw_export_status": raw_row.get("raw_export_status", "NOT_REGISTERED"),
        "format_profile_status": format_row.get("status", "NOT_REGISTERED"),
        "current_evidence": {
            "original_file": raw_row.get("original_file"),
            "original_sha256": raw_row.get("original_sha256"),
            "release": raw_row.get("release"),
            "client": raw_row.get("client"),
            "layout_name": raw_row.get("layout_name"),
            "selection_variant": raw_row.get("selection_variant"),
            "technical_field_catalog": raw_row.get("technical_field_catalog"),
        },
        "required_artifacts": [item["artifact"] for item in artifact_contract],
        "acceptance": {
            "native_export_received": False,
            "hash_verified": False,
            "context_complete": False,
            "field_catalog_verified": False,
            "control_totals_reconciled": False,
            "owner_and_sme_signed": False,
        },
        "status": "WAITING_FOR_AUTHORIZED_NATIVE_INPUT",
    })

pack = {
    "as_of": str(date.today()),
    "status": "INTAKE_CONTRACT_ONLY",
    "purpose": "Collect authorized native exports and acceptance evidence for the 12 Phase 3 pilot reports.",
    "pilot_count": len(rows),
    "pilot_ids": pilot_ids,
    "batch_context_required": required_context,
    "artifact_contract": artifact_contract,
    "reports": rows,
    "completion_rule": "A report remains WAITING_FOR_AUTHORIZED_NATIVE_INPUT until every required artifact is present, hash-verified, and owner/SME accepted.",
    "prohibited_inference": [
        "Synthetic XLSX/CSV does not satisfy ORIGINAL_NATIVE_EXPORT.",
        "A public screenshot or web reference does not prove target release/client layout.",
        "A balanced teaching sample does not prove population completeness, IFRS classification, or SAP acceptance.",
    ],
}
dump(PHASE2 / "native-evidence-intake.json", pack)

lines = [
    "# Native evidence intake — Phase 2/3",
    "",
    "Đây là hợp đồng tiếp nhận bằng chứng, chưa phải bằng chứng SAP. Gói áp dụng cho 12 pilot Phase 3 và giữ trạng thái chờ cho đến khi đủ file, hash, context, catalog, control total và sign-off.",
    "",
    "## Cách bàn giao",
    "",
    "1. Gửi original export từ đúng system/client/release; giữ nguyên file và tên gốc.",
    "2. Kèm capture context: selection, cutoff, layout, paging, totals, units, language và quyền truy cập.",
    "3. Kèm technical field catalog theo đúng thứ tự cột gốc; đánh dấu hidden/calculated fields.",
    "4. Kèm control total/scope check và hash SHA-256 của từng file.",
    "5. Owner, SAP key user và IFRS/business reviewer ký kết quả cùng exception list.",
    "",
    "## Không được dùng làm thay thế",
    "",
    "Synthetic teaching samples, proposed schemas, public screenshots và web references chỉ là context; chúng không đóng native, release hoặc SME gate.",
    "",
    "Chi tiết machine-readable nằm trong `native-evidence-intake.json`.",
]
(PHASE2 / "native-evidence-intake.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

print(json.dumps({
    "status": "PASS",
    "pilot_count": len(rows),
    "pilot_ids": pilot_ids,
    "outputs": [str(PHASE2 / "native-evidence-intake.json"), str(PHASE2 / "native-evidence-intake.md")],
}, ensure_ascii=False, indent=2))

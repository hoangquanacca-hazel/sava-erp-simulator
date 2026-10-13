---
tags: [savafinlab, sava-erp-simulator, session-report, S4]
date: 2026-10-10
status: done
---

# Báo cáo cuối phiên S4 — SAVA ERP MTO Simulator (10/10/2026)

Brief: `CLOUD_BRIEF_S4.md` (Q4 = a, Q5 = a, Q6 = b). Nhánh gốc `feat/sim-p0-mfg`. Chuẩn TT99.

## Tiến độ: T0–T5 hoàn tất, đã merge vào `feat/sim-p0-mfg`

| Task | Nội dung | Kết quả |
|---|---|---|
| T0 | Baseline lint, eslint:strict, parity, s1, health, s2, costing, a0, s3, build | Tất cả exit 0 trên gốc |
| T1 | Q4 = (a): bỏ màu/kg khỏi giá nhựa nền, giữ `ROH-MB-COLOR` | FAIL 28/40 trước sửa → PASS. Denso ΔP −817.409 |
| T2 | Q5 = (a): tách phụ gia ESD/kg thành dòng BOM `ROH-ADD-ESD` | FAIL 13/40 trước sửa → PASS. ΔP = 0 |
| T3 | Q6 = (b): giờ công/giờ máy hiển thị = giờ vận hành thực tính | Không đổi số học |
| T4 | AUD-040: đồng bộ cây BOM + BOMVisualizer với chính sách | `test:s4` PASS 40/40, 79 test âm tính bị bắt |
| T5 | Bảng trước/sau + GIAODICH_TT99 + CHANGELOG + AUD-041…044 | `docs-cloud/S4_COSTING_BEFORE_AFTER.md` |

## PR
- #13 (T1+T2+T5, đổi số) — chủ dự án duyệt bảng, merge `6d3f776`.
- #14 (T3+T4, trình bày) — merge `6c6268f` sau khi chuyển base sang `feat/sim-p0-mfg`.
- CI `feat` sau merge: run #21 trên `6c6268f` kết luận success (đọc kết luận run, chưa mở log từng bước).

## Số liệu (VND)
| Preset | P trước | P sau |
|---|---:|---:|
| Samsung | 48.780.088 | 48.780.088 |
| Canon | 53.086.050 | 53.086.050 |
| Denso | 99.482.210 | 98.664.801 |

## Bằng chứng
- Log FAIL trước sửa: `docs-cloud/evidence/s4_q4_before_fix.log`, `s4_q5_before_fix.log`.
- Quy tắc 11: `oracle_costing.py --off=q4,q5 --stdout` và `a0_oracle.py --off=q4,q5 --stdout` tái tạo đúng từng byte đáp án của `feat` cũ.
- Σ 11 báo cáo = Σ ACDOCA trên 54 ca (`test:s3`); MB51/COOIS_CMP/CK13N có `ROH-ADD-ESD` đúng cho Denso, không có ở Samsung/Canon.
- Không đổi `acdoca.ts`, `materialLedger.ts`; không xóa file; không `.pyc` trong diff.

## Điểm lệch so với brief
- `SetupScreen.tsx` không có ô nhập `laborHours` → không sửa (AUD-043).
- Giờ MÁY hiển thị cũng sai cùng kiểu → sửa chung.
- Mã vật tư màu trên cây BOM đổi `ROH-MB-<mã màu>` → `ROH-MB-COLOR`.

## Việc dở / nợ
- ESLint toàn repo còn 40 lỗi + 1 cảnh báo (nền S3: 42); `lint:eslint` vẫn `continue-on-error`.
- Masterbatch dựng theo công thức heuristic (2% định mức × màu/kg × 50), chưa là master data CS03.
- Texture theo cái vẫn gom SXC 632140, chưa là công đoạn routing thật (AUD-036).
- Hai nhánh `cloud/s4-q4q5`, `cloud/s4-present` còn trên remote (quy tắc không xóa) — chủ dự án quyết định xóa.
- Chưa mở log từng bước của CI run #21.

## Bài học (không lặp lại)
- Merge liên tiếp trong vài giây làm CI run trước bị `cancelled`; chờ run xanh rồi mới merge tiếp.
- PR xếp chồng: GitHub không tự chuyển base khi head branch của PR trước còn tồn tại → chuyển base bằng tay và kiểm lại trước khi merge.
- Test mới phát hiện thật CK13N thiếu dòng ESD — test kiểm sự hiện diện dòng nên giữ.

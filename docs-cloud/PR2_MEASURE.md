# PR-2 — Đo oracle giá thành độc lập trên mã nhánh Codex (CHỈ ĐO)

Nhánh `cloud/pr2-costing-oracle` (gốc `cloud/s1-report-completion` sau PR-1). Không sửa `src/`, `a0_oracle.py`, `a0_expected.json`.
Log nguyên văn: `docs-cloud/evidence/pr2_costing_measure.log` (`npm run test:costing`, **exit 1**).

**Lưu ý nguồn oracle:** `oracle_costing.py` / `costing_expected.json` lấy từ `origin/feat/sim-p0-mfg` là **bản S4**, đã gồm Q1 (bao bì), Q4 (màu) và Q5 (ESD). Do đó "số oracle" dưới đây là số sau cả ba quyết định, không chỉ Q1. Cột Q1/Q4/Q5 tách bằng cờ `--off` của chính oracle (Q1 = oracle `--off=q4,q5` trừ số Codex; Q4 = `--off=q5` trừ `--off=q4,q5`; Q5 = oracle đầy đủ trừ `--off=q5`). Số Codex lấy từ `computeMTO` của nhánh này.

`test:costing` trên nhánh này **không** có bước `a0_oracle.py --check` (bản Codex đọc `/tmp/planned.json` do TS sinh nên không độc lập; sửa ở PR-3). Kết quả: Samsung PASS, Canon PASS, Denso FAIL; **35/40 ca lệch** (toàn bộ là các ca Strategy 25 của Denso).

## 1. Ba preset (VND)

| Preset | P Codex | P oracle (S4) | Lệch (Codex − oracle) | Kết quả |
|---|---:|---:|---:|---|
| samsung-cover | 48.780.088 | 48.780.088 | 0 | PASS |
| canon-frame | 53.086.050 | 53.086.050 | 0 | PASS |
| denso-sensor | 113.882.210 | 98.664.801 | +15.217.409 | **FAIL** |

## 2. Denso — tách lệch theo quyết định (Codex → oracle; số âm = oracle thấp hơn Codex)

| Thành phần | Codex | Q1 bao bì | Q4 màu | Q5 ESD | Oracle | Tổng |
|---|---:|---:|---:|---:|---:|---:|
| M (621) | 27.237.668 | 0 | −756.860 | 0 | 26.480.808 | −756.860 |
| L (622) | 19.897.480 | 0 | 0 | 0 | 19.897.480 | 0 |
| Máy (627) | 36.576.250 | 0 | 0 | 0 | 36.576.250 | 0 |
| SXC 8% (627) | 3.770.812 | 0 | −60.549 | 0 | 3.710.263 | −60.549 |
| Add-on (627) | 26.400.000 | −14.400.000 | 0 | 0 | 12.000.000 | −14.400.000 |
| **P** | **113.882.210** | **−14.400.000** | **−817.409** | **0** | **98.664.801** | **−15.217.409** |

Cộng các cột quyết định: −14.400.000 − 817.409 + 0 = −15.217.409 = tổng lệch → **không còn phần dư chưa giải thích**.

### Lệch theo dòng BOM / khoản

| Dòng / khoản | Codex | Oracle | Lệch | Do |
|---|---:|---:|---:|---|
| `ROH-RESIN` (nhựa nền; Codex đặt mã `ROH-H-T-NH-A-P` theo loại nhựa) | 11.958.388 | 11.061.800 | +896.588 | Giá nhựa nền Codex cộng màu 6.500/kg (Q4: 756.860) và texture 1.200/kg (Q5: 139.728); 756.860 + 139.728 = 896.588 |
| `ROH-MB-COLOR` | 735.280 | 735.280 | 0 | Giữ nguyên (Q4 chốt giữ dòng masterbatch) |
| `ROH-ADD-ESD` | không có | 139.728 | −139.728 | Q5 tách phụ gia ESD/kg thành dòng BOM riêng; nuốt đúng phần texture/kg đã nằm trong giá nhựa → M không đổi ròng |
| `VERP-PACKAGING` | 14.544.000 | 14.544.000 | 0 | Bao bì đã có trong BOM ở cả hai |
| Add-on 627 | 26.400.000 | 12.000.000 | +14.400.000 | Q1: Codex cộng lại bao bì 8.000 × 1.800 = 14.400.000 vào add-on (tính trùng với dòng VERP); phần còn lại 12.000.000 = 8.000 × 1.500 (texture ESD /cái) |

### SXC +60.549 — nguyên nhân
SXC = làm tròn((M + L) × 8%). Giữa Codex và oracle chỉ M đổi (−756.860, do Q4), L không đổi, Q1 không chạm M/L, Q5 không đổi M ròng. 8% × 756.860 = 60.548,8 → làm tròn 60.549. **Vậy SXC +60.549 là hệ quả gián tiếp thuần túy của Q4**, không phải một sai khác riêng. Đã kiểm bằng phép tách `--off` ở trên (cột SXC: Q1 = 0, Q4 = −60.549, Q5 = 0).

## 3. Các ca Strategy 25 khác của Denso
35 ca lệch gồm preset Denso và các ca ma trận màu × texture × bao bì: mọi ca có bao bì > 0 lệch add-on đúng bằng SL × phụ phí bao bì (Q1); ca có màu > 0 lệch M theo Q4 (+8% SXC); ca có texture ESD lệch cấu trúc BOM (Q5). Ví dụ `denso/c-std/t-std/p-vacuum`: chỉ add-on lệch +6.800.000 = 8.000 × 850. Samsung, Canon và ca Strategy 20 gắn mã biến thể không lệch.

## 4. Ý nghĩa cho PR-3
Muốn `test:costing` xanh, mã Codex cần đủ Q1 + Q4 + Q5 (không chỉ Q1) và `a0_oracle.py` phải đọc từ `oracle_costing.py`. Tách thành PR riêng, mỗi quyết định có log FAIL trước và bảng trước/sau được duyệt (xem `S4_COSTING_BEFORE_AFTER.md` trên nhánh feat).

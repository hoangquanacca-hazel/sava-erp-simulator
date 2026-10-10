# PR-6 — Đo Q6: giờ công/giờ máy hiển thị ở "Bóc tách giá thành" (chỉ đo, không sửa `src/`)

Nhánh `cloud/pr6-q6-measure` (gốc `cloud/s1-report-completion`, đã có PR-1…PR-5). Cách đo: script ngoài repo gọi đúng hàm mà `BOMVisualizer` dùng (`canonicalBomTree`, `planGroups` trong `src/presentation/finance.ts`) trên preset gốc (chế độ "theo giờ"), không biến động (0%), rồi so với `computeMTO` và ACDOCA bước 3 (`generateStepEntries`). Script không có nhánh fallback; số lấy trực tiếp từ mã.

## Mã nguồn
- `BOMVisualizer.tsx` dùng `canonicalBomTree` / `planGroups` (không còn tự tính). Nút nhân công và máy đặt `qty = c.operatingHours` (`finance.ts:7,9`); đơn giá hiển thị = `cost / qty`.
- Không còn chỗ nào trong `src/components` hiển thị `params.laborHours` / `params.machineHours` (grep: 0 kết quả). `SetupScreen.tsx:752` hiển thị `computed.operatingHours`.
- `buildBOMTree` cũ trong `calculator.ts` (dùng `params.laborHours`, dòng 1526–1623) **vẫn còn** nhưng BOMVisualizer không gọi nó (nhập khẩu `canonicalBomTree as buildBOMTree`).

## Bảng (chế độ "theo giờ", đơn vị giờ / VND)

| Preset | Giờ nhập (lao động / máy) | Giờ vận hành `operatingHours` | Giờ HIỂN THỊ (công / máy) | Đơn giá hiển thị (công / máy) | 622 tính | 622 hạch toán (ACDOCA bước 3) | Máy 627 tính | 627 hạch toán (máy+SXC+add-on) |
|---|---|---:|---|---|---:|---:|---:|---:|
| samsung-cover | 250 / 220 | 220,94 | 220,94 / 220,94 | 65.000 / 110.000 | 14.361.100 | 14.361.100 | 24.303.400 | 26.116.488 (= 24.303.400 + SXC 1.813.088) |
| denso-sensor | 320 / 290 | 292,61 | 292,61 / 292,61 | 68.000 / 125.000 | 19.897.480 | 19.897.480 | 36.576.250 | 52.286.513 (= 36.576.250 + SXC 3.710.263 + add-on 12.000.000) |

Kiểm: giờ hiển thị × đơn giá = 220,94 × 65.000 = 14.361.100 (Samsung 622), 292,61 × 68.000 = 19.897.480 (Denso 622); máy 220,94 × 110.000 = 24.303.400, 292,61 × 125.000 = 36.576.250 — **khớp tuyệt đối** số tính và số hạch toán. (Với biến động +3,5% của Denso, ACDOCA ghi 622 = 20.593.892 = số tính + chênh lệch thực tế 696.412; đó là phân bổ chênh lệch, không liên quan giờ hiển thị.)

## Kết luận
**Q6 = (b) đã đúng trên nhánh này.** Màn hình hiển thị giờ vận hành thực tính (220,94 / 292,61), không phải giờ nhập (250/220, 320/290), và giờ × đơn giá = 622/máy 627 đã hạch toán. 622 không đổi số học (đúng Q6 = b). **Không cần làm** ở `src/`.

Còn lại (không bắt buộc, ghi nhận): `buildBOMTree` trong `calculator.ts` là mã chết còn dùng `laborHours`/`machineHours` — để nguyên (quy tắc không sửa `calculator.ts`); và trường `laborHours` vẫn nằm trong kiểu dữ liệu/preset theo quyết định Q6.

# PR-6 — báo cáo (nhánh `cloud/pr6-q6-measure`, gốc `cloud/s1-report-completion`; chỉ đo, không sửa `src/`)

**Câu hỏi:** màn "Bóc tách giá thành" (BOMVisualizer) ở chế độ "theo giờ" hiển thị giờ nhập hay giờ vận hành, có khớp 622/627 không?
**Kết quả:** hiển thị **giờ vận hành thực tính** (Samsung 220,94; Denso 292,61), không phải giờ nhập (250/220; 320/290). Giờ × đơn giá = 622 và máy 627 đã hạch toán, khớp tuyệt đối (Samsung 14.361.100 / 24.303.400; Denso 19.897.480 / 36.576.250).
**Kết luận:** Q6 = (b) **đã đúng** trên nhánh này → **không cần làm**; chi tiết `docs-cloud/PR6_Q6_MEASURE.md`.
**Nguồn:** BOMVisualizer dùng `canonicalBomTree`/`planGroups` (`src/presentation/finance.ts`), `qty = operatingHours`; không còn chỗ nào hiển thị `params.laborHours`/`machineHours`.
**Ghi nhận:** `buildBOMTree` trong `calculator.ts` (còn dùng `laborHours`) là mã chết, không được gọi; không sửa theo quy tắc.
**Chưa làm / rủi ro:** không có sửa mã; đo trên preset gốc, chưa chạy giao diện trình duyệt (đo qua hàm mà component gọi); Canon (chế độ "tổng") không thuộc phạm vi.

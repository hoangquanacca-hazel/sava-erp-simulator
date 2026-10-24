# Native evidence intake — Phase 2/3

Đây là hợp đồng tiếp nhận bằng chứng, chưa phải bằng chứng SAP. Gói áp dụng cho 12 pilot Phase 3 và giữ trạng thái chờ cho đến khi đủ file, hash, context, catalog, control total và sign-off.

## Cách bàn giao

1. Gửi original export từ đúng system/client/release; giữ nguyên file và tên gốc.
2. Kèm capture context: selection, cutoff, layout, paging, totals, units, language và quyền truy cập.
3. Kèm technical field catalog theo đúng thứ tự cột gốc; đánh dấu hidden/calculated fields.
4. Kèm control total/scope check và hash SHA-256 của từng file.
5. Owner, SAP key user và IFRS/business reviewer ký kết quả cùng exception list.

## Không được dùng làm thay thế

Synthetic teaching samples, proposed schemas, public screenshots và web references chỉ là context; chúng không đóng native, release hoặc SME gate.

Chi tiết machine-readable nằm trong `native-evidence-intake.json`.

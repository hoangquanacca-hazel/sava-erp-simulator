# Liên kết giao dịch / định khoản trong Phase A

Đây là mô hình đào tạo TT99 **chưa đối chiếu PDF Công báo**, không tư vấn áp dụng pháp lý. Không đổi số học hoặc nghiệp vụ posting trong phiên này.

| Giao dịch / báo cáo | Bút toán hiện có trong simulator | Giải thích kiểm soát |
|---|---|---|
| MIGO261 / MB51, COOIS components | Nợ621/Có152 thực tế | vật tư xuất đối chiếu FI, độ lớn giá trị không dùng dấuH làm số âm lần hai |
| CO11N / confirmations, operations | Nợ622/Có334; Nợ627/Có214 trong kịch bản cơ sở | giờ từ event, tiền khớp FI; không tuyên bố mọi overhead ngoài đời có đối ứng214 |
| Tập hợp chi phí / KOB1 | Nợ154/Có621,622,627 thực tế | lấy đúng154 debit để tránh đếm chi phí hai lần |
| MIGO101 / MB51, header, goods movements | Valuated: Nợ155/Có154 theo standard × share giao | Non-valuated: chỉ số lượng, không FI |
| MIGO601 / MB51, goods movements | Valuated: Nợ6321xx/Có155 theo standard | Non-valuated: chỉ số lượng, không FI |
| KKS1 | không sinh chứng từ mới | actual−plan; đối soát giá trị từ154 và kế hoạchCK13N |
| CK13N | không sinh chứng từ mới | drill kế hoạch621/622/627; dùng lot size, không cộng header với item |
| Settlement / SUP01 | Valuated bất lợi Nợ632/Có154, thuận lợi ngược lại; Non-valuated Nợ632/Có154 phần actual đã giao | settled âm cho favorable; tách khỏi bút toán kết quả911 |
| FAGLL03 | tất cả dòng ACDOCA được cung cấp | Nợ dương/Có âm; document balance và lineage |

VA88/KKA2 được giữ theo mô hình sales-order costing hiện có; không đổi tên thành production-order settlement chuẩn hoặc khẳng định SAP KKS1 thực luôn có layout này. GR/IR, IC, ML không nằm trong gói Phase A UI hiện tại.

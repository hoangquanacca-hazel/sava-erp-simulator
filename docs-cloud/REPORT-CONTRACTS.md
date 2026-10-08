# Hợp đồng Phase A v1

Nguồn là một scenario snapshot: tham số + computed + `buildScenarioEvents` + ACDOCA đã post. Không tái sinh bút toán để lấp thiếu dữ liệu. Báo cáo mô phỏng dùng tên trường SAP gần nhất; **chưa phải approved SAP export variant**. Các trường riêng có tiền tố ZSIM; chưa hỗ trợ các Fiori app thật.

| Báo cáo | Grain / key trong snapshot | Đối soát và dấu |
|---|---|---|
| FAGLL03 | FI item: ledger/company/year/BELNR/DOCLN | HSL = Nợ − Có; so từng dòng và tổng với ACDOCA |
| MB51 | material item: MJAHR/MBLNR/ZEILE | MENGE, DMBTR là độ lớn; SHKZG S/H nhập/xuất; 261→621,101→155,601→6321xx |
| COOIS_HEADER | AUFNR | GAMNG kế hoạch, WEMNG đã giao/GR; không giả trạng thái SAP |
| COOIS_COMPONENTS | AUFNR/RSPOS | planned/actual quantity theo từng UoM; giá trị đối chiếu vật tư thực tế |
| COOIS_OPERATIONS | AUFNR/VORNR | giờ kế hoạch/thực tế từ event; không cộng giờ với tiền |
| COOIS_CONFIRMATIONS | AUFNR/RUECK | yield, labor/machine hours và giá trị 622/627 |
| COOIS_GOODS_MOVEMENTS | MJAHR/MBLNR/ZEILE | cùng nguồn và quy ước MB51 |
| KOB1 | AUFNR/ZSIM_SOURCE_LINE (BELNR/BUZEI) | góc nhìn cost collector 154 Nợ tại bước3; không cộng thêm621/622/627 gây đếm đôi; không phải full COEP |
| KKS1 | AUFNR | plan,actual,variance=actual-plan,settled,WIP; không gán các variance category SAP khi thiếu driver |
| CK13N | KALNR/ZSIM_RECORD/KSTAR | 1 HEADER +3 ITEM 621/622/627; tổng item = header; lot qty và unit cost; không cộng header+item |
| SUP01 | AUFNR/ZSIM_SOURCE_LINE | chỉ dòng154 của bước7; settled=Có−Nợ, thuận lợi âm; không trộn closing911 vào settlement |

Keys chỉ duy nhất trong scenario; khi hợp nhất cần runId/sourceHash. Toàn bộ 11 file dùng cùng runId. CK13N header/item chung một file giải thích số lượng 11 của brief; dictionary dài hạn vẫn có dataset riêng.

## RAW và manifest

UTF-8, tab, LF, banner SIMULATED, dòng trống, header kỹ thuật, data, LF cuối. Chuỗi có tab/newline được flatten khi **sinh** export; file tải xuống là RAW của mô phỏng, không phải bản gốc SAP được nhập. Mỗi file giữ byte private, getter trả bản sao; freeze object và metadata. Tải xuống có thể bị người dùng sửa, SHA-256 dùng phát hiện chứ không ngăn sửa.

Tên tải: `SIM-{sourceHash16}_{reportId}_SIMULATED.txt`; manifest cùng tên thêm `.manifest.json`. Lưu sourceHash đầy đủ, sha256 file, bytes,rowCount,sourceLineCount,totals,schemaVersion,generatorVersion,runId,selection(config/date/material/stock/delivery),adapterVersion=null,phase=GENERATED_RAW. Không đưa timestamp máy vào hash. runId là content ID, không phải event ID chạy nhiều lần. Không lưu tên khách hàng trong manifest.

## Giả định / giới hạn

- Events kế thừa mô hình A0.1: actual quantities/hours suy từ tỷ lệ actual/planned; không đủ làm bằng chứng root cause thực tế.
- Partial delivery/0 delivery và favorable/unfavorable được test. Non-valuated101/601 có quantity, value0 và FI link rỗng.
- Chưa hỗ trợ reversal262/102, nhiều order, nhiều kỳ/UoM conversion hoặc report SAP thật. Không silently map thiếu trường về0.
- Header/canonical schema/adapter CLEAN phiên sau phải được version riêng. Không dùng các layout này làm chứng nhận ECC↔S/4HANA tương đương.

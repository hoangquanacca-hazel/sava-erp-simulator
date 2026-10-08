# S3 — browser RAW → CLEAN v1

Baseline475808e, cùng repo/branch cloud/s1-report-completion. A/B/C tiếp tục ưu tiên: chỉ RAW do simulator sinh; toàn bộ xử lý trong RAM trình duyệt; không lưu server, upload fileSAP thật, DB, worker hoặc mạng mới. Các đề xuất spool/objectstore/quarantine/streaming trong kế hoạch07/10 là deferred.

## Đã triển khai

Registry máy đọc `src/adapters/contracts.v1.json` cho11profile tương ứng PhaseA. Không đổi generator hoặc adapter oracle để đạt kiểm thử. Status SIM_PROFILE_IMPLEMENTED_PENDING_SME; chưa approved SAP export variant. Các canonical fields/grain/keys chỉ cho layout mô phỏng hiện tại, không tự nhận hỗ trợ ECC/Fiori/SAP thật.

`adaptRaw(bytes,manifest)` thực hiện LOAD→DETECT FORMAT→VALIDATE HEADER→PRESERVE RAW→STANDARDIZE→VALIDATE→OUTPUT CLEAN→QUALITY LOG. Giữ bytes và manifest clone trướcawait; mọi failure trả BLOCKED/clean=null, giữ originalbytes +SHA256 +qualitylog. Phasefailure sớm không giả đã chạy các stage sau. RAW lớn trên1MiB, hơn5000rows hoặc profile không biết bị chặn. Counter sourceRows=null khi chưa parse, không đoán0.

- Strict UTF8 khôngBOM, TSV/LF, bannerSIMULATED, columnorder/names đúng hoàn toàn, newlinecuối. Không fuzzy header, guesslocale hoặc alias.
- Verify filehash/bytes, schema/generatorversions, reportprofile thuộc registryownkeys, sourceHash/runId/phase, filename, fixedconfig/date/material/delivery và count. Manifest không ký số; sửa cảRAW+manifest vẫn cần semanticcontrols, SHA256 không chứng minh trustedorigin.
- Identifiers giữ leadingzeros; optionalblank→null; requiredmissing→BLOCK. Money VNDinteger, signedmoney chỉ theo contract, qtydecimal hữu hạn khôngâm. Không silently convert locale '1,25' hay missing→0.
- Checks currency/UoM/date/fiscalperiod/plant/company/ledger/order, duplicate/emptykeys, sign/movement, nonvaluatedFI, manifesttotals, deliveryselection. KKS actual−plan; CK13N header/items/lot×unit. Nullable keycost_element chỉ CKHEADER.
- Rowlineage có rawHash +rawLine(1based,datarow đầu4); metadata schema/adapter/sourceHash/runId. MB51/COOISmovements thêm signed_quantity/signed_amount_lc từ SHKZG; amount_lc gốc độlớn còn nguyên trongCLEAN.
- AcceptedCLEAN frozen JSON, manifestSHA256/bytes/count/rawhash/version với reconciliationStatus=PENDING_S4/businessAcceptance=PENDING_SME. Không xuất CSV để tránh mơ hồ type/leadingzeros.

## Giao diện

Sau7bước cơ sở → SAP Reports → tạo11RAW → DataLab → Chuẩn hóa và kiểm tra dữ liệu. Có kết quả từngreport, tốiđa3rowsCLEAN để xem canonicalfields/lineage, tảiCLEAN/manifestCLEAN/qualitylog. Chỉ resultPASS có CLEAN; mộtreport bịchặn không đồng nghĩa cácreportkhác đã được đốisoátbundle. Không có filepickerSAP thật. Đổi scenario/params làm mất hiệu lực tất cảartefacts cũ qua snapshotkey.

## Bằng chứng

`npm run test:s3`: 54cases×11=594conversions +594hashmutationreject, independent handauthoredMB51fixture, malformedheader/locale/NaN/date/currency/UoM/sign/movement/keydup/count/totals/prototype/version/provenance/name/shape/encoding/size, asyncisolation. WIP/material khớp a0_expected.json giữ nguyên. Bộ UI/parity/A0/reportregression được chạy lại, logs ở evidence/.

Agent khác tác giả review/probe3lỗi (prototype lookup, clone sauawait, selection thiếu/sai). Đã sửa;8probe độc lập xác nhận resolved, baselinevalid vẫnPASS. Bằng chứng nguyên bản ở independent-review/. Intermediate syntheticprobe của QA dùng đúng bản trước sửa để chứng minh defect, không dùng nó làm acceptance script chính; không rerun và diễn giải historicalFAIL là regression mới.

Live browserUAT vẫnBLOCKED do provider của agentkhông khả dụng. Không suy runtimeUITestPASS từ TypeScript/build/API. Downloadedcontent/hash, SME/legal vàM01–M10 chưa nghiệmthu.

## Bước tiếp S4

Đối soát CLEAN giữa11datasets và exceptions C01–C07; orphanjoins/multi-reportselection/totals theoUoM; giải trình/reviewerworkflow trongbrowser. Root-cause/MART/S5 sau S4. ZFIR009A/ZFIR159 vẫn BLOCKED_NO_SAMPLE. Không overwriteRAW, không merge/deploytrongphiênnày.


## UAT mới và sửa bổ sung sau commit3eb5bd1

PhiênQA browser mới đã chạy2cases Samsung/Canon: DataLab11/11PASS, canonicalpreview/lineage, kế thừa settlement/WIP/dashboard đúng, staleRAW+CLEANẩn khi đổi dữliệu. Bằng chứng trước sửa bổ sung ở browser-qa/REPORT.md; downloadedcontent/hash vẫnUNVERIFIED(timeout).

QA còn ghi nhận mastergrid dùngDEFAULT_BOM/ROUTING không cùng nguồncalc, tỷ lệBOM hiển thị quá dài, CostCollector vẫn dùng fullorderP&L ở giao50%, billing narrative dùng fullquantity. Đã sửa ở presentation/SetupScreen/Collector/Ledger: editorfallback phản ánhcomputedBOM, routing dùngresolveRouting, tỷ lệ1decimal, Collector nhận revenue/COGS/GP từACDOCA nhưdashboard, diễn giảiUIbilling theoSLđãgiao. Original posting descriptions/metadata vàcalculator không bị sửa; CSV/PDF legacy cần audit riêng nếu dùngdescription gốc.

MởStep3khi chưa thựcthiMRP thì nhãn“Chưa lập” đúng, không phải lỗi. Khi đãexecuteStep2nhãnMRP; trướcexecuteStep3không nói đãxuất. UI-finance54cases mởrộng kiểm renderededitor, masterlinecost/metadata, Collector↔Margin Analysis↔oracle và billingquantity. Không đổi đápánexpected.


## Chốt S3 và QA mới — 08/10/2026

Code S3: `3eb5bd1`; sửa bổ sung UI: `cbfa51a`. QA độc lập mở phiên trình duyệt mới đã kiểm bản UI phục vụ tại http://127.0.0.1:3017/: Samsung master/BOM và trạng thái MRP; Canon Non-valuated, variance -3,5%, giao 1.000/2.000. Phạm vi kiểm trực tiếp đạt: Collector/Margin/dashboard khớp, billing 1.000 cái, settlement và WIP154 mỗi phần25.614.019, variance có dấu -929.006; tạo11RAW, Data Lab11/11 đạt, typed CLEAN/leading zeros/lineage, đổi tham số vô hiệu hóa RAW+CLEAN. Webinar được khôi phục OFF, không tạo lead.

[Báo cáo QA nguyên bản](browser-qa-final/QA_REPORT.md), [quan sát](browser-qa-final/qa-results.json), ảnh và SHA256 manifest nằm trong browser-qa-final/. Đây là focused browser QA, không phải54case thủ công hoặc nghiệm thu nghiệp vụ. Agent nhận commit từ tác giả; bằng chứng trình duyệt chứng minh UI được phục vụ, không tự chứng minh toàn bộ source-to-build provenance. Kết quả mới thay thế trạng thái browser BLOCKED lịch sử cho đúng phạm vi trên.

Kiểm kỹ thuật:594 adapter conversions và594 hash mutations;54 UI/oracle cases;8 probes độc lập; lint/parity/S1/S2/A0/reports/build/start đềuexit0. Logs tại evidence/ và independent-review/. Download completion/content/hash vẫn UNVERIFIED. S3 hoàn thành kỹ thuật trong phạm vi simulator; S4/S5/S6, golden Mr Quân, SME/TT99/legal và P0-MFG M01–M10 chưa nghiệm thu.

### Chênh lệch còn cần xử lý / quyết định tiếp

- Nhãn Margin Analysis Non-valuated gọi toàn bộ COGS là “Variance VA88”: số tổng khớp nhưng ý nghĩa nhãn chưa được chấp nhận; rà soát trong S4 trước release.
- TP còn0 sau PGI trong ca giao50%: mô hình hiện tại ghi101=1.000 và601=1.000, nên tồnFG0. Phần kế hoạch còn lại chưa có production/GR event, cònWIP. Đây là giả định cần SME xác nhận; không tự thêm1.000TP vào kho khi không có chứng từ.
- Đổi giá giữ ledger đã post nhưng vô hiệu hóa report artefacts; cần thực thi lại kịch bản để tạo bộ số mới. Không sửa ngược chứng từ đã ghi.
- Billing narrative trên UI đã sửa theo giao thực tế; description gốc trong legacy CSV/PDF cần kiểm riêng. Bundle lớn ~1,48MB vẫn backlog hiệu năng.

Tiếp theo S4: controls đối soát liên dataset CLEAN và exceptions C01–C07, giữ lineage và dữ liệu bị chặn; reviewer độc lập kiểm bằng chứng trước human gate. MART/CFO dashboard mở rộng sau lớp control. Không dùng hash thay chứng minh nguồn tin cậy, không gọi RAW trong RAM là WORM. Không merge/push/deploy.

# 24 nhu cầu ưu tiên sau baseline150 — 13/10/2026

Người dùng đã yêu cầu tiếp tục sau khi gửi bảng116 ứng viên/24Cao. Baseline main ebde51a:150 hồ sơ204 biến thể204XLSX408CSV, template static độc lập. Làm trong cùng repo/clean worktree/nhánh codex/sap-priority-business-gaps; không reset/stash/clean checkoutgốc fix/tt99-labels hoặc nguồnprivate. Không sửa engine/React/APIs/functions/routes/dependencies/theme; appnav chỉ cập nhật số lượng.

## Quyết định phạm vi và bằng chứng

Giữ24 nhu cầu nghiệpvụ, sửa9 sai tênApp trong bảng gốc; không thêmApp sai vào danh mục. F1872/F0957 chưa xác nhận: dùng entrypoints được SAP nêu cho nhu cầu (APF1733, profitcenterF0959); không tuyên bố successor/equivalence. ARoverviewF3242 làcardARaging, không phảiAPF1733. SpendF0905 làPurchasingSpend, không phảiSupplierEvaluationF1661/F1661A. DSOF1741;SalesVolumeF1250;historyF1615;balancesF1617. Targetedition/release vẫnUNKNOWN; năm triểnkhai2022 không xác định release. Ưu tiên ECCclassic vàS4query2022 khi có chứng cứ; release mới hơn ghi riêng.

F1780 đã có CO11-02 vàCO11-03 source-reference reconstruction: liên kết lại, không thêm bảntrùng.23 views còn lại được bổ sung thành variants khi cùngpurpose/grain, hoặc hồ sơ mới khi khác nghiệpvụ. Dự kiến10 hồ sơ mới:FI31APaging/FI32DSO/CO31PCAline/CO32KE30/MM31Spend/MM32supplierinvoice/SD16SalesVolume/SD17incomingorders/PM09PMIScost/AA08depreciationrun. Tổng dự kiến160profiles227variants. Không coi raw24rows là24profiles mới.

## Mô hình độc lập

Gói priority-24: viewerstatic, JSONmodel, dictionary/fields/source-evidence, CSVlayout/flat, XLSXLayout/Flat input/Fields, ZIP. Registry24dòng giữ user-supplied identity riêng khỏi correctedentrypoint và availabilitytarget. Hub hiển thị trạng thái3giaiđoạn; 150baseline không là fullacceptance. Từngview ghi grain,keys,sourceversion,fieldprovenance,role(filter/dimension/measure/context),sourceURL,selection,reading,reconciliation,control,IFRSdraft vàlineage.

Phân biệt VISIBLE_SOURCE_LABEL (nếu thực sự đọc ảnh/ô), DOCUMENTED_DIMENSION/MEASURE (tài liệu), SAVA_PROPOSED vàUNKNOWN. Không trộn labels từnhiềuviews thànhmẫu được khẳngđịnh cótrongSAP. Mỗi view áp dụng mộtphạmvi cụthể; thứtựlayout/export chưa có ảnh ghiNOT_VERIFIED. Publicchỉlinknguồn, khôngPDF/ảnhoriginals/credentials/privateinputpaths. DữliệuSAVA giảđịnh rõ; workbook RAW giữstrings phục vụcleanup theo yêu cầu người dùng, không là dữliệusổcái.

## Kiểm tra và releasegate

Lưu baseline hashes654publicfiles/master150objects/manifest. Bảo toàn mẫu cũ byte-for-byte; chỉ index/master/progress thay cóchủđích. Kiểm từngô CSV/XLSX,links,ZIPCRC/manifest,fieldpositions/grain/keys,fixturemissing/locale/duplicate và cáccontrolphươngtrình cóýnghĩa. UI test24needs/23newviews+F1780reference, source/correctedidentity, search/module/mode/download, fullwidthcolumns. Authoring bằngbundledartifacttool; render từsavedfiles riêng, giữprocesscrashrenderer thật nếu còn0xC0000409.

Cập nhậtgategroup vàmanifest cókiểm; lịch sử expansion150 testfirst150 prefix vẫn nguyên, testpriority riêng bảo vệ tổng160/227. CI/regressions/build PASS mớiPRpreview. So11compiledappassets và2functionpackages/config với livebaseline. Merge main vàpublish trong scope được userđãủyquyền, saupreviewpass. HTTP/download/content/hash trênproduction; journal/Obsidianreceipt. Không chạySAPtransaction/create/execute/post/release hoặc gửiAIpaidrequests.

## Rủi ro và giới hạn

Độ sâu/source thật quantrọng hơn sốID;nguồnngữcảnh không chứng nhận layout/fileexport. KE30 tùyform/operatingconcern; proxy/derivedmargin không lànativeKE30. PMIS statistics khácIW39orderlists; balancecarryforward khácactualperiod; AP/AR aging signedcredits/closedafterkeydate phải cópolicy. Fiori apps từrelease mới không mặc định cótrênhệ2022. G1/G2/G3 cònacceptanceconditions, không báo hoànthành cả3 vì160templates. Template runtimeđộc lập nhưng vẫn cùnghosting/release.

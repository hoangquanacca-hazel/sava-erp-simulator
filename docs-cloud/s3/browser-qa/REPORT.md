# Independent fresh browser QA — 2026-10-08

Target: http://127.0.0.1:3017/. Parent-supplied commit 3eb5bd1; server-source binding not independently verified. Fresh hidden IAB tab, reload before execution. Two browser cases only; not 54 matrix or SME/legal/human acceptance.

Overall: mixed PASS/FAIL. S3 runtime RAW to CLEAN UI passed both cases, remaining UI inconsistencies prevent full UI acceptance.

- **PASS — Samsung material total**: 8302500
- **PASS — Samsung old8100000absence**: Not present in observed BOM panels
- **FAIL — Mastergrid and canonicaltree identities**: Samsung mastergridChiMeiABS/masterbatch/tray; treeSabicCycoloy genericmaterial. Canon mastergrid remains sameChiMei rows while canonicaltreePA66GF30; no name consistency acceptance.
- **FAIL — Initialstep3 pendingMRPlabel**: AfterCO01navigationbeforeexecutionstockpanelChưa lập/Chưa tạo PR mua hàng, notMRP; executiondisabled.
- **FAIL — BOM percentage formatting**: 17.020264498087826/29.44049629430763/53.53923920760455 Samsung; Canon31.182862541100718/23.735049038306673/45.082088420592605
- **PASS — Samsung 11RAW/DataLab**: 11/11Đạt; FAGLL03numericamount8302500, stringline_item000001, rawHash546fb7cecc21da97de7e6c510ce51ac2aff0f26a841b9a6b3a50d1295063a200/rawLine4..6
- **PASS — Scenario change invalidation**: Samsung RAW/CLEAN lists disappeared when Canon selected; generatebuttondisabled beforeexecution
- **PASS — Canon partialdelivery narrative**: -3.5%,1000/2000; settled25614019 andWIP25614019
- **PASS — Canon OrderProfitDashboard**: COGS25614019; GP89385981; revenue115000000; signedvariance-929006/-3.6%;32.3+24.6+46.7-3.6=100.0
- **FAIL — Canon collector versus ledger**: Collector revenue230000000,COGS51228038,GP178771962; marginpanelGP89385981 and Thẻ đơn hàng178771962✗lệch; dashboard correct. Billingnarrative says2000units butamount115000000.
- **PASS — Canon 11RAW/DataLab**: 11/11Đạt; KKS1CLEANplanned53086050 actual51228038 variance-1858012 settled25614019 wip25614019; rawHash3e3c73a652eeaaed249f8d457f19e8838b8afe2e372c60cbd5f760800eaa6c5a/rawLine4
- **PASS — Parameter invalidation**: Change-3.5to-3.4 removed allRAW/CLEANbuttons(count0/0); priorledgerremains renderedwhileparameteractualupdates
- **UNVERIFIED — Downloadedcontent/hash**: waitForEvent(download) registeredbeforefirstTảiCLEANclick; Timedoutafter10000ms waitingfordownload. No localfileclaimed.
- **PASS — Live restore**: InitiallyOFF; enabledfortests; restoredOFFverifiedĐangTắt; leadcountremains0.


Reproduction: ADMIN → Cấu Hình Phiên & Webinar Live → enable Live; Samsung preset → CO01 before execution → Chạy hết 7 bước → Kiểm tra và tạo báo cáo → Chuẩn hóa và kiểm tra dữ liệu → first CLEAN preview. Then Canon preset → Tham số CK11N → variance -3.5 and delivered 1000/2000 → run all → generate → DataLab → KKS1 CLEAN preview. Change variance to -3.4 and return to cockpit: RAW/CLEAN lists disappear. Restore Live OFF.

Evidence: observations.json; canon-before-invalidation.txt; canon-data-lab.jpg; after-parameter-change.txt; live-restored-off.txt. Samsung evidence is tool-observed only, no saved screenshot.

Downloads: click attempted with documented download event; event timed out after 10000 ms, no saved file/content/hash verification.

No AI, upload, lead/contact/account identity entry, consent, deploy, repo changes, or human/legal acceptance. Live OFF and lead count 0 verified at finish.

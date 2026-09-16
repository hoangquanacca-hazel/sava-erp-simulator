import * as XLSX from 'xlsx';
import {
  MTOParameters,
  MTOComputed,
  JournalEntry,
  TrialBalanceResult,
  RawMaterialBOMItem,
  RoutingWorkCenter,
  DEFAULT_BOM_ITEMS,
  DEFAULT_ROUTING,
} from '../types';

/**
 * Xuất trọn gói Báo cáo ERP Excel (3 Sheets):
 * Sheet 1: Sổ Nhật Ký Chung (General Ledger Entries)
 * Sheet 2: Bảng Cân Đối Phát Sinh Tài Khoản (Trial Balance)
 * Sheet 3: Báo Cáo Kết Quả Kinh Doanh Đơn Hàng (Order P&L)
 */
export function exportFullERPPackageExcel(
  entries: JournalEntry[],
  trialBalance: TrialBalanceResult,
  params: MTOParameters,
  computed: MTOComputed
): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Sổ Nhật Ký Chung (General Ledger)
  // -------------------------------------------------------------
  const glHeaders = [
    'STT',
    'Bước',
    'Ngày ghi sổ',
    'Số chứng từ',
    'Loại chứng từ',
    'Mã T-Code SAP',
    'Diễn giải nghiệp vụ kế toán',
    'TK Nợ',
    'Tên TK Nợ',
    'TK Có',
    'Tên TK Có',
    'Số tiền (VND)',
    'Đối tượng tập hợp chi phí',
    'Ghi chú chuẩn VAS / SAP',
  ];

  const glRows = entries.map((e, idx) => [
    idx + 1,
    `Bước ${e.stepIndex}`,
    e.postingDate,
    e.voucherNo,
    e.docType,
    e.tCode,
    e.description,
    e.debitAccount,
    e.debitAccountName,
    e.creditAccount,
    e.creditAccountName,
    e.amount,
    e.costObject,
    e.note || '',
  ]);

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  glRows.push([
    '',
    '',
    '',
    '',
    '',
    '',
    'TỔNG CỘNG PHÁT SINH SỔ NHẬT KÝ CHUNG',
    '',
    '',
    '',
    '',
    totalAmount,
    '',
    entries.length > 0 ? 'Cân đối (Nợ = Có)' : '',
  ]);

  const wsGL = XLSX.utils.aoa_to_sheet([
    ['CÔNG TY TNHH CÔNG NGHỆ CHÍNH XÁC SAVA (SAVA PRECISION TECHNOLOGY)'],
    ['SỔ NHẬT KÝ CHUNG — THEO DÕI ĐƠN HÀNG MTO (MAKE-TO-ORDER)'],
    [`Khách hàng: ${params.customer} | Mã đơn hàng: #SO-49281 | Linh kiện: ${params.componentCode} - ${params.componentName}`],
    [`Chuẩn mực kế toán: Thông tư 99/2025/TT-BTC & TT 200/2014/TT-BTC | Tích hợp SAP SD-MM-PP-QM-FICO`],
    [],
    glHeaders,
    ...glRows,
  ]);

  // Set column widths for readability
  wsGL['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 14 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
    { wch: 45 },
    { wch: 10 },
    { wch: 35 },
    { wch: 10 },
    { wch: 35 },
    { wch: 18 },
    { wch: 32 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, wsGL, 'Sổ Nhật Ký Chung (GL)');

  // -------------------------------------------------------------
  // Sheet 2: Bảng Cân Đối Phát Sinh (Trial Balance)
  // -------------------------------------------------------------
  const tbHeaders = [
    'Số hiệu TK',
    'Tên Tài Khoản Kế Toán',
    'Phân loại TK',
    'Số dư Đầu kỳ Nợ (VND)',
    'Số dư Đầu kỳ Có (VND)',
    'Số phát sinh Trong kỳ Nợ (VND)',
    'Số phát sinh Trong kỳ Có (VND)',
    'Số dư Cuối kỳ Nợ (VND)',
    'Số dư Cuối kỳ Có (VND)',
    'Trạng thái kiểm tra',
  ];

  const tbRows = trialBalance.items.map((item) => [
    item.accountNumber,
    item.accountName,
    item.accountType === 'asset'
      ? 'Tài sản'
      : item.accountType === 'liability'
      ? 'Nợ phải trả'
      : item.accountType === 'revenue'
      ? 'Doanh thu'
      : item.accountType === 'expense'
      ? 'Chi phí'
      : 'Xác định KQKD / Trung gian',
    item.openingDebit,
    item.openingCredit,
    item.debitTurnover,
    item.creditTurnover,
    item.closingDebit,
    item.closingCredit,
    item.debitTurnover === item.creditTurnover ? 'Cân đối dòng' : 'Hợp lệ',
  ]);

  tbRows.push([
    'TỔNG',
    'TỔNG CỘNG BẢNG CÂN ĐỐI PHÁT SINH',
    '',
    0,
    0,
    trialBalance.totalDebitTurnover,
    trialBalance.totalCreditTurnover,
    trialBalance.totalClosingDebit,
    trialBalance.totalClosingCredit,
    trialBalance.isBalanced ? 'ĐẠT CÂN ĐỐI TUYỆT ĐỐI' : 'CHÊNH LỆCH',
  ]);

  const wsTB = XLSX.utils.aoa_to_sheet([
    ['CÔNG TY TNHH CÔNG NGHỆ CHÍNH XÁC SAVA (SAVA PRECISION TECHNOLOGY)'],
    ['BẢNG CÂN ĐỐI PHÁT SINH TÀI KHOẢN (TRIAL BALANCE) — MÔ PHỎNG SAP FICO'],
    [`Kỳ kế toán: Đơn hàng MTO #SO-49281 | Sản lượng: ${params.orderQuantity.toLocaleString('vi-VN')} đơn vị`],
    [`Quy định: Thông tư 99/2025/TT-BTC & Thông tư 200/2014/TT-BTC`],
    [],
    tbHeaders,
    ...tbRows,
  ]);

  wsTB['!cols'] = [
    { wch: 12 },
    { wch: 42 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, wsTB, 'Bảng Cân Đối Phát Sinh');

  // -------------------------------------------------------------
  // Sheet 3: Báo Cáo Kết Quả Kinh Doanh Đơn Hàng (Order P&L)
  // -------------------------------------------------------------
  const plHeaders = [
    'Chỉ tiêu phân tích tài chính',
    'Mã số',
    'Giá trị (VND) / Chỉ số',
    'Tỷ lệ % / Đơn giá',
    'Thuyết minh quy trình kế toán SAP & VAS',
  ];

  const plRows = [
    [
      '1. Doanh thu bán hàng và cung cấp dịch vụ (TK 511)',
      '01',
      computed.totalRevenue,
      '100.0%',
      `Hóa đơn VF01: ${params.orderQuantity.toLocaleString('vi-VN')} SP × ${params.sellingPrice.toLocaleString('vi-VN')} đ/SP`,
    ],
    [
      '2. Thuế giá trị gia tăng đầu ra 10% (TK 3331)',
      '02',
      computed.vatAmount,
      `${(params.vatRate * 100).toFixed(0)}%`,
      'Hóa đơn điện tử VAT gửi khách hàng OEM',
    ],
    [
      '3. Tổng giá trị thanh toán phải thu khách hàng (TK 131)',
      '03',
      computed.totalBillingAmount,
      '110.0%',
      `Phải thu đối tác OEM (${params.customer})`,
    ],
    [
      '4. Chi phí nguyên liệu, vật liệu trực tiếp (TK 621)',
      '11',
      computed.directMaterialCost621,
      `${((computed.directMaterialCost621 / (computed.plannedCost || 1)) * 100).toFixed(1)}% giá thành`,
      `MIGO 261E: Xuất hạt nhựa kỹ thuật & phụ gia từ kho Stock E`,
    ],
    [
      '5. Chi phí nhân công trực tiếp ép phun (TK 622)',
      '12',
      computed.directLaborCost622,
      `${((computed.directLaborCost622 / (computed.plannedCost || 1)) * 100).toFixed(1)}% giá thành`,
      `CO11N: Giờ công thợ đứng máy ép (${computed.operatingHours} giờ)`,
    ],
    [
      '6. Chi phí máy móc & sản xuất chung (TK 627)',
      '13',
      computed.totalOverhead627,
      `${((computed.totalOverhead627 / (computed.plannedCost || 1)) * 100).toFixed(1)}% giá thành`,
      `CO11N: Khấu hao máy ép phun, khuôn đúc và điện năng xưởng`,
    ],
    [
      '7. Chi phí tùy biến Option / Gia công thêm',
      '14',
      computed.variantAddonTotal,
      '-',
      'Gia công khử tĩnh điện ESD / Bao bì hút chân không chuyên dụng',
    ],
    [
      '8. Tổng giá thành sản xuất kế hoạch (CK11N / TK 154)',
      '10',
      computed.plannedCost,
      `${computed.unitPlannedCost.toLocaleString('vi-VN')} đ/SP`,
      'Giá thành định mức ban đầu khi mở Sales Order Costing',
    ],
    [
      '9. Chênh lệch chi phí thực tế tại xưởng (Variance)',
      '20',
      computed.actualCostVariance,
      `${params.actualVariancePercent || 0}%`,
      'Chênh lệch hao hụt thực tế xử lý tại bước KKA2 / VA88',
    ],
    [
      '10. Giá vốn hàng bán kế hoạch (TK 632 - COGS)',
      '21',
      computed.plannedCOGS,
      `${((computed.plannedCOGS / (computed.totalRevenue || 1)) * 100).toFixed(1)}% doanh thu`,
      params.stockType === 'Valuated'
        ? 'Valuated Stock E: Ghi nhận giá vốn tại bước Xuất kho giao hàng PGI 601E'
        : 'Non-valuated Stock E: Ghi nhận giá vốn tại bước Quyết toán Settlement VA88',
    ],
    [
      '11. Lợi nhuận gộp đơn hàng (Gross Profit)',
      '30',
      computed.grossProfit,
      `${computed.grossMarginPercent}% Biên LNG`,
      'Doanh thu thuần (TK 511) trừ Giá vốn hàng bán (TK 632)',
    ],
  ];

  const wsPL = XLSX.utils.aoa_to_sheet([
    ['CÔNG TY TNHH CÔNG NGHỆ CHÍNH XÁC SAVA (SAVA PRECISION TECHNOLOGY)'],
    ['BÁO CÁO KẾT QUẢ KINH DOANH ĐƠN HÀNG (ORDER PROFITABILITY & LOSS STATEMENT)'],
    [`Khách hàng: ${params.customer} | Linh kiện: ${params.componentCode}`],
    [`Chiến lược MTO: ${params.strategy} | Loại kho: ${params.stockType} Stock E`],
    [],
    plHeaders,
    ...plRows,
  ]);

  wsPL['!cols'] = [
    { wch: 45 },
    { wch: 10 },
    { wch: 22 },
    { wch: 20 },
    { wch: 55 },
  ];

  XLSX.utils.book_append_sheet(wb, wsPL, 'Kết Quả Đơn Hàng (P&L)');

  // Download file
  const fileName = `Sava_SAP_MTO_BaoCao_ERP_${params.componentCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Tạo file Excel mẫu chuẩn (.xlsx) để người dùng tải về tham khảo và chỉnh sửa tham số:
 */
export function generateSampleExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Tham số đơn hàng chung
  const paramsData = [
    ['THAM SỐ', 'GIÁ TRỊ', 'ĐƠN VỊ TÍNH', 'MÔ TẢ Ý NGHĨA'],
    ['customer', 'VinFast Automotive LLC', 'Tên khách hàng', 'Đối tác OEM đặt hàng'],
    ['componentCode', 'VF-BUMPER-CLIP-01', 'Mã vật tư', 'Mã chi tiết linh kiện OEM'],
    ['componentName', 'Ngàm cài cản trước ô tô điện VF8', 'Tên sản phẩm', 'Mô tả kỹ thuật linh kiện'],
    ['orderQuantity', 5000, 'CÁI', 'Số lượng đơn hàng sản xuất'],
    ['sellingPrice', 45000, 'VND/CÁI', 'Đơn giá bán theo hợp đồng OEM'],
    ['vatRate', 0.1, 'Tỷ lệ (10%)', 'Thuế suất GTGT đầu ra'],
    ['strategy', 'Strategy 20', 'Strategy 20 / Strategy 25', 'Chiến lược MTO trong SAP'],
    ['stockType', 'Valuated', 'Valuated / Non-valuated', 'Loại kho Sales Order Stock E'],
    ['actualVariancePercent', 2.0, '%', 'Tỷ lệ hao hụt chi phí thực tế tại xưởng'],
  ];
  const wsParams = XLSX.utils.aoa_to_sheet(paramsData);
  wsParams['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsParams, 'ThamSoDonHang');

  // Sheet 2: Định mức BOM (Bill of Materials)
  const bomData = [
    ['Mã vật tư (Item Code)', 'Tên nguyên vật liệu', 'Loại vật tư', 'Định mức / 1.000 SP', 'Hao hụt (%)', 'Đơn giá (VND/ĐVT)', 'Đơn vị tính'],
    ['ROH-ABS-757', 'Hạt nhựa ABS kỹ thuật ChiMei PA-757', 'ROH', 22.5, 2.5, 52000, 'KG'],
    ['ROH-MB-BK01', 'Hạt màu Masterbatch đen chịu nhiệt', 'ROH', 0.5, 1.0, 120000, 'KG'],
    ['VERP-TRAY-01', 'Khay vỉ định hình chống tĩnh điện ESD', 'VERP', 1000, 1.5, 850, 'CÁI'],
  ];
  const wsBOM = XLSX.utils.aoa_to_sheet(bomData);
  wsBOM['!cols'] = [{ wch: 20 }, { wch: 36 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsBOM, 'DinhMucBOM');

  // Sheet 3: Routing định mức chuyền máy ép
  const routingData = [
    ['Mã Work Center', 'Tên xưởng máy', 'Setup khuôn (Giờ)', 'Chu kỳ ép (Giây/SP)', 'Giá giờ máy (VND/giờ)', 'Giá giờ công (VND/giờ)', 'Tỷ lệ SXC chung (%)'],
    ['WC-INJ-01', 'Máy ép Haitian Mars II 350T & Thợ bậc 4', 1.5, 26, 145000, 75000, 8.0],
  ];
  const wsRouting = XLSX.utils.aoa_to_sheet(routingData);
  wsRouting['!cols'] = [{ wch: 18 }, { wch: 38 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsRouting, 'RoutingDinhMuc');

  XLSX.writeFile(wb, 'Mau_ThamSo_MTO_Sava.xlsx');
}

/**
 * Đọc file Excel người dùng tải lên và chuyển đổi thành thông số MTOParameters
 */
export async function parseParametersFromExcel(file: File): Promise<{
  success: boolean;
  params?: Partial<MTOParameters>;
  message: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return { success: false, message: 'File Excel không có dữ liệu bảng tính.' };
    }

    const result: Partial<MTOParameters> = {};

    // 1. Tìm sheet ThamSoDonHang hoặc Sheet đầu tiên
    const paramSheetName =
      wb.SheetNames.find((s) => s.toLowerCase().includes('thamso') || s.toLowerCase().includes('order')) ||
      wb.SheetNames[0];

    const paramSheet = wb.Sheets[paramSheetName];
    if (paramSheet) {
      const rows: any[][] = XLSX.utils.sheet_to_json(paramSheet, { header: 1 });
      for (const row of rows) {
        if (!row || row.length < 2) continue;
        const key = String(row[0]).trim();
        const val = row[1];

        if (key === 'customer') result.customer = String(val);
        else if (key === 'componentCode') result.componentCode = String(val);
        else if (key === 'componentName') result.componentName = String(val);
        else if (key === 'orderQuantity') result.orderQuantity = Number(val) || 1000;
        else if (key === 'sellingPrice') result.sellingPrice = Number(val) || 10000;
        else if (key === 'vatRate') result.vatRate = Number(val) || 0.1;
        else if (key === 'strategy') result.strategy = String(val).includes('25') ? 'Strategy 25' : 'Strategy 20';
        else if (key === 'stockType') result.stockType = String(val).toLowerCase().includes('non') ? 'Non-valuated' : 'Valuated';
        else if (key === 'actualVariancePercent') result.actualVariancePercent = Number(val) || 0;
      }
    }

    // 2. Tìm sheet DinhMucBOM nếu có
    const bomSheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('bom') || s.toLowerCase().includes('dinhmuc')
    );

    if (bomSheetName && wb.Sheets[bomSheetName]) {
      const bomSheet = wb.Sheets[bomSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(bomSheet, { header: 1 });
      const bomItems: RawMaterialBOMItem[] = [];

      // Bỏ qua dòng tiêu đề (dòng 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;
        const itemCode = String(row[0] || '').trim();
        if (!itemCode) continue;

        bomItems.push({
          id: `excel-bom-${i}`,
          itemCode,
          name: String(row[1] || itemCode),
          materialType: String(row[2] || 'ROH').trim() as any,
          qtyPer1000: Number(row[3]) || 1,
          scrapRatePercent: Number(row[4]) || 0,
          unitPrice: Number(row[5]) || 1000,
          uom: String(row[6] || 'KG'),
        });
      }

      if (bomItems.length > 0) {
        result.bomItems = bomItems;
        // Cập nhật giá hạt nhựa cơ bản từ dòng đầu tiên
        const primaryResin = bomItems.find((b) => b.materialType === 'ROH');
        if (primaryResin) {
          result.resinType = primaryResin.name;
          result.resinPricePerKg = primaryResin.unitPrice;
          result.materialNormKgPer1000 = primaryResin.qtyPer1000;
        }
      }
    }

    // 3. Tìm sheet Routing nếu có
    const routingSheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('routing') || s.toLowerCase().includes('chuyen')
    );

    if (routingSheetName && wb.Sheets[routingSheetName]) {
      const routingSheet = wb.Sheets[routingSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(routingSheet, { header: 1 });
      if (rows.length >= 2) {
        const row = rows[1];
        if (row && row.length >= 4) {
          const routing: RoutingWorkCenter = {
            workCenterCode: String(row[0] || 'WC-INJ-01'),
            workCenterName: String(row[1] || 'Máy ép Haitian Mars II'),
            machineSetupTimeHours: Number(row[2]) || 1.5,
            cycleTimeSeconds: Number(row[3]) || 26,
            machineHourlyRate: Number(row[4]) || 145000,
            laborHourlyRate: Number(row[5]) || 75000,
            factoryOverheadRatePercent: Number(row[6]) || 8.0,
          };
          result.routing = routing;
          result.machineRatePerHour = routing.machineHourlyRate;
          result.laborRatePerHour = routing.laborHourlyRate;
        }
      }
    }

    return {
      success: true,
      params: result,
      message: `Đã import thành công dữ liệu từ file Excel "${file.name}"!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Lỗi đọc file Excel: ${error?.message || 'Không đúng định dạng'}`,
    };
  }
}

import {
  MTOParameters,
  MTOComputed,
  JournalEntry,
  TrialBalanceItem,
  SpecialStockEState,
  SalesOrderCostCardState,
  StepDefinition,
  BOMComponentNode,
  VARIANT_COLORS,
  VARIANT_TEXTURES,
  VARIANT_PACKAGINGS,
} from '../types';

/**
 * Tính toán toàn bộ các chỉ số chi phí kế hoạch, doanh thu, thuế GTGT, giá vốn và lợi nhuận
 * từ các tham số người dùng nhập vào.
 * 100% tính toán thực sự từ công thức thực, hỗ trợ Strategy 25 (Variant Configuration) và Variance.
 */
export function computeMTO(params: MTOParameters): MTOComputed {
  // 1. Kiểm tra cấu hình Variant nếu chọn Strategy 25
  let colorResinAddon = 0;
  let textureResinAddon = 0;
  let textureUnitAddon = 0;
  let packagingUnitAddon = 0;

  if (params.strategy === 'Strategy 25') {
    const color = VARIANT_COLORS.find((c) => c.id === params.variantColorId);
    const texture = VARIANT_TEXTURES.find((t) => t.id === params.variantTextureId);
    const packaging = VARIANT_PACKAGINGS.find((p) => p.id === params.variantPackagingId);

    if (color) colorResinAddon = color.resinCostAddonPerKg;
    if (texture) {
      textureResinAddon = texture.resinCostAddonPerKg;
      textureUnitAddon = texture.unitCostAddon;
    }
    if (packaging) packagingUnitAddon = packaging.unitCostAddon;
  }

  const effectiveResinPricePerKg = params.resinPricePerKg + colorResinAddon + textureResinAddon;

  // 2. Định mức hạt nhựa resin kỹ thuật cơ bản:
  const totalResinKg = (params.orderQuantity / 1000) * params.materialNormKgPer1000;

  // 3. Dynamic BOM Master Data Engine (MM/PP - CK11N):
  // Nếu có danh sách bomItems thì bóc tách chi tiết, nếu không thì dùng bộ vật tư tiêu chuẩn
  const bomItems =
    params.bomItems && params.bomItems.length > 0
      ? params.bomItems
      : [
          {
            id: 'bom-resin-default',
            itemCode: `ROH-${(params.resinType || 'ABS').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 10).toUpperCase()}`,
            name: `Hạt nhựa kỹ thuật ${params.resinType || 'ABS'}`,
            materialType: 'ROH' as const,
            qtyPer1000: params.materialNormKgPer1000,
            scrapRatePercent: 2.5,
            unitPrice: effectiveResinPricePerKg,
            uom: 'KG',
          },
          ...(colorResinAddon > 0
            ? [
                {
                  id: 'bom-color-default',
                  itemCode: 'ROH-MB-COLOR',
                  name: `Hạt màu Masterbatch (${params.variantColorName || 'Đặc thù'})`,
                  materialType: 'ROH' as const,
                  qtyPer1000: Number((params.materialNormKgPer1000 * 0.02).toFixed(2)),
                  scrapRatePercent: 1.0,
                  unitPrice: colorResinAddon * 50,
                  uom: 'KG',
                },
              ]
            : []),
          ...(packagingUnitAddon > 0
            ? [
                {
                  id: 'bom-pack-default',
                  itemCode: 'VERP-PACKAGING',
                  name: `Bao bì đóng gói (${params.variantPackagingName || 'OEM Tray'})`,
                  materialType: 'VERP' as const,
                  qtyPer1000: 1000,
                  scrapRatePercent: 1.0,
                  unitPrice: packagingUnitAddon,
                  uom: 'CÁI',
                },
              ]
            : []),
        ];

  const bomItemBreakdowns = bomItems.map((item) => {
    const grossQty = (params.orderQuantity / 1000) * item.qtyPer1000 * (1 + (item.scrapRatePercent || 0) / 100);
    const totalCost = Math.round(grossQty * item.unitPrice);
    const unitCost = params.orderQuantity > 0 ? Math.round(totalCost / params.orderQuantity) : 0;
    return {
      itemCode: item.itemCode,
      name: item.name,
      grossQty: Number(grossQty.toFixed(2)),
      uom: item.uom,
      totalCost,
      unitCost,
      sharePercent: 0,
    };
  });

  const directMaterialCost621 = bomItemBreakdowns.reduce((sum, b) => sum + b.totalCost, 0);
  const materialCost = directMaterialCost621;

  // 4. Routing & Work Center Engine (CA01 / CR01 / CK11N):
  const routing =
    params.routing || {
      workCenterCode: 'WC-INJ-01',
      workCenterName: 'Máy ép Haitian Mars II 350T & Thợ bậc 4',
      machineSetupTimeHours: 1.5,
      cycleTimeSeconds:
        params.orderQuantity > 0 && params.machineHours > 0
          ? Math.max(10, Math.round((params.machineHours * 3600) / params.orderQuantity))
          : 26,
      machineHourlyRate: params.machineRatePerHour || 145000,
      laborHourlyRate: params.laborRatePerHour || 75000,
      factoryOverheadRatePercent: 8.0,
    };

  const cycleHours = (routing.cycleTimeSeconds * params.orderQuantity) / 3600;
  const operatingHours = Number((cycleHours + (routing.machineSetupTimeHours || 0)).toFixed(2));

  // Direct Labor Cost (TK 622) = (Cycle Time * Order Qty / 3600 + Setup) * Labor Hourly Rate
  const directLaborCost622 =
    params.laborCostMode === 'hourly'
      ? Math.round(operatingHours * routing.laborHourlyRate)
      : Math.round(params.laborTotal);
  const effectiveLaborCost = directLaborCost622;

  // Machine Overhead (TK 627) = Operating Hours * Machine Hourly Rate
  const machineOverhead627 =
    params.machineCostMode === 'hourly'
      ? Math.round(operatingHours * routing.machineHourlyRate)
      : Math.round(params.machineTotal);

  // Factory Overhead (TK 627) = (Material Cost + Labor Cost) * Overhead Rate %
  const factoryOverhead627 = Math.round(
    (directMaterialCost621 + directLaborCost622) * (routing.factoryOverheadRatePercent / 100)
  );

  const totalOverhead627 = machineOverhead627 + factoryOverhead627;
  const effectiveMachineCost = totalOverhead627;

  // Chi phí biến thể gia tăng trên từng đơn vị sản phẩm (khử tĩnh điện, phụ kiện bề mặt):
  const variantAddonTotal = Math.round(params.orderQuantity * (textureUnitAddon + packagingUnitAddon));

  const laborOverheadTotal = effectiveLaborCost + effectiveMachineCost + variantAddonTotal;

  // 5. Tổng giá thành sản xuất kế hoạch (Planned Production Cost - CK11N / CK24):
  const plannedCost = directMaterialCost621 + directLaborCost622 + totalOverhead627 + variantAddonTotal;

  const unitPlannedCost =
    params.orderQuantity > 0 ? Math.round(plannedCost / params.orderQuantity) : 0;

  // Cập nhật tỷ lệ % chia sẻ chi phí cho từng dòng BOM
  bomItemBreakdowns.forEach((b) => {
    b.sharePercent = plannedCost > 0 ? Number(((b.totalCost / plannedCost) * 100).toFixed(1)) : 0;
  });

  // 6. Tính toán Chênh lệch chi phí thực tế tại xưởng (Shop-floor Variance):
  const variancePercent = params.actualVariancePercent || 0;
  const actualCostVariance = Math.round(plannedCost * (variancePercent / 100));
  const actualCostBeforeRework = plannedCost + actualCostVariance;

  // 7. Doanh thu & Thuế GTGT:
  const totalRevenue = Math.round(params.orderQuantity * params.sellingPrice);
  const vatAmount = Math.round(totalRevenue * params.vatRate);
  const totalBillingAmount = totalRevenue + vatAmount;

  // 8. Giá vốn & Lợi nhuận gộp kế hoạch:
  const plannedCOGS = plannedCost;
  const grossProfit = totalRevenue - plannedCOGS;
  const grossMarginPercent =
    totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;

  return {
    totalResinKg: Number(totalResinKg.toFixed(2)),
    effectiveResinPricePerKg,
    materialCost,
    effectiveLaborCost,
    effectiveMachineCost,
    laborOverheadTotal,
    variantAddonTotal,
    plannedCost,
    unitPlannedCost,
    directMaterialCost621,
    directLaborCost622,
    machineOverhead627,
    factoryOverhead627,
    totalOverhead627,
    operatingHours,
    bomItemBreakdowns,
    actualCostVariance,
    actualCostBeforeRework,
    totalRevenue,
    vatAmount,
    totalBillingAmount,
    plannedCOGS,
    grossProfit,
    grossMarginPercent,
  };
}

/**
 * Định dạng tiền tệ Việt Nam đồng (VND) theo chuẩn dấu chấm ngăn cách hàng nghìn.
 * Ví dụ: 12500000 -> 12.500.000 ₫
 */
export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  const parts = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${parts} ₫`;
}

/**
 * Định dạng số thông thường với dấu chấm hàng nghìn
 */
export function formatNumber(amount: number, decimals: number = 0): string {
  if (isNaN(amount)) return '0';
  if (decimals > 0) {
    const fixed = amount.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedInt},${decPart}`;
  }
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Định nghĩa 7 bước trong quy trình SAP Make-to-Order (MTO) tại PIC Vietnam
 */
export const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 1,
    title: 'Tạo Đơn Hàng Bán & Tính Giá Thành Kế Hoạch',
    sapModule: 'SD · CO',
    tCode: 'VA01 / CK51N',
    shortDesc: 'Khởi tạo Sales Order gắn mã khách hàng OEM và chạy tính giá thành đơn hàng (Unit Costing).',
    detailedAction:
      'Hệ thống tạo Sales Order đối tượng tập hợp chi phí. T-code CK51N tự động bóc tách BOM & Routing để tính Tổng giá thành sản xuất kế hoạch.',
    learningPoint:
      'Bước này thuộc phân hệ SD và CO-PC. Chưa có giao dịch kho vật lý hay chuyển giao quyền sở hữu nên KHÔNG phát sinh bút toán tài chính trên Sổ Cái (FI).',
  },
  {
    id: 2,
    title: 'Chạy Hoạch Định Nhu Cầu Vật Tư (MRP)',
    sapModule: 'PP · MM',
    tCode: 'MD02',
    shortDesc: 'Chạy MRP đơn hàng riêng (Single-Item Multi-Level) để tính toán nhu cầu hạt nhựa resin.',
    detailedAction:
      'Hệ thống phân tích tồn kho và định mức kỹ thuật, tự động sinh Lệnh kế hoạch (Planned Order) và Yêu cầu mua hàng (Purchase Requisition - PR) chỉ định cho Special Stock E.',
    learningPoint:
      'PP và MM tạo các chứng từ kế hoạch logistics. Chưa phát sinh nhập xuất kho thực tế nên chưa ghi sổ kế toán FI.',
  },
  {
    id: 3,
    title: 'Sản Xuất Tại Xưởng Ép Nhựa & Xuất/Nhập Kho',
    sapModule: 'PP · MM · FI',
    tCode: 'CO01 · MIGO 261E · CO11N · MIGO 101E',
    movementType: '261E & 101E',
    shortDesc: 'Xuất hạt nhựa cho Lệnh sản xuất, ghi nhận giờ công & máy ép, sau đó nhập kho thành phẩm.',
    detailedAction:
      'Chuyển Lệnh kế hoạch thành Lệnh sản xuất CO01. Xuất kho hạt nhựa (MIGO 261E), xác nhận công nhân và máy ép (CO11N), nhập kho thành phẩm hoàn thành (MIGO 101E).',
    learningPoint:
      'Định khoản Thông tư 200: Nợ 621/Có 152 (NVL), Nợ 622/Có 334 (Nhân công), Nợ 627/Có 214 (SXC), sau đó kết chuyển Nợ 154/Có 621,622,627. Nếu là Kho Valuated Stock E: Nhập kho ghi Nợ 155/Có 154. Nếu Non-valuated Stock E: KHÔNG sinh bút toán Nợ 155/Có 154 (chỉ ghi nhận số lượng vật lý vào kho E)!',
  },
  {
    id: 4,
    title: 'Kiểm Định Chất Lượng & Quyết Định Sử Dụng (UD)',
    sapModule: 'QM',
    tCode: 'QA11',
    shortDesc: 'Bộ phận KCS kiểm tra độ co ngót, bọt khí, kích thước khuôn mẫu và đưa ra Usage Decision.',
    detailedAction:
      'KCS mở Inspection Lot trên T-code QA11. Lựa chọn Quyết định sử dụng: Pass (Đạt - chuyển kho sử dụng) hoặc Fail (Lỗi - chặn xuất kho và kích hoạt nhánh Rework xử lý).',
    learningPoint:
      'Nếu Fail, hệ thống KHÓA không cho thực hiện giao hàng bước 5. Doanh nghiệp bắt buộc phải xử lý nhánh Rework (Sửa chữa phát sinh chi phí hoặc Nhượng bộ kỹ thuật) mới được mở khóa.',
  },
  {
    id: 5,
    title: 'Xuất Kho Giao Hàng Cho Khách (Delivery & PGI)',
    sapModule: 'SD · MM · FI',
    tCode: 'VL01N · MIGO 601E',
    movementType: '601E',
    shortDesc: 'Tạo phiếu giao hàng Outbound Delivery và thực hiện Post Goods Issue (PGI) giao cho khách OEM.',
    detailedAction:
      'Xuất hàng từ Special Stock E lên xe vận chuyển giao cho nhà máy của khách hàng. Trừ tồn kho vật lý thành phẩm.',
    learningPoint:
      'ĐIỂM MẤU CHỐT CỦA MTO: Nếu Kho Valuated: PGI tự động ghi nhận Giá vốn hàng bán Nợ 632 / Có 155. Nếu Kho Non-valuated: PGI KHÔNG sinh bút toán Nợ 632/Có 155 vì TK 155 không có giá trị tiền tệ — giá vốn sẽ được ghi nhận ở Bước 7!',
  },
  {
    id: 6,
    title: 'Lập Hóa Đơn Thương Mại (Billing)',
    sapModule: 'SD · FICO',
    tCode: 'VF01',
    shortDesc: 'Phát hành hóa đơn bán hàng cho khách hàng OEM dựa trên chứng từ giao hàng đã hoàn thành.',
    detailedAction:
      'Kế toán lập Billing Document trên T-code VF01, ghi nhận Doanh thu bán hàng và Thuế GTGT 10% gửi cho Samsung/Canon/Denso.',
    learningPoint:
      'Hạch toán Doanh thu và Thuế theo TT 200: Nợ TK 131 (Phải thu khách hàng) / Có TK 511 (Doanh thu bán hàng) và Có TK 3331 (Thuế GTGT đầu ra phải nộp).',
  },
  {
    id: 7,
    title: 'Phân Tích Kết Quả & Quyết Toán Đơn Hàng (Settlement)',
    sapModule: 'CO · FI',
    tCode: 'KKA2 · VA88',
    shortDesc: 'Chạy Result Analysis đánh giá dở dang/giá vốn và Quyết toán Sales Order vào phân hệ CO-PA.',
    detailedAction:
      'KKA2 xác định trạng thái hoàn tất đơn hàng. VA88 quyết toán toàn bộ chi phí và doanh thu từ Sales Order Cost Collector vào Phân tích lợi nhuận CO-PA và kết chuyển sổ cái 911.',
    learningPoint:
      'ĐẶC BIỆT VỚI NON-VALUATED STOCK: Tại bước này hệ thống mới hạch toán Giá vốn Nợ 632 / Có 154 để tất toán tài khoản 154 về 0. Cuối cùng, kết chuyển 511 và 632 vào 911 để xác định Lợi nhuận gộp thực tế.',
  },
];

/**
 * Sinh các bút toán sổ cái cho từng bước dựa trên tham số thực và trạng thái kho
 */
export function generateStepEntries(
  stepId: number,
  params: MTOParameters,
  computed: MTOComputed,
  reworkCost: number = 0,
  scrapCost: number = 0,
  resolutionMethod?: 'rework' | 'scrap' | 'concession' | null
): JournalEntry[] {
  const isValuated = params.stockType === 'Valuated';
  const soCode = 'SO-PIC-2026-49281';
  const entries: JournalEntry[] = [];
  const today = '15/09/2026';

  if (stepId === 1 || stepId === 2) {
    // Bước 1 và 2: Lập Sales Order & Hoạch định MRP. Không sinh bút toán tài chính (FI).
    return [];
  }

  if (stepId === 3) {
    // 1. Xuất kho NVL hạt nhựa (MIGO 261E)
    const strategyNote =
      params.strategy === 'Strategy 20'
        ? 'Strategy 20 (MTO Thuần): Vật tư hạt nhựa cách ly tuyệt đối cho Sales Order #49281, không điều chuyển chéo.'
        : `Strategy 25 (Variant Config): Bao gồm phụ gia ${params.variantColorName || 'Đặc thù'} và chi tiết định hình.`;

    entries.push({
      id: `entry-3-1`,
      stepIndex: 3,
      voucherNo: `PKT-261E-01`,
      docType: 'WA - Xuất kho NVL SX',
      postingDate: today,
      tCode: 'MIGO 261E',
      description: `Xuất ${formatNumber(computed.totalResinKg, 2)} kg ${params.resinType} cho Đơn hàng ${soCode}`,
      debitAccount: '621',
      debitAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp',
      creditAccount: '152',
      creditAccountName: 'Nguyên liệu, vật liệu (Kho hạt nhựa kỹ thuật)',
      amount: computed.materialCost,
      costObject: `Lệnh SX #PRD-01 (${soCode})`,
      note: `Movement 261E: Xuất kho hạt nhựa cho Lệnh sản xuất riêng của Sales Order Stock E. ${strategyNote}`,
    });

    // 2. Ghi nhận nhân công trực tiếp ép nhựa (CO11N)
    entries.push({
      id: `entry-3-2`,
      stepIndex: 3,
      voucherNo: `PKT-CO11N-01`,
      docType: 'CO - Nhân công trực tiếp',
      postingDate: today,
      tCode: 'CO11N',
      description: `Chi phí nhân công thợ vận hành máy ép nhựa cho Đơn hàng ${soCode}`,
      debitAccount: '622',
      debitAccountName: 'Chi phí nhân công trực tiếp',
      creditAccount: '334',
      creditAccountName: 'Phải trả người lao động (Lương thợ ép)',
      amount: computed.effectiveLaborCost,
      costObject: `Lệnh SX #PRD-01 (${soCode})`,
      note: 'Confirmation xác nhận giờ công lao động trực tiếp tại xưởng ép phun nhựa.',
    });

    // 3. Ghi nhận chi phí máy móc, điện năng & sản xuất chung (CO11N)
    entries.push({
      id: `entry-3-3`,
      stepIndex: 3,
      voucherNo: `PKT-CO11N-02`,
      docType: 'CO - Chi phí SX chung',
      postingDate: today,
      tCode: 'CO11N',
      description: `Khấu hao máy ép phun, khuôn mẫu, điện 3 pha và phụ kiện bao bì chi tiết ${params.componentCode}`,
      debitAccount: '627',
      debitAccountName: 'Chi phí sản xuất chung (Máy & Điện xưởng ép)',
      creditAccount: '214',
      creditAccountName: 'Hao mòn TSCĐ & Chi phí phải trả (Máy ép/Điện lực)',
      amount: computed.effectiveMachineCost + computed.variantAddonTotal,
      costObject: `Lệnh SX #PRD-01 (${soCode})`,
      note: 'Xác nhận chi phí máy ép phun và phân bổ phụ trợ sản xuất theo Routing.',
    });

    // 4. Tập hợp chi phí sản xuất vào sản phẩm dở dang (TK 154 - Period-end / Order Collection)
    entries.push({
      id: `entry-3-4a`,
      stepIndex: 3,
      voucherNo: `PKT-154-01`,
      docType: 'KC - Tập hợp giá thành',
      postingDate: today,
      tCode: 'CO01',
      description: `Kết chuyển chi phí NVL trực tiếp sang chi phí sản xuất dở dang`,
      debitAccount: '154',
      debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
      creditAccount: '621',
      creditAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp',
      amount: computed.materialCost,
      costObject: `Đối tượng tính giá thành: ${soCode}`,
      note: 'Kết chuyển chi phí 621 sang TK 154 theo Thông tư 200/2014/TT-BTC.',
    });

    entries.push({
      id: `entry-3-4b`,
      stepIndex: 3,
      voucherNo: `PKT-154-02`,
      docType: 'KC - Tập hợp giá thành',
      postingDate: today,
      tCode: 'CO01',
      description: `Kết chuyển chi phí nhân công trực tiếp sang chi phí sản xuất dở dang`,
      debitAccount: '154',
      debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
      creditAccount: '622',
      creditAccountName: 'Chi phí nhân công trực tiếp',
      amount: computed.effectiveLaborCost,
      costObject: `Đối tượng tính giá thành: ${soCode}`,
      note: 'Kết chuyển chi phí 622 sang TK 154 theo Thông tư 200.',
    });

    entries.push({
      id: `entry-3-4c`,
      stepIndex: 3,
      voucherNo: `PKT-154-03`,
      docType: 'KC - Tập hợp giá thành',
      postingDate: today,
      tCode: 'CO01',
      description: `Kết chuyển chi phí sản xuất chung máy & điện sang chi phí sản xuất dở dang`,
      debitAccount: '154',
      debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
      creditAccount: '627',
      creditAccountName: 'Chi phí sản xuất chung',
      amount: computed.effectiveMachineCost + computed.variantAddonTotal,
      costObject: `Đối tượng tính giá thành: ${soCode}`,
      note: 'Kết chuyển chi phí 627 sang TK 154 theo Thông tư 200.',
    });

    // 5. Nhập kho thành phẩm hoàn thành (MIGO 101E)
    if (isValuated) {
      entries.push({
        id: `entry-3-5`,
        stepIndex: 3,
        voucherNo: `PKT-101E-01`,
        docType: 'WE - Nhập kho thành phẩm',
        postingDate: today,
        tCode: 'MIGO 101E',
        description: `Nhập kho ${formatNumber(params.orderQuantity)} cái ${params.componentCode} vào Kho Valuated Stock E`,
        debitAccount: '155',
        debitAccountName: 'Thành phẩm (Kho riêng Sales Order E có định giá)',
        creditAccount: '154',
        creditAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
        amount: computed.plannedCost,
        costObject: `Sales Order Stock E (${soCode})`,
        note: 'VALUATED STOCK: Movement 101E ghi nhận giá trị thành phẩm nhập kho Nợ 155 / Có 154 theo giá thành kế hoạch.',
      });
    } else {
      // Chú ý: Nếu Non-valuated stock, MIGO 101E KHÔNG sinh bút toán Nợ 155/Có 154!
      // Hệ thống chỉ theo dõi về mặt số lượng vật lý trong kho E.
    }

    return entries;
  }

  if (stepId === 4) {
    // Bước 4: QM Inspection & Usage Decision (QA11)
    if (resolutionMethod === 'rework' && reworkCost > 0) {
      const reworkMaterial = Math.round(reworkCost * 0.45);
      const reworkLabor = reworkCost - reworkMaterial;

      entries.push({
        id: `entry-4-rework-mat`,
        stepIndex: 4,
        voucherNo: `PKT-CO07-01`,
        docType: 'CO07 - Lệnh gia công sửa chữa',
        postingDate: today,
        tCode: 'CO07 / MIGO 261E',
        description: `Xuất hạt nhựa ép bù gia công sửa chữa lỗi kiểm định KCS`,
        debitAccount: '621',
        debitAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp (Ép bù Rework)',
        creditAccount: '152',
        creditAccountName: 'Nguyên liệu, vật liệu (Kho hạt nhựa)',
        amount: reworkMaterial,
        costObject: `Lệnh SX Rework #CO07-RW01 (${soCode})`,
        note: 'Quy trình Rework: Cấp thêm hạt nhựa ép bù xử lý lỗi khuôn/co ngót.',
      });

      entries.push({
        id: `entry-4-rework-lab`,
        stepIndex: 4,
        voucherNo: `PKT-CO07-02`,
        docType: 'CO07 - Nhân công gọt ba-via',
        postingDate: today,
        tCode: 'CO07 / CO11N',
        description: `Chi phí nhân công thợ gọt ba-via, đánh bóng sửa chi tiết không đạt KCS`,
        debitAccount: '622',
        debitAccountName: 'Chi phí nhân công trực tiếp (Công thợ Rework)',
        creditAccount: '334',
        creditAccountName: 'Phải trả người lao động (Lương phụ trội sửa lỗi)',
        amount: reworkLabor,
        costObject: `Lệnh SX Rework #CO07-RW01 (${soCode})`,
        note: 'Công nhân nguội xử lý ba-via và mài phẳng theo tiêu chuẩn kỹ thuật OEM.',
      });

      entries.push({
        id: `entry-4-rework-kc-mat`,
        stepIndex: 4,
        voucherNo: `PKT-CO07-03`,
        docType: 'KC - Tập hợp chi phí Rework',
        postingDate: today,
        tCode: 'CO07',
        description: `Kết chuyển chi phí NVL gia công lại vào chi phí sản xuất dở dang`,
        debitAccount: '154',
        debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
        creditAccount: '621',
        creditAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp',
        amount: reworkMaterial,
        costObject: `Đối tượng tính giá thành: ${soCode}`,
        note: 'Kết chuyển chi phí sửa chữa vào giá thành sản phẩm.',
      });

      entries.push({
        id: `entry-4-rework-kc-lab`,
        stepIndex: 4,
        voucherNo: `PKT-CO07-04`,
        docType: 'KC - Tập hợp chi phí Rework',
        postingDate: today,
        tCode: 'CO07',
        description: `Kết chuyển chi phí nhân công gia công lại vào chi phí sản xuất dở dang`,
        debitAccount: '154',
        debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
        creditAccount: '622',
        creditAccountName: 'Chi phí nhân công trực tiếp',
        amount: reworkLabor,
        costObject: `Đối tượng tính giá thành: ${soCode}`,
        note: 'Tích lũy chi phí Rework vào Sales Order Cost Collector.',
      });

      if (isValuated) {
        entries.push({
          id: `entry-4-rework-gr`,
          stepIndex: 4,
          voucherNo: `PKT-CO07-05`,
          docType: 'WE - Bổ sung giá trị kho E',
          postingDate: today,
          tCode: 'MIGO 101E',
          description: `Cập nhật tăng giá trị thành phẩm kho E sau khi hoàn tất nghiệm thu Rework`,
          debitAccount: '155',
          debitAccountName: 'Thành phẩm (Kho riêng Sales Order E)',
          creditAccount: '154',
          creditAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
          amount: reworkCost,
          costObject: `Sales Order Stock E (${soCode})`,
          note: 'Valuated Stock: Cập nhật tăng giá trị kho thành phẩm sau khi KCS tái kiểm định Đạt.',
        });
      }
    } else if (resolutionMethod === 'scrap' && scrapCost > 0) {
      // Nhánh Scrap: Hủy phế phẩm và kích hoạt Lệnh sản xuất bù số lượng
      entries.push({
        id: `entry-4-scrap-loss`,
        stepIndex: 4,
        voucherNo: `PKT-QM-SCRAP01`,
        docType: 'QM - Tổn thất phế phẩm không thể phục hồi',
        postingDate: today,
        tCode: 'QA11 (Scrap)',
        description: `Ghi nhận tổn thất phế phẩm ép nhựa nứt vỡ/bọt khí không thể phục hồi theo TT 200`,
        debitAccount: '632',
        debitAccountName: 'Giá vốn hàng bán (Tổn thất sản xuất hao hụt vượt định mức)',
        creditAccount: isValuated ? '155' : '154',
        creditAccountName: isValuated
          ? 'Thành phẩm (Kho riêng Sales Order E)'
          : 'Chi phí sản xuất, kinh doanh dở dang',
        amount: scrapCost,
        costObject: `Phiếu thanh lý phế phẩm #SCRAP-01 (${soCode})`,
        note: 'Theo TT 200: Giá trị sản phẩm hỏng không sửa chữa được vượt định mức hạch toán vào Giá vốn hàng bán (hoặc TK 811).',
      });

      // Bút toán sản xuất bù lô hàng mới thay thế:
      const replMat = Math.round(scrapCost * 0.55);
      const replLaborOverhead = scrapCost - replMat;

      entries.push({
        id: `entry-4-scrap-repl-mat`,
        stepIndex: 4,
        voucherNo: `PKT-QM-REPL01`,
        docType: 'WA - Xuất NVL sản xuất bù phế phẩm',
        postingDate: today,
        tCode: 'CO01 / MIGO 261E',
        description: `Xuất hạt nhựa sản xuất bù số lượng linh kiện bị phế liệu`,
        debitAccount: '621',
        debitAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp (Sản xuất bù)',
        creditAccount: '152',
        creditAccountName: 'Nguyên liệu, vật liệu (Kho hạt nhựa)',
        amount: replMat,
        costObject: `Lệnh SX thay thế #PRD-REPL (${soCode})`,
        note: 'Mở lệnh sản xuất bổ sung bù số lượng thành phẩm đạt chuẩn giao khách.',
      });

      entries.push({
        id: `entry-4-scrap-repl-lab`,
        stepIndex: 4,
        voucherNo: `PKT-QM-REPL02`,
        docType: 'CO - Nhân công & máy ép sản xuất bù',
        postingDate: today,
        tCode: 'CO01 / CO11N',
        description: `Chi phí nhân công & máy ép sản xuất bổ sung bù phế phẩm`,
        debitAccount: '622',
        debitAccountName: 'Chi phí nhân công trực tiếp (Sản xuất bù)',
        creditAccount: '334',
        creditAccountName: 'Phải trả người lao động',
        amount: replLaborOverhead,
        costObject: `Lệnh SX thay thế #PRD-REPL (${soCode})`,
        note: 'Xác nhận công thợ sản xuất bù lô hàng.',
      });

      entries.push({
        id: `entry-4-scrap-repl-kc`,
        stepIndex: 4,
        voucherNo: `PKT-QM-REPL03`,
        docType: 'KC - Tập hợp giá thành sản xuất bù',
        postingDate: today,
        tCode: 'CO01',
        description: `Tập hợp chi phí sản xuất bù vào chi phí sản xuất dở dang`,
        debitAccount: '154',
        debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
        creditAccount: '621',
        creditAccountName: 'Chi phí nguyên liệu, vật liệu trực tiếp',
        amount: replMat,
        costObject: `Đối tượng tính giá thành: ${soCode}`,
        note: 'Tập hợp chi phí lô sản xuất bổ sung.',
      });

      entries.push({
        id: `entry-4-scrap-repl-kc2`,
        stepIndex: 4,
        voucherNo: `PKT-QM-REPL04`,
        docType: 'KC - Tập hợp giá thành sản xuất bù',
        postingDate: today,
        tCode: 'CO01',
        description: `Tập hợp chi phí nhân công sản xuất bù vào chi phí dở dang`,
        debitAccount: '154',
        debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
        creditAccount: '622',
        creditAccountName: 'Chi phí nhân công trực tiếp',
        amount: replLaborOverhead,
        costObject: `Đối tượng tính giá thành: ${soCode}`,
        note: 'Tập hợp chi phí lô sản xuất bổ sung.',
      });

      if (isValuated) {
        entries.push({
          id: `entry-4-scrap-repl-gr`,
          stepIndex: 4,
          voucherNo: `PKT-QM-REPL05`,
          docType: 'WE - Nhập kho lô sản xuất bù',
          postingDate: today,
          tCode: 'MIGO 101E',
          description: `Nhập kho hoàn thành số lượng sản phẩm sản xuất bù đạt chuẩn`,
          debitAccount: '155',
          debitAccountName: 'Thành phẩm (Kho riêng Sales Order E)',
          creditAccount: '154',
          creditAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
          amount: scrapCost,
          costObject: `Sales Order Stock E (${soCode})`,
          note: 'Nhập kho lô sản phẩm đạt chất lượng thay thế.',
        });
      }
    }
    return entries;
  }

  if (stepId === 5) {
    // Bước 5: Xuất kho giao hàng (Delivery & PGI 601E)
    if (isValuated) {
      const totalCostDelivered = computed.plannedCost + reworkCost + scrapCost;
      entries.push({
        id: `entry-5-1`,
        stepIndex: 5,
        voucherNo: `PKT-601E-01`,
        docType: 'WA - Xuất kho giao hàng PGI',
        postingDate: today,
        tCode: 'VL01N / MIGO 601E',
        description: `Xuất giao ${formatNumber(params.orderQuantity)} cái ${params.componentCode} cho ${params.customer}`,
        debitAccount: '632',
        debitAccountName: 'Giá vốn hàng bán (COGS)',
        creditAccount: '155',
        creditAccountName: 'Thành phẩm (Kho riêng Sales Order E)',
        amount: totalCostDelivered,
        costObject: `Outbound Delivery #800142 (${soCode})`,
        note: 'VALUATED STOCK: PGI 601E ghi nhận ngay Giá vốn hàng bán Nợ 632 / Có 155 khi xuất giao quyền sở hữu cho khách.',
      });
    }
    // Với Non-valuated Stock: PGI KHÔNG sinh bút toán tài chính Nợ 632/Có 155!
    return entries;
  }

  if (stepId === 6) {
    // Bước 6: Lập hóa đơn bán hàng thương mại (VF01)
    // 1. Ghi nhận doanh thu thuần
    entries.push({
      id: `entry-6-1`,
      stepIndex: 6,
      voucherNo: `PKT-VF01-01`,
      docType: 'RV - Hóa đơn bán hàng',
      postingDate: today,
      tCode: 'VF01',
      description: `Doanh thu bán ${formatNumber(params.orderQuantity)} cái ${params.componentCode} cho ${params.customer}`,
      debitAccount: '131',
      debitAccountName: `Phải thu khách hàng (${params.customer})`,
      creditAccount: '511',
      creditAccountName: 'Doanh thu bán hàng và cung cấp dịch vụ',
      amount: computed.totalRevenue,
      costObject: `Hóa đơn #90038101 (${soCode})`,
      note: 'Ghi nhận doanh thu bán hàng OEM theo hợp đồng.',
    });

    // 2. Ghi nhận thuế GTGT đầu ra (10%)
    entries.push({
      id: `entry-6-2`,
      stepIndex: 6,
      voucherNo: `PKT-VF01-02`,
      docType: 'RV - Thuế GTGT đầu ra',
      postingDate: today,
      tCode: 'VF01',
      description: `Thuế GTGT 10% theo Hóa đơn bán hàng OEM cho ${params.customer}`,
      debitAccount: '131',
      debitAccountName: `Phải thu khách hàng (${params.customer})`,
      creditAccount: '3331',
      creditAccountName: 'Thuế giá trị gia tăng phải nộp (Thuế GTGT đầu ra)',
      amount: computed.vatAmount,
      costObject: `Hóa đơn #90038101 (${soCode})`,
      note: 'Hạch toán thuế GTGT đầu ra theo quy định Thông tư 200.',
    });

    return entries;
  }

  if (stepId === 7) {
    // Bước 7: Phân tích kết quả & Quyết toán (KKA2 / VA88)
    const baseCost = computed.plannedCost + reworkCost + scrapCost;
    const actualVariance = computed.actualCostVariance;

    // ĐỐI VỚI NON-VALUATED STOCK: ĐÂY LÀ BƯỚC HẠCH TOÁN GIÁ VỐN TOÀN BỘ NỢ 632 / CÓ 154!
    if (!isValuated) {
      const totalActualCost = baseCost + actualVariance;
      entries.push({
        id: `entry-7-cogs-nonval`,
        stepIndex: 7,
        voucherNo: `PKT-VA88-COGS`,
        docType: 'CO - Quyết toán Giá vốn Non-valuated',
        postingDate: today,
        tCode: 'VA88 / KKA2',
        description: `Kết chuyển chi phí tập hợp trên Sales Order sang Giá vốn hàng bán (Non-valuated Stock)`,
        debitAccount: '632',
        debitAccountName: 'Giá vốn hàng bán (COGS)',
        creditAccount: '154',
        creditAccountName: 'Chi phí sản xuất, kinh doanh dở dang (Sales Order Cost Collector)',
        amount: totalActualCost,
        costObject: `Quyết toán Sales Order ${soCode}`,
        note: 'ĐIỂM ĐẶC THÙ NON-VALUATED STOCK: Toàn bộ chi phí sản xuất thực tế trên TK 154 được kết chuyển thành Giá vốn hàng bán ở bước Quyết toán Settlement!',
      });
    } else {
      // ĐỐI VỚI VALUATED STOCK: HẠCH TOÁN CHÊNH LỆCH GIÁ THÀNH THỰC TẾ (VARIANCE)
      if (actualVariance > 0) {
        entries.push({
          id: `entry-7-variance-unfavorable`,
          stepIndex: 7,
          voucherNo: `PKT-VA88-VAR01`,
          docType: 'CO - Quyết toán chênh lệch giá thành',
          postingDate: today,
          tCode: 'VA88',
          description: `Hạch toán Chênh lệch chi phí thực tế vượt định mức (Unfavorable Variance) vào Giá vốn`,
          debitAccount: '632',
          debitAccountName: 'Giá vốn hàng bán (Chi phí vượt định mức)',
          creditAccount: '154',
          creditAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
          amount: actualVariance,
          costObject: `Quyết toán Sales Order ${soCode}`,
          note: 'Quyết toán chênh lệch chi phí thực tế vượt chi phí kế hoạch (Hao hụt nhựa, tăng giờ máy) vào Giá vốn hàng bán.',
        });
      } else if (actualVariance < 0) {
        entries.push({
          id: `entry-7-variance-favorable`,
          stepIndex: 7,
          voucherNo: `PKT-VA88-VAR02`,
          docType: 'CO - Ghi giảm giá vốn tiết kiệm',
          postingDate: today,
          tCode: 'VA88',
          description: `Ghi giảm Giá vốn hàng bán do tiết kiệm chi phí sản xuất thực tế so với định mức`,
          debitAccount: '154',
          debitAccountName: 'Chi phí sản xuất, kinh doanh dở dang',
          creditAccount: '632',
          creditAccountName: 'Giá vốn hàng bán (Tiết kiệm định mức)',
          amount: Math.abs(actualVariance),
          costObject: `Quyết toán Sales Order ${soCode}`,
          note: 'Chênh lệch chi phí có lợi (Favorable Variance): Giảm giá vốn hàng bán tương ứng số tiết kiệm được.',
        });
      }
    }

    // Kết chuyển doanh thu và giá vốn vào TK 911 để xác định kết quả kinh doanh cuối cùng
    const totalRecognizedCOGS = isValuated
      ? baseCost + actualVariance
      : baseCost + actualVariance;

    entries.push({
      id: `entry-7-settle-rev`,
      stepIndex: 7,
      voucherNo: `PKT-VA88-01`,
      docType: 'CO - Kết chuyển Doanh thu CO-PA',
      postingDate: today,
      tCode: 'VA88',
      description: `Kết chuyển Doanh thu thuần bán hàng vào Tài khoản Xác định kết quả kinh doanh (CO-PA)`,
      debitAccount: '511',
      debitAccountName: 'Doanh thu bán hàng và cung cấp dịch vụ',
      creditAccount: '911',
      creditAccountName: 'Xác định kết quả kinh doanh',
      amount: computed.totalRevenue,
      costObject: `CO-PA Segment: ${params.customer} / ${params.componentCode}`,
      note: 'Tất toán tài khoản doanh thu 511 để xác định kết quả kinh doanh thực tế.',
    });

    entries.push({
      id: `entry-7-settle-cogs`,
      stepIndex: 7,
      voucherNo: `PKT-VA88-02`,
      docType: 'CO - Kết chuyển Giá vốn CO-PA',
      postingDate: today,
      tCode: 'VA88',
      description: `Kết chuyển Giá vốn hàng bán vào Tài khoản Xác định kết quả kinh doanh (CO-PA)`,
      debitAccount: '911',
      debitAccountName: 'Xác định kết quả kinh doanh',
      creditAccount: '632',
      creditAccountName: 'Giá vốn hàng bán (Thực tế)',
      amount: totalRecognizedCOGS,
      costObject: `CO-PA Segment: ${params.customer} / ${params.componentCode}`,
      note: 'Tất toán tài khoản giá vốn 632 để xác định Lợi nhuận gộp thực tế của Đơn hàng.',
    });

    return entries;
  }

  return [];
}

/**
 * Tính trạng thái tồn kho Special Stock E dựa trên bước hiện tại
 */
export function computeStockEState(
  currentStep: number,
  params: MTOParameters,
  computed: MTOComputed,
  qmDecision: 'pass' | 'fail' | null,
  reworkHandled: boolean
): SpecialStockEState {
  const isValuated = params.stockType === 'Valuated';

  if (currentStep < 2) {
    return {
      resinQuantityKg: 0,
      resinValueVND: 0,
      wipValueVND: 0,
      finishedGoodsQuantity: 0,
      finishedGoodsValueVND: 0,
      stockStatus: 'Chưa lập',
    };
  }

  if (currentStep === 2) {
    return {
      resinQuantityKg: computed.totalResinKg,
      resinValueVND: computed.materialCost,
      wipValueVND: 0,
      finishedGoodsQuantity: 0,
      finishedGoodsValueVND: 0,
      stockStatus: 'Đã tạo nhu cầu MRP (PR/PO)',
    };
  }

  if (currentStep === 3) {
    return {
      resinQuantityKg: 0, // Đã xuất vào sản xuất
      resinValueVND: 0,
      wipValueVND: 0,
      finishedGoodsQuantity: params.orderQuantity,
      finishedGoodsValueVND: isValuated ? computed.plannedCost : 0,
      stockStatus: 'Chờ kiểm định chất lượng (QI)',
    };
  }

  if (currentStep === 4) {
    if (qmDecision === 'fail' && !reworkHandled) {
      return {
        resinQuantityKg: 0,
        resinValueVND: 0,
        wipValueVND: computed.plannedCost,
        finishedGoodsQuantity: params.orderQuantity,
        finishedGoodsValueVND: isValuated ? computed.plannedCost : 0,
        stockStatus: 'Đang bị chặn kiểm định (Blocked)',
      };
    }
    return {
      resinQuantityKg: 0,
      resinValueVND: 0,
      wipValueVND: 0,
      finishedGoodsQuantity: params.orderQuantity,
      finishedGoodsValueVND: isValuated ? computed.plannedCost : 0,
      stockStatus: 'Đạt chuẩn - Sẵn sàng giao (Unrestricted)',
    };
  }

  if (currentStep >= 5) {
    return {
      resinQuantityKg: 0,
      resinValueVND: 0,
      wipValueVND: 0,
      finishedGoodsQuantity: 0, // Đã xuất giao hàng
      finishedGoodsValueVND: 0,
      stockStatus: 'Đã xuất kho giao khách (PGI Completed)',
    };
  }

  return {
    resinQuantityKg: 0,
    resinValueVND: 0,
    wipValueVND: 0,
    finishedGoodsQuantity: 0,
    finishedGoodsValueVND: 0,
    stockStatus: 'Chưa lập',
  };
}

/**
 * Tính trạng thái thẻ chi phí Sales Order Cost Collector
 */
export function computeSalesOrderCostCard(
  currentStep: number,
  params: MTOParameters,
  computed: MTOComputed,
  reworkCost: number = 0,
  scrapCost: number = 0
): SalesOrderCostCardState {
  const soCode = 'SO-PIC-2026-49281';

  let accumulatedMaterialCost = 0;
  let accumulatedLaborCost = 0;
  let accumulatedMachineCost = 0;
  let recognizedRevenue = 0;
  let recognizedCOGS = 0;
  let settledToCOPA = false;

  if (currentStep >= 3) {
    accumulatedMaterialCost = computed.materialCost;
    accumulatedLaborCost = computed.effectiveLaborCost;
    accumulatedMachineCost = computed.effectiveMachineCost + computed.variantAddonTotal;
  }

  const actualVarianceCost = currentStep >= 3 ? computed.actualCostVariance : 0;
  const qmReworkCost = reworkCost;
  const qmScrapCost = scrapCost;

  const totalAccumulatedCost =
    accumulatedMaterialCost +
    accumulatedLaborCost +
    accumulatedMachineCost +
    actualVarianceCost +
    qmReworkCost +
    qmScrapCost;

  if (currentStep >= 6) {
    recognizedRevenue = computed.totalRevenue;
  }

  if (params.stockType === 'Valuated') {
    if (currentStep >= 5) {
      recognizedCOGS = computed.plannedCost + qmReworkCost + qmScrapCost;
    }
    if (currentStep >= 7) {
      // Bao gồm cả chênh lệch variance khi quyết toán
      recognizedCOGS = totalAccumulatedCost;
    }
  } else {
    // Non-valuated stock ghi nhận COGS ở bước 7
    if (currentStep >= 7) {
      recognizedCOGS = totalAccumulatedCost;
    }
  }

  if (currentStep >= 7) {
    settledToCOPA = true;
  }

  const actualGrossProfit = recognizedRevenue - recognizedCOGS;

  return {
    salesOrderNumber: soCode,
    componentCode: params.componentCode,
    customerName: params.customer,
    accumulatedMaterialCost,
    accumulatedLaborCost,
    accumulatedMachineCost,
    actualVarianceCost,
    qmReworkCost,
    qmScrapCost,
    totalAccumulatedCost,
    recognizedRevenue,
    recognizedCOGS,
    actualGrossProfit,
    settledToCOPA,
  };
}

/**
 * Xuất dữ liệu chứng từ sang định dạng CSV (hỗ trợ Excel với UTF-8 BOM)
 */
export function exportEntriesToCSV(entries: JournalEntry[]): void {
  if (entries.length === 0) return;

  const headers = [
    'STT',
    'Số chứng từ',
    'Loại chứng từ',
    'Ngày ghi sổ',
    'T-Code SAP',
    'Diễn giải nghiệp vụ',
    'Tài khoản Nợ',
    'Tên tài khoản Nợ',
    'Tài khoản Có',
    'Tên tài khoản Có',
    'Số tiền (VND)',
    'Đối tượng chi phí',
    'Ghi chú',
  ];

  const rows = entries.map((e, index) => [
    index + 1,
    `"${e.voucherNo}"`,
    `"${e.docType}"`,
    `"${e.postingDate}"`,
    `"${e.tCode}"`,
    `"${e.description.replace(/"/g, '""')}"`,
    `"${e.debitAccount}"`,
    `"${e.debitAccountName.replace(/"/g, '""')}"`,
    `"${e.creditAccount}"`,
    `"${e.creditAccountName.replace(/"/g, '""')}"`,
    e.amount,
    `"${e.costObject.replace(/"/g, '""')}"`,
    `"${e.note.replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Nhat_ky_ke_toan_SAP_MTO_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Xuất dữ liệu chứng từ sang định dạng JSON
 */
export function exportEntriesToJSON(entries: JournalEntry[], params: MTOParameters): void {
  const data = {
    app: 'SAP MTO Simulator — PIC Vietnam',
    exportedAt: new Date().toISOString(),
    parameters: params,
    totalEntries: entries.length,
    totalDebit: entries.reduce((acc, e) => acc + e.amount, 0),
    totalCredit: entries.reduce((acc, e) => acc + e.amount, 0),
    isBalanced: entries.reduce((acc, e) => acc + e.amount, 0) === entries.reduce((acc, e) => acc + e.amount, 0),
    entries,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Nhat_ky_SAP_MTO_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tính toán Bảng Cân đối Số phát sinh & Số dư các Tài khoản (Trial Balance)
 * chuẩn Thông tư 200/2014/TT-BTC từ tập hợp chứng từ ghi sổ
 */
export function computeTrialBalance(entries: JournalEntry[]): {
  items: TrialBalanceItem[];
  totalDebitTurnover: number;
  totalCreditTurnover: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
} {
  const accountMap: Record<
    string,
    {
      name: string;
      debit: number;
      credit: number;
    }
  > = {};

  const STANDARD_ACCOUNT_NAMES: Record<string, string> = {
    '131': 'Phải thu của khách hàng (VinFast Automotive)',
    '152': 'Nguyên liệu, vật liệu (Hạt nhựa Resin kỹ thuật)',
    '154': 'Chi phí sản xuất, kinh doanh dở dang (Lệnh SX/Sales Order MTO)',
    '155': 'Thành phẩm (Special Stock E)',
    '214': 'Hao mòn tài sản cố định (Khấu hao máy ép phun & khuôn)',
    '331': 'Phải trả cho người bán (Điện 3 pha & vật tư phụ)',
    '334': 'Phải trả người lao động (Tiền lương công nhân xưởng ép)',
    '3331': 'Thuế GTGT đầu ra phải nộp (10%)',
    '511': 'Doanh thu bán hàng và cung cấp dịch vụ',
    '621': 'Chi phí nguyên liệu, vật liệu trực tiếp',
    '622': 'Chi phí nhân công trực tiếp',
    '627': 'Chi phí sản xuất chung (Khấu hao máy & điện năng)',
    '632': 'Giá vốn hàng bán (Cost of Goods Sold)',
    '911': 'Xác định kết quả kinh doanh',
  };

  for (const e of entries) {
    if (!accountMap[e.debitAccount]) {
      accountMap[e.debitAccount] = {
        name: e.debitAccountName || STANDARD_ACCOUNT_NAMES[e.debitAccount] || `Tài khoản ${e.debitAccount}`,
        debit: 0,
        credit: 0,
      };
    }
    accountMap[e.debitAccount].debit += e.amount;

    if (!accountMap[e.creditAccount]) {
      accountMap[e.creditAccount] = {
        name: e.creditAccountName || STANDARD_ACCOUNT_NAMES[e.creditAccount] || `Tài khoản ${e.creditAccount}`,
        debit: 0,
        credit: 0,
      };
    }
    accountMap[e.creditAccount].credit += e.amount;
  }

  // Sắp xếp các tài khoản theo thứ tự danh mục kế toán Việt Nam
  const sortedAccounts = Object.keys(accountMap).sort((a, b) => a.localeCompare(b));

  const items: TrialBalanceItem[] = sortedAccounts.map((acc) => {
    const data = accountMap[acc];
    const debit = data.debit;
    const credit = data.credit;

    let closingDebit = 0;
    let closingCredit = 0;
    let accountType: TrialBalanceItem['accountType'] = 'clearing';

    if (acc.startsWith('1') || acc.startsWith('2')) {
      accountType = 'asset';
      if (acc === '214') {
        accountType = 'liability';
        closingCredit = Math.max(0, credit - debit);
        closingDebit = Math.max(0, debit - credit);
      } else {
        const net = debit - credit;
        if (net >= 0) {
          closingDebit = net;
          closingCredit = 0;
        } else {
          closingDebit = 0;
          closingCredit = -net;
        }
      }
    } else if (acc.startsWith('3') || acc.startsWith('4')) {
      accountType = 'liability';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
        closingDebit = 0;
      } else {
        closingDebit = -net;
        closingCredit = 0;
      }
    } else if (acc.startsWith('5') || acc.startsWith('7')) {
      accountType = 'revenue';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
      } else {
        closingDebit = -net;
      }
    } else if (acc.startsWith('6') || acc.startsWith('8')) {
      accountType = 'expense';
      const net = debit - credit;
      if (net >= 0) {
        closingDebit = net;
      } else {
        closingCredit = -net;
      }
    } else if (acc === '911') {
      accountType = 'clearing';
      const net = credit - debit;
      if (net >= 0) {
        closingCredit = net;
      } else {
        closingDebit = -net;
      }
    }

    return {
      accountNumber: acc,
      accountName: data.name,
      openingDebit: 0,
      openingCredit: 0,
      debitTurnover: debit,
      creditTurnover: credit,
      closingDebit,
      closingCredit,
      accountType,
    };
  });

  const totalDebitTurnover = items.reduce((sum, item) => sum + item.debitTurnover, 0);
  const totalCreditTurnover = items.reduce((sum, item) => sum + item.creditTurnover, 0);
  const totalClosingDebit = items.reduce((sum, item) => sum + item.closingDebit, 0);
  const totalClosingCredit = items.reduce((sum, item) => sum + item.closingCredit, 0);

  return {
    items,
    totalDebitTurnover,
    totalCreditTurnover,
    totalClosingDebit,
    totalClosingCredit,
    isBalanced: totalDebitTurnover === totalCreditTurnover,
  };
}

/**
 * Xây dựng cấu trúc Cây Định Mức BOM (Bill of Materials) và Bóc tách Chi phí Kế hoạch
 * mô phỏng T-code SAP CS03 (Display BOM) và CK51N (Sales Order Costing Estimate).
 */
export function buildBOMTree(params: MTOParameters, computed: MTOComputed): BOMComponentNode {
  const selectedColor = VARIANT_COLORS.find((c) => c.id === params.variantColorId) || VARIANT_COLORS[0];
  const selectedTexture = VARIANT_TEXTURES.find((t) => t.id === params.variantTextureId) || VARIANT_TEXTURES[0];
  const selectedPackaging = VARIANT_PACKAGINGS.find((p) => p.id === params.variantPackagingId) || VARIANT_PACKAGINGS[0];

  const totalPlannedCost = Math.max(1, computed.plannedCost || 1);
  const qty = Math.max(1, params.orderQuantity);

  // 1. Raw Resin Base
  const baseResinCost = Math.round(computed.totalResinKg * params.resinPricePerKg);
  const baseResinQtyPerUnit = params.materialNormKgPer1000 / 1000;

  // 2. Color Masterbatch Addon
  const colorResinAddon = selectedColor.resinCostAddonPerKg || 0;
  const colorTotalCost = Math.round(computed.totalResinKg * colorResinAddon);
  const colorQtyPerUnit = Number((baseResinQtyPerUnit * 0.02).toFixed(4)); // 2% định mức phụ gia màu

  // 3. Labor routing cost
  const laborTotalCost = computed.effectiveLaborCost;
  const laborHoursPerUnit = params.laborCostMode === 'hourly' ? params.laborHours / qty : 0;
  const laborUnitCost = Math.round(laborTotalCost / qty);

  // 4. Machine routing cost
  const machineTotalCost = computed.effectiveMachineCost;
  const machineHoursPerUnit = params.machineCostMode === 'hourly' ? params.machineHours / qty : 0;
  const machineUnitCost = Math.round(machineTotalCost / qty);

  // 5. Surface treatment / Texture
  const textureResinAddon = selectedTexture.resinCostAddonPerKg || 0;
  const textureUnitAddon = selectedTexture.unitCostAddon || 0;
  const textureTotalCost = Math.round((textureUnitAddon * qty) + (computed.totalResinKg * textureResinAddon));
  const textureUnitCost = Math.round(textureTotalCost / qty);

  // 6. Packaging
  const packagingUnitCost = selectedPackaging.unitCostAddon || 0;
  const packagingTotalCost = Math.round(packagingUnitCost * qty);

  // Sub-Assembly: Thân vỏ nhựa ép thô (Body Injection Sub-Assembly)
  const subAssemblyTotalCost = baseResinCost + colorTotalCost + laborTotalCost + machineTotalCost;
  const subAssemblyUnitCost = Math.round(subAssemblyTotalCost / qty);

  const resinNode: BOMComponentNode = {
    id: 'bom-resin-base',
    itemNumber: '0010',
    level: 2,
    materialNumber: `ROH-${(params.resinType || 'ABS').replace(/[^a-zA-Z0-9]/g, '-').toUpperCase().slice(0, 14)}`,
    description: `Hạt nhựa kỹ thuật ${params.resinType || 'ABS'} nguyên sinh`,
    materialType: 'ROH',
    itemCategory: 'L',
    unitOfMeasure: 'KG',
    quantityPerUnit: Number(baseResinQtyPerUnit.toFixed(4)),
    totalQuantity: Number(computed.totalResinKg.toFixed(2)),
    unitCost: params.resinPricePerKg,
    totalCost: baseResinCost,
    costSharePercent: Number(((baseResinCost / totalPlannedCost) * 100).toFixed(1)),
    scrapPercent: 2.5,
    tt200Account: 'TK 621 (CP NVL trực tiếp)',
    tt200AccountName: 'Tài khoản 621 - Chi phí nguyên vật liệu trực tiếp (Có TK 152 Kho hạt nhựa)',
    sapModule: 'MM / PP',
    sapTCode: 'MM03 / MIGO 261E',
    technicalNotes: 'Hạt nhựa polymer kỹ thuật nạp vào phễu sấy chân không (Dehumidifying Hopper Dryer) 80°C trước khi ép.',
  };

  const colorNode: BOMComponentNode = {
    id: 'bom-color-mb',
    itemNumber: '0020',
    level: 2,
    materialNumber: `ROH-MB-${(params.variantColorId || 'STD').toUpperCase()}`,
    description: `Hạt màu Masterbatch (${selectedColor.name})`,
    materialType: 'ROH',
    itemCategory: 'L',
    unitOfMeasure: 'KG',
    quantityPerUnit: colorQtyPerUnit,
    totalQuantity: Number((computed.totalResinKg * 0.02).toFixed(2)),
    unitCost: colorResinAddon > 0 ? colorResinAddon * 50 : 0,
    totalCost: colorTotalCost,
    costSharePercent: Number(((colorTotalCost / totalPlannedCost) * 100).toFixed(1)),
    scrapPercent: 1.0,
    tt200Account: 'TK 621 (CP NVL trực tiếp)',
    tt200AccountName: 'Tài khoản 621 - Phụ gia tạo màu phân tán theo cấu hình đơn hàng (Có TK 152)',
    sapModule: 'MM / PP',
    sapTCode: 'CS03 / MIGO 261E',
    technicalNotes: selectedColor.description || 'Hạt màu phụ gia kháng tia UV, phân tán đồng đều trong buồng nung trục vít nhiệt độ 240°C.',
  };

  const laborNode: BOMComponentNode = {
    id: 'bom-labor-op',
    itemNumber: '0030',
    level: 2,
    materialNumber: 'ACT-LAB-OP01',
    description: 'Giờ công nhân công ép phun (Routing Op 0010)',
    materialType: 'ACT',
    itemCategory: 'E',
    unitOfMeasure: 'GIỜ',
    quantityPerUnit: Number(laborHoursPerUnit.toFixed(4)),
    totalQuantity: params.laborHours,
    unitCost: params.laborRatePerHour,
    totalCost: laborTotalCost,
    costSharePercent: Number(((laborTotalCost / totalPlannedCost) * 100).toFixed(1)),
    tt200Account: 'TK 622 (CP Nhân công trực tiếp)',
    tt200AccountName: 'Tài khoản 622 - Tiền lương và phụ cấp thợ đứng máy ép (Có TK 334)',
    sapModule: 'PP / CO-PC',
    sapTCode: 'CA03 / CO11N',
    technicalNotes: 'Work Center: WC-INJ-01. Thợ bậc 4 vận hành chu kỳ máy ép, lấy sản phẩm robot gắp và kiểm tra bavia cuống rót.',
  };

  const machineNode: BOMComponentNode = {
    id: 'bom-machine-op',
    itemNumber: '0040',
    level: 2,
    materialNumber: 'ACT-MACH-350T',
    description: 'Khấu hao máy ép phun 350T & Điện năng (Routing Op 0010)',
    materialType: 'ACT',
    itemCategory: 'E',
    unitOfMeasure: 'GIỜ',
    quantityPerUnit: Number(machineHoursPerUnit.toFixed(4)),
    totalQuantity: params.machineHours,
    unitCost: params.machineRatePerHour,
    totalCost: machineTotalCost,
    costSharePercent: Number(((machineTotalCost / totalPlannedCost) * 100).toFixed(1)),
    tt200Account: 'TK 627 (CP Sản xuất chung)',
    tt200AccountName: 'Tài khoản 627 - Khấu hao máy ép phun, khuôn đúc và điện năng 3 pha (Có TK 214)',
    sapModule: 'PP / CO-PC',
    sapTCode: 'CA03 / CO11N',
    technicalNotes: 'Lực kẹp 3.500 kN, khuôn ép 4 cavity, chu kỳ ép chu trình tự động giải nhiệt tuần hoàn Chiller.',
  };

  const subAssemblyNode: BOMComponentNode = {
    id: 'bom-subassembly',
    itemNumber: '0100',
    level: 1,
    materialNumber: `${params.componentCode}-BODY`,
    description: 'Cụm thân vỏ nhựa ép thô (Molded Core Body)',
    materialType: 'HALB',
    itemCategory: 'L',
    unitOfMeasure: 'CÁI',
    quantityPerUnit: 1,
    totalQuantity: qty,
    unitCost: subAssemblyUnitCost,
    totalCost: subAssemblyTotalCost,
    costSharePercent: Number(((subAssemblyTotalCost / totalPlannedCost) * 100).toFixed(1)),
    tt200Account: 'TK 154 (Chi phí SX dở dang)',
    tt200AccountName: 'Tài khoản 154 - Tập hợp chi phí Lệnh sản xuất ép phun (PP04)',
    sapModule: 'PP / MM',
    sapTCode: 'CS03 / CO01',
    technicalNotes: 'Bán thành phẩm sau máy ép phun, đã cắt bavia cuống phun runner trước khi xử lý bề mặt hoàn thiện.',
    children: [resinNode, colorNode, laborNode, machineNode],
  };

  const surfaceNode: BOMComponentNode = {
    id: 'bom-surface',
    itemNumber: '0200',
    level: 1,
    materialNumber: `SRF-${(params.variantTextureId || 'STD').toUpperCase()}`,
    description: `Xử lý bề mặt & phụ gia đặc tính (${selectedTexture.name})`,
    materialType: 'ROH',
    itemCategory: 'L',
    unitOfMeasure: 'SET',
    quantityPerUnit: 1,
    totalQuantity: qty,
    unitCost: textureUnitCost,
    totalCost: textureTotalCost,
    costSharePercent: Number(((textureTotalCost / totalPlannedCost) * 100).toFixed(1)),
    tt200Account: 'TK 627 / TK 621',
    tt200AccountName: 'Tài khoản 627 (SXC) hoặc 621 tùy theo bản chất gia công phủ hóa chất',
    sapModule: 'PP / MM',
    sapTCode: 'CS03 / CK51N',
    technicalNotes: selectedTexture.description || 'Ăn mòn nhám bề mặt hoặc phủ lớp bảo vệ khử tĩnh điện vi mạch ESD theo yêu cầu khách hàng.',
  };

  const packagingNode: BOMComponentNode = {
    id: 'bom-packaging',
    itemNumber: '0300',
    level: 1,
    materialNumber: `VERP-${(params.variantPackagingId || 'STD').toUpperCase()}`,
    description: `Vật tư bao bì đóng gói (${selectedPackaging.name})`,
    materialType: 'VERP',
    itemCategory: 'L',
    unitOfMeasure: 'SET',
    quantityPerUnit: 1,
    totalQuantity: qty,
    unitCost: packagingUnitCost,
    totalCost: packagingTotalCost,
    costSharePercent: Number(((packagingTotalCost / totalPlannedCost) * 100).toFixed(1)),
    tt200Account: 'TK 627 (Bao bì đóng gói)',
    tt200AccountName: 'Tài khoản 627 - Vật tư bao bì phục vụ đóng gói xuất xưởng OEM',
    sapModule: 'MM',
    sapTCode: 'MM03 / MIGO 261E',
    technicalNotes: selectedPackaging.description || 'Khay vỉ định hình carton hoặc túi hút chân không phòng sạch tiêu chuẩn.',
  };

  const rootNode: BOMComponentNode = {
    id: 'bom-root',
    itemNumber: '0000',
    level: 0,
    materialNumber: params.componentCode || 'PIC-COMP-MTO',
    description: params.componentName || 'Linh kiện nhựa kỹ thuật OEM Make-to-Order',
    materialType: 'FERT',
    itemCategory: 'L',
    unitOfMeasure: 'CÁI',
    quantityPerUnit: 1,
    totalQuantity: qty,
    unitCost: computed.unitPlannedCost,
    totalCost: computed.plannedCost,
    costSharePercent: 100,
    tt200Account: 'TK 155 (Kho E) / TK 154',
    tt200AccountName: 'Tài khoản 155 - Thành phẩm Special Stock E (Sales Order Stock)',
    sapModule: 'SD / PP / CO-PC',
    sapTCode: 'VA01 / CK51N',
    technicalNotes: 'Đơn hàng bán Sales Order MTO. Giá thành kế hoạch được tính toán chi tiết qua CK51N gồm Bán thành phẩm HALB, Xử lý bề mặt và Đóng gói bao bì.',
    children: [subAssemblyNode, surfaceNode, packagingNode],
  };

  return rootNode;
}


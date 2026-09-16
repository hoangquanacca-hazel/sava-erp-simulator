export type StrategyType = 'Strategy 20' | 'Strategy 25';
export type StockType = 'Valuated' | 'Non-valuated';
export type UIMode = 'fiori' | 'classic';

export interface VariantOption {
  id: string;
  name: string;
  description: string;
  resinCostAddonPerKg: number; // Cộng thêm vào giá hạt nhựa (VND/kg)
  unitCostAddon: number; // Cộng thêm vào chi phí trên 1 sản phẩm (VND/cái)
}

export interface RawMaterialBOMItem {
  id: string;
  itemCode: string;
  name: string;
  materialType: 'ROH' | 'VERP';
  qtyPer1000: number; // e.g. 22.5 kg / 1000 pcs
  scrapRatePercent: number; // e.g. 2.5%
  unitPrice: number; // VND/kg or VND/uom
  uom: string; // 'KG' | 'SET' | 'PC'
}

export interface RoutingWorkCenter {
  workCenterCode: string;
  workCenterName: string;
  machineSetupTimeHours: number; // Giờ chuẩn bị máy ép (Setup time)
  cycleTimeSeconds: number; // Chu kỳ ép trên 1 sản phẩm (giây / unit)
  machineHourlyRate: number; // Đơn giá máy ép (VND/giờ)
  laborHourlyRate: number; // Đơn giá thợ ép (VND/giờ)
  factoryOverheadRatePercent: number; // Tỷ lệ chi phí chung nhà máy (%)
}

export interface MTOParameters {
  customer: string;
  componentCode: string;
  componentName: string;
  orderQuantity: number;
  sellingPrice: number;
  materialNormKgPer1000: number;
  resinPricePerKg: number;
  resinType: string;
  laborCostMode: 'total' | 'hourly';
  laborRatePerHour: number;
  laborHours: number;
  laborTotal: number;
  machineCostMode: 'total' | 'hourly';
  machineRatePerHour: number;
  machineHours: number;
  machineTotal: number;
  vatRate: number;
  strategy: StrategyType;
  stockType: StockType;
  // Strategy 25 Variant Configuration Attributes
  variantColorId?: string;
  variantColorName?: string;
  variantTextureId?: string;
  variantTextureName?: string;
  variantPackagingId?: string;
  variantPackagingName?: string;
  // Step 3 Actual Variance % (Input by user at shop floor)
  actualVariancePercent: number; // e.g. 0, 3, 5, -2%
  // Dynamic Master Data BOM & Routing Engine (MM/PP - CK11N)
  bomItems?: RawMaterialBOMItem[];
  routing?: RoutingWorkCenter;
}

export interface MTOComputed {
  totalResinKg: number;
  effectiveResinPricePerKg: number;
  materialCost: number;
  effectiveLaborCost: number;
  effectiveMachineCost: number;
  laborOverheadTotal: number;
  variantAddonTotal: number;
  plannedCost: number;
  unitPlannedCost: number;
  // Detailed Product Costing Sheet (CK11N / CK24)
  directMaterialCost621: number;
  directLaborCost622: number;
  machineOverhead627: number;
  factoryOverhead627: number;
  totalOverhead627: number;
  operatingHours: number;
  bomItemBreakdowns?: Array<{
    itemCode: string;
    name: string;
    grossQty: number;
    uom: string;
    totalCost: number;
    unitCost: number;
    sharePercent: number;
  }>;
  // Actual cost with variance
  actualCostVariance: number;
  actualCostBeforeRework: number;
  totalRevenue: number;
  vatAmount: number;
  totalBillingAmount: number;
  plannedCOGS: number;
  grossProfit: number;
  grossMarginPercent: number;
}

export interface JournalEntry {
  id: string;
  stepIndex: number;
  voucherNo: string;
  docType: string; // WA, WE, RV, CO...
  postingDate: string;
  tCode: string;
  description: string;
  debitAccount: string;
  debitAccountName: string;
  creditAccount: string;
  creditAccountName: string;
  amount: number;
  costObject: string;
  note: string;
}

export interface TrialBalanceItem {
  accountNumber: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  debitTurnover: number;
  creditTurnover: number;
  closingDebit: number;
  closingCredit: number;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'clearing';
}

export interface TrialBalanceResult {
  items: TrialBalanceItem[];
  totalDebitTurnover: number;
  totalCreditTurnover: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

export const DEFAULT_BOM_ITEMS: RawMaterialBOMItem[] = [
  {
    id: 'bom-raw-1',
    itemCode: 'ROH-ABS-757',
    name: 'Hạt nhựa ABS kỹ thuật ChiMei PA-757 (Đài Loan)',
    materialType: 'ROH',
    qtyPer1000: 22.5,
    scrapRatePercent: 2.5,
    unitPrice: 52000,
    uom: 'KG',
  },
  {
    id: 'bom-raw-2',
    itemCode: 'ROH-MB-BK01',
    name: 'Hạt màu Masterbatch đen chịu nhiệt 280°C (Black 2%)',
    materialType: 'ROH',
    qtyPer1000: 0.5,
    scrapRatePercent: 1.0,
    unitPrice: 120000,
    uom: 'KG',
  },
  {
    id: 'bom-raw-3',
    itemCode: 'VERP-TRAY-01',
    name: 'Khay vỉ định hình chống tĩnh điện ESD (Packaging Tray)',
    materialType: 'VERP',
    qtyPer1000: 1000,
    scrapRatePercent: 1.5,
    unitPrice: 850,
    uom: 'CÁI',
  },
];

export const DEFAULT_ROUTING: RoutingWorkCenter = {
  workCenterCode: 'WC-INJ-01',
  workCenterName: 'Máy ép Haitian Mars II 350T & Thợ bậc 4',
  machineSetupTimeHours: 1.5,
  cycleTimeSeconds: 26,
  machineHourlyRate: 145000,
  laborHourlyRate: 75000,
  factoryOverheadRatePercent: 8.0,
};


export interface SpecialStockEState {
  resinQuantityKg: number;
  resinValueVND: number;
  wipValueVND: number;
  finishedGoodsQuantity: number;
  finishedGoodsValueVND: number;
  stockStatus:
    | 'Chưa lập'
    | 'Đã tạo nhu cầu MRP (PR/PO)'
    | 'Đang ép phun tại xưởng'
    | 'Chờ kiểm định chất lượng (QI)'
    | 'Đang bị chặn kiểm định (Blocked)'
    | 'Đạt chuẩn - Sẵn sàng giao (Unrestricted)'
    | 'Đã xuất kho giao khách (PGI Completed)';
}

export interface SalesOrderCostCardState {
  salesOrderNumber: string;
  componentCode: string;
  customerName: string;
  accumulatedMaterialCost: number;
  accumulatedLaborCost: number;
  accumulatedMachineCost: number;
  actualVarianceCost: number;
  qmReworkCost: number;
  qmScrapCost: number;
  totalAccumulatedCost: number;
  recognizedRevenue: number;
  recognizedCOGS: number;
  actualGrossProfit: number;
  settledToCOPA: boolean;
}

export interface StepDefinition {
  id: number;
  title: string;
  sapModule: string;
  tCode: string;
  movementType?: string;
  shortDesc: string;
  detailedAction: string;
  learningPoint: string;
}

export interface StepRuntimeState {
  isExecuted: boolean;
  qmDecision: 'pass' | 'fail' | null;
  qmResolutionMethod?: 'rework' | 'scrap' | 'concession' | null;
  qmReworkCost: number;
  qmScrapCost: number;
  qmReworkHandled: boolean;
  actualVariancePercent: number;
  entries: JournalEntry[];
}

export interface BOMComponentNode {
  id: string;
  itemNumber: string;
  level: number;
  materialNumber: string;
  description: string;
  materialType: 'FERT' | 'HALB' | 'ROH' | 'VERP' | 'ACT';
  itemCategory: 'L' | 'N' | 'T' | 'E'; // L: Stock item, N: Non-stock, E: Activity/Operation
  unitOfMeasure: string;
  quantityPerUnit: number;
  totalQuantity: number;
  unitCost: number;
  totalCost: number;
  costSharePercent: number;
  scrapPercent?: number;
  tt200Account: string;
  tt200AccountName: string;
  sapModule: string;
  sapTCode: string;
  technicalNotes?: string;
  children?: BOMComponentNode[];
}

export interface TCodeInfo {
  tCode: string;
  stepId: number;
  module: string;
  name: string;
  vietnameseName: string;
  purpose: string;
  accountingRole: string;
  sapTables: string;
  movementType?: string;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  params: MTOParameters;
}

export const VARIANT_COLORS: VariantOption[] = [
  {
    id: 'c-std',
    name: 'Màu tự nhiên (Natural Resin Base)',
    description: 'Hạt nhựa nguyên sinh không pha màu phụ gia.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 0,
  },
  {
    id: 'c-blk',
    name: 'Đen UV chống lão hóa (Carbon Black Masterbatch)',
    description: 'Pha hạt màu đen phụ gia kháng tia cực tím ngoài trời.',
    resinCostAddonPerKg: 3500,
    unitCostAddon: 0,
  },
  {
    id: 'c-wht',
    name: 'Trắng tinh khiết OEM (Medical White TiO2)',
    description: 'Pha hạt màu trắng quang học độ tinh khiết cao.',
    resinCostAddonPerKg: 5000,
    unitCostAddon: 0,
  },
  {
    id: 'c-ylw',
    name: 'Vàng tín hiệu Denso (Fluorescent Yellow Masterbatch)',
    description: 'Màu vàng an toàn nhận diện cảm biến ô tô.',
    resinCostAddonPerKg: 6500,
    unitCostAddon: 0,
  },
];

export const VARIANT_TEXTURES: VariantOption[] = [
  {
    id: 't-std',
    name: 'Bề mặt bóng tiêu chuẩn (SPI A2)',
    description: 'Độ bóng lòng khuôn tiêu chuẩn SPI A2, không phát sinh chi phí.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 0,
  },
  {
    id: 't-matte',
    name: 'Nhám mờ chống trầy (VDI 3400 Ref 27)',
    description: 'Ăn mòn hoa văn bề mặt khuôn, tăng độ bám và chống xước.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 700,
  },
  {
    id: 't-esd',
    name: 'Phủ phụ gia khử tĩnh điện (ESD Protection)',
    description: 'Phủ hoạt chất tiêu tán tĩnh điện bảo vệ mạch bán dẫn.',
    resinCostAddonPerKg: 1200,
    unitCostAddon: 1500,
  },
];

export const VARIANT_PACKAGINGS: VariantOption[] = [
  {
    id: 'p-std',
    name: 'Khay vỉ xốp Blister tiêu chuẩn',
    description: 'Đóng gói khay định hình carton thông thường theo tiêu chuẩn.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 0,
  },
  {
    id: 'p-vacuum',
    name: 'Túi hút chân không Cleanroom Class 1000',
    description: 'Đóng gói môi trường vô trùng phòng sạch chống ẩm mốc.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 850,
  },
  {
    id: 'p-ip68',
    name: 'Lắp thêm gioăng đệm cao su Silicone IP68',
    description: 'Chèn linh kiện phụ trợ gioăng O-ring chống thấm nước hoàn hảo.',
    resinCostAddonPerKg: 0,
    unitCostAddon: 1800,
  },
];

export const SAP_TCODES_LIST: TCodeInfo[] = [
  {
    tCode: 'VA01',
    stepId: 1,
    module: 'SD',
    name: 'Create Sales Order',
    vietnameseName: 'Tạo đơn hàng bán Make-to-Order',
    purpose: 'Khởi tạo Sales Order với Item Category (TAK/TAC) chỉ định đối tượng tập hợp chi phí riêng.',
    accountingRole: 'Chưa sinh bút toán tài chính (FI). Lưu chứng từ đơn hàng bán (VBAK, VBAP).',
    sapTables: 'VBAK, VBAP, VBEP',
  },
  {
    tCode: 'CK51N',
    stepId: 1,
    module: 'CO-PC',
    name: 'Sales Order Costing',
    vietnameseName: 'Tính giá thành đơn vị kế hoạch Sales Order',
    purpose: 'Bóc tách cấu trúc BOM hạt nhựa và Routing giờ máy ép để xác định Planned Cost.',
    accountingRole: 'Lưu Costing Estimate trên Sales Order. Cơ sở định giá Standard Price khi nhập kho.',
    sapTables: 'KEKO, KEPH, CKIS',
  },
  {
    tCode: 'MD02',
    stepId: 2,
    module: 'PP / MM',
    name: 'Single-Item, Multi-Level MRP',
    vietnameseName: 'Chạy hoạch định nhu cầu vật tư đơn hàng riêng',
    purpose: 'Phân tích tồn kho hạt nhựa và tự động sinh Planned Order và Purchase Requisition (PR).',
    accountingRole: 'Chưa ghi sổ kế toán. Chỉ sinh chứng từ lập kế hoạch nhu cầu Special Stock E.',
    sapTables: 'MDKP, MDTB, PLAF, EBAN',
  },
  {
    tCode: 'CO01',
    stepId: 3,
    module: 'PP',
    name: 'Create Production Order',
    vietnameseName: 'Tạo lệnh sản xuất ép phun gắn Sales Order',
    purpose: 'Mở Lệnh sản xuất Order Type PP04 (MTO) gắn chặt với số hiệu Sales Order Item.',
    accountingRole: 'Thiết lập đối tượng chi phí nội bộ (Internal Order / Prod. Order).',
    sapTables: 'AFKO, AFPO, AUFK',
  },
  {
    tCode: 'MIGO (261E)',
    stepId: 3,
    module: 'MM / FI',
    name: 'Goods Issue to Order (Stock E)',
    vietnameseName: 'Xuất kho hạt nhựa cho Lệnh SX kho E',
    purpose: 'Xuất hạt nhựa kỹ thuật từ kho Special Stock E vào phễu nạp máy ép phun.',
    accountingRole: 'Nợ TK 621 (CP NVL trực tiếp) / Có TK 152 (Kho hạt nhựa).',
    sapTables: 'MSEG, MKPF, BKPF, BSEG',
    movementType: '261E',
  },
  {
    tCode: 'CO11N',
    stepId: 3,
    module: 'PP / CO',
    name: 'Confirm Production Operation',
    vietnameseName: 'Xác nhận sản lượng, giờ công & giờ máy',
    purpose: 'Công nhân xưởng bấm xác nhận số lượng chi tiết ép xong, giờ công và giờ chạy máy thực tế.',
    accountingRole: 'Nợ TK 622 / Có TK 334 (Nhân công) và Nợ TK 627 / Có TK 214 (Khấu hao máy & điện).',
    sapTables: 'AFRU, CRHD, COBK, COST',
  },
  {
    tCode: 'MIGO (101E)',
    stepId: 3,
    module: 'MM / FI',
    name: 'Goods Receipt from Order (Stock E)',
    vietnameseName: 'Nhập kho thành phẩm ép nhựa hoàn thành',
    purpose: 'Nhập sản phẩm hoàn thành vào kho bảo quản Sales Order Stock E.',
    accountingRole: 'Nếu Valuated: Nợ TK 155 / Có TK 154 (giá kế hoạch). Nếu Non-valuated: KHÔNG sinh bút toán FI.',
    sapTables: 'MSEG, MKPF, MBEW',
    movementType: '101E',
  },
  {
    tCode: 'QA11',
    stepId: 4,
    module: 'QM',
    name: 'Record Usage Decision (UD)',
    vietnameseName: 'Kiểm định KCS & Quyết định sử dụng',
    purpose: 'KCS đánh giá dung sai kích thước, bọt khí, co ngót khuôn và cấp Quyết định sử dụng (Pass / Reject).',
    accountingRole: 'Nếu Pass: Chuyển Quality Inspection -> Unrestricted. Nếu Reject: Khóa vào Blocked Stock.',
    sapTables: 'QALS, QAVE, QAMV',
  },
  {
    tCode: 'CO07',
    stepId: 4,
    module: 'PP / CO',
    name: 'Production Order without Material (Rework)',
    vietnameseName: 'Lệnh sản xuất gia công lại (Rework Order)',
    purpose: 'Mở lệnh gia công phụ xử lý ba-via, ép bù cho các sản phẩm không đạt ở bước QA11.',
    accountingRole: 'Ghi nhận chi phí sửa chữa: Nợ TK 621, 622 / Có TK 152, 334; kết chuyển Nợ 154 / Có 621, 622.',
    sapTables: 'AFKO, AFPO, AUFK',
  },
  {
    tCode: 'VL01N',
    stepId: 5,
    module: 'SD / LE',
    name: 'Create Outbound Delivery with Order Reference',
    vietnameseName: 'Tạo phiếu xuất kho giao hàng Outbound Delivery',
    purpose: 'Lập lệnh giao hàng theo hợp đồng và chỉ định số xe container giao nhà máy OEM.',
    accountingRole: 'Chưa phát sinh bút toán tài chính (chứng từ logistics giao hàng LIKP, LIPS).',
    sapTables: 'LIKP, LIPS, VBFA',
  },
  {
    tCode: 'MIGO (601E)',
    stepId: 5,
    module: 'MM / SD / FI',
    name: 'Post Goods Issue (PGI - Stock E)',
    vietnameseName: 'Xuất kho giao hàng chuyển giao quyền sở hữu',
    purpose: 'Thực hiện PGI chuyển hàng lên xe giao cho đối tác OEM.',
    accountingRole: 'Nếu Valuated: Nợ TK 632 / Có TK 155. Nếu Non-valuated: KHÔNG ghi nhận TK 632 tại đây!',
    sapTables: 'MSEG, MKPF, BKPF, BSEG',
    movementType: '601E',
  },
  {
    tCode: 'VF01',
    stepId: 6,
    module: 'SD / FI',
    name: 'Create Billing Document',
    vietnameseName: 'Lập hóa đơn tài chính thương mại gửi khách OEM',
    purpose: 'Phát hành Hóa đơn thương mại điện tử gửi khách hàng OEM dựa trên giao nhận hoàn thành.',
    accountingRole: 'Nợ TK 131 / Có TK 511 (Doanh thu thuần) và Có TK 3331 (Thuế GTGT đầu ra 10%).',
    sapTables: 'VBRK, VBRP, BKPF, BSEG',
  },
  {
    tCode: 'KKA2',
    stepId: 7,
    module: 'CO-PC',
    name: 'Calculate Results Analysis for Sales Order',
    vietnameseName: 'Phân tích kết quả chi phí dở dang và doanh thu',
    purpose: 'Tính toán WIP (Work in Process) và chi phí thực tế lũy kế trên Sales Order Cost Collector.',
    accountingRole: 'Chuẩn bị dữ liệu để tất toán toàn bộ dở dang về 0 khi đơn hàng đóng hoàn tất.',
    sapTables: 'COSBP, COSB, COSP',
  },
  {
    tCode: 'VA88',
    stepId: 7,
    module: 'CO / FI',
    name: 'Settle Sales Order to CO-PA & G/L',
    vietnameseName: 'Quyết toán đơn hàng bán vào Phân tích lợi nhuận',
    purpose: 'Quyết toán chi phí và doanh thu từ Sales Order sang phân hệ CO-PA và Sổ Cái kế toán FI.',
    accountingRole: 'Non-valuated: Nợ 632 / Có 154. Hạch toán chênh lệch giá thành (Variance). Kết chuyển Nợ 511 / Có 911 và Nợ 911 / Có 632.',
    sapTables: 'COBRA, COBRB, CE1xxxx, BKPF',
  },
  {
    tCode: 'FS10N',
    stepId: 7,
    module: 'FI',
    name: 'G/L Account Balance Display',
    vietnameseName: 'Xem số dư và đối chiếu phát sinh Sổ Cái',
    purpose: 'Kiểm tra bảng cân đối số phát sinh các tài khoản 152, 154, 155, 621, 622, 627, 632, 511, 131, 911.',
    accountingRole: 'Đảm bảo nguyên tắc Cân đối Tổng Nợ = Tổng Có trên Sổ Cái (General Ledger).',
    sapTables: 'GLT0, FAGLFLEXT',
  },
];

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'samsung-cover',
    name: 'Tình huống 1: Vỏ camera Samsung (MTO Thuần - Kho Định Giá)',
    description: 'Đơn hàng 5.000 vỏ bảo vệ camera Polycarbonate cho Samsung Electronics VN. Dùng Strategy 20, kho có định giá (Valuated Stock E).',
    params: {
      customer: 'Samsung Electronics Vietnam (SEVT)',
      componentCode: 'PL-SEVT-CAM08',
      componentName: 'Vỏ bảo vệ cụm camera Polycarbonate chịu lực',
      orderQuantity: 5000,
      sellingPrice: 42000,
      materialNormKgPer1000: 22.5,
      resinPricePerKg: 72000,
      resinType: 'Hạt nhựa PC/ABS kỹ thuật cao Sabic Cycoloy',
      laborCostMode: 'hourly',
      laborRatePerHour: 65000,
      laborHours: 250,
      laborTotal: 16250000,
      machineCostMode: 'hourly',
      machineRatePerHour: 110000,
      machineHours: 220,
      machineTotal: 24200000,
      vatRate: 0.1,
      strategy: 'Strategy 20',
      stockType: 'Valuated',
      actualVariancePercent: 0,
    },
  },
  {
    id: 'canon-frame',
    name: 'Tình huống 2: Khung máy in Canon (Kho Phi Định Giá - Non-valuated)',
    description: 'Đơn hàng 2.000 khung đỡ cơ khí máy in laser Canon. Dùng Kho phi định giá (Non-valuated Stock E) — Giá vốn hạch toán ở Bước 7 (Settlement).',
    params: {
      customer: 'Canon Vietnam Co., Ltd (Thăng Long)',
      componentCode: 'PL-CANON-FRM02',
      componentName: 'Khung máy in Laser chính xác cao sợi thủy tinh 30%',
      orderQuantity: 2000,
      sellingPrice: 115000,
      materialNormKgPer1000: 95.0,
      resinPricePerKg: 85000,
      resinType: 'Hạt nhựa PA66 + 30% Glass Fiber chống cháy V0',
      laborCostMode: 'total',
      laborRatePerHour: 70000,
      laborHours: 180,
      laborTotal: 12600000,
      machineCostMode: 'total',
      machineRatePerHour: 135000,
      machineHours: 160,
      machineTotal: 21600000,
      vatRate: 0.1,
      strategy: 'Strategy 20',
      stockType: 'Non-valuated',
      actualVariancePercent: 0,
    },
  },
  {
    id: 'denso-sensor',
    name: 'Tình huống 3: Nắp cảm biến Denso (Strategy 25 - MTO Biến Thể)',
    description: 'Đơn hàng 8.000 nắp cảm biến ô tô chống thấm nước. Dùng Strategy 25 (MTO có Variant Configuration), kho định giá.',
    params: {
      customer: 'Denso Manufacturing Vietnam',
      componentCode: 'PL-DENSO-SN99',
      componentName: 'Nắp cảm biến rada lùi chống nước IP68 xe hơi',
      orderQuantity: 8000,
      sellingPrice: 28500,
      materialNormKgPer1000: 14.2,
      resinPricePerKg: 95000,
      resinType: 'Hạt nhựa PBT gia cường chịu nhiệt 160°C',
      laborCostMode: 'hourly',
      laborRatePerHour: 68000,
      laborHours: 320,
      laborTotal: 21760000,
      machineCostMode: 'hourly',
      machineRatePerHour: 125000,
      machineHours: 290,
      machineTotal: 36250000,
      vatRate: 0.1,
      strategy: 'Strategy 25',
      stockType: 'Valuated',
      variantColorId: 'c-ylw',
      variantColorName: 'Vàng tín hiệu Denso (Fluorescent Yellow Masterbatch)',
      variantTextureId: 't-esd',
      variantTextureName: 'Phủ phụ gia khử tĩnh điện (ESD Protection)',
      variantPackagingId: 'p-ip68',
      variantPackagingName: 'Lắp thêm gioăng đệm cao su Silicone IP68',
      actualVariancePercent: 3.5, // 3.5% hao hụt thực tế tại xưởng
    },
  },
];

export interface RegisteredUser {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  company: string;
  receiveMaterials: boolean;
  consentPolicy: boolean;
  registeredAt: string; // ISO String
}

export interface AdminSettings {
  bypassSessionLimits: boolean;
  simulatedAvailableSessions: number;
}

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Database,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

export interface TCodeMasterDetail {
  tCode: string;
  stepId: number;
  module:
    | 'SD'
    | 'MM'
    | 'PP'
    | 'QM'
    | 'CO-PC'
    | 'CO'
    | 'FI'
    | 'MM/FI'
    | 'PP/CO'
    | 'SD/FI'
    | 'SD/LE'
    | 'CO/FI'
    | string;
  englishName: string;
  vietnameseName: string;
  sapDescription: string;
  accountingRole: string;
  debitCreditEntries?: string[];
  stockTypeNote?: string;
  sapTables: string;
  keyFields?: string;
}

export const COMPREHENSIVE_TCODE_LIST: TCodeMasterDetail[] = [
  {
    tCode: 'VA01',
    stepId: 1,
    module: 'SD',
    englishName: 'Create Sales Order',
    vietnameseName: 'Tạo Đơn hàng bán MTO',
    sapDescription:
      'Khởi tạo đơn hàng bán theo phương thức Make-to-Order với Item Category chỉ định (TAK cho kho Valuated hoặc TAC cho kho Non-valuated). Thiết lập Sales Order làm đối tượng hạch toán chi phí riêng biệt (Account Assignment Object).',
    accountingRole:
      'Chưa phát sinh bút toán tài chính (FI). Lưu chứng từ đơn hàng bán (Sales Order) làm cơ sở pháp lý và xác lập mã đối tượng tập hợp chi phí cho toàn bộ chu trình sản xuất.',
    stockTypeNote: 'Thiết lập định dạng kho Special Stock E (Valuated hoặc Non-valuated).',
    sapTables: 'VBAK (Header), VBAP (Item), VBEP (Schedule Lines)',
    keyFields: 'VBELN (SO Number), POSNR (Item), KUNNR (Customer), MATNR',
  },
  {
    tCode: 'CK51N',
    stepId: 1,
    module: 'CO-PC',
    englishName: 'Sales Order Costing',
    vietnameseName: 'Tính Giá thành Đơn vị Kế hoạch',
    sapDescription:
      'Thực hiện bóc tách định mức nguyên vật liệu (BOM hạt nhựa PC/ABS, PA66) và Routing công nghệ (giờ máy ép phun, giờ nhân công trực tiếp) để tính toán Giá thành Kế hoạch (Cost Estimate with Quantity Structure).',
    accountingRole:
      'Xác định Planned Cost làm cơ sở định giá nhập kho Standard Price (đối với Valuated Stock E) và là chuẩn đối chiếu để phân tích chênh lệch giá thành sản xuất (Variance Analysis) tại Bước 7.',
    stockTypeNote: 'Bắt buộc đối với MTO để hệ thống có đơn giá kế hoạch ghi nhận lúc nhập kho MIGO 101E.',
    sapTables: 'KEKO (Costing Header), KEPH (Cost Component Split), CKIS (Itemization)',
    keyFields: 'KALNR (Cost Estimate No), KAUFN (SO), KPOSN (Item), STPRS (Standard Price)',
  },
  {
    tCode: 'MD02',
    stepId: 2,
    module: 'PP',
    englishName: 'MRP - Single-Item, Multi-Level',
    vietnameseName: 'Hoạch định Nhu cầu Vật tư Đơn hàng',
    sapDescription:
      'Chạy thuật toán hoạch định nhu cầu vật tư riêng biệt cho đơn hàng (Sales Order Specific MRP). Hệ thống tự động kiểm tra tồn kho hạt nhựa và lập ra các Lệnh sản xuất kế hoạch (Planned Orders) và Yêu cầu mua hàng (Purchase Requisitions) gắn cờ Stock E.',
    accountingRole:
      'Chưa phát sinh bút toán kế toán. Khởi tạo các đối tượng điều độ sản xuất và nhu cầu cung ứng nguyên vật liệu gắn chặt với số hiệu đơn hàng bán.',
    stockTypeNote: 'Tạo Planned Order loại KD (Customer Order Specific) chỉ dành riêng cho Sales Order này.',
    sapTables: 'MDKP (MRP Header), MDTB (MRP Detail), PLAF (Planned Orders), EBAN (Purchasing Reqs)',
    keyFields: 'PLNUM (Planned Order), BANFN (PR Number), DELKZ (MRP Element)',
  },
  {
    tCode: 'CO01',
    stepId: 3,
    module: 'PP',
    englishName: 'Create Production Order',
    vietnameseName: 'Tạo Lệnh Sản xuất Ép phun MTO',
    sapDescription:
      'Chuyển đổi Planned Order thành Lệnh sản xuất thực thi (Production Order loại PP04 - Make-to-Order). Lệnh được kết nối trực tiếp với Sales Order và mang tài khoản đối tượng chi phí nội bộ (Internal Order / Cost Collector).',
    accountingRole:
      'Thiết lập đối tượng tập hợp chi phí xưởng ép nhựa. Mọi chi phí nguyên vật liệu, nhân công và máy phát sinh sau này sẽ hạch toán ghi nhận vào Lệnh sản xuất này.',
    stockTypeNote: 'Header của Lệnh sản xuất lưu trữ chính xác Sales Order & Item làm Settlement Receiver.',
    sapTables: 'AFKO (Order Header), AFPO (Order Item), AUFK (Order Master)',
    keyFields: 'AUFNR (Order Number), KDAUF (Sales Order), KDPOS (Sales Order Item)',
  },
  {
    tCode: 'MIGO (261E)',
    stepId: 3,
    module: 'MM/FI',
    englishName: 'Goods Issue to Order (Movement Type 261E)',
    vietnameseName: 'Xuất kho Hạt nhựa cho Lệnh Sản xuất',
    sapDescription:
      'Xuất kho hạt nhựa kỹ thuật (PC/ABS, PA66, PBT) từ kho nguyên liệu Special Stock E vào dây chuyền máy ép phun theo định mức BOM đơn hàng.',
    accountingRole:
      'Ghi nhận Chi phí Nguyên vật liệu trực tiếp (TT200): Nợ TK 621 / Có TK 152. Đồng thời cập nhật giá trị tiêu hao vào Lệnh sản xuất trong phân hệ Controlling (CO).',
    debitCreditEntries: ['Nợ TK 621: Chi phí nguyên vật liệu trực tiếp', 'Có TK 152: Nguyên liệu, vật liệu hạt nhựa'],
    sapTables: 'MSEG (Material Doc Segment), MKPF (Header), BKPF (FI Doc Header), BSEG (FI Doc Item)',
    keyFields: 'MBLNR (Material Doc), MJAHR (Year), BWART=261, SOBKZ=E',
  },
  {
    tCode: 'CO11N',
    stepId: 3,
    module: 'PP/CO',
    englishName: 'Enter Time Ticket (Production Confirmation)',
    vietnameseName: 'Xác nhận Công đoạn & Giờ Máy Ép',
    sapDescription:
      'Công nhân xưởng bấm thẻ ghi nhận sản lượng chi tiết ép xong, thời gian vận hành máy ép (Machine Hours) và số giờ công nhân đứng máy (Labor Hours) thực tế.',
    accountingRole:
      'Tự động ghi nhận Chi phí Nhân công trực tiếp và Chi phí Sản xuất chung theo TT200: Nợ TK 622 / Có TK 334 và Nợ TK 627 / Có TK 214, 331. Cuối kỳ kết chuyển toàn bộ chi phí 621, 622, 627 sang Nợ TK 154.',
    debitCreditEntries: [
      'Nợ TK 622: Chi phí nhân công trực tiếp / Có TK 334: Phải trả người lao động',
      'Nợ TK 627: Chi phí sản xuất chung / Có TK 214: Khấu hao máy ép & Có TK 331: Điện năng',
      'Cuối kỳ kết chuyển: Nợ TK 154 (Chi phí SXKD dở dang) / Có TK 621, 622, 627',
    ],
    sapTables: 'AFRU (Confirmations), CRHD (Work Centers), COBK (CO Doc Header), COST (CO Cost Totals)',
    keyFields: 'RUECK (Confirmation No), RMZHL (Counter), AUFNR (Order), ISMNW (Actual Work)',
  },
  {
    tCode: 'MIGO (101E)',
    stepId: 3,
    module: 'MM/FI',
    englishName: 'Goods Receipt from Order (Movement Type 101E)',
    vietnameseName: 'Nhập kho Thành phẩm Ép nhựa',
    sapDescription:
      'Nhập các linh kiện hoàn thành sau công đoạn ép phun vào kho lưu trữ thành phẩm đặc thù Special Stock E của đơn hàng.',
    accountingRole:
      'Phân nhánh theo cơ chế quản trị kho:\n• Nếu Valuated Stock E: Ghi nhận Nợ TK 155 (Thành phẩm) / Có TK 154 (Chi phí SXKD dở dang) theo Giá thành Kế hoạch (Standard Cost).\n• Nếu Non-valuated Stock E: KHÔNG sinh bút toán tài chính FI (chỉ tăng số lượng vật lý trên thẻ kho E).',
    debitCreditEntries: [
      '[Valuated Stock]: Nợ TK 155 (Thành phẩm) / Có TK 154 (theo Giá Kế hoạch)',
      '[Non-valuated Stock]: Không phát sinh bút toán tài chính (Zero FI Postings)',
    ],
    stockTypeNote: 'Điểm mấu chốt quyết định phương pháp tính giá vốn hàng bán trong SAP MTO.',
    sapTables: 'MSEG (Material Doc Segment), MKPF, MBEW (Material Valuation)',
    keyFields: 'MBLNR, MJAHR, BWART=101, SOBKZ=E, DMBTR (Amount in LC)',
  },
  {
    tCode: 'QA11',
    stepId: 4,
    module: 'QM',
    englishName: 'Record Usage Decision (UD)',
    vietnameseName: 'Kiểm định KCS & Quyết định Sử dụng',
    sapDescription:
      'Bộ phận Quản lý Chất lượng (QM) đo đạc kích thước dung sai, kiểm tra độ bóng bề mặt SPI/MT, độ khít ren và đưa ra quyết định chấp thuận (Pass / Usage Decision) hoặc từ chối (Reject/Rework).',
    accountingRole:
      '• Nếu Đạt (Pass): Chuyển lô hàng từ Quality Inspection sang Sẵn sàng xuất bán (Unrestricted Use).\n• Nếu Rework: Kích hoạt Lệnh sản xuất bổ sung CO07, hạch toán chi phí sửa chữa ép bù: Nợ TK 621, 622 / Có TK 152, 334 và kết chuyển sang Nợ TK 154.\n• Nếu Scrap: Ghi nhận chi phí thiệt hại phế phẩm hủy bỏ.',
    debitCreditEntries: [
      '[Nếu Rework CO07]: Nợ TK 621, 622 / Có TK 152, 334',
      '[Kết chuyển Rework]: Nợ TK 154 / Có TK 621, 622 (Chi phí gia công lại)',
    ],
    sapTables: 'QALS (Inspection Lot), QAVE (Usage Decision), QAMV (Characteristics Specs)',
    keyFields: 'PRUEFLOS (Inspection Lot No), VBEWERTUNG (Decision: A=Accept, R=Reject)',
  },
  {
    tCode: 'VL01N',
    stepId: 5,
    module: 'SD/LE',
    englishName: 'Create Outbound Delivery with Order Reference',
    vietnameseName: 'Lập Phiếu Giao hàng Outbound Delivery',
    sapDescription:
      'Bộ phận Logistics tạo lệnh xuất giao hàng tham chiếu từ Sales Order, xác định biển số xe tải, bốc xếp container và ngày giờ giao tới nhà máy khách hàng OEM.',
    accountingRole:
      'Chưa phát sinh bút toán kế toán tài chính FI. Đây là chứng từ hậu cần Logistics Execution (LIKP/LIPS) bắt buộc để làm thủ tục xuất kho chuyển giao quyền sở hữu (PGI).',
    sapTables: 'LIKP (Delivery Header), LIPS (Delivery Item), VBFA (Document Flow)',
    keyFields: 'VBELN (Delivery No), VBELV (Preceding Sales Order), LFART (Delivery Type)',
  },
  {
    tCode: 'MIGO (601E) / PGI',
    stepId: 5,
    module: 'MM/FI',
    englishName: 'Post Goods Issue (PGI - Movement Type 601E)',
    vietnameseName: 'Xuất kho Giao hàng (PGI)',
    sapDescription:
      'Ghi nhận xuất kho thực tế chuyển giao quyền sở hữu hàng hóa cho đối tác OEM khi xe rời khỏi cổng nhà máy PIC.',
    accountingRole:
      'Phân nhánh theo cơ chế kho:\n• Nếu Valuated Stock E: Tự động ghi nhận Giá vốn hàng bán theo TT200: Nợ TK 632 / Có TK 155 (theo Giá thành Kế hoạch).\n• Nếu Non-valuated Stock E: KHÔNG hạch toán TK 632 tại đây! Toàn bộ giá vốn sẽ được ghi nhận một lần tại Bước 7 (Quyết toán VA88).',
    debitCreditEntries: [
      '[Valuated Stock]: Nợ TK 632: Giá vốn hàng bán / Có TK 155: Thành phẩm',
      '[Non-valuated Stock]: Không ghi nhận giá vốn ở bước này (hoãn lại đến VA88)',
    ],
    sapTables: 'MSEG, MKPF, BKPF, BSEG',
    keyFields: 'MBLNR, BWART=601, SOBKZ=E, KDAUF, KDPOS',
  },
  {
    tCode: 'VF01',
    stepId: 6,
    module: 'SD/FI',
    englishName: 'Create Billing Document',
    vietnameseName: 'Lập Hóa đơn Thương mại & Doanh thu',
    sapDescription:
      'Phát hành Hóa đơn tài chính bán hàng (Billing Invoice) gửi cho đối tác OEM dựa trên số lượng giao hàng đã xác nhận thành công tại bước 5.',
    accountingRole:
      'Ghi nhận Doanh thu bán hàng và Công nợ phải thu khách hàng theo TT200:\n• Nợ TK 131: Phải thu của khách hàng OEM (Tổng thanh toán)\n• Có TK 511: Doanh thu bán hàng và cung cấp dịch vụ (Doanh thu thuần)\n• Có TK 3331: Thuế GTGT đầu ra phải nộp (Thuế suất 10%).',
    debitCreditEntries: [
      'Nợ TK 131: Phải thu của khách hàng (Tổng giá trị thanh toán)',
      'Có TK 511: Doanh thu bán hàng và cung cấp dịch vụ',
      'Có TK 3331: Thuế GTGT đầu ra phải nộp (10%)',
    ],
    sapTables: 'VBRK (Billing Header), VBRP (Billing Item), BKPF, BSEG',
    keyFields: 'VBELN (Billing Doc), FKDAT (Billing Date), NETWR (Net Value), MWSBK (Tax Amount)',
  },
  {
    tCode: 'KKA2',
    stepId: 7,
    module: 'CO-PC',
    englishName: 'Calculate Results Analysis for Sales Order',
    vietnameseName: 'Phân tích Kết quả & Dở dang (WIP)',
    sapDescription:
      'Chạy chu trình tính toán chi phí sản xuất dở dang (Work in Process) và đối chiếu chi phí thực tế lũy kế so với doanh thu ghi nhận trên Sales Order Cost Collector.',
    accountingRole:
      'Chuẩn bị dữ liệu định lượng chênh lệch (Variance) và xác định kỳ hạn tất toán dở dang về 0 (WIP = 0) khi đơn hàng đã hoàn tất giao hàng và xuất hóa đơn.',
    sapTables: 'COSBP (Periodic Totals), COSB (Variance Totals), COSP (External Postings)',
    keyFields: 'KAUFN (Sales Order), KPOSN (Item), ABGSL (Results Analysis Key)',
  },
  {
    tCode: 'VA88',
    stepId: 7,
    module: 'CO/FI',
    englishName: 'Settle Sales Order to CO-PA & G/L',
    vietnameseName: 'Quyết toán Đơn hàng sang CO-PA & Sổ Cái FI',
    sapDescription:
      'Chạy chương trình quyết toán cuối cùng, chuyển toàn bộ chênh lệch chi phí, giá vốn và doanh thu từ Sales Order sang phân hệ Phân tích Lợi nhuận (CO-PA) và Sổ Cái kế toán FI.',
    accountingRole:
      'Bút toán quyết toán toàn diện theo TT200:\n1. Non-valuated Stock: Ghi nhận Giá vốn thực tế: Nợ TK 632 / Có TK 154.\n2. Valuated Stock: Hạch toán Chênh lệch giá thành (Variance):\n   - Chênh lệch bất lợi (Chi phí thực tế > Kế hoạch): Nợ TK 632 / Có TK 154.\n   - Chênh lệch có lợi (Chi phí thực tế < Kế hoạch): Nợ TK 154 / Có TK 632.\n3. Kết chuyển Xác định kết quả kinh doanh cuối kỳ:\n   - Kết chuyển doanh thu: Nợ TK 511 / Có TK 911.\n   - Kết chuyển giá vốn: Nợ TK 911 / Có TK 632.',
    debitCreditEntries: [
      '[Non-Valuated]: Nợ TK 632 / Có TK 154 (Toàn bộ giá thành thực tế)',
      '[Valuated Unfavorable Variance]: Nợ TK 632 / Có TK 154 (Chênh lệch thiếu/vượt định mức)',
      '[Valuated Favorable Variance]: Nợ TK 154 / Có TK 632 (Tiết kiệm định mức)',
      '[Kết chuyển Doanh thu]: Nợ TK 511 / Có TK 911: Xác định kết quả kinh doanh',
      '[Kết chuyển Giá vốn]: Nợ TK 911 / Có TK 632: Xác định kết quả kinh doanh',
    ],
    sapTables: 'COBRA (Settlement Rules Header), COBRB (Rules Item), BKPF, BSEG, CE1xxxx (CO-PA Segment)',
    keyFields: 'OBJNR (Object Number), PERIO (Period), GJAHR (Fiscal Year), WTGBTR (Value in Doc Curr)',
  },
  {
    tCode: 'CO07',
    stepId: 4,
    module: 'PP',
    englishName: 'Production Order without Material (Rework)',
    vietnameseName: 'Lệnh Sản xuất Gia công lại (Rework Order)',
    sapDescription:
      'Mở lệnh sản xuất phụ xử lý gọt ba-via thừa, ép bù khuyết tật hoặc xử lý bề mặt cho các sản phẩm không đạt chuẩn KCS kiểm tra ở bước QA11.',
    accountingRole:
      'Ghi nhận chi phí sửa chữa khắc phục sai hỏng: Nợ TK 621, 622 / Có TK 152, 334; kết chuyển toàn bộ vào chi phí dở dang Nợ TK 154 / Có TK 621, 622.',
    debitCreditEntries: [
      'Nợ TK 621 (Hạt nhựa bổ sung) / Có TK 152',
      'Nợ TK 622 (Công gọt bavia/sửa khuôn) / Có TK 334',
      'Kết chuyển: Nợ TK 154 / Có TK 621, 622',
    ],
    sapTables: 'AFKO, AFPO, AUFK',
    keyFields: 'AUFNR (Rework Order), KDAUF (Original SO Ref)',
  },
  {
    tCode: 'FS10N',
    stepId: 7,
    module: 'FI',
    englishName: 'G/L Account Balance Display',
    vietnameseName: 'Xem Số dư & Bảng Cân đối Sổ Cái FI',
    sapDescription:
      'Kiểm tra bảng tổng hợp số phát sinh Nợ/Có và số dư cuối kỳ của các tài khoản Sổ Cái (General Ledger) phục vụ lập Báo cáo tài chính chuẩn TT200.',
    accountingRole:
      'Đối chiếu đối ứng tài khoản: Kiểm tra số dư TK 152, 154 (về 0 khi đơn hàng hoàn tất), TK 155, TK 621, 622, 627 (đã kết chuyển hết sang 154), TK 632, 511, 131 và 911 đảm bảo Tổng Nợ = Tổng Có.',
    sapTables: 'GLT0, FAGLFLEXT',
    keyFields: 'RACCT (Account No), RBUKRS (Company Code), RYEAR (Year)',
  },
];

export interface TCodeLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStep?: (stepId: number, tCode?: string) => void;
  onGoToSimulation?: () => void;
}

export const TCodeLookupModal: React.FC<TCodeLookupModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStep,
  onGoToSimulation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedStep, setSelectedStep] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const modulesList = ['ALL', 'SD', 'MM', 'PP', 'QM', 'CO-PC', 'CO', 'FI'];
  const stepsList = ['ALL', '1', '2', '3', '4', '5', '6', '7'];

  const filteredData = useMemo(() => {
    return COMPREHENSIVE_TCODE_LIST.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.tCode.toLowerCase().includes(q) ||
        item.englishName.toLowerCase().includes(q) ||
        item.vietnameseName.toLowerCase().includes(q) ||
        item.sapDescription.toLowerCase().includes(q) ||
        item.accountingRole.toLowerCase().includes(q) ||
        item.sapTables.toLowerCase().includes(q);

      const matchesModule =
        selectedModule === 'ALL' || item.module.includes(selectedModule);

      const matchesStep =
        selectedStep === 'ALL' || item.stepId.toString() === selectedStep;

      return matchesSearch && matchesModule && matchesStep;
    });
  }, [searchTerm, selectedModule, selectedStep]);

  const handleCopy = (tCode: string) => {
    navigator.clipboard.writeText(tCode);
    setCopiedCode(tCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleGoToStep = (stepId: number, tCode: string) => {
    onClose();
    if (onNavigateToStep) {
      onNavigateToStep(stepId, tCode);
    }
    if (onGoToSimulation) {
      onGoToSimulation();
    }
  };

  if (!isOpen) return null;

  const getModuleBadgeColor = (mod: string) => {
    if (mod.includes('SD')) return 'bg-sky-950 text-sky-300 border-sky-700/60';
    if (mod.includes('MM')) return 'bg-emerald-950 text-emerald-300 border-emerald-700/60';
    if (mod.includes('PP')) return 'bg-purple-950 text-purple-300 border-purple-700/60';
    if (mod.includes('QM')) return 'bg-amber-950 text-amber-300 border-amber-700/60';
    if (mod.includes('CO')) return 'bg-orange-950 text-orange-300 border-orange-700/60';
    if (mod.includes('FI')) return 'bg-teal-950 text-teal-300 border-teal-700/60';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tcode-modal-title"
    >
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tcode-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Tra cứu T-Code SAP & Bút toán Kế toán MTO (Thông tư 200)
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SAP S/4HANA ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tổng hợp đầy đủ chức năng SAP, định mức sản xuất, bảng CSDL và vai trò hạch toán chi phí - giá vốn từ Bước 1 đến Bước 7
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo T-Code (VA01, CK51N...), tên tài khoản (621, 632, 154), bảng SAP (VBAK, MSEG)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Module Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Module:
            </span>
            {modulesList.map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedModule === mod
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          {/* Step Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Bước:
            </span>
            <select
              value={selectedStep}
              onChange={(e) => setSelectedStep(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">Tất cả các bước (1-7)</option>
              {stepsList.filter((s) => s !== 'ALL').map((s) => (
                <option key={s} value={s}>
                  Bước {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">Không tìm thấy T-Code nào phù hợp với điều kiện tìm kiếm.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedModule('ALL');
                  setSelectedStep('ALL');
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Xóa bộ lọc để xem toàn bộ danh sách
              </button>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/95 text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-3 sm:px-4 w-[140px] shrink-0">T-Code & Module</th>
                    <th className="py-3 px-3 sm:px-4 w-[90px] shrink-0">Quy trình</th>
                    <th className="py-3 px-3 sm:px-4 w-[240px]">Tên giao dịch & Mô tả SAP</th>
                    <th className="py-3 px-3 sm:px-4 min-w-[280px]">
                      Vai trò Kế toán trong chu trình MTO (TT200)
                    </th>
                    <th className="py-3 px-3 sm:px-4 w-[160px] hidden lg:table-cell">Bảng CSDL SAP</th>
                    <th className="py-3 px-3 sm:px-4 w-[110px] text-right">Điều hướng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs">
                  {filteredData.map((item) => (
                    <tr
                      key={item.tCode}
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      {/* T-Code and Module column */}
                      <td className="py-3.5 px-3 sm:px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shadow-sm">
                              {item.tCode}
                            </span>
                            <button
                              onClick={() => handleCopy(item.tCode.split(' ')[0])}
                              title="Sao chép T-Code"
                              className="text-slate-500 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                            >
                              {copiedCode === item.tCode.split(' ')[0] ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div>
                            <span
                              className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getModuleBadgeColor(
                                item.module
                              )}`}
                            >
                              {item.module}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Step column */}
                      <td className="py-3.5 px-3 sm:px-4 align-top">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] font-bold text-emerald-400">
                          Bước {item.stepId}
                        </span>
                      </td>

                      {/* SAP Description column */}
                      <td className="py-3.5 px-3 sm:px-4 align-top space-y-1.5">
                        <div>
                          <div className="font-bold text-slate-100 text-xs sm:text-[13px]">
                            {item.vietnameseName}
                          </div>
                          <div className="text-[11px] text-cyan-400/90 font-mono font-medium">
                            {item.englishName}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {item.sapDescription}
                        </p>
                        {item.stockTypeNote && (
                          <div className="text-[10px] text-indigo-300/80 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-900/40">
                            <strong>Kho E:</strong> {item.stockTypeNote}
                          </div>
                        )}
                      </td>

                      {/* Accounting Role column */}
                      <td className="py-3.5 px-3 sm:px-4 align-top space-y-2">
                        <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                          {item.accountingRole}
                        </div>

                        {/* Debit / Credit breakdown pills if available */}
                        {item.debitCreditEntries && item.debitCreditEntries.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-850">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <span>Hạch toán chi tiết:</span>
                            </span>
                            <div className="space-y-1">
                              {item.debitCreditEntries.map((entry, idx) => (
                                <div
                                  key={idx}
                                  className="text-[11px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-200/90 flex items-start gap-1.5"
                                >
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{entry}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* SAP Tables column (Desktop only) */}
                      <td className="py-3.5 px-3 sm:px-4 align-top hidden lg:table-cell space-y-1 font-mono text-[11px]">
                        <div className="text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
                          {item.sapTables}
                        </div>
                        {item.keyFields && (
                          <div className="text-[10px] text-slate-500 leading-snug">
                            Keys: {item.keyFields}
                          </div>
                        )}
                      </td>

                      {/* Navigation Action column */}
                      <td className="py-3.5 px-3 sm:px-4 align-top text-right">
                        <button
                          onClick={() => handleGoToStep(item.stepId, item.tCode)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer whitespace-nowrap group-hover:ring-1 group-hover:ring-cyan-400"
                          title={`Chuyển đến Bước ${item.stepId} trong Stepper`}
                        >
                          <span>Bước {item.stepId}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Hiển thị <strong>{filteredData.length}</strong> / {COMPREHENSIVE_TCODE_LIST.length} mã T-Code
              trọng tâm trong mô hình Make-to-Order
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

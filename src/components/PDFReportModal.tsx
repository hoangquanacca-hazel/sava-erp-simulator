import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Printer,
  X,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Scale,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  MTOParameters,
  MTOComputed,
  JournalEntry,
  StepRuntimeState,
  SalesOrderCostCardState,
  SpecialStockEState,
} from '../types';
import { formatVND, computeTrialBalance } from '../utils/calculator';

export interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: MTOParameters;
  computed: MTOComputed;
  entries: JournalEntry[];
  stepStates: Record<number, StepRuntimeState>;
  salesOrderCostCard: SalesOrderCostCardState;
  stockEState: SpecialStockEState;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({
  isOpen,
  onClose,
  params,
  computed,
  entries,
  stepStates,
  salesOrderCostCard,
  stockEState,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const trialBalance = computeTrialBalance(entries);

  const documentTitle = `Bao_Cao_Ke_Toan_MTO_${params.stockType === 'Valuated' ? 'Valuated' : 'NonValuated'}_${params.componentCode}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 12mm 15mm 12mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: 'Times New Roman', Times, serif, sans-serif !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  if (!isOpen) return null;

  const isValuated = params.stockType === 'Valuated';
  const grossMarginPercent =
    salesOrderCostCard.recognizedRevenue > 0
      ? Number(
          (
            (salesOrderCostCard.actualGrossProfit / salesOrderCostCard.recognizedRevenue) *
            100
          ).toFixed(2)
        )
      : 0;

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const currentTimeStr = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Control Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Xem Trước & Xuất Báo Cáo Kế Toán MTO (PDF Lưu Trữ)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                  Mẫu TT 200/2014/TT-BTC
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lưu lại bảng cân đối tài khoản, báo cáo chi phí và các bút toán cuối cùng của kịch bản hiện tại
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action Button: Print to PDF */}
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer hover:scale-102"
              title="Mở hộp thoại in ấn để in hoặc lưu thành file PDF"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu File PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Container (Simulating Pristine A4 White Paper) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center">
          {/* Printable Document Container */}
          <div
            ref={printRef}
            className="w-full max-w-[840px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm text-xs leading-relaxed border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif, sans-serif",
            }}
          >
            {/* 1. Header Đơn Vị & Quốc Hiệu Chuẩn TT200 */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-5">
              <div className="w-1/2 space-y-0.5">
                <div className="font-bold text-sm uppercase text-slate-900 tracking-wide">
                  CÔNG TY TNHH NHỰA KỸ THUẬT CAO PIC VIỆT NAM
                </div>
                <div className="text-[11px] text-slate-700 italic">
                  Hệ thống quản trị ERP SAP S/4HANA Enterprise Cloud (MTO Simulation)
                </div>
                <div className="text-[11px] text-slate-600">
                  Địa chỉ: Lô CN-08, KCN VSIP Bắc Ninh, TP. Từ Sơn, Bắc Ninh
                </div>
                <div className="text-[11px] text-slate-600">
                  Mã số thuế: 2301099882 | Tel: (0222) 388 9988
                </div>
              </div>

              <div className="w-1/2 text-right space-y-0.5">
                <div className="font-bold text-xs text-slate-900">
                  Mẫu số: B01-DN & S03b-DN
                </div>
                <div className="text-[10px] text-slate-600 italic">
                  (Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính)
                </div>
                <div className="text-[11px] font-mono text-slate-800 font-semibold pt-1">
                  Mã lưu trữ: BC-MTO-{isValuated ? 'VAL' : 'NONVAL'}-{params.componentCode}
                </div>
                <div className="text-[10px] text-slate-500">
                  Thời điểm xuất biểu: {currentTimeStr} · Ngày {currentDateStr}
                </div>
              </div>
            </div>

            {/* 2. Tiêu Đề Báo Cáo */}
            <div className="text-center my-6 space-y-1.5">
              <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wide">
                BÁO CÁO QUYẾT TOÁN CHI PHÍ SẢN XUẤT MAKE-TO-ORDER (MTO)
              </h1>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                VÀ BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN KẾ TOÁN (TRIAL BALANCE)
              </h2>
              <div className="inline-block px-3 py-1 bg-slate-100 rounded-full border border-slate-300 font-semibold text-[11px] text-slate-800 mt-1">
                Phương thức quản lý kho: {isValuated ? 'HÀNG TỒN KHO CÓ TÍNH GIÁ TRỊ (VALUATED SALES ORDER STOCK E)' : 'HÀNG TỒN KHO KHÔNG TÍNH GIÁ TRỊ (NON-VALUATED SALES ORDER STOCK E)'}
              </div>
            </div>

            {/* 3. Phần I: Thông Tin Đơn Hàng & Kịch Bản Sản Xuất */}
            <div className="mb-6">
              <div className="font-bold text-xs uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 text-slate-900 mb-2.5">
                I. THÔNG TIN ĐƠN HÀNG BÁN & KỊCH BẢN KỸ THUẬT (SALES ORDER & TECHNICAL PROFILE)
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] border border-slate-200 p-3 rounded bg-slate-50/50">
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Số hiệu Sales Order:</span>
                  <span className="font-mono font-bold text-slate-900">SO-PIC-2026-49281 (Item 10)</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Khách hàng OEM:</span>
                  <span className="font-bold text-slate-900">{params.customer}</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Mã linh kiện:</span>
                  <span className="font-mono font-bold text-slate-900">{params.componentCode}</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Tên thành phẩm:</span>
                  <span className="font-semibold text-slate-900">{params.componentName}</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Chiến lược hoạch định:</span>
                  <span className="font-semibold text-slate-900">
                    {params.strategy} {params.strategy === 'Strategy 25' ? `(${params.variantColorName}, ${params.variantTextureName})` : '(MTO Thuần Túy)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Số lượng đặt hàng:</span>
                  <span className="font-mono font-bold text-slate-900">{params.orderQuantity.toLocaleString('vi-VN')} chiếc</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Đơn giá bán xuất xưởng:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatVND(params.sellingPrice)} / chiếc</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Thuế suất GTGT:</span>
                  <span className="font-mono font-semibold text-slate-900">{(params.vatRate * 100).toFixed(0)}% (TK 3331)</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Chênh lệch chi phí thực tế (Variance):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {params.actualVariancePercent >= 0 ? `+${params.actualVariancePercent}%` : `${params.actualVariancePercent}%`} ({formatVND(computed.actualCostVariance)})
                  </span>
                </div>
                <div className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                  <span className="text-slate-600">Quyết định kiểm định KCS (QM):</span>
                  <span className="font-semibold text-slate-900">
                    {stepStates[4]?.qmDecision === 'pass'
                      ? 'Đạt chuẩn xuất sắc (Pass 100%)'
                      : stepStates[4]?.qmDecision === 'fail'
                      ? `Phát hiện sai lệch (Xử lý: ${stepStates[4]?.qmResolutionMethod === 'rework' ? 'Gia công lại' : stepStates[4]?.qmResolutionMethod === 'scrap' ? 'Hủy bỏ' : 'Nhượng bộ'})`
                      : 'Chưa kiểm định KCS'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Phần II: Tổng Hợp Chỉ Tiêu Tài Chính & Kết Quả Kinh Doanh */}
            <div className="mb-6">
              <div className="font-bold text-xs uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 text-slate-900 mb-2.5">
                II. TỔNG HỢP CHỈ TIÊU KẾ TOÁN QUẢN TRỊ & GIÁ THÀNH ĐƠN HÀNG (CO-PA / FINANCIAL SUMMARY)
              </div>

              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-1.5 text-center w-12">STT</th>
                    <th className="border border-slate-300 px-3 py-1.5 text-left">Chỉ tiêu kinh tế tài chính</th>
                    <th className="border border-slate-300 px-2 py-1.5 text-center w-24">TK Hạch toán</th>
                    <th className="border border-slate-300 px-3 py-1.5 text-right w-36">Kế hoạch (CK51N)</th>
                    <th className="border border-slate-300 px-3 py-1.5 text-right w-36">Thực tế Quyết toán</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">1</td>
                    <td className="border border-slate-300 px-3 py-1 font-medium">Doanh thu bán hàng và cung cấp dịch vụ</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono font-bold">TK 511</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.totalRevenue)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono font-bold text-slate-900">
                      {formatVND(salesOrderCostCard.recognizedRevenue)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">2</td>
                    <td className="border border-slate-300 px-3 py-1">Thuế Giá trị gia tăng đầu ra (VAT 10%)</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">TK 3331</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.vatAmount)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.vatAmount)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">3</td>
                    <td className="border border-slate-300 px-3 py-1 font-semibold">Tổng giá trị thanh toán khách hàng OEM</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono font-bold">TK 131</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.totalBillingAmount)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono font-bold">{formatVND(computed.totalBillingAmount)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">4</td>
                    <td className="border border-slate-300 px-3 py-1">Chi phí nguyên vật liệu trực tiếp (Hạt nhựa Resin)</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">TK 621</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.materialCost)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(salesOrderCostCard.accumulatedMaterialCost)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">5</td>
                    <td className="border border-slate-300 px-3 py-1">Chi phí nhân công trực tiếp (Công nhân ép nhựa)</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">TK 622</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.effectiveLaborCost)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(salesOrderCostCard.accumulatedLaborCost)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">6</td>
                    <td className="border border-slate-300 px-3 py-1">Chi phí sản xuất chung (Khấu hao máy, điện, khuôn)</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">TK 627</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(computed.effectiveMachineCost + computed.variantAddonTotal)}</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">{formatVND(salesOrderCostCard.accumulatedMachineCost)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">7</td>
                    <td className="border border-slate-300 px-3 py-1">Chi phí xử lý sai hỏng KCS (Gia công lại / Scrap)</td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono">TK 154 / 621,622</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">0 đ</td>
                    <td className="border border-slate-300 px-3 py-1 text-right font-mono">
                      {formatVND(salesOrderCostCard.qmReworkCost + salesOrderCostCard.qmScrapCost)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">8</td>
                    <td className="border border-slate-300 px-3 py-1.5 font-bold">Tổng Giá vốn hàng bán ghi nhận (COGS)</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold text-rose-800">TK 632</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{formatVND(computed.plannedCOGS)}</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono font-black text-slate-950">
                      {formatVND(salesOrderCostCard.recognizedCOGS)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/70 font-bold">
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">9</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-emerald-950">Lợi nhuận gộp thực tế (Gross Profit)</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold text-emerald-800">TK 911</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-emerald-800">{formatVND(computed.grossProfit)}</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-emerald-900 font-black">
                      {formatVND(salesOrderCostCard.actualGrossProfit)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/70 font-bold">
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">10</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-emerald-950">Tỷ suất lợi nhuận gộp (% Margin)</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-center font-mono text-slate-600">-</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono">{computed.grossMarginPercent}%</td>
                    <td className="border border-slate-300 px-3 py-1.5 text-right font-mono text-emerald-900 font-black">
                      {grossMarginPercent}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Phần III: Bảng Cân Đối Số Phát Sinh Tài Khoản Kế Toán (Trial Balance) */}
            <div className="mb-6">
              <div className="font-bold text-xs uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 text-slate-900 mb-2.5 flex items-center justify-between">
                <span>III. BẢNG CÂN ĐỐI SỐ PHÁT SINH CÁC TÀI KHOẢN (TRIAL BALANCE — TT 200/2014/TT-BTC)</span>
                <span className="font-mono text-[10px] font-semibold text-emerald-800">
                  {trialBalance.isBalanced ? '✓ BẢNG CÂN ĐỐI HOÀN HẢO' : '⚠ CẦN ĐỐI CHIẾU'}
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-1 text-center w-8">STT</th>
                    <th className="border border-slate-300 px-2 py-1 text-center w-14">Số hiệu</th>
                    <th className="border border-slate-300 px-2.5 py-1 text-left">Tên tài khoản Sổ Cái</th>
                    <th className="border border-slate-300 px-2 py-1 text-right w-24">Phát sinh Nợ</th>
                    <th className="border border-slate-300 px-2 py-1 text-right w-24">Phát sinh Có</th>
                    <th className="border border-slate-300 px-2 py-1 text-right w-24">Dư Nợ cuối</th>
                    <th className="border border-slate-300 px-2 py-1 text-right w-24">Dư Có cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 py-4 text-center text-slate-500 italic">
                        Chưa phát sinh chứng từ kế toán trong kỳ mô phỏng.
                      </td>
                    </tr>
                  ) : (
                    trialBalance.items.map((item, idx) => (
                      <tr key={item.accountNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono text-slate-600">{idx + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono font-bold text-slate-900">
                          {item.accountNumber}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1 text-slate-850">{item.accountName}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-medium">
                          {item.debitTurnover > 0 ? formatVND(item.debitTurnover) : '-'}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-medium">
                          {item.creditTurnover > 0 ? formatVND(item.creditTurnover) : '-'}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">
                          {item.closingDebit > 0 ? formatVND(item.closingDebit) : '-'}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">
                          {item.closingCredit > 0 ? formatVND(item.closingCredit) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Hàng Tổng Cộng */}
                  <tr className="bg-slate-200 font-bold text-slate-950">
                    <td colSpan={3} className="border border-slate-300 px-3 py-1.5 text-center uppercase tracking-wider">
                      TỔNG CỘNG CÂN ĐỐI
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-950 font-black">
                      {formatVND(trialBalance.totalDebitTurnover)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-950 font-black">
                      {formatVND(trialBalance.totalCreditTurnover)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-950 font-black">
                      {formatVND(trialBalance.totalClosingDebit)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-950 font-black">
                      {formatVND(trialBalance.totalClosingCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Phần IV: Bảng Kê Chi Tiết Chứng Từ & Bút Toán Ghi Sổ Cuối Cùng */}
            <div className="mb-6">
              <div className="font-bold text-xs uppercase bg-slate-100 px-3 py-1.5 border-l-4 border-slate-800 text-slate-900 mb-2.5">
                IV. SỔ NHẬT KÝ CHUNG — BẢNG KÊ TOÀN BỘ CÁC BÚT TOÁN PHÁT SINH (JOURNAL ENTRIES LOG)
              </div>

              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-7">STT</th>
                    <th className="border border-slate-300 px-2 py-1 text-center w-20">Số chứng từ</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-14">T-Code</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Nội dung nghiệp vụ kinh tế</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-12">Nợ TK</th>
                    <th className="border border-slate-300 px-1.5 py-1 text-center w-12">Có TK</th>
                    <th className="border border-slate-300 px-2 py-1 text-right w-24">Số tiền (VND)</th>
                    <th className="border border-slate-300 px-2 py-1 text-left w-24">Đối tượng chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-slate-300 py-3 text-center text-slate-500 italic">
                        Chưa có chứng từ ghi sổ.
                      </td>
                    </tr>
                  ) : (
                    entries.map((e, index) => (
                      <tr key={e.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-300 px-1.5 py-0.5 text-center font-mono text-slate-500">{index + 1}</td>
                        <td className="border border-slate-300 px-2 py-0.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {e.voucherNo}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-0.5 text-center font-mono text-[9px] text-slate-600 whitespace-nowrap">
                          B{e.stepIndex}·{e.tCode}
                        </td>
                        <td className="border border-slate-300 px-2 py-0.5 text-slate-800 leading-tight">
                          <div>{e.description}</div>
                          {e.note && <div className="text-[9px] text-slate-500 italic mt-0.5">{e.note}</div>}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 bg-slate-50">
                          {e.debitAccount}
                        </td>
                        <td className="border border-slate-300 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 bg-slate-50">
                          {e.creditAccount}
                        </td>
                        <td className="border border-slate-300 px-2 py-0.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatVND(e.amount)}
                        </td>
                        <td className="border border-slate-300 px-2 py-0.5 font-mono text-[9px] text-slate-600 truncate max-w-[120px]">
                          {e.costObject}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Hàng Tổng Cộng */}
                  <tr className="bg-slate-100 font-bold text-slate-900">
                    <td colSpan={6} className="border border-slate-300 px-3 py-1 text-center uppercase">
                      TỔNG CỘNG SỐ TIỀN PHÁT SINH GHI SỔ ({entries.length} CHỨNG TỪ)
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-right font-mono font-black text-slate-950">
                      {formatVND(entries.reduce((acc, curr) => acc + curr.amount, 0))}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center font-mono text-[9px] text-emerald-800 font-bold">
                      CÂN SỔ 100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 7. Phần V: Thuyết Minh & Đánh Giá Đối Chiếu Kế Toán Trưởng */}
            <div className="mb-8 border border-slate-300 p-3.5 rounded bg-slate-50/70 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-900 uppercase">
                V. KẾT LUẬN & THUYẾT MINH PHƯƠNG PHÁP HẠCH TOÁN THEO THÔNG TƯ 200/2014/TT-BTC:
              </div>
              <p className="text-slate-700 text-justify">
                1. <strong>Đặc thù hạch toán kho Special Stock E:</strong> Đơn hàng áp dụng phương thức{' '}
                <strong>{isValuated ? 'Kho Valuated (Có tính giá trị)' : 'Kho Non-Valuated (Không tính giá trị)'}</strong>.{' '}
                {isValuated
                  ? 'Khi hoàn thành ép nhựa ở Bước 3 (MIGO 101E), thành phẩm được nhập kho ghi nhận Nợ TK 155 / Có TK 154 theo Giá thành định mức kế hoạch (CK51N). Giá vốn hàng bán Nợ 632 / Có 155 được ghi nhận ngay tại Bước 5 khi xuất kho PGI (601E). Chênh lệch giá thành thực tế được tất toán ở Bước 7 qua VA88.'
                  : 'Trong phương thức Non-Valuated, thành phẩm nhập kho MIGO 101E chỉ theo dõi về mặt hiện vật (không ghi nhận Nợ 155 / Có 154). Tại Bước 5 PGI không sinh bút toán giá vốn. Toàn bộ Giá vốn hàng bán Nợ 632 / Có 154 được kết chuyển toàn bộ một lần tại Bước 7 khi quyết toán đơn hàng bằng T-code VA88.'}
              </p>
              <p className="text-slate-700 text-justify">
                2. <strong>Xử lý chi phí dở dang (WIP):</strong> Tài khoản 154 đã được tất toán toàn bộ chi phí sản xuất thực tế về số dư bằng 0, không có chi phí dở dang treo lại trên đơn hàng đã giao hoàn tất.
              </p>
              <p className="text-slate-700 text-justify">
                3. <strong>Xác định kết quả kinh doanh:</strong> Doanh thu thuần và Giá vốn hàng bán đã được kết chuyển đầy đủ vào Tài khoản 911. Lợi nhuận gộp thực tế của đơn hàng đạt{' '}
                <strong>{formatVND(salesOrderCostCard.actualGrossProfit)}</strong> (Biên lợi nhuận gộp đạt {grossMarginPercent}%).
              </p>
            </div>

            {/* 8. Phần VI: Chữ Ký Xác Nhận Pháp Lý (3 Cột) */}
            <div className="mt-8 pt-4 border-t border-slate-300">
              <div className="flex justify-between text-center text-xs">
                <div className="w-1/3 space-y-1">
                  <div className="font-bold text-slate-900 uppercase">NGƯỜI LẬP BIỂU</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-800">Nguyễn Văn Kế Toán</div>
                  <div className="text-[10px] text-slate-600">Chuyên viên Kế toán Chi phí SAP</div>
                </div>

                <div className="w-1/3 space-y-1">
                  <div className="font-bold text-slate-900 uppercase">KẾ TOÁN TRƯỞNG</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-800">Trần Thị Trưởng</div>
                  <div className="text-[10px] text-slate-600">Kế toán trưởng (Chief Accountant)</div>
                </div>

                <div className="w-1/3 space-y-1">
                  <div className="font-bold text-slate-900 uppercase">GIÁM ĐỐC ĐIỀU HÀNH</div>
                  <div className="text-[10px] text-slate-500 italic">(Ký, đóng dấu, ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-800">Phạm Tổng Giám Đốc</div>
                  <div className="text-[10px] text-slate-600">Tổng Giám Đốc / CEO</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Tài liệu đã được đối chiếu cân đối Sổ Cái ({entries.length} bút toán, {trialBalance.items.length} tài khoản phát sinh)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => handlePrint()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-900/30 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In / Xuất File PDF Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

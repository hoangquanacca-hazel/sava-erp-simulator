import React, { useState } from 'react';
import {
  MTOParameters,
  MTOComputed,
  StepDefinition,
  StepRuntimeState,
} from '../types';
import { formatVND, formatNumber } from '../utils/calculator';
import { BOMVisualizer } from './BOMVisualizer';
import {
  Play,
  CheckCircle,
  HelpCircle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  XCircle,
  Lock,
  Unlock,
  Package,
  UserCheck,
  Cpu,
  Layers,
  TrendingUp,
  TrendingDown,
  Scale,
  Trash2,
  Wrench,
  FileCheck2,
} from 'lucide-react';

interface StepCardProps {
  step: StepDefinition;
  isActive: boolean;
  isExecuted: boolean;
  stepState: StepRuntimeState;
  params: MTOParameters;
  computed: MTOComputed;
  onExecute: () => void;
  onQMDecision: (decision: 'pass' | 'fail') => void;
  onHandleQMResolution: (method: 'rework' | 'scrap' | 'concession', cost: number) => void;
  onChangeVariancePercent?: (percent: number) => void;
  onExplainStep: (step: StepDefinition) => void;
  canExecute: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  isActive,
  isExecuted,
  stepState,
  params,
  computed,
  onExecute,
  onQMDecision,
  onHandleQMResolution,
  onChangeVariancePercent,
  onExplainStep,
  canExecute,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'rework' | 'scrap' | 'concession'>('rework');
  const defaultReworkCost = Math.round(computed.plannedCost * 0.02); // 2% chi phí sửa chữa
  const defaultScrapCost = Math.round(computed.plannedCost * 0.05); // 5% tổn thất phế phẩm
  const [customCost, setCustomCost] = useState<number>(defaultReworkCost);

  const isQMStep = step.id === 4;
  const isQMFailedAndNotHandled = isQMStep && stepState.qmDecision === 'fail' && !stepState.qmReworkHandled;

  return (
    <div
      id={`step-card-${step.id}`}
      className={`rounded-xl border transition-all duration-300 overflow-hidden shadow-lg ${
        isActive
          ? 'bg-slate-900 border-cyan-500/50 shadow-cyan-950/30 ring-1 ring-cyan-500/30'
          : isExecuted
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-slate-950/40 border-slate-850 opacity-70'
      }`}
    >
      {/* Header of the step card */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm border shadow-inner ${
              isExecuted
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isActive
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isExecuted ? <Check className="w-5 h-5" /> : `0${step.id}`}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {step.sapModule}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                T-Code: {step.tCode}
              </span>
              {step.movementType && (
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Mvt: {step.movementType}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-1">
              Bước {step.id}: {step.title}
            </h3>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExplainStep(step)}
            className="px-2.5 py-1.5 rounded-lg border border-teal-500/30 bg-teal-950/40 hover:bg-teal-900/50 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Nhờ Trợ giảng AI giải thích chi tiết nghiệp vụ và hạch toán bước này"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Giải thích bước này</span>
          </button>

          {!isExecuted && isActive && (
            <button
              onClick={onExecute}
              disabled={!canExecute || isQMFailedAndNotHandled}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                canExecute && !isQMFailedAndNotHandled
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Thực hiện (Execute)</span>
            </button>
          )}

          {isExecuted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đã hoàn thành</span>
            </span>
          )}
        </div>
      </div>

      {/* Body: Action details & Special SAP / TT200 modules */}
      <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
        <p className="text-slate-300 leading-relaxed">{step.detailedAction}</p>

        {/* Special Learning Point Box */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 block mb-0.5">Bản chất hạch toán kế toán & SAP:</strong>
            <p className="leading-relaxed">{step.learningPoint}</p>
          </div>
        </div>

        {/* Step 1: Interactive Costed BOM Tree Visualizer (CK51N & CS03) */}
        {step.id === 1 && (
          <div className="pt-1">
            <BOMVisualizer
              params={params}
              computed={computed}
            />
          </div>
        )}

        {/* Step 3: Interactive 2-Stage WIP Visualizer & Variance input */}
        {step.id === 3 && (
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <strong className="text-white text-xs font-bold">
                  Quy Trình Chi Phí Giá Thành 2 Giai Đoạn (Circular 200/2014/TT-BTC)
                </strong>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Lệnh SX: #PRD-01 · SO #49281
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Stage 1 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">Giai Đoạn 1: Tập Hợp Chi Phí</span>
                  <span className="text-[10px] font-mono text-slate-400">Shop Floor</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Nợ 621 (Hạt nhựa):</span>
                    <span className="font-mono text-white">{formatVND(computed.materialCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Nợ 622 (Lương thợ ép):</span>
                    <span className="font-mono text-white">{formatVND(computed.effectiveLaborCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Nợ 627 (Máy ép, điện, phụ gia):</span>
                    <span className="font-mono text-white">
                      {formatVND(computed.effectiveMachineCost + computed.variantAddonTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Intermediate Collection */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300">Trung Gian: Kết Chuyển 154</span>
                  <span className="text-[10px] font-mono text-indigo-400">Period-End</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Tập hợp toàn bộ 621, 622, 627 sang tài khoản dở dang đối tượng Sales Order:
                </p>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-indigo-200 font-semibold">Nợ TK 154 / Có 621, 622, 627:</span>
                  <span className="font-mono font-bold text-indigo-300">{formatVND(computed.plannedCost)}</span>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">Giai Đoạn 2: Nhập Kho 101E</span>
                  <span className="text-[10px] font-mono text-emerald-400">Kho Riêng E</span>
                </div>
                {params.stockType === 'Valuated' ? (
                  <div className="space-y-1 text-[11px]">
                    <span className="text-emerald-300 font-semibold block">Valuated Stock (Có định giá):</span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nợ 155 / Có 154:</span>
                      <span className="font-mono font-bold text-emerald-300">{formatVND(computed.plannedCost)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Thành phẩm ghi sổ theo giá thành kế hoạch định mức.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    <span className="text-amber-300 font-semibold block">Non-valuated Stock (Phi định giá):</span>
                    <span className="text-amber-200 block font-mono text-[10px]">
                      KHÔNG sinh bút toán Nợ 155/Có 154
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Chỉ ghi tăng số lượng vật lý vào kho E (0 đ ghi sổ). Chi phí lưu trên TK 154 đến Bước 7 quyết toán!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shop-floor Actual Variance % Slider within Step 3 */}
            {onChangeVariancePercent && (
              <div className="p-3 rounded-lg bg-slate-900/90 border border-rose-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Thiết lập chênh lệch chi phí thực tế phát sinh tại xưởng ép (%)
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      params.actualVariancePercent > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : params.actualVariancePercent < 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {params.actualVariancePercent > 0 ? '+' : ''}
                    {params.actualVariancePercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="-15"
                    max="30"
                    step="1"
                    value={params.actualVariancePercent}
                    onChange={(e) => onChangeVariancePercent(Number(e.target.value))}
                    className="flex-1 accent-rose-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    Chênh lệch: {formatVND(computed.varianceAmount)} (sẽ quyết toán tại Bước 7)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 (QM): Interactive Usage Decision Branching */}
        {isQMStep && isActive && !isExecuted && (
          <div className="border border-slate-700 rounded-xl p-4 bg-slate-950/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-slate-200">
                  Quyết Định Sử Dụng Kiểm Định Chất Lượng (QA11 Usage Decision)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Lot #QI-49281-01</span>
            </div>

            <p className="text-xs text-slate-400">
              KCS kiểm tra các chỉ tiêu dung sai kích thước (+/-0.02mm), bọt khí, độ biến dạng co ngót.
              Vui lòng chọn kết quả kiểm nghiệm:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onQMDecision('pass')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  stepState.qmDecision === 'pass'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-emerald-400">
                    PASS — Đạt chuẩn (Accept)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block leading-tight">
                    Lô hàng đạt 100% tiêu chuẩn OEM. Chuyển sang Unrestricted Use và cho phép xuất giao hàng.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onQMDecision('fail')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  stepState.qmDecision === 'fail'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="p-1.5 rounded-md bg-rose-500/20 text-rose-400 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs block text-rose-400">
                    FAIL — Lỗi kiểm định (Reject / Block)
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block leading-tight">
                    Phát hiện bọt khí và ba-via khuôn. Khóa lô hàng vào Blocked Stock và CHẶN tiến trình giao hàng.
                  </span>
                </div>
              </button>
            </div>

            {/* If Fail: 3 Genuine SAP Resolution Methods */}
            {stepState.qmDecision === 'fail' && !stepState.qmReworkHandled && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-600/40 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>TIẾN TRÌNH ĐANG BỊ KHÓA (BLOCKED BY QM)</span>
                </div>

                {/* Contextual Course Upsell & Error Diagnosis for QM Failure */}
                <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0">💡</span>
                    <span className="leading-relaxed">
                      <strong>Gợi ý nghiệp vụ:</strong> Chênh lệch phát sinh do chưa kết chuyển hết TK 154 sang TK 632 hoặc chi phí sửa chữa CO07. Tham gia Chuyên đề Kế toán Giá thành SAP trên Savafinlab để làm chủ 100% nghiệp vụ này.
                    </span>
                  </div>
                  <a
                    href="https://savafinlab.com.vn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded flex items-center gap-1 shrink-0 transition-colors whitespace-nowrap"
                  >
                    <span>Khóa Học Giá Thành SAP</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Hệ thống SAP không cho phép tạo chứng từ Outbound Delivery (Bước 5) khi hàng còn nằm trong Blocked Stock.
                  Để tiếp tục, bạn bắt buộc phải giải quyết qua một trong 3 phương án:
                </p>

                <div className="space-y-2.5 text-xs">
                  {/* Option 1: Rework */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedMethod === 'rework'
                        ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qmResolution"
                      checked={selectedMethod === 'rework'}
                      onChange={() => {
                        setSelectedMethod('rework');
                        setCustomCost(defaultReworkCost);
                      }}
                      className="mt-0.5 text-cyan-500"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        <strong className="text-slate-200">
                          1. Gia công sửa chữa & Ép bù (Rework Order CO07):
                        </strong>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Phát sinh chi phí NVL ép bù (Nợ 621 / Có 152) và công thợ gọt ba-via (Nợ 622 / Có 334), kết chuyển Nợ 154 / Có 621, 622 và Nợ 155 / Có 154.
                      </p>
                      {selectedMethod === 'rework' && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-slate-400">Chi phí gia công dự kiến:</span>
                          <input
                            type="number"
                            value={customCost}
                            onChange={(e) => setCustomCost(Math.max(0, Number(e.target.value)))}
                            className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-cyan-300 font-bold"
                          />
                          <span className="text-[11px] text-slate-400">VND (~2% giá thành)</span>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Option 2: Scrap & Replacement */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedMethod === 'scrap'
                        ? 'bg-slate-900 border-rose-500 ring-1 ring-rose-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qmResolution"
                      checked={selectedMethod === 'scrap'}
                      onChange={() => {
                        setSelectedMethod('scrap');
                        setCustomCost(defaultScrapCost);
                      }}
                      className="mt-0.5 text-rose-500"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <strong className="text-slate-200">
                          2. Hủy phế phẩm & Sản xuất bù (Scrap & Replacement Order):
                        </strong>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Lô hàng lỗi nặng không phục hồi. Ghi nhận tổn thất phế phẩm ngoài định mức: Nợ 632 / Có 155 (hoặc Có 154). Đồng thời tự động kích hoạt Lệnh sản xuất bù lô mới để có thành phẩm giao khách.
                      </p>
                      {selectedMethod === 'scrap' && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-slate-400">Giá trị tổn thất phế phẩm & sản xuất bù:</span>
                          <input
                            type="number"
                            value={customCost}
                            onChange={(e) => setCustomCost(Math.max(0, Number(e.target.value)))}
                            className="w-36 bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-rose-300 font-bold"
                          />
                          <span className="text-[11px] text-slate-400">VND (~5% giá thành)</span>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Option 3: Concession */}
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedMethod === 'concession'
                        ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qmResolution"
                      checked={selectedMethod === 'concession'}
                      onChange={() => {
                        setSelectedMethod('concession');
                        setCustomCost(0);
                      }}
                      className="mt-0.5 text-amber-500"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                        <strong className="text-slate-200">
                          3. Phê duyệt nhượng bộ kỹ thuật (Concession / Technical Waiver):
                        </strong>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        Biên bản chấp thuận đặc cách của Giám đốc Kỹ thuật OEM (sai số nhỏ không ảnh hưởng lắp ráp). Không phát sinh chi phí phụ trội, chuyển kho giao hàng ngay.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onHandleQMResolution(
                        selectedMethod,
                        selectedMethod === 'concession' ? 0 : customCost
                      )
                    }
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Xác nhận giải quyết phương án để MỞ KHÓA</span>
                  </button>
                </div>
              </div>
            )}

            {stepState.qmReworkHandled && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>
                    Đã xử lý thành công theo phương án:{' '}
                    <strong>
                      {stepState.qmResolutionMethod === 'rework'
                        ? `Gia công sửa chữa (Chi phí: ${formatVND(stepState.qmReworkCost)})`
                        : stepState.qmResolutionMethod === 'scrap'
                        ? `Phế liệu & Sản xuất bù (Chi phí: ${formatVND(stepState.qmScrapCost)})`
                        : 'Nhượng bộ kỹ thuật OEM (0 VND phụ trội)'}
                    </strong>
                    . Lô hàng đã chuyển sang Unrestricted Use!
                  </span>
                </div>
                <span className="font-bold text-emerald-400">Đã mở khóa ✓</span>
              </div>
            )}
          </div>
        )}

        {/* Step 5 (Delivery & PGI) Valuation Context Alert */}
        {step.id === 5 && (
          <div className="p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 bg-slate-950/60 border-slate-800">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              {params.stockType === 'Valuated' ? (
                <p className="text-slate-300">
                  <strong className="text-emerald-400">Valuated Special Stock E:</strong> Khi PGI 601E, hệ thống tự động sinh bút toán giá vốn{' '}
                  <span className="font-mono text-cyan-300">Nợ TK 632 / Có TK 155</span> với số tiền{' '}
                  <span className="font-mono font-bold text-emerald-400">
                    {formatVND(
                      computed.plannedCost +
                        (stepState.qmReworkCost || 0) +
                        (stepState.qmScrapCost || 0)
                    )}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-slate-300">
                  <strong className="text-amber-400">Non-valuated Special Stock E:</strong> PGI 601E xuất giao hàng{' '}
                  <span className="text-amber-300 font-semibold">KHÔNG sinh bút toán Nợ 632 / Có 155</span> vì TK 155 không có giá trị ghi sổ.
                  Giá vốn sẽ được ghi nhận tại <strong>Bước 7 (Settlement VA88)</strong>!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 7 (Settlement & Variance Analysis) */}
        {step.id === 7 && (
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <strong className="text-white text-xs font-bold">
                  Bảng Phân Tích Chênh Lệch Định Mức & Thực Tế (Target vs. Actual Variance — VA88)
                </strong>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                CO-PA Settlement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Giá thành kế hoạch (Standard):</span>
                <span className="text-base font-bold font-mono text-cyan-300">
                  {formatVND(computed.plannedCost)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">
                  Tỷ lệ chênh lệch thực tế ({params.actualVariancePercent}%):
                </span>
                <span
                  className={`text-base font-bold font-mono ${
                    computed.varianceAmount > 0
                      ? 'text-rose-400'
                      : computed.varianceAmount < 0
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {computed.varianceAmount > 0 ? '+' : ''}
                  {formatVND(computed.varianceAmount)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Giá thành thực tế (Actual Cost):</span>
                <span className="text-base font-bold font-mono text-white">
                  {formatVND(computed.plannedCost + computed.varianceAmount)}
                </span>
              </div>
            </div>

            {params.stockType === 'Non-valuated' ? (
              <div className="p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 bg-amber-950/20 border-amber-500/30">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-200">
                  ⚡ <strong>Quyết toán Non-valuated Stock:</strong> Tại bước này hệ thống hạch toán kết chuyển chi phí từ Sales Order{' '}
                  <span className="font-mono font-bold text-white">Nợ TK 632 / Có TK 154</span> (tổng chi phí thực tế{' '}
                  <span className="font-mono font-bold text-cyan-300">
                    {formatVND(computed.plannedCost + computed.varianceAmount)}
                  </span>
                  ) để tất toán tài khoản 154 về 0, đồng thời kết chuyển xác định kết quả kinh doanh sang TK 911!
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg border text-xs leading-relaxed flex items-start gap-2.5 bg-slate-900/60 border-slate-800">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-slate-300">
                  ⚡ <strong>Quyết toán Valuated Stock:</strong> Bút toán xử lý chênh lệch giá thành:{' '}
                  {computed.varianceAmount > 0 ? (
                    <span className="text-rose-300 font-semibold">
                      Nợ 632 / Có 154: {formatVND(computed.varianceAmount)} (Chênh lệch bất lợi - chi phí vượt định mức)
                    </span>
                  ) : computed.varianceAmount < 0 ? (
                    <span className="text-emerald-300 font-semibold">
                      Nợ 154 / Có 632: {formatVND(Math.abs(computed.varianceAmount))} (Chênh lệch thuận lợi - tiết kiệm chi phí)
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold">Không phát sinh chênh lệch định mức.</span>
                  )}
                  . Sau đó kết chuyển 511 và 632 vào 911 để xác định lãi gộp thực tế.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Auto-generated Journal Entries Table */}
        {stepState.entries.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span>Bút toán phát sinh tại bước này ({stepState.entries.length} chứng từ)</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">Theo TT 200/2014/TT-BTC</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[11px]">
                    <th className="py-2 px-3">Số Chứng Từ</th>
                    <th className="py-2 px-3">T-Code</th>
                    <th className="py-2 px-3">Diễn Giải Nghiệp Vụ</th>
                    <th className="py-2 px-3 text-center">Nợ (Dr)</th>
                    <th className="py-2 px-3 text-center">Có (Cr)</th>
                    <th className="py-2 px-3 text-right">Số Tiền (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {stepState.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-cyan-400 font-semibold">{e.voucherNo}</td>
                      <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{e.tCode}</td>
                      <td className="py-2 px-3 text-slate-200 font-sans max-w-xs">{e.description}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 text-[11px]">
                          {e.debitAccount}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-bold border border-teal-800 text-[11px]">
                          {e.creditAccount}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {formatVND(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* If no financial entries for this step (e.g. Step 1 and 2) */}
        {isExecuted && stepState.entries.length === 0 && (
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 italic">
            ℹ️ Bước này chỉ ghi nhận chứng từ logistics/kế hoạch và đối tượng chi phí trong SAP (SD/CO/PP/MM),
            chưa phát sinh bút toán tài chính trên Sổ Cái (FI) theo chuẩn Thông tư 200.
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Search,
  Terminal,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { SAP_TCODES_LIST, TCodeInfo } from '../types';

export interface CommandBarProps {
  onNavigateToStep: (stepId: number, tCode: string) => void;
  currentStepId: number;
  highlightedStepId?: number | null;
  onOpenTCodeLookup?: () => void;
  onOpenAdminDashboard?: () => void;
}

// Extended mapping of all aliases and common variations in SAP MTO
const TCODE_STEP_MAP: Record<string, { stepId: number; primaryTCode: string; name: string; module: string }> = {
  // Step 1: Sales Order & Costing
  VA01: { stepId: 1, primaryTCode: 'VA01', name: 'Tạo Sales Order (Item Category TAK/TAC)', module: 'SD' },
  VA02: { stepId: 1, primaryTCode: 'VA02', name: 'Thay đổi Sales Order', module: 'SD' },
  VA03: { stepId: 1, primaryTCode: 'VA03', name: 'Hiển thị Sales Order', module: 'SD' },
  CK51N: { stepId: 1, primaryTCode: 'CK51N', name: 'Sales Order Costing (Tính giá thành KH)', module: 'CO-PC' },
  CK11N: { stepId: 1, primaryTCode: 'CK11N', name: 'Cost Estimate with Quantity Structure', module: 'CO-PC' },

  // Step 2: MRP
  MD02: { stepId: 2, primaryTCode: 'MD02', name: 'Chạy MRP đơn hàng riêng (Stock E)', module: 'PP/MM' },
  MD01: { stepId: 2, primaryTCode: 'MD01', name: 'MRP Toàn bộ nhà máy', module: 'PP' },
  MD04: { stepId: 2, primaryTCode: 'MD04', name: 'Stock / Requirements List', module: 'PP/MM' },
  MD03: { stepId: 2, primaryTCode: 'MD03', name: 'Single-Item Single-Level MRP', module: 'PP' },
  PLAF: { stepId: 2, primaryTCode: 'PLAF', name: 'Planned Orders Table', module: 'PP' },

  // Step 3: Production, Confirmation & Goods Movement
  CO01: { stepId: 3, primaryTCode: 'CO01', name: 'Tạo Production Order (Lệnh SX PP04 MTO)', module: 'PP' },
  CO02: { stepId: 3, primaryTCode: 'CO02', name: 'Thay đổi Production Order', module: 'PP' },
  CO03: { stepId: 3, primaryTCode: 'CO03', name: 'Hiển thị Production Order', module: 'PP' },
  CO11N: { stepId: 3, primaryTCode: 'CO11N', name: 'Xác nhận công đoạn & giờ máy ép (Confirm)', module: 'PP/CO' },
  CO15: { stepId: 3, primaryTCode: 'CO15', name: 'Xác nhận toàn bộ Lệnh SX', module: 'PP' },
  MIGO: { stepId: 3, primaryTCode: 'MIGO', name: 'Nhập / Xuất kho vật tư và thành phẩm', module: 'MM/FI' },
  '261': { stepId: 3, primaryTCode: 'MIGO 261E', name: 'Xuất kho hạt nhựa cho Lệnh SX', module: 'MM/FI' },
  '261E': { stepId: 3, primaryTCode: 'MIGO 261E', name: 'Xuất kho hạt nhựa Special Stock E (TK 621)', module: 'MM/FI' },
  '101': { stepId: 3, primaryTCode: 'MIGO 101E', name: 'Nhập kho thành phẩm hoàn thành', module: 'MM/FI' },
  '101E': { stepId: 3, primaryTCode: 'MIGO 101E', name: 'Nhập kho thành phẩm hoàn thành vào kho E', module: 'MM/FI' },

  // Step 4: Quality Inspection (QM)
  QA11: { stepId: 4, primaryTCode: 'QA11', name: 'Quyết định sử dụng lô kiểm tra (Usage Decision)', module: 'QM' },
  QA32: { stepId: 4, primaryTCode: 'QA32', name: 'Danh sách lô kiểm tra KCS (Inspection Lot List)', module: 'QM' },
  QE51N: { stepId: 4, primaryTCode: 'QE51N', name: 'Ghi nhận kết quả đo kiểm KCS', module: 'QM' },
  CO07: { stepId: 4, primaryTCode: 'CO07', name: 'Lệnh sản xuất gia công lại (Rework Order)', module: 'PP/CO' },

  // Step 5: Delivery & PGI
  VL01N: { stepId: 5, primaryTCode: 'VL01N', name: 'Tạo phiếu giao hàng Outbound Delivery', module: 'SD/LE' },
  VL02N: { stepId: 5, primaryTCode: 'VL02N', name: 'Thay đổi chứng từ giao hàng', module: 'SD/LE' },
  VL03N: { stepId: 5, primaryTCode: 'VL03N', name: 'Hiển thị Outbound Delivery', module: 'SD/LE' },
  PGI: { stepId: 5, primaryTCode: 'MIGO 601E', name: 'Post Goods Issue (Xuất kho giao hàng)', module: 'MM/SD/FI' },
  '601': { stepId: 5, primaryTCode: 'MIGO 601E', name: 'Xuất kho chuyển quyền sở hữu', module: 'MM/SD/FI' },
  '601E': { stepId: 5, primaryTCode: 'MIGO 601E', name: 'Xuất kho Special Stock E giao khách OEM', module: 'MM/SD/FI' },

  // Step 6: Billing
  VF01: { stepId: 6, primaryTCode: 'VF01', name: 'Lập hóa đơn bán hàng thương mại (Billing)', module: 'SD/FI' },
  VF02: { stepId: 6, primaryTCode: 'VF02', name: 'Thay đổi hóa đơn bán hàng', module: 'SD/FI' },
  VF03: { stepId: 6, primaryTCode: 'VF03', name: 'Hiển thị hóa đơn bán hàng (VBRK/VBRP)', module: 'SD/FI' },
  VF04: { stepId: 6, primaryTCode: 'VF04', name: 'Danh sách giao hàng chờ xuất hóa đơn', module: 'SD' },

  // Step 7: Settlement & G/L
  VA88: { stepId: 7, primaryTCode: 'VA88', name: 'Quyết toán Sales Order sang CO-PA & FI', module: 'CO/FI' },
  KKA2: { stepId: 7, primaryTCode: 'KKA2', name: 'Tính chi phí dở dang WIP / Results Analysis', module: 'CO-PC' },
  KO88: { stepId: 7, primaryTCode: 'KO88', name: 'Quyết toán Lệnh sản xuất nội bộ', module: 'CO' },
  CO88: { stepId: 7, primaryTCode: 'CO88', name: 'Quyết toán đồng loạt kỳ kế toán', module: 'CO' },
  FS10N: { stepId: 7, primaryTCode: 'FS10N', name: 'Xem số dư Sổ Cái tài khoản kế toán', module: 'FI' },
  FBL3N: { stepId: 7, primaryTCode: 'FBL3N', name: 'Chi tiết từng dòng bút toán Sổ Cái', module: 'FI' },
};

// Popular T-Codes for one-click navigation
const QUICK_TCODES = [
  { tCode: 'VA01', step: 1, label: 'B1: Sales Order' },
  { tCode: 'MD02', step: 2, label: 'B2: MRP' },
  { tCode: 'CO01', step: 3, label: 'B3: Prod Order' },
  { tCode: 'QA11', step: 4, label: 'B4: KCS / UD' },
  { tCode: 'VL01N', step: 5, label: 'B5: Delivery' },
  { tCode: 'VF01', step: 6, label: 'B6: Billing' },
  { tCode: 'VA88', step: 7, label: 'B7: Settlement' },
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onNavigateToStep,
  currentStepId,
  highlightedStepId,
  onOpenTCodeLookup,
  onOpenAdminDashboard,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestion list based on user input
  const suggestions = React.useMemo(() => {
    const clean = inputVal.trim().toUpperCase().replace(/^\/N/, '').replace(/^\/O/, '');
    if (!clean) return [];

    const results: { key: string; stepId: number; name: string; module: string }[] = [];
    for (const [code, info] of Object.entries(TCODE_STEP_MAP)) {
      if (code.includes(clean) || info.name.toLowerCase().includes(inputVal.toLowerCase())) {
        if (!results.some((r) => r.key === code)) {
          results.push({
            key: code,
            stepId: info.stepId,
            name: info.name,
            module: info.module,
          });
        }
      }
    }
    return results.slice(0, 6);
  }, [inputVal]);

  const executeCommand = (cmd: string) => {
    // Sanitize SAP command:
    // Strip leading /n, /o, /N, /O, and whitespace
    let normalized = cmd.trim().toUpperCase();
    if (normalized.startsWith('/N') || normalized.startsWith('/O')) {
      normalized = normalized.substring(2).trim();
    }

    if (!normalized) {
      setStatusMessage({
        type: 'info',
        text: 'Vui lòng nhập mã T-Code SAP (ví dụ: VA01, MD02, CO01, QA11, VL01N, VF01, VA88).',
      });
      return;
    }

    // Secret Admin Command Triggers (/nADMIN, SAVA2026, ADMIN)
    if (normalized === 'ADMIN' || normalized === 'SAVA2026' || normalized === 'SAVA') {
      if (onOpenAdminDashboard) {
        onOpenAdminDashboard();
        setStatusMessage({
          type: 'success',
          text: `[S] Lệnh hệ thống ${cmd}: Đang mở SAVA Admin Control Center...`,
        });
        setDropdownOpen(false);
        setInputVal('');
        setTimeout(() => setStatusMessage(null), 4000);
        return;
      }
    }

    // Direct match or alias lookup
    let match = TCODE_STEP_MAP[normalized];

    // Fallback: check if user typed "STEP 3", "BƯỚC 2", "3", etc.
    if (!match) {
      const stepNumMatch = normalized.match(/^(?:STEP|BƯỚC|B)?\s*([1-7])$/i);
      if (stepNumMatch) {
        const stepNum = parseInt(stepNumMatch[1], 10);
        const quick = QUICK_TCODES.find((q) => q.step === stepNum);
        match = {
          stepId: stepNum,
          primaryTCode: quick?.tCode || `STEP ${stepNum}`,
          name: quick?.label || `Bước ${stepNum}`,
          module: 'SAP MTO',
        };
      }
    }

    if (match) {
      onNavigateToStep(match.stepId, match.primaryTCode);
      setStatusMessage({
        type: 'success',
        text: `[S] Giao dịch ${match.primaryTCode} thành công: Đã chuyển đến Bước ${match.stepId} (${match.name}) [${match.module}]`,
      });
      setDropdownOpen(false);
      setInputVal('');
      // Auto-clear message after 5 seconds
      setTimeout(() => {
        setStatusMessage((curr) => (curr?.type === 'success' ? null : curr));
      }, 5000);
    } else {
      setStatusMessage({
        type: 'error',
        text: `[E] Mã giao dịch "${cmd}" không tồn tại trong chu trình SAP MTO. Hãy thử: VA01, MD02, CO01, QA11, VL01N, VF01, VA88.`,
      });
      setTimeout(() => {
        setStatusMessage((curr) => (curr?.type === 'error' ? null : curr));
      }, 6000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(inputVal);
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-900 border border-slate-750 rounded-xl p-3 sm:p-4 shadow-lg relative overflow-visible"
    >
      {/* Top row: SAP Command Field & Fast execute */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Command Box Container */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          {/* SAP System Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 select-none shrink-0 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-200">PRD</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-400">100</span>
          </div>

          {/* Form with SAP green checkmark button & Input */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex items-center relative rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-500/60 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 transition-all shadow-inner"
          >
            {/* SAP Classic Green Enter/Execute Button */}
            <button
              type="submit"
              className="px-2.5 py-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-l-lg transition-colors cursor-pointer border-r border-slate-800 flex items-center gap-1 shrink-0"
              title="Thực thi T-Code (Enter / Execute transaction)"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>

            {/* Input field */}
            <div className="relative flex-1 flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Nhập mã SAP T-Code (vd: VA01, MD02, CO01, QA11, VL01N, VF01, VA88)..."
                className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm font-mono tracking-wider text-slate-100 placeholder:text-slate-500 placeholder:font-sans focus:outline-none uppercase"
                autoComplete="off"
                spellCheck="false"
              />

              {inputVal && (
                <button
                  type="button"
                  onClick={() => {
                    setInputVal('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 mr-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Xóa lệnh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Dropdown Button */}
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-r-lg border-l border-slate-800 transition-colors cursor-pointer"
              title="Danh sách T-Code gợi ý"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </div>

        {/* Right: Quick T-Code Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 hidden sm:inline">
            T-Code nhanh:
          </span>
          {QUICK_TCODES.map((item) => {
            const isActive = currentStepId === item.step;
            const isHighlighted = highlightedStepId === item.step;

            return (
              <button
                key={item.tCode}
                onClick={() => executeCommand(item.tCode)}
                className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border ${
                  isHighlighted
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 scale-105 animate-pulse'
                    : isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                }`}
                title={`Điều hướng đến ${item.label}`}
              >
                <span>{item.tCode}</span>
                <span className="text-[9px] font-normal opacity-70">B{item.step}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-Suggestion Dropdown */}
      {dropdownOpen && suggestions.length > 0 && (
        <div className="absolute left-3 sm:left-4 right-3 sm:right-auto sm:w-[480px] top-[54px] z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-lg">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span>Gợi ý T-Code trong chu trình MTO</span>
            <span className="text-cyan-400 font-mono">Bấm để điều hướng</span>
          </div>
          {suggestions.map((sug) => (
            <button
              key={sug.key}
              type="button"
              onClick={() => executeCommand(sug.key)}
              className="w-full px-2.5 py-2 rounded-lg text-left hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-cyan-400 group-hover:text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {sug.key}
                </span>
                <span className="text-xs text-slate-200 group-hover:text-white font-medium">
                  {sug.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                  {sug.module}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Bước {sug.stepId}
                </span>
              </div>
            </button>
          ))}

          {onOpenTCodeLookup && (
            <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenTCodeLookup();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 py-1 transition-colors cursor-pointer w-full justify-center bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mở Sổ Tay Tra Cứu Toàn Bộ T-Code & Bút Toán TT200</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SAP Status Message Line */}
      {statusMessage ? (
        <div
          className={`mt-2.5 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
              : 'bg-slate-950 text-slate-300 border border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="truncate">{statusMessage.text}</span>
          </div>

          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
            title="Đóng thông báo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-cyan-400/70" />
            <span>
              <strong>SAP Command Field</strong>: Nhập T-Code (vd: <code className="text-cyan-400 font-mono">VA01</code>, <code className="text-cyan-400 font-mono">MD02</code>, <code className="text-cyan-400 font-mono">CO01</code>, <code className="text-cyan-400 font-mono">QA11</code>, <code className="text-cyan-400 font-mono">VL01N</code>, <code className="text-cyan-400 font-mono">VF01</code>, <code className="text-cyan-400 font-mono">VA88</code>) rồi nhấn <strong>Enter</strong> để điều hướng.
            </span>
          </span>
          <span className="hidden md:inline font-mono text-[10px] text-slate-500">
            Hỗ trợ cả cú pháp: <span className="text-slate-400">/nVA01</span>
          </span>
        </div>
      )}
    </div>
  );
};

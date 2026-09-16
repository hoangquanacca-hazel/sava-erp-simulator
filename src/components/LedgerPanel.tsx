import React, { useState, useMemo } from 'react';
import {
  JournalEntry,
  MTOParameters,
  MTOComputed,
  UIMode,
  TrialBalanceResult,
} from '../types';
import { formatVND, computeTrialBalance } from '../utils/calculator';
import { exportFullERPPackageExcel } from '../utils/excelService';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Layers,
  X,
  RotateCcw,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Table,
  Scale,
  ArrowRight,
  TrendingUp,
  Eye,
} from 'lucide-react';

interface LedgerPanelProps {
  entries: JournalEntry[];
  params?: MTOParameters;
  computed?: MTOComputed;
  currentStepId?: number;
  onOpenPDFReport?: () => void;
  onRequestExportExcel?: () => void;
  uiMode?: UIMode;
}

// Active account mapping by Step ID in MTO 7-step flow
const STEP_ACTIVE_ACCOUNTS: Record<number, { accounts: string[]; label: string }> = {
  1: { accounts: [], label: 'Bước 1: Mở đơn hàng SO VA01 (Chưa phát sinh hạch toán FI)' },
  2: { accounts: [], label: 'Bước 2: Chạy MRP MD02 & Lệnh SX CO01 (Chưa phát sinh FI)' },
  3: {
    accounts: ['152', '621', '622', '627', '334', '214'],
    label: 'Bước 3: Xuất kho hạt nhựa MIGO 261E & Ghi nhận công thợ CO11N (Nợ 621, 622, 627)',
  },
  4: {
    accounts: ['154', '155', '621', '622', '627', '632'],
    label: 'Bước 4: Nhập kho bán thành phẩm/thành phẩm MIGO 101E & Kiểm định KCS QA11',
  },
  5: {
    accounts: ['155', '632'],
    label: 'Bước 5: Xuất kho giao hàng OEM PGI VL01N/VL02N 601E (Valuated: Nợ 632 / Có 155)',
  },
  6: {
    accounts: ['131', '511', '3331'],
    label: 'Bước 6: Phát hành hóa đơn điện tử OEM VF01 (Nợ 131, Có 511, Có 3331)',
  },
  7: {
    accounts: ['154', '632', '511', '911'],
    label: 'Bước 7: Quyết toán đơn hàng KKA2 / VA88 & Khóa sổ xác định KQKD (TK 911)',
  },
};

export const LedgerPanel: React.FC<LedgerPanelProps> = ({
  entries,
  params,
  computed,
  currentStepId = 1,
  onOpenPDFReport,
  onRequestExportExcel,
  uiMode = 'fiori',
}) => {
  const [activeTab, setActiveTab] = useState<'gl' | 'tb'>('gl');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedStep, setSelectedStep] = useState<string>('all');

  const isClassic = uiMode === 'classic';

  // Compute real totals directly from actual journal entry amounts
  const totalDebit = entries.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCredit = entries.reduce((acc, curr) => acc + curr.amount, 0);
  const variance = totalDebit - totalCredit;
  const isBalanced = entries.length > 0 ? variance === 0 : true;

  // Compute Trial Balance
  const trialBalance: TrialBalanceResult = useMemo(() => {
    return computeTrialBalance(entries);
  }, [entries]);

  // Check if any filter is actively applied
  const isFiltered =
    searchTerm.trim() !== '' || selectedAccount !== 'all' || selectedStep !== 'all';

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const q = searchTerm.trim().toLowerCase();

      // Check if user specifically searched by a step pattern
      const stepMatch = q.match(/^(?:bước|step|b)?\s*([1-7])$/i);
      const isSearchMatchingStep =
        stepMatch !== null
          ? e.stepIndex === parseInt(stepMatch[1], 10)
          : `bước ${e.stepIndex}`.includes(q) ||
            `step ${e.stepIndex}`.includes(q) ||
            `b${e.stepIndex}`.includes(q);

      // Check if user searched by G/L account number or account name
      const isSearchMatchingAccount =
        e.debitAccount.toLowerCase().includes(q) ||
        e.creditAccount.toLowerCase().includes(q) ||
        e.debitAccountName.toLowerCase().includes(q) ||
        e.creditAccountName.toLowerCase().includes(q);

      // General voucher / tcode / description matching
      const isSearchMatchingGeneral =
        e.voucherNo.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tCode.toLowerCase().includes(q) ||
        e.costObject.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q));

      const matchesSearch =
        q === '' ||
        isSearchMatchingStep ||
        isSearchMatchingAccount ||
        isSearchMatchingGeneral;

      // Dropdown Step filter
      const matchesStepDropdown =
        selectedStep === 'all' || e.stepIndex.toString() === selectedStep;

      // Dropdown Account filter
      const matchesAccountDropdown =
        selectedAccount === 'all' ||
        e.debitAccount === selectedAccount ||
        e.creditAccount === selectedAccount;

      return matchesSearch && matchesStepDropdown && matchesAccountDropdown;
    });
  }, [entries, searchTerm, selectedAccount, selectedStep]);

  // Filtered sub-totals
  const filteredDebit = filteredEntries.reduce((acc, curr) => acc + curr.amount, 0);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedAccount('all');
    setSelectedStep('all');
  };

  const handleQuickAccount = (acc: string) => {
    if (selectedAccount === acc) {
      setSelectedAccount('all');
    } else {
      setSelectedAccount(acc);
    }
  };

  const handleQuickStep = (stepId: string) => {
    if (selectedStep === stepId) {
      setSelectedStep('all');
    } else {
      setSelectedStep(stepId);
    }
  };

  const stepHighlight = STEP_ACTIVE_ACCOUNTS[currentStepId] || { accounts: [], label: '' };

  const handleExportExcel = () => {
    if (onRequestExportExcel) {
      onRequestExportExcel();
      return;
    }
    if (!params || !computed) {
      alert('Không có đủ dữ liệu tham số để xuất báo cáo ERP.');
      return;
    }
    exportFullERPPackageExcel(entries, trialBalance, params, computed);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden shadow-xl flex flex-col h-full border ${
        isClassic
          ? 'bg-[#ffffff] border-[#7f9db9] text-black font-sans'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Panel Header with Balanced Badge and View Switcher Tabs */}
      <div
        className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          isClassic ? 'bg-[#ece9d8] border-[#7f9db9]' : 'bg-slate-900/95 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border ${
              isClassic
                ? 'bg-[#ffffff] text-[#1e395b] border-[#7f9db9]'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}
          >
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isClassic ? 'text-[#0a246a]' : 'text-white'}`}>
                Hệ Thống Sổ Kế Toán & Cân Đối Phát Sinh
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                  isClassic
                    ? 'bg-white text-[#333333] border-[#7f9db9]'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Thông tư 99/2025/TT-BTC & TT 200/2014/TT-BTC
              </span>
            </div>
            <p className={`text-xs ${isClassic ? 'text-[#555555]' : 'text-slate-400'}`}>
              Tự động hạch toán đồng thời giữa Kế toán tài chính (FI) và Kế toán quản trị SAP CO
            </p>
          </div>
        </div>

        {/* Action Buttons: Tab Switcher, Excel Full Package, PDF, and Balance Status */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Main Tab Toggle: Sổ Nhật Ký vs Bảng Cân Đối Phát Sinh */}
          <div
            className={`flex items-center p-0.5 rounded border ${
              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-800 border-slate-700'
            }`}
          >
            <button
              onClick={() => setActiveTab('gl')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'gl'
                  ? isClassic
                    ? 'bg-[#316ac5] text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm'
                  : isClassic
                  ? 'text-[#333333] hover:text-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Sổ Nhật Ký Chung ({entries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tb')}
              className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tb'
                  ? isClassic
                    ? 'bg-[#316ac5] text-white shadow-sm'
                    : 'bg-cyan-600 text-white shadow-sm'
                  : isClassic
                  ? 'text-[#333333] hover:text-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Bảng Cân Đối Phát Sinh</span>
            </button>
          </div>

          {/* Export Full ERP Package Excel (3 Sheets) */}
          <button
            onClick={handleExportExcel}
            disabled={entries.length === 0}
            title="Xuất trọn gói Báo cáo ERP ra Excel: Sổ Cái, Bảng Cân Đối, và Kết Quả Kinh Doanh (P&L)"
            className={`px-2.5 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border shadow-sm transition-all ${
              entries.length > 0
                ? isClassic
                  ? 'bg-white hover:bg-[#f0f0f0] text-[#006600] border-[#7f9db9] cursor-pointer'
                  : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/60 hover:border-emerald-500 cursor-pointer ring-1 ring-emerald-500/20'
                : isClassic
                ? 'bg-[#e5e5e5] text-[#999999] border-[#cccccc] cursor-not-allowed'
                : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất Excel ERP (Full)</span>
          </button>

          {/* PDF Report button */}
          {onOpenPDFReport && (
            <button
              onClick={onOpenPDFReport}
              disabled={entries.length === 0}
              title="Xuất báo cáo quyết toán và bảng cân đối số phát sinh ra PDF lưu trữ"
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all shadow-sm ${
                entries.length > 0
                  ? isClassic
                    ? 'bg-[#ffffff] hover:bg-[#f0f0f0] text-[#800000] border-[#7f9db9] cursor-pointer'
                    : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-700/60 hover:border-rose-500 cursor-pointer'
                  : isClassic
                  ? 'bg-[#e5e5e5] text-[#999999] border-[#cccccc] cursor-not-allowed'
                  : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>In PDF</span>
            </button>
          )}

          {/* Real Dynamic Balance Indicator */}
          {entries.length === 0 ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border ${
                isClassic
                  ? 'bg-[#e5e5e5] text-[#666666] border-[#cccccc]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              Chưa có bút toán
            </span>
          ) : isBalanced ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border shadow-sm ${
                isClassic
                  ? 'bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>CÂN SỔ ✓ (Nợ = Có: {formatVND(totalDebit)})</span>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold border shadow-sm animate-pulse ${
                isClassic
                  ? 'bg-[#f2dede] text-[#a94442] border-[#ebccd1]'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-rose-950/50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>LỆCH SỔ ✗ (Lệch: {formatVND(variance)})</span>
            </div>
          )}
        </div>
      </div>

      {/* Contextual Course Upsell & Error Diagnosis when Trial Balance is Unbalanced */}
      {!isBalanced && entries.length > 0 && (
        <div
          className={`px-4 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn ${
            isClassic
              ? 'bg-[#fff3cd] border-[#ffeeba] text-[#856404]'
              : 'bg-amber-950/70 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 max-w-3xl">
            <span className="text-base">💡</span>
            <span className="leading-relaxed">
              <strong>Gợi ý nghiệp vụ:</strong> Chênh lệch phát sinh do chưa kết chuyển hết TK 154 sang TK 632. Tham gia Chuyên đề Kế toán Giá thành SAP trên Savafinlab để làm chủ 100% nghiệp vụ này.
            </span>
          </div>
          <a
            href="https://savafinlab.com.vn"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
              isClassic
                ? 'bg-[#0a246a] text-white hover:bg-[#1e395b]'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow'
            }`}
          >
            <span>Khóa Học Giá Thành SAP</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Active Step Accounting Context Banner */}
      <div
        className={`px-4 py-2 border-b text-xs flex items-center justify-between gap-3 ${
          isClassic
            ? 'bg-[#f5f5f5] border-[#e0e0e0] text-[#333333]'
            : 'bg-slate-950/80 border-slate-800/80 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-500">
            Trọng tâm hạch toán Bước {currentStepId}:
          </span>
          <span>{stepHighlight.label}</span>
        </div>
        {stepHighlight.accounts.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400">Tài khoản ảnh hưởng:</span>
            {stepHighlight.accounts.map((acc) => (
              <span
                key={acc}
                className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/15 border border-amber-500/40 text-amber-300"
              >
                TK {acc}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: SỔ NHẬT KÝ CHUNG (GENERAL LEDGER) */}
      {activeTab === 'gl' && (
        <>
          {/* Enhanced Filter and Search Bar */}
          <div
            className={`p-3 border-b space-y-2.5 ${
              isClassic ? 'bg-[#f8f8f8] border-[#e0e0e0]' : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
              {/* Main Search Input Field */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc theo số TK ('154', '632'...), Bước ('3', 'B3'...), T-Code, số CT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded pl-8 pr-8 py-1.5 text-xs border focus:outline-none ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-900 border-slate-700/80 text-slate-200 focus:border-cyan-500'
                  }`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter by Step ID Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>Bước:</span>
                </span>
                <select
                  value={selectedStep}
                  onChange={(e) => setSelectedStep(e.target.value)}
                  className={`rounded px-2 py-1.5 text-xs border focus:outline-none cursor-pointer ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-500'
                  }`}
                >
                  <option value="all">Tất cả các bước (1-7)</option>
                  <option value="1">Bước 1: SO & CK51N (VA01)</option>
                  <option value="2">Bước 2: MRP Vật tư (MD02)</option>
                  <option value="3">Bước 3: SX & Xuất NVL (MIGO 261E, CO11N)</option>
                  <option value="4">Bước 4: Nhập kho TP & KCS (MIGO 101E)</option>
                  <option value="5">Bước 5: Giao hàng & PGI (VL01N, 601E)</option>
                  <option value="6">Bước 6: Hóa đơn & Doanh thu (VF01)</option>
                  <option value="7">Bước 7: Quyết toán & Khóa sổ (VA88, KKA2)</option>
                </select>
              </div>

              {/* Filter by G/L Account Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-400" />
                  <span>Lọc TK:</span>
                </span>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className={`rounded px-2 py-1.5 text-xs border focus:outline-none cursor-pointer ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-cyan-500'
                  }`}
                >
                  <option value="all">Tất cả tài khoản Sổ Cái</option>
                  <option value="154">TK 154 — CP SXKD dở dang</option>
                  <option value="632">TK 632 — Giá vốn hàng bán</option>
                  <option value="155">TK 155 — Thành phẩm kho E</option>
                  <option value="152">TK 152 — Hạt nhựa nguyên liệu</option>
                  <option value="621">TK 621 — CP NVL trực tiếp</option>
                  <option value="622">TK 622 — CP Nhân công trực tiếp</option>
                  <option value="627">TK 627 — CP Sản xuất chung</option>
                  <option value="511">TK 511 — Doanh thu bán hàng</option>
                  <option value="131">TK 131 — Phải thu khách hàng</option>
                  <option value="3331">TK 3331 — Thuế GTGT đầu ra</option>
                  <option value="334">TK 334 — Phải trả người lao động</option>
                  <option value="214">TK 214 — Hao mòn TSCĐ máy ép</option>
                  <option value="911">TK 911 — Xác định kết quả KD</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Xóa toàn bộ bộ lọc"
                >
                  <RotateCcw className="w-3 h-3 text-rose-400" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                <span>Phím tắt lọc:</span>
              </span>

              {['154', '632', '155', '621', '622', '627', '511', '131'].map((acc) => {
                const isActive = selectedAccount === acc || searchTerm.trim() === acc;
                return (
                  <button
                    key={acc}
                    onClick={() => handleQuickAccount(acc)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-950 text-amber-300 border-amber-500/70 font-bold shadow-sm ring-1 ring-amber-400/40'
                        : isClassic
                        ? 'bg-white text-black border-[#7f9db9] hover:bg-[#e0e8f5]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    TK {acc}
                  </button>
                );
              })}

              <span className="text-slate-600 mx-1">|</span>

              {['3', '4', '5', '6', '7'].map((step) => {
                const isActive = selectedStep === step || searchTerm.trim() === step;
                return (
                  <button
                    key={step}
                    onClick={() => handleQuickStep(step)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/70 font-bold shadow-sm ring-1 ring-cyan-400/40'
                        : isClassic
                        ? 'bg-white text-black border-[#7f9db9] hover:bg-[#e0e8f5]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    B{step}
                  </button>
                );
              })}

              {isFiltered && (
                <span className="ml-auto text-[11px] text-cyan-400 font-medium">
                  Đang hiển thị {filteredEntries.length} / {entries.length} bút toán
                  {filteredEntries.length > 0 && ` (Nợ: ${formatVND(filteredDebit)})`}
                </span>
              )}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto flex-1 max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead
                className={`sticky top-0 border-b font-semibold text-[11px] uppercase tracking-wider z-10 ${
                  isClassic
                    ? 'bg-[#ece9d8] text-[#333333] border-[#7f9db9]'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Số CT</th>
                  <th className="py-2.5 px-3">Bước / T-Code</th>
                  <th className="py-2.5 px-3">Diễn Giải Nghiệp Vụ</th>
                  <th className="py-2.5 px-3 text-center">Nợ (Dr)</th>
                  <th className="py-2.5 px-3 text-center">Có (Cr)</th>
                  <th className="py-2.5 px-3 text-right">Số Tiền (VND)</th>
                  <th className="py-2.5 px-3">Đối Tượng Chi Phí</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-mono text-xs ${isClassic ? 'divide-[#e0e0e0]' : 'divide-slate-800/60'}`}>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      {entries.length === 0
                        ? 'Chưa phát sinh chứng từ kế toán. Hãy hoàn thành các bước trong quy trình SAP MTO.'
                        : 'Không tìm thấy chứng từ phù hợp với bộ lọc hiện tại.'}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, index) => (
                    <tr
                      key={e.id || `${e.voucherNo}-${index}`}
                      className={`transition-colors ${
                        isClassic ? 'hover:bg-[#f5f8fc]' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 font-sans">{index + 1}</td>
                      <td className="py-2 px-3 font-semibold text-cyan-400">{e.voucherNo}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          B{e.stepIndex}: {e.tCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-200 max-w-[280px] truncate" title={e.description}>
                        {e.description}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {e.debitAccount}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-bold text-teal-400 px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                          {e.creditAccount}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        {formatVND(e.amount)}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[140px]" title={e.costObject}>
                        {e.costObject}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VIEW 2: BẢNG CÂN ĐỐI PHÁT SINH (TRIAL BALANCE) */}
      {activeTab === 'tb' && (
        <div className="overflow-x-auto flex-1 max-h-[440px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead
              className={`sticky top-0 border-b font-semibold text-[11px] uppercase tracking-wider z-10 ${
                isClassic
                  ? 'bg-[#ece9d8] text-[#333333] border-[#7f9db9]'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <tr>
                <th className="py-2.5 px-3">Mã Số TK</th>
                <th className="py-2.5 px-3">Tên Tài Khoản Kế Toán</th>
                <th className="py-2.5 px-3">Phân Loại</th>
                <th className="py-2.5 px-3 text-right">Dư Đầu Kỳ (Nợ)</th>
                <th className="py-2.5 px-3 text-right">Dư Đầu Kỳ (Có)</th>
                <th className="py-2.5 px-3 text-right">Phát Sinh (Nợ)</th>
                <th className="py-2.5 px-3 text-right">Phát Sinh (Có)</th>
                <th className="py-2.5 px-3 text-right">Dư Cuối Kỳ (Nợ)</th>
                <th className="py-2.5 px-3 text-right">Dư Cuối Kỳ (Có)</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono text-xs ${isClassic ? 'divide-[#e0e0e0]' : 'divide-slate-800/60'}`}>
              {trialBalance.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    Chưa có số liệu phát sinh trên Bảng cân đối tài khoản.
                  </td>
                </tr>
              ) : (
                trialBalance.items.map((item) => {
                  const isActiveInStep = stepHighlight.accounts.includes(item.accountNumber);

                  return (
                    <tr
                      key={item.accountNumber}
                      className={`transition-colors ${
                        isActiveInStep
                          ? 'bg-amber-500/10 font-medium'
                          : isClassic
                          ? 'hover:bg-[#f5f8fc]'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-amber-400 flex items-center gap-1.5">
                        <span>{item.accountNumber}</span>
                        {isActiveInStep && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans">
                            Đang xử lý
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-200">
                        {item.accountName}
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-400">
                        {item.accountType === 'asset'
                          ? 'Tài sản'
                          : item.accountType === 'liability'
                          ? 'Nợ phải trả'
                          : item.accountType === 'revenue'
                          ? 'Doanh thu'
                          : item.accountType === 'expense'
                          ? 'Chi phí'
                          : 'Xác định KQKD'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {item.openingDebit > 0 ? formatVND(item.openingDebit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {item.openingCredit > 0 ? formatVND(item.openingCredit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                        {item.debitTurnover > 0 ? formatVND(item.debitTurnover) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-teal-400">
                        {item.creditTurnover > 0 ? formatVND(item.creditTurnover) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-cyan-300">
                        {item.closingDebit > 0 ? formatVND(item.closingDebit) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-cyan-300">
                        {item.closingCredit > 0 ? formatVND(item.closingCredit) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Trial Balance Total Row */}
            {trialBalance.items.length > 0 && (
              <tfoot
                className={`sticky bottom-0 border-t-2 font-mono font-bold text-xs ${
                  isClassic
                    ? 'bg-[#eaf0fb] text-[#0a246a] border-[#316ac5]'
                    : 'bg-slate-950 text-slate-100 border-cyan-500/50'
                }`}
              >
                <tr>
                  <td colSpan={3} className="py-3 px-3 uppercase font-sans tracking-wide">
                    Tổng cộng Bảng Cân Đối Phát Sinh
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400">-</td>
                  <td className="py-3 px-3 text-right text-slate-400">-</td>
                  <td className="py-3 px-3 text-right text-emerald-400">
                    {formatVND(trialBalance.totalDebitTurnover)}
                  </td>
                  <td className="py-3 px-3 text-right text-teal-400">
                    {formatVND(trialBalance.totalCreditTurnover)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300">
                    {formatVND(trialBalance.totalClosingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300">
                    {formatVND(trialBalance.totalClosingCredit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

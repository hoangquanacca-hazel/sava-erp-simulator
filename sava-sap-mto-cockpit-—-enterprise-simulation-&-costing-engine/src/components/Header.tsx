import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Bot,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  Settings,
  ShieldCheck,
  Search,
  BookOpen,
  Terminal,
  X,
  ExternalLink,
  CheckCircle2,
  Printer,
  FileText,
  Monitor,
  LayoutGrid,
  Save,
  ArrowLeft,
  LogOut,
  Ban,
  Share2,
  FolderTree,
} from 'lucide-react';
import { PRESET_SCENARIOS, PresetScenario, SAP_TCODES_LIST, UIMode, AdminSettings } from '../types';
import { TCodeLookupModal } from './TCodeLookupModal';

interface HeaderProps {
  onReset: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onOpenPDFReport?: () => void;
  onToggleAITutor: () => void;
  aiTutorOpen: boolean;
  totalEntriesCount: number;
  currentScreen: 'setup' | 'simulation';
  onGoToSetup: () => void;
  onGoToSimulation: () => void;
  onNavigateToStep?: (stepId: number, tCode?: string) => void;
  uiMode?: UIMode;
  onToggleUIMode?: (mode: UIMode) => void;
  onToggleClassicMenu?: () => void;
  isClassicMenuOpen?: boolean;
  adminSettings?: AdminSettings;
  onOpenAdminDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onSelectPreset,
  onExportCSV,
  onExportJSON,
  onOpenPDFReport,
  onToggleAITutor,
  aiTutorOpen,
  totalEntriesCount,
  currentScreen,
  onGoToSetup,
  onGoToSimulation,
  onNavigateToStep,
  uiMode = 'fiori',
  onToggleUIMode,
  onToggleClassicMenu,
  isClassicMenuOpen = false,
  adminSettings,
  onOpenAdminDashboard,
}) => {
  const [tCodeModalOpen, setTCodeModalOpen] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  const isClassic = uiMode === 'classic';

  const handleRunCommand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = commandInput.trim().toUpperCase().replace(/^\/N/, '').replace(/^\/O/, '');
    if (!raw) return;

    // Secret Admin Command Triggers
    if (raw === 'ADMIN' || raw === 'SAVA2026' || raw === 'SAVA') {
      if (onOpenAdminDashboard) {
        onOpenAdminDashboard();
        setCommandFeedback('Đang mở SAVA Admin Control Center...');
        setTimeout(() => setCommandFeedback(null), 3000);
        setCommandInput('');
        return;
      }
    }

    // Find step that matches tCode
    const match = SAP_TCODES_LIST.find((t) =>
      t.tCode.toUpperCase().includes(raw)
    );

    if (match) {
      setCommandFeedback(`Đã chuyển tới Bước ${match.stepId}: ${match.tCode}`);
      if (onNavigateToStep) {
        onNavigateToStep(match.stepId, match.tCode);
      }
      if (currentScreen !== 'simulation') {
        onGoToSimulation();
      }
      setTimeout(() => setCommandFeedback(null), 3000);
      setCommandInput('');
    } else {
      setCommandFeedback(`Không tìm thấy T-Code "${commandInput}"`);
      setTimeout(() => setCommandFeedback(null), 3000);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors shadow-md ${
          isClassic
            ? 'bg-[#d4d0c8] text-[#000000] border-b-2 border-[#808080]'
            : 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800'
        }`}
      >
        {/* Simulation Banner as required */}
        <div
          className={`px-4 py-1 text-center text-xs font-medium flex items-center justify-center gap-2 border-b ${
            isClassic
              ? 'bg-[#ffffcc] border-[#e6e600] text-[#665200]'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong className="tracking-wide uppercase font-bold">MÔ PHỎNG — Không phải hệ thống SAP thật</strong>{' '}
            | SAVA Precision Technology · Đào tạo thực chiến quy trình Make-to-Order (MTO) chuẩn Thông tư 99/2025/TT-BTC & TT 200/2014/TT-BTC
          </span>
        </div>

        {/* SAP Classic GUI Menu Bar & Command Strip (Simulated R/3 Interface) */}
        {isClassic && (
          <div className="bg-[#ece9d8] border-b border-[#999999] px-3 py-0.5 text-xs text-[#111111] font-sans flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleClassicMenu}
                className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded font-bold text-[#0a246a] flex items-center gap-1 border border-transparent hover:border-[#7f9db9]"
                title="Bật/Tắt cây thư mục SAP Easy Access"
              >
                📁 <u>M</u>enu (Easy Access)
              </button>
              <span className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded"><u>E</u>dit</span>
              <button
                type="button"
                onClick={onToggleClassicMenu}
                className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded"
              >
                Fa<u>v</u>orites
              </button>
              <span className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded">E<u>x</u>tras</span>
              <span className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded"><u>S</u>ystem</span>
              <span className="cursor-pointer hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded"><u>H</u>elp</span>
            </div>
            <div className="text-[11px] font-mono text-[#444444] hidden md:block">
              SAP GUI for Windows (SAVA R/3 Enterprise PRD-01)
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md ${
                isClassic
                  ? 'bg-[#1e395b] text-white border border-[#0f243d]'
                  : 'bg-gradient-to-br from-cyan-600 to-blue-800 text-cyan-200 border border-cyan-400/30'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-base sm:text-lg font-bold tracking-tight ${
                    isClassic ? 'text-[#0a246a]' : 'text-white'
                  }`}
                >
                  Sava SAP MTO Cockpit{' '}
                  <span className={isClassic ? 'text-[#316ac5] font-semibold' : 'text-cyan-400 font-semibold'}>
                    — Enterprise Simulation & Costing Engine
                  </span>
                </h1>
                <span
                  className={`hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isClassic
                      ? 'bg-[#e0e8f5] text-[#1e395b] border-[#a0b8df]'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  SD · MM · PP · QM · FICO (TT 99/2025)
                </span>
              </div>
              <p className={`text-[11px] ${isClassic ? 'text-[#555555]' : 'text-slate-400'}`}>
                SAVA Precision Technology — Sản xuất linh kiện ép nhựa chính xác theo đơn hàng OEM
              </p>
            </div>
          </div>

          {/* Authentic SAP Command Field */}
          <form
            onSubmit={handleRunCommand}
            className={`flex items-center relative rounded px-2 py-1 shadow-inner border ${
              isClassic
                ? 'bg-white border-[#7f9db9]'
                : 'bg-slate-950 border-slate-700'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 pr-1.5 border-r mr-1.5 ${
                isClassic ? 'text-[#555555] border-[#cccccc]' : 'text-slate-400 border-slate-800'
              }`}
            >
              <Terminal className={`w-3.5 h-3.5 ${isClassic ? 'text-[#1e395b]' : 'text-cyan-400'}`} />
              <span className="text-[10px] font-mono uppercase">OK-Code</span>
            </div>
            <input
              type="text"
              placeholder="/nVA01, CK11N..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              className={`text-xs font-mono uppercase focus:outline-none w-28 ${
                isClassic
                  ? 'bg-transparent text-[#000000] placeholder-[#888888]'
                  : 'bg-transparent text-cyan-300 placeholder-slate-600'
              }`}
            />
            <button
              type="submit"
              title="Nhấn Enter để thực thi lệnh T-Code (SAP Enter checkmark)"
              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                isClassic
                  ? 'bg-[#3cb371] hover:bg-[#2e8b57] text-white border border-[#1e6b37]'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              }`}
            >
              ✓
            </button>
            {commandFeedback && (
              <div
                className={`absolute top-full mt-1.5 left-0 right-0 text-[11px] px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap border ${
                  isClassic
                    ? 'bg-[#ffffcc] text-[#333333] border-[#e6e600]'
                    : 'bg-slate-900 border-cyan-500/60 text-cyan-300'
                }`}
              >
                {commandFeedback}
              </div>
            )}
          </form>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Simulated SAP License Concurrency Limit Badge */}
            <div
              className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shadow-sm ${
                isClassic
                  ? 'bg-[#ffffff] text-[#0a246a] border-[#7f9db9]'
                  : 'bg-slate-900/90 text-cyan-300 border-cyan-500/40'
              }`}
              title="Mô phỏng giới hạn số lượng người dùng đồng thời trên giấy phép SAP Demo (Tối đa 5 active sessions)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Số Session còn trống: {adminSettings?.simulatedAvailableSessions ?? 2}/5</span>
            </div>

            {/* UI Mode Toggle (SAP Fiori vs SAP Classic GUI) */}
            {onToggleUIMode && (
              <div
                className={`flex items-center p-0.5 rounded border text-xs font-medium shadow-sm ${
                  isClassic
                    ? 'bg-[#ffffff] border-[#7f9db9]'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <button
                  onClick={() => onToggleUIMode('fiori')}
                  title="Chuyển sang giao diện SAP Fiori hiện đại (Modern Web UX)"
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                    !isClassic
                      ? 'bg-cyan-600 text-white font-bold shadow'
                      : 'text-[#444444] hover:text-black'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>SAP Fiori</span>
                </button>
                <button
                  onClick={() => onToggleUIMode('classic')}
                  title="Chuyển sang giao diện SAP Classic GUI (Windows R/3 Styling)"
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                    isClassic
                      ? 'bg-[#1e395b] text-white font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>SAP Classic GUI</span>
                </button>
              </div>
            )}

            {/* SAP Easy Access Tree Drawer Button (Classic Mode Only) */}
            {isClassic && onToggleClassicMenu && (
              <button
                type="button"
                onClick={onToggleClassicMenu}
                className={`px-2.5 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isClassicMenuOpen
                    ? 'bg-[#316ac5] text-white border-[#204a87] shadow-inner'
                    : 'bg-[#ece9d8] hover:bg-[#e0dcc8] text-[#0a246a] border-[#7f9db9]'
                }`}
                title="Mở ngăn kéo menu cây SAP Easy Access (Menu 7 bước MTO)"
              >
                <FolderTree className="w-3.5 h-3.5 text-[#d49b00]" />
                <span>📂 SAP Easy Access</span>
              </button>
            )}

            {/* Tra cứu T-Code Modal Trigger */}
            <button
              onClick={() => setTCodeModalOpen(true)}
              className={`px-2.5 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isClassic
                  ? 'bg-[#ece9d8] hover:bg-[#e0dcc8] text-[#333333] border-[#7f9db9]'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Mở sổ tay tra cứu chi tiết tất cả T-Code trong chu trình MTO"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Tra cứu T-Code</span>
            </button>

            {/* Preset Selector */}
            <div className="relative">
              <select
                aria-label="Chọn tình huống mẫu"
                defaultValue=""
                onChange={(e) => {
                  const found = PRESET_SCENARIOS.find((p) => p.id === e.target.value);
                  if (found) onSelectPreset(found);
                  e.target.value = '';
                }}
                className={`text-xs rounded px-2.5 py-1.5 border focus:outline-none cursor-pointer font-medium ${
                  isClassic
                    ? 'bg-white text-[#000000] border-[#7f9db9]'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 focus:ring-1 focus:ring-cyan-500'
                }`}
              >
                <option value="" disabled>
                  📋 Chọn tình huống mẫu...
                </option>
                {PRESET_SCENARIOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Screen Switcher (Setup vs 7 Steps) */}
            <div
              className={`flex items-center p-0.5 rounded border ${
                isClassic
                  ? 'bg-white border-[#7f9db9]'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <button
                onClick={onGoToSetup}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'setup'
                    ? isClassic
                      ? 'bg-[#316ac5] text-white shadow-sm'
                      : 'bg-cyan-600 text-white shadow-sm'
                    : isClassic
                    ? 'text-[#444444] hover:text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Tham số CK11N</span>
              </button>
              <button
                onClick={onGoToSimulation}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
                  currentScreen === 'simulation'
                    ? isClassic
                      ? 'bg-[#316ac5] text-white shadow-sm'
                      : 'bg-cyan-600 text-white shadow-sm'
                    : isClassic
                    ? 'text-[#444444] hover:text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>7 Bước SAP MTO</span>
              </button>
            </div>

            {/* PDF Report Button */}
            <button
              onClick={onOpenPDFReport}
              disabled={totalEntriesCount === 0}
              title="Xuất báo cáo quyết toán và bảng cân đối kế toán ra file PDF lưu trữ"
              className={`text-xs px-2.5 py-1.5 rounded border font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                totalEntriesCount > 0
                  ? isClassic
                    ? 'bg-[#ece9d8] hover:bg-[#e0dcc8] text-[#800000] border-[#7f9db9] cursor-pointer'
                    : 'bg-gradient-to-r from-rose-950/60 to-amber-950/40 border-rose-700/60 text-rose-300 hover:text-white hover:border-rose-500 hover:from-rose-900/70 hover:to-amber-900/50 cursor-pointer ring-1 ring-rose-500/20'
                  : isClassic
                  ? 'bg-[#e5e5e5] text-[#999999] border-[#cccccc] cursor-not-allowed'
                  : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Báo cáo PDF</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={onReset}
              title="Làm mới mô phỏng và nhập kịch bản mới"
              className={`text-xs px-2.5 py-1.5 rounded border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isClassic
                  ? 'bg-[#ece9d8] hover:bg-[#e0dcc8] text-[#cc0000] border-[#7f9db9]'
                  : 'border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* AI Tutor Toggle Button */}
            <button
              onClick={onToggleAITutor}
              className={`text-xs px-3 py-1.5 rounded border font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                aiTutorOpen
                  ? isClassic
                    ? 'bg-[#316ac5] text-white border-[#1e395b]'
                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 border-teal-400 ring-2 ring-cyan-400/40'
                  : isClassic
                  ? 'bg-[#ece9d8] hover:bg-[#e0dcc8] text-[#004080] border-[#7f9db9]'
                  : 'bg-teal-950/50 border-teal-500/40 text-teal-300 hover:bg-teal-900/50'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-300" />
              <span>Trợ giảng AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tra cứu T-Code Modal */}
      <TCodeLookupModal
        isOpen={tCodeModalOpen}
        onClose={() => setTCodeModalOpen(false)}
        onNavigateToStep={onNavigateToStep}
        onGoToSimulation={onGoToSimulation}
      />
    </>
  );
};

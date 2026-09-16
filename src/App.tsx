import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MTOParameters,
  MTOComputed,
  StepRuntimeState,
  JournalEntry,
  PresetScenario,
  PRESET_SCENARIOS,
  UIMode,
  RegisteredUser,
  AdminSettings,
} from './types';
import {
  computeMTO,
  STEP_DEFINITIONS,
  generateStepEntries,
  computeStockEState,
  computeSalesOrderCostCard,
  computeTrialBalance,
  exportEntriesToCSV,
  exportEntriesToJSON,
  formatVND,
} from './utils/calculator';
import { exportFullERPPackageExcel } from './utils/excelService';
import { Header } from './components/Header';
import { CommandBar } from './components/CommandBar';
import { SetupScreen } from './components/SetupScreen';
import { StepCard } from './components/StepCard';
import { LedgerPanel } from './components/LedgerPanel';
import { SalesOrderCard } from './components/SalesOrderCard';
import { SpecialStockPanel } from './components/SpecialStockPanel';
import { AITutorDrawer } from './components/AITutorDrawer';
import { PDFReportModal } from './components/PDFReportModal';
import { SAPClassicMenu } from './components/SAPClassicMenu';
import { LeadCaptureModal } from './components/LeadCaptureModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { SessionLimitBanner } from './components/SessionLimitBanner';
import { OrderProfitDashboard } from './components/OrderProfitDashboard';
import {
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FastForward,
  AlertTriangle,
  Layers,
  FileCheck,
  FolderTree,
} from 'lucide-react';

const INITIAL_PARAMS: MTOParameters = PRESET_SCENARIOS[0].params;

export default function App() {
  const [params, setParams] = useState<MTOParameters>(INITIAL_PARAMS);
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'simulation'>('setup');
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [uiMode, setUiMode] = useState<UIMode>('fiori');
  const [isClassicMenuOpen, setIsClassicMenuOpen] = useState<boolean>(true);
  const [highlightedStepId, setHighlightedStepId] = useState<number | null>(null);
  const [highlightedTCode, setHighlightedTCode] = useState<string | null>(null);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);
  const [aiInitialQuestion, setAiInitialQuestion] = useState<string | undefined>(undefined);
  const [pdfReportOpen, setPdfReportOpen] = useState<boolean>(false);

  // User Registration & Gatekeeper Funnel State
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('sava_registered_user'));
    } catch {
      return false;
    }
  });
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(() => {
    try {
      const raw = localStorage.getItem('sava_registered_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [leadModalOpen, setLeadModalOpen] = useState<boolean>(false);
  const [leadModalTriggerReason, setLeadModalTriggerReason] = useState<'step3' | 'excel' | 'aitutor' | 'general'>('step3');
  const [pendingActionAfterLead, setPendingActionAfterLead] = useState<(() => void) | null>(null);

  // Simulated Session Limits & Licencing State
  const [completedRunsCount, setCompletedRunsCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('sava_completed_runs') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [sessionBannerDismissed, setSessionBannerDismissed] = useState<boolean>(false);

  // Secret Admin Control Center State
  const [adminDashboardOpen, setAdminDashboardOpen] = useState<boolean>(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const raw = localStorage.getItem('sava_admin_settings');
      return raw ? JSON.parse(raw) : { bypassSessionLimits: false, simulatedAvailableSessions: 2 };
    } catch {
      return { bypassSessionLimits: false, simulatedAvailableSessions: 2 };
    }
  });

  // Footer 3-click secret detector
  const [footerClicks, setFooterClicks] = useState<number>(0);
  const footerClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Runtime state of each of the 7 steps
  const [stepStates, setStepStates] = useState<Record<number, StepRuntimeState>>({
    1: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    2: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    3: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    4: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    5: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    6: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    7: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
  });

  // Real-time computed parameters
  const computed = useMemo(() => computeMTO(params), [params]);

  // Aggregate all generated journal entries across executed steps
  const allJournalEntries = useMemo(() => {
    const list: JournalEntry[] = [];
    for (let i = 1; i <= 7; i++) {
      if (stepStates[i]?.isExecuted) {
        list.push(...stepStates[i].entries);
      }
    }
    return list;
  }, [stepStates]);

  // Inventory & Sales Order states updated in real-time
  const stockEState = useMemo(() => {
    const executedSteps = [1, 2, 3, 4, 5, 6, 7].filter((id) => stepStates[id]?.isExecuted);
    const highestStep = executedSteps.length > 0 ? Math.max(...executedSteps) : 0;
    return computeStockEState(
      highestStep,
      params,
      computed,
      stepStates[4].qmDecision,
      stepStates[4].qmReworkHandled
    );
  }, [stepStates, params, computed]);

  const salesOrderCostCard = useMemo(() => {
    const executedSteps = [1, 2, 3, 4, 5, 6, 7].filter((id) => stepStates[id]?.isExecuted);
    const highestStep = executedSteps.length > 0 ? Math.max(...executedSteps) : 0;
    return computeSalesOrderCostCard(
      highestStep,
      params,
      computed,
      stepStates[4].qmReworkCost || 0,
      stepStates[4].qmScrapCost || 0
    );
  }, [stepStates, params, computed]);

  // Reset function
  const handleReset = () => {
    setStepStates({
      1: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      2: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      3: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      4: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      5: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      6: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
      7: { isExecuted: false, qmDecision: null, qmResolutionMethod: null, qmReworkHandled: false, qmReworkCost: 0, qmScrapCost: 0, actualVariancePercent: 0, entries: [] },
    });
    setCurrentStepId(1);
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setParams(preset.params);
    handleReset();
    setCurrentScreen('simulation');
  };

  // Allow modifying variance % directly on shop floor (Step 3)
  const handleChangeVariancePercent = (percent: number) => {
    setParams((prev) => ({
      ...prev,
      actualVariancePercent: percent,
    }));
  };

  // Registration & Gatekeeper action resolution
  const handleSuccessRegistration = (user: RegisteredUser) => {
    setIsRegistered(true);
    setRegisteredUser(user);
    setLeadModalOpen(false);

    if (pendingActionAfterLead) {
      const action = pendingActionAfterLead;
      setPendingActionAfterLead(null);
      setTimeout(() => {
        action();
      }, 150);
    }
  };

  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    try {
      localStorage.setItem('sava_admin_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  const doExportExcel = () => {
    const trialBalance = computeTrialBalance(allJournalEntries);
    exportFullERPPackageExcel(allJournalEntries, trialBalance, params, computed);
  };

  const handleRequestExcel = () => {
    if (!isRegistered && !adminSettings.bypassSessionLimits) {
      setLeadModalTriggerReason('excel');
      setPendingActionAfterLead(() => () => doExportExcel());
      setLeadModalOpen(true);
      return;
    }
    doExportExcel();
  };

  const handleToggleAITutor = () => {
    if (!aiTutorOpen && !isRegistered && !adminSettings.bypassSessionLimits) {
      setLeadModalTriggerReason('aitutor');
      setPendingActionAfterLead(() => () => setAiTutorOpen(true));
      setLeadModalOpen(true);
      return;
    }
    setAiTutorOpen((prev) => !prev);
  };

  // 3-click secret detector for footer credits
  const handleFooterSecretClick = () => {
    setFooterClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setAdminDashboardOpen(true);
        return 0;
      }
      if (footerClickTimerRef.current) clearTimeout(footerClickTimerRef.current);
      footerClickTimerRef.current = setTimeout(() => {
        setFooterClicks(0);
      }, 1500);
      return next;
    });
  };

  // Execution of a step
  const executeStepInternal = (stepId: number) => {
    // Special validation for Step 4 (QM):
    if (stepId === 4) {
      if (!stepStates[4].qmDecision) {
        // If not chosen yet, set default to pass
        setStepStates((prev) => ({
          ...prev,
          4: {
            ...prev[4],
            qmDecision: 'pass',
            isExecuted: true,
            qmReworkHandled: true,
            entries: [],
          },
        }));
        if (currentStepId === 4) setCurrentStepId(5);
        return;
      }

      if (stepStates[4].qmDecision === 'fail' && !stepStates[4].qmReworkHandled) {
        // BLOCKED!
        return;
      }
    }

    const reworkCost = stepStates[4].qmReworkCost || 0;
    const scrapCost = stepStates[4].qmScrapCost || 0;
    const method = stepStates[4].qmResolutionMethod || null;
    const generatedEntries = generateStepEntries(stepId, params, computed, reworkCost, scrapCost, method);

    setStepStates((prev) => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        isExecuted: true,
        entries: generatedEntries,
      },
    }));

    if (stepId === 7) {
      setCompletedRunsCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem('sava_completed_runs', next.toString());
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    }

    if (stepId < 7) {
      setCurrentStepId(stepId + 1);
    }
  };

  const handleExecuteStep = (stepId: number) => {
    // Step 1 & 2 are free. Step 3 (In-house production) triggers gatekeeper
    if (stepId >= 3 && !isRegistered && !adminSettings.bypassSessionLimits) {
      setLeadModalTriggerReason('step3');
      setPendingActionAfterLead(() => () => executeStepInternal(stepId));
      setLeadModalOpen(true);
      return;
    }
    executeStepInternal(stepId);
  };

  // Step 4 QM Decision handler
  const handleQMDecision = (decision: 'pass' | 'fail') => {
    setStepStates((prev) => ({
      ...prev,
      4: {
        ...prev[4],
        qmDecision: decision,
        qmResolutionMethod: null,
        qmReworkHandled: decision === 'pass',
        qmReworkCost: 0,
        qmScrapCost: 0,
        isExecuted: decision === 'pass',
        entries: [],
      },
    }));

    if (decision === 'pass') {
      setCurrentStepId(5);
    }
  };

  // Step 4 QM Resolution handler (Rework / Scrap / Concession)
  const handleQMResolution = (method: 'rework' | 'scrap' | 'concession', cost: number) => {
    const reworkCost = method === 'rework' ? cost : 0;
    const scrapCost = method === 'scrap' ? cost : 0;
    const qmEntries = generateStepEntries(4, params, computed, reworkCost, scrapCost, method);

    setStepStates((prev) => ({
      ...prev,
      4: {
        ...prev[4],
        qmResolutionMethod: method,
        qmReworkHandled: true,
        qmReworkCost: reworkCost,
        qmScrapCost: scrapCost,
        isExecuted: true,
        entries: qmEntries,
      },
    }));

    setCurrentStepId(5);
  };

  // Fast forward execution for demonstration
  const handleExecuteAllInternal = () => {
    let currentReworkCost = stepStates[4].qmReworkCost || 0;
    let currentScrapCost = stepStates[4].qmScrapCost || 0;
    let currentMethod = stepStates[4].qmResolutionMethod || null;
    const newStates = { ...stepStates };

    for (let s = 1; s <= 7; s++) {
      if (s === 4 && !newStates[4].qmDecision) {
        newStates[4].qmDecision = 'pass';
        newStates[4].qmReworkHandled = true;
      }
      const entries = generateStepEntries(
        s,
        params,
        computed,
        currentReworkCost,
        currentScrapCost,
        currentMethod
      );
      newStates[s] = {
        ...newStates[s],
        isExecuted: true,
        entries,
      };
    }

    setStepStates(newStates);
    setCurrentStepId(7);

    setCompletedRunsCount((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('sava_completed_runs', next.toString());
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleExecuteAll = () => {
    if (!isRegistered && !adminSettings.bypassSessionLimits) {
      setLeadModalTriggerReason('step3');
      setPendingActionAfterLead(() => () => handleExecuteAllInternal());
      setLeadModalOpen(true);
      return;
    }
    handleExecuteAllInternal();
  };

  // Handle navigation from SAP Command Bar (or T-Code triggers)
  const handleCommandNavigate = (stepId: number, tCode?: string) => {
    setCurrentStepId(stepId);
    setHighlightedStepId(stepId);
    setHighlightedTCode(tCode || null);

    // Auto-clear the highlight after 4 seconds
    setTimeout(() => {
      setHighlightedStepId((curr) => (curr === stepId ? null : curr));
    }, 4000);
  };

  // AI step explainer trigger
  const handleExplainStep = (stepDef: (typeof STEP_DEFINITIONS)[0]) => {
    const question = `Hãy giải thích chi tiết Bước ${stepDef.id}: ${stepDef.title} (T-code ${stepDef.tCode}, Module ${stepDef.sapModule}) trong quy trình MTO của PIC Vietnam. Hãy phân tích các tài khoản kế toán theo Thông tư 200/2014/TT-BTC và cơ chế kho ${params.stockType} Stock.`;
    setAiInitialQuestion(question);

    if (!isRegistered && !adminSettings.bypassSessionLimits) {
      setLeadModalTriggerReason('aitutor');
      setPendingActionAfterLead(() => () => setAiTutorOpen(true));
      setLeadModalOpen(true);
      return;
    }
    setAiTutorOpen(true);
  };

  const activeStepDef = STEP_DEFINITIONS.find((s) => s.id === currentStepId) || STEP_DEFINITIONS[0];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 ${
        uiMode === 'classic' ? 'bg-[#d4d0c8] text-black' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Application Header */}
      <Header
        uiMode={uiMode}
        onToggleUIMode={setUiMode}
        onToggleClassicMenu={() => setIsClassicMenuOpen((prev) => !prev)}
        isClassicMenuOpen={isClassicMenuOpen}
        onReset={handleReset}
        onSelectPreset={handleSelectPreset}
        onExportCSV={() => exportEntriesToCSV(allJournalEntries)}
        onExportJSON={() => exportEntriesToJSON(allJournalEntries, params)}
        onOpenPDFReport={() => setPdfReportOpen(true)}
        onToggleAITutor={handleToggleAITutor}
        aiTutorOpen={aiTutorOpen}
        totalEntriesCount={allJournalEntries.length}
        currentScreen={currentScreen}
        onGoToSetup={() => setCurrentScreen('setup')}
        onGoToSimulation={() => setCurrentScreen('simulation')}
        onNavigateToStep={(stepId, tCode) => handleCommandNavigate(stepId, tCode || 'SAP T-CODE')}
        adminSettings={adminSettings}
        onOpenAdminDashboard={() => setAdminDashboardOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentScreen === 'setup' ? (
          <SetupScreen
            params={params}
            computed={computed}
            onChangeParams={setParams}
            onStartSimulation={() => setCurrentScreen('simulation')}
            uiMode={uiMode}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Simulated Session Limit & SAVA Upsell Banner (When >= 3 runs or sessions exhausted) */}
            {(completedRunsCount >= 3 || adminSettings.simulatedAvailableSessions === 0) &&
              !sessionBannerDismissed && (
                <SessionLimitBanner
                  completedRunsCount={completedRunsCount}
                  onResetDemo={() => {
                    handleReset();
                    setSessionBannerDismissed(false);
                  }}
                  onClose={() => setSessionBannerDismissed(true)}
                  uiMode={uiMode}
                />
              )}

            {/* SAP Command Field Toolbar */}
            <CommandBar
              onNavigateToStep={handleCommandNavigate}
              currentStepId={currentStepId}
              highlightedStepId={highlightedStepId}
              onOpenAdminDashboard={() => setAdminDashboardOpen(true)}
            />

            {/* Quick Context Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {params.customer}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {params.componentCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    SL: {params.orderQuantity.toLocaleString('vi-VN')} cái · {params.strategy} ·{' '}
                    <strong className={params.stockType === 'Valuated' ? 'text-emerald-400' : 'text-amber-400'}>
                      {params.stockType} Stock
                    </strong>
                  </p>
                </div>
              </div>

              {/* Fast Forward & Navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Tự động thực hiện toàn bộ 7 bước để xem kết quả ngay"
                >
                  <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Chạy hết 7 bước</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Chạy lại mô phỏng từ đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bắt đầu lại</span>
                </button>
              </div>
            </div>

            {/* Stepper Navigation Indicator */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md overflow-x-auto">
              <div className="flex items-center justify-between min-w-[720px] gap-2">
                {STEP_DEFINITIONS.map((s) => {
                  const state = stepStates[s.id];
                  const isCurrent = currentStepId === s.id;
                  const isBlocked = s.id === 4 && state.qmDecision === 'fail' && !state.qmReworkHandled;
                  const isHighlighted = highlightedStepId === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setCurrentStepId(s.id);
                        if (highlightedStepId === s.id) setHighlightedStepId(null);
                      }}
                      className={`flex-1 p-2 rounded-lg border text-left transition-all cursor-pointer relative ${
                        isHighlighted
                          ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400 shadow-xl shadow-amber-500/25 scale-[1.03] z-10'
                          : isCurrent
                          ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                          : state.isExecuted
                          ? 'bg-slate-950/60 border-emerald-500/40 hover:bg-slate-900'
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/50 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            isHighlighted ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          BƯỚC {s.id}
                        </span>
                        {isHighlighted ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono font-black text-[9px] tracking-wider animate-bounce shadow-sm">
                            {highlightedTCode || s.tCode.split(' ')[0]}
                          </span>
                        ) : state.isExecuted ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isBlocked ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        ) : null}
                      </div>
                      <div
                        className={`text-xs font-bold truncate ${
                          isHighlighted ? 'text-amber-200' : 'text-slate-200'
                        }`}
                      >
                        {s.tCode}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{s.sapModule}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Card */}
            <StepCard
              step={activeStepDef}
              isActive={true}
              isExecuted={stepStates[activeStepDef.id]?.isExecuted || false}
              stepState={stepStates[activeStepDef.id]}
              params={params}
              computed={computed}
              onExecute={() => handleExecuteStep(activeStepDef.id)}
              onQMDecision={handleQMDecision}
              onHandleQMResolution={handleQMResolution}
              onChangeVariancePercent={handleChangeVariancePercent}
              onExplainStep={handleExplainStep}
              canExecute={
                activeStepDef.id === 1 ||
                stepStates[activeStepDef.id - 1]?.isExecuted === true
              }
            />

            {/* Always-Visible Panels Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Bảng Điều Khiển Theo Dõi Kế Toán & Tồn Kho (Always-Visible Panels)
                </h2>
              </div>

              {/* Grid of 2 summary cards: Sales Order Card & Special Stock E */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesOrderCard
                  cardState={salesOrderCostCard}
                  params={params}
                  computed={computed}
                  currentStep={currentStepId}
                />
                <SpecialStockPanel
                  stockState={stockEState}
                  params={params}
                  currentStep={currentStepId}
                />
              </div>

              {/* General Ledger Panel (Full width) */}
              <LedgerPanel
                entries={allJournalEntries}
                params={params}
                computed={computed}
                currentStepId={currentStepId}
                uiMode={uiMode}
                onOpenPDFReport={() => setPdfReportOpen(true)}
                onRequestExportExcel={handleRequestExcel}
              />

              {/* Order Profitability Dashboard (Recharts: Doanh thu 511, Giá vốn 632, Lợi nhuận gộp) */}
              <OrderProfitDashboard
                params={params}
                computed={computed}
                cardState={salesOrderCostCard}
                entries={allJournalEntries}
                currentStepId={currentStepId}
                uiMode={uiMode}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Disclaimer (EXACT TEXT SPECIFIED BY SPECIFICATION) */}
      <footer
        className={`border-t py-6 px-4 text-center text-xs space-y-2 mt-auto ${
          uiMode === 'classic'
            ? 'bg-[#ece9d8] border-[#7f9db9] text-[#333333]'
            : 'bg-slate-950/90 border-slate-800/80 text-slate-400'
        }`}
      >
        <div className={`font-bold ${uiMode === 'classic' ? 'text-[#0a246a]' : 'text-slate-200'}`}>
          Sava SAP MTO Cockpit — Enterprise Simulation & Costing Engine
        </div>
        <p className="max-w-4xl mx-auto leading-relaxed">
          Bản demo / prototype · dữ liệu minh họa SAVA (Công ty TNHH Công nghệ Chính xác SAVA — hư cấu), không phải số liệu doanh nghiệp thật.
        </p>
        <p className="max-w-4xl mx-auto leading-relaxed">
          Thiết kế & phát triển bởi{' '}
          <strong
            onClick={handleFooterSecretClick}
            className="cursor-pointer hover:text-cyan-400 transition-colors select-none"
            title="Nhấp 3 lần để mở SAVA Admin Control Center (Dành cho Mr. Quân)"
          >
            Hoàng Quân (Mr Quân)
          </strong>{' '}
          — chuyên gia Tài chính · Kế toán · FP&A · Kiểm soát nội bộ, kết hợp nghiệp vụ tài chính/kiểm toán với công nghệ AI.
        </p>
        <p className="max-w-4xl mx-auto leading-relaxed">
          Savafinlab — Tư vấn Tài chính, Thuế & Kế toán · Liên hệ hợp tác / tư vấn qua website:{' '}
          <a
            href="https://savafinlab.com.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline font-medium"
          >
            savafinlab.com.vn
          </a>
        </p>
      </footer>

      {/* AI Tutor Slide-over Drawer */}
      <AITutorDrawer
        isOpen={aiTutorOpen}
        onClose={() => {
          setAiTutorOpen(false);
          setAiInitialQuestion(undefined);
        }}
        currentStep={currentStepId}
        params={params}
        computed={computed}
        activeStepDef={activeStepDef}
        lastGeneratedEntries={stepStates[currentStepId]?.entries || []}
        allEntriesCount={allJournalEntries.length}
        initialQuestion={aiInitialQuestion}
      />

      {/* PDF Accounting Report Modal (Print & Archive) */}
      <PDFReportModal
        isOpen={pdfReportOpen}
        onClose={() => setPdfReportOpen(false)}
        params={params}
        computed={computed}
        entries={allJournalEntries}
        stepStates={stepStates}
        salesOrderCostCard={salesOrderCostCard}
        stockEState={stockEState}
      />

      {/* Gatekeeper Lead Capture Modal (Step 3, Excel Export, AI Tutor) */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => {
          setLeadModalOpen(false);
          setPendingActionAfterLead(null);
        }}
        onSuccess={handleSuccessRegistration}
        triggerReason={leadModalTriggerReason}
        uiMode={uiMode}
      />

      {/* Secret Admin Control Center Modal (For Mr. Hoang Quan) */}
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
        adminSettings={adminSettings}
        onUpdateAdminSettings={handleUpdateAdminSettings}
        uiMode={uiMode}
      />

      {/* SAP Classic Easy Access Drawer (Only appears when uiMode === 'classic') */}
      {uiMode === 'classic' && (
        <>
          {/* Pinned Tab on the left edge when drawer is closed */}
          {!isClassicMenuOpen && (
            <button
              onClick={() => setIsClassicMenuOpen(true)}
              className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#ece9d8] hover:bg-[#dcd8c8] text-[#0a246a] border-y-2 border-r-2 border-[#808080] py-3 px-2 rounded-r-md shadow-2xl flex flex-col items-center gap-1.5 font-bold text-xs cursor-pointer select-none transition-all group"
              title="Mở cây thư mục SAP Easy Access"
            >
              <FolderTree className="w-4 h-4 text-[#d49b00] group-hover:scale-110 transition-transform" />
              <span className="[writing-mode:vertical-rl] tracking-wider text-[11px] font-sans">
                SAP Easy Access
              </span>
            </button>
          )}

          {/* SAP Classic Easy Access Menu Tree Drawer */}
          <SAPClassicMenu
            isOpen={isClassicMenuOpen}
            onClose={() => setIsClassicMenuOpen(false)}
            currentStepId={currentStepId}
            onNavigateToStep={(stepId, tCode) => {
              handleCommandNavigate(stepId, tCode || 'SAP T-CODE');
            }}
            onGoToSimulation={() => setCurrentScreen('simulation')}
            stepStates={stepStates}
            uiMode={uiMode}
          />
        </>
      )}
    </div>
  );
}

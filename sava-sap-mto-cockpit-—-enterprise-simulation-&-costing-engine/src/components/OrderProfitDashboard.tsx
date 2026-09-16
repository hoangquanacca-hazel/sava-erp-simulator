import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calculator,
  Info,
} from 'lucide-react';
import {
  MTOParameters,
  MTOComputed,
  SalesOrderCostCardState,
  JournalEntry,
  UIMode,
} from '../types';
import { formatVND, formatNumber } from '../utils/calculator';

export interface OrderProfitDashboardProps {
  params: MTOParameters;
  computed: MTOComputed;
  cardState: SalesOrderCostCardState;
  entries: JournalEntry[];
  currentStepId: number;
  uiMode?: UIMode;
}

export const OrderProfitDashboard: React.FC<OrderProfitDashboardProps> = ({
  params,
  computed,
  cardState,
  entries,
  currentStepId,
  uiMode = 'fiori',
}) => {
  const isClassic = uiMode === 'classic';

  // Extract posted financial transactions from Journal Entries
  const { postedRevenue511, postedCOGS632, hasCompletedStep7 } = useMemo(() => {
    const rev511 = entries
      .filter((e) => e.creditAccount.startsWith('511'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const cogs632 = entries
      .filter((e) => e.debitAccount.startsWith('632'))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const step7Done = entries.some((e) => e.stepIndex === 7);

    return {
      postedRevenue511: rev511,
      postedCOGS632: cogs632,
      hasCompletedStep7: step7Done,
    };
  }, [entries]);

  // Actual vs Planned Calculation
  // If step 6 has posted revenue, use it; otherwise show planned revenue as preview
  const actualRevenue = postedRevenue511 > 0 ? postedRevenue511 : computed.totalRevenue;
  // If step 7 or step 5 has posted COGS, use it; otherwise use accumulated actual production cost
  const actualCOGS =
    postedCOGS632 > 0
      ? postedCOGS632
      : cardState.totalAccumulatedCost > 0
      ? cardState.totalAccumulatedCost
      : computed.plannedCost + (computed.actualCostVariance || 0);

  const actualGrossProfit = actualRevenue - actualCOGS;
  const actualMarginPercent =
    actualRevenue > 0 ? (actualGrossProfit / actualRevenue) * 100 : 0;

  const plannedRevenue = computed.totalRevenue;
  const plannedCOGS = computed.plannedCost;
  const plannedGrossProfit = computed.grossProfit;
  const plannedMarginPercent = computed.grossMarginPercent;

  const profitVariance = actualGrossProfit - plannedGrossProfit;
  const isProfitFavorable = profitVariance >= 0;

  // Chart data configuration:
  // 1. Direct Comparison Bar Data: Doanh thu (511) vs Giá vốn (632) vs Lợi nhuận gộp
  const comparisonData = useMemo(() => {
    return [
      {
        metric: 'Doanh thu (TK 511)',
        shortName: 'Doanh Thu 511',
        KeHoach: plannedRevenue,
        ThucTe: actualRevenue,
        variance: actualRevenue - plannedRevenue,
        color: '#06b6d4', // cyan-500
        actualColor: '#0891b2', // cyan-600
        accountCode: 'TK 511',
      },
      {
        metric: 'Giá vốn hàng bán (TK 632)',
        shortName: 'Giá Vốn 632',
        KeHoach: plannedCOGS,
        ThucTe: actualCOGS,
        variance: actualCOGS - plannedCOGS,
        color: '#f59e0b', // amber-500
        actualColor: '#d97706', // amber-600
        accountCode: 'TK 632',
      },
      {
        metric: 'Lợi nhuận gộp (Gross Profit)',
        shortName: 'Lợi Nhuận Gộp',
        KeHoach: plannedGrossProfit,
        ThucTe: actualGrossProfit,
        variance: actualGrossProfit - plannedGrossProfit,
        color: '#10b981', // emerald-500
        actualColor: actualGrossProfit >= 0 ? '#059669' : '#e11d48', // emerald-600 / rose-600
        accountCode: 'P&L (511 - 632)',
      },
    ];
  }, [
    plannedRevenue,
    actualRevenue,
    plannedCOGS,
    actualCOGS,
    plannedGrossProfit,
    actualGrossProfit,
  ]);

  // Breakdown of actual COGS components for analytical depth
  const cogsBreakdownData = useMemo(() => {
    const rawMaterial = computed.materialCost;
    const directLabor = computed.effectiveLaborCost;
    const overhead = computed.effectiveMachineCost + computed.variantAddonTotal;
    const shopFloorVariance = computed.actualCostVariance;
    const reworkCost = cardState.qmReworkCost || 0;
    const scrapCost = cardState.qmScrapCost || 0;

    return [
      { name: 'NVL trực tiếp (621)', value: rawMaterial, color: '#38bdf8' },
      { name: 'Nhân công TT (622)', value: directLabor, color: '#818cf8' },
      { name: 'Sản xuất chung (627)', value: overhead, color: '#a78bfa' },
      ...(shopFloorVariance !== 0
        ? [
            {
              name: 'Biến động xưởng (Variance)',
              value: Math.abs(shopFloorVariance),
              color: shopFloorVariance > 0 ? '#fb923c' : '#4ade80',
            },
          ]
        : []),
      ...(reworkCost > 0
        ? [{ name: 'Sửa chữa QM (CO07)', value: reworkCost, color: '#f43f5e' }]
        : []),
      ...(scrapCost > 0
        ? [{ name: 'Tổn thất phế phẩm (Scrap)', value: scrapCost, color: '#e11d48' }]
        : []),
    ];
  }, [computed, cardState]);

  return (
    <div
      id="order-profit-dashboard"
      className={`rounded-2xl border p-5 sm:p-6 shadow-xl space-y-6 transition-all animate-fadeIn ${
        isClassic
          ? 'bg-[#ece9d8] border-[#7f9db9] text-black font-sans'
          : 'bg-slate-900/90 border-slate-800 text-slate-100 backdrop-blur-sm'
      }`}
    >
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isClassic
                ? 'bg-[#0a246a] text-white border-[#204a87]'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wide border ${
                  isClassic
                    ? 'bg-white text-[#0a246a] border-[#7f9db9]'
                    : 'bg-slate-950 text-cyan-300 border-cyan-800/60'
                }`}
              >
                SAP CO-PA · PROFITABILITY ANALYSIS
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                  hasCompletedStep7
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {hasCompletedStep7 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã Quyết Toán Xong 7 Bước (VA88 Settled)</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Số Liệu Đang Mô Phỏng (Bước {currentStepId}/7)</span>
                  </>
                )}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
              Order Profit Dashboard — Phân Tích Hiệu Quả & Lợi Nhuận Đơn Hàng MTO
            </h2>
          </div>
        </div>

        {/* Order Identifier Tag */}
        <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
          <div
            className={`px-3 py-1.5 rounded-xl border font-mono ${
              isClassic
                ? 'bg-white border-[#7f9db9] text-[#0a246a]'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <span className="text-slate-500 mr-1.5">SO:</span>
            <span className="font-bold text-cyan-400">{cardState.salesOrderNumber}</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="font-semibold text-slate-300">{params.customer}</span>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh thu 511 */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              Doanh Thu Thuần (TK 511)
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {postedRevenue511 > 0 ? 'Đã hạch toán VF01' : 'Kế hoạch VA01'}
            </span>
          </div>
          <div className="text-xl font-black text-cyan-400 mt-2 font-mono">
            {formatVND(actualRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Đơn giá: {formatVND(params.sellingPricePerUnit)} / cái</span>
            <span>SL: {formatNumber(params.orderQuantity)}</span>
          </div>
        </div>

        {/* Giá vốn 632 */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Giá Vốn Hàng Bán (TK 632)
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
              {postedCOGS632 > 0 ? 'Đã quyết toán VA88' : 'Chi phí ước tính'}
            </span>
          </div>
          <div className="text-xl font-black text-amber-400 mt-2 font-mono">
            {formatVND(actualCOGS)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Định mức KH: {formatVND(plannedCOGS)}</span>
            <span
              className={`font-semibold ${
                actualCOGS <= plannedCOGS ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {actualCOGS <= plannedCOGS ? 'Tiết kiệm' : 'Vượt định mức'}
            </span>
          </div>
        </div>

        {/* Lợi nhuận gộp thực tế */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              {actualGrossProfit >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              Lợi Nhuận Gộp Thực Tế
            </span>
            <span
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                actualGrossProfit >= 0
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950 text-rose-300 border-rose-800/60'
              }`}
            >
              511 - 632
            </span>
          </div>
          <div
            className={`text-xl font-black mt-2 font-mono ${
              actualGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatVND(actualGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            {isProfitFavorable ? (
              <span className="text-emerald-400 flex items-center font-semibold">
                <ArrowUpRight className="w-3 h-3" /> +{formatVND(profitVariance)}
              </span>
            ) : (
              <span className="text-rose-400 flex items-center font-semibold">
                <ArrowDownRight className="w-3 h-3" /> {formatVND(profitVariance)}
              </span>
            )}
            <span>so với KH ({formatVND(plannedGrossProfit)})</span>
          </div>
        </div>

        {/* Tỷ suất lợi nhuận gộp Gross Margin % */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/80 border-slate-800 shadow-inner'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Tỷ Suất LN Gộp (Gross Margin)
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
              % Biên Lãi
            </span>
          </div>
          <div className="text-xl font-black text-teal-300 mt-2 font-mono">
            {actualMarginPercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Kế hoạch: {plannedMarginPercent.toFixed(1)}%</span>
            <span
              className={`font-semibold ${
                actualMarginPercent >= plannedMarginPercent
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}
            >
              {actualMarginPercent >= plannedMarginPercent ? 'Đạt KPI' : 'Cần kiểm soát'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart: Doanh thu (511) vs Giá vốn (632) vs Lợi nhuận gộp */}
        <div
          className={`lg:col-span-2 p-5 rounded-xl border flex flex-col justify-between ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/90 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span>Biểu Đồ So Sánh Doanh Thu (511), Giá Vốn (632) & Lợi Nhuận Gộp</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Đối chiếu trực quan giữa Kế hoạch (BOM/Routing) và Thực tế sản xuất theo đơn hàng
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-500/70 inline-block" />
                <span className="text-slate-400">Kế hoạch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                <span className="text-cyan-300 font-semibold">Thực tế</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Container */}
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isClassic ? '#d0d0d0' : '#334155'}
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  stroke={isClassic ? '#333333' : '#94a3b8'}
                  tick={{ fill: isClassic ? '#0a246a' : '#cbd5e1', fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke={isClassic ? '#333333' : '#94a3b8'}
                  tick={{ fill: isClassic ? '#555555' : '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val: number) => {
                    if (Math.abs(val) >= 1000000000) {
                      return `${(val / 1000000000).toFixed(1)}B`;
                    }
                    if (Math.abs(val) >= 1000000) {
                      return `${(val / 1000000).toFixed(0)}M`;
                    }
                    return `${val}`;
                  }}
                  tickLine={false}
                  dx={-5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div
                          className={`p-3 rounded-xl border shadow-xl text-xs space-y-1.5 ${
                            isClassic
                              ? 'bg-white border-[#7f9db9] text-black'
                              : 'bg-slate-900 border-slate-700 text-slate-100'
                          }`}
                        >
                          <div className="font-bold text-cyan-400 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                            <span>{data.metric}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {data.accountCode}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Kế hoạch:</span>
                            <span className="font-mono font-semibold">
                              {formatVND(data.KeHoach)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Thực tế:</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {formatVND(data.ThucTe)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Chênh lệch (Variance):</span>
                            <span
                              className={`font-mono font-bold ${
                                data.variance >= 0 ? 'text-cyan-300' : 'text-rose-400'
                              }`}
                            >
                              {data.variance > 0 ? '+' : ''}
                              {formatVND(data.variance)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#64748b" />
                <Bar
                  dataKey="KeHoach"
                  name="Kế hoạch (Planned)"
                  fill={isClassic ? '#7f9db9' : '#475569'}
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Bar
                  dataKey="ThucTe"
                  name="Thực tế (Actual)"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.actualColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend Table */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Doanh Thu 511</span>
              <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">
                {formatVND(actualRevenue)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Giá Vốn 632</span>
              <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm">
                {formatVND(actualCOGS)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Lợi Nhuận Gộp</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${
                  actualGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatVND(actualGrossProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* COGS Cost Structure Breakdown & Financial Notes */}
        <div
          className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 ${
            isClassic
              ? 'bg-white border-[#7f9db9]'
              : 'bg-slate-950/90 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-400" />
                Cơ Cấu Giá Vốn Thực Tế (TK 632)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {formatVND(actualCOGS)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bóc tách chi tiết các khoản chi phí sản xuất cấu thành giá vốn đơn hàng
            </p>

            {/* Visual breakdown list */}
            <div className="mt-4 space-y-2.5">
              {cogsBreakdownData.map((item, idx) => {
                const pct = actualCOGS > 0 ? (item.value / actualCOGS) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </span>
                      <span className="font-mono font-semibold">
                        {formatVND(item.value)}
                        <span className="text-slate-500 text-[10px] ml-1">
                          ({pct.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expert Financial Analysis (FP&A Recommendation) */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
              isClassic
                ? 'bg-[#f5f5f5] border-[#d0d0d0] text-[#333333]'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Nhận Định Quản Trị Giá Thành (FP&A Insight)</span>
            </div>
            <p>
              {actualMarginPercent >= 20 ? (
                <>
                  Đơn hàng đạt biên lợi nhuận gộp lý tưởng{' '}
                  <strong className="text-emerald-400">{actualMarginPercent.toFixed(1)}%</strong>{' '}
                  (vượt ngưỡng an toàn 20% cho dòng sản phẩm ép nhựa kỹ thuật cao OEM).
                </>
              ) : actualMarginPercent >= 10 ? (
                <>
                  Biên lợi nhuận gộp ở mức trung bình{' '}
                  <strong className="text-amber-400">{actualMarginPercent.toFixed(1)}%</strong>. Cần
                  tối ưu chu kỳ ép máy (Cycle Time) và kiểm soát hao hụt bọt khí ở khâu QM để cải
                  thiện hiệu quả.
                </>
              ) : (
                <>
                  Biên lợi nhuận gộp bị thu hẹp đáng kể (
                  <strong className="text-rose-400">{actualMarginPercent.toFixed(1)}%</strong>) do
                  chi phí phế phẩm / sửa chữa hoặc biến động giá hạt nhựa đầu vào.
                </>
              )}
            </p>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 flex items-center justify-between">
              <span>Chế độ kho: {params.stockType} Stock</span>
              <span>Khấu hao máy: {formatNumber(params.machineOperatingHours, 1)}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

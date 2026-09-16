import React from 'react';
import { SalesOrderCostCardState, MTOParameters, MTOComputed } from '../types';
import { formatVND } from '../utils/calculator';
import {
  FileText,
  TrendingUp,
  Package,
  Layers,
  CheckCircle,
  Clock,
  DollarSign,
  Cpu,
  UserCheck,
  Award,
} from 'lucide-react';

interface SalesOrderCardProps {
  cardState: SalesOrderCostCardState;
  params: MTOParameters;
  computed: MTOComputed;
  currentStep: number;
}

export const SalesOrderCard: React.FC<SalesOrderCardProps> = ({
  cardState,
  params,
  computed,
  currentStep,
}) => {
  const marginPercent =
    cardState.recognizedRevenue > 0
      ? Number(((cardState.actualGrossProfit / cardState.recognizedRevenue) * 100).toFixed(2))
      : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Thẻ Đơn Hàng Bán — Sales Order Cost Collector
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {cardState.salesOrderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Đối tượng tập hợp chi phí & doanh thu theo dõi lãi lỗ MTO
            </p>
          </div>
        </div>

        <div>
          {cardState.settledToCOPA ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Đã quyết toán CO-PA (VA88)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
              <Clock className="w-3.5 h-3.5" />
              <span>Đang tích lũy chi phí (WIP)</span>
            </span>
          )}
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-slate-500 block text-[11px]">Khách hàng OEM:</span>
          <span className="font-semibold text-slate-200 truncate block">{params.customer}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Mã linh kiện:</span>
          <span className="font-mono text-cyan-400 truncate block">{params.componentCode}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Số lượng đặt:</span>
          <span className="font-mono text-slate-200 block">{params.orderQuantity.toLocaleString('vi-VN')} cái</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Loại kho Stock E:</span>
          <span className="font-semibold text-amber-400 block">{params.stockType} Stock</span>
        </div>
      </div>

      {/* Accumulated Cost Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">
            Chi Phí Sản Xuất Tích Lũy (Accumulated Costs)
          </span>
          <span className="font-mono font-bold text-cyan-300">
            {formatVND(cardState.totalAccumulatedCost)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-400" />
                NVL Hạt nhựa (621)
              </span>
            </div>
            <div className="font-mono font-bold text-slate-200 text-xs">
              {formatVND(cardState.accumulatedMaterialCost)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-400" />
                Nhân công ép (622)
              </span>
            </div>
            <div className="font-mono font-bold text-slate-200 text-xs">
              {formatVND(cardState.accumulatedLaborCost)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                Máy ép & SXC (627)
              </span>
            </div>
            <div className="font-mono font-bold text-slate-200 text-xs">
              {formatVND(cardState.accumulatedMachineCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Performance Section: Revenue, COGS, Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Doanh thu ghi nhận (TK 511)</span>
          <span className="text-sm sm:text-base font-bold text-teal-400 font-mono">
            {formatVND(cardState.recognizedRevenue)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {currentStep >= 6 ? 'Đã xuất hóa đơn VF01' : 'Chờ lập hóa đơn Bước 6'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Giá vốn ghi nhận (TK 632)</span>
          <span className="text-sm sm:text-base font-bold text-rose-300 font-mono">
            {formatVND(cardState.recognizedCOGS)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {params.stockType === 'Valuated'
              ? currentStep >= 5
                ? 'Đã ghi nhận tại PGI (Bước 5)'
                : 'Sẽ ghi nhận tại Bước 5'
              : currentStep >= 7
              ? 'Đã quyết toán tại VA88 (Bước 7)'
              : 'Sẽ ghi nhận tại Bước 7'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40">
          <span className="text-[11px] text-emerald-300 font-semibold block mb-1">
            Lợi nhuận gộp thực tế (Gross Profit)
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
            {formatVND(cardState.actualGrossProfit)}
          </span>
          <div className="flex items-center justify-between text-[10px] text-emerald-300/80 mt-0.5">
            <span>Biên lãi gộp:</span>
            <strong className="font-mono">{marginPercent}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SpecialStockEState, MTOParameters } from '../types';
import { formatVND, formatNumber } from '../utils/calculator';
import {
  Boxes,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Truck,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface SpecialStockPanelProps {
  stockState: SpecialStockEState;
  params: MTOParameters;
  currentStep: number;
}

export const SpecialStockPanel: React.FC<SpecialStockPanelProps> = ({
  stockState,
  params,
  currentStep,
}) => {
  const isValuated = params.stockType === 'Valuated';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Kho Riêng Đơn Hàng — Special Stock E
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                SO Stock (Ind. Cust.)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quản lý tách biệt tồn kho vật lý & giá trị theo số hiệu Sales Order
            </p>
          </div>
        </div>

        {/* Current Stock Physical Status Badge */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
              stockState.stockStatus.includes('Đang bị chặn')
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse'
                : stockState.stockStatus.includes('Đạt chuẩn')
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : stockState.stockStatus.includes('Đã xuất kho')
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {stockState.stockStatus.includes('Đang bị chặn') ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : stockState.stockStatus.includes('Đạt chuẩn') ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : stockState.stockStatus.includes('Đã xuất') ? (
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{stockState.stockStatus}</span>
          </span>
        </div>
      </div>

      {/* 3 Categories: Raw Materials, WIP, Finished Goods */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Category 1: Resin Raw Material (Movement 261E) */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>NVL Hạt Nhựa (TK 152)</span>
            </span>
            <span className="font-mono text-slate-500">Mvt 261E</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {formatNumber(stockState.resinQuantityKg, 2)} kg
            </span>
            <span className="font-mono text-emerald-400 text-xs font-semibold">
              {formatVND(stockState.resinValueVND)}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 truncate">
            {currentStep < 2
              ? 'Chưa tạo PR mua hàng'
              : currentStep === 2
              ? 'Đã dự trù theo MRP (MD02)'
              : 'Đã xuất kho đưa vào ép phun (261E)'}
          </div>
        </div>

        {/* Category 2: Work in Process WIP (TK 154) */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Sản Phẩm Dở Dang (TK 154)</span>
            </span>
            <span className="font-mono text-slate-500">Routing/Ord</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {stockState.wipValueVND > 0 ? 'Đang gia công/Lỗi' : '0 ₫'}
            </span>
            <span className="font-mono text-amber-400 text-xs font-semibold">
              {formatVND(stockState.wipValueVND)}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 truncate">
            {stockState.wipValueVND > 0
              ? 'Chi phí treo tại xưởng ép'
              : 'Không có dở dang tồn đọng'}
          </div>
        </div>

        {/* Category 3: Finished Goods (Movement 101E & 601E) */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thành Phẩm Kho E (TK 155)</span>
            </span>
            <span className="font-mono text-slate-500">101E / 601E</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {formatNumber(stockState.finishedGoodsQuantity)} cái
            </span>
            <span className="font-mono text-cyan-400 text-xs font-semibold">
              {formatVND(stockState.finishedGoodsValueVND)}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 truncate">
            {!isValuated && stockState.finishedGoodsQuantity > 0
              ? 'Non-valuated: Tồn kho vật lý (Giá trị sổ sách = 0 đ)'
              : currentStep >= 5
              ? 'Đã xuất giao khách (PGI 601E)'
              : 'Sẵn sàng trong kho'}
          </div>
        </div>
      </div>
    </div>
  );
};

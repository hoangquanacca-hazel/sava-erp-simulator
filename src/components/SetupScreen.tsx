import React, { useRef, useState } from 'react';
import {
  MTOParameters,
  MTOComputed,
  StrategyType,
  StockType,
  VARIANT_COLORS,
  VARIANT_TEXTURES,
  VARIANT_PACKAGINGS,
  RawMaterialBOMItem,
  RoutingWorkCenter,
  DEFAULT_BOM_ITEMS,
  DEFAULT_ROUTING,
  UIMode,
} from '../types';
import { formatVND, formatNumber } from '../utils/calculator';
import { BOMVisualizer } from './BOMVisualizer';
import {
  exportFullERPPackageExcel,
  generateSampleExcelTemplate,
  parseParametersFromExcel,
} from '../utils/excelService';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Info,
  DollarSign,
  Cpu,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sliders,
  Palette,
  Sparkles,
  Percent,
  FolderTree,
  Upload,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Check,
  Building2,
  Wrench,
  Flame,
} from 'lucide-react';

interface SetupScreenProps {
  params: MTOParameters;
  computed: MTOComputed;
  onChangeParams: (newParams: MTOParameters) => void;
  onStartSimulation: () => void;
  uiMode?: UIMode;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  params,
  computed,
  onChangeParams,
  onStartSimulation,
  uiMode = 'fiori',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isClassic = uiMode === 'classic';

  const updateField = <K extends keyof MTOParameters>(
    key: K,
    value: MTOParameters[K]
  ) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const bomItems = params.bomItems && params.bomItems.length > 0 ? params.bomItems : DEFAULT_BOM_ITEMS;
  const routing = params.routing || DEFAULT_ROUTING;

  // Handlers for BOM Items table
  const handleUpdateBOMItem = (index: number, updated: Partial<RawMaterialBOMItem>) => {
    const nextList = [...bomItems];
    nextList[index] = { ...nextList[index], ...updated };
    // Automatically update resinType, resinPricePerKg, materialNormKgPer1000 if first item is updated
    const newParams: MTOParameters = {
      ...params,
      bomItems: nextList,
    };
    if (index === 0 && nextList[0].materialType === 'ROH') {
      newParams.resinType = nextList[0].name;
      newParams.resinPricePerKg = nextList[0].unitPrice;
      newParams.materialNormKgPer1000 = nextList[0].qtyPer1000;
    }
    onChangeParams(newParams);
  };

  const handleAddBOMItem = () => {
    const newItem: RawMaterialBOMItem = {
      id: `bom-item-${Date.now()}`,
      itemCode: 'ROH-ADDON-' + (bomItems.length + 1),
      name: 'Vật tư phụ gia / Hạt màu mới',
      materialType: 'ROH',
      qtyPer1000: 1.0,
      scrapRatePercent: 1.5,
      unitPrice: 45000,
      uom: 'KG',
    };
    onChangeParams({
      ...params,
      bomItems: [...bomItems, newItem],
    });
  };

  const handleRemoveBOMItem = (index: number) => {
    if (bomItems.length <= 1) {
      alert('Đơn hàng cần có ít nhất 1 dòng nguyên vật liệu trong BOM!');
      return;
    }
    const nextList = bomItems.filter((_, idx) => idx !== index);
    onChangeParams({
      ...params,
      bomItems: nextList,
    });
  };

  // Handlers for Routing Work Center
  const handleUpdateRouting = (updated: Partial<RoutingWorkCenter>) => {
    const nextRouting: RoutingWorkCenter = { ...routing, ...updated };
    onChangeParams({
      ...params,
      routing: nextRouting,
      laborRatePerHour: nextRouting.laborHourlyRate,
      machineRatePerHour: nextRouting.machineHourlyRate,
    });
  };

  // Handler for Excel File Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseParametersFromExcel(file);
    if (result.success && result.params) {
      onChangeParams({
        ...params,
        ...result.params,
      });
      setImportNotification({
        type: 'success',
        message: result.message,
      });
      setTimeout(() => setImportNotification(null), 6000);
    } else {
      setImportNotification({
        type: 'error',
        message: result.message,
      });
      setTimeout(() => setImportNotification(null), 6000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const selectedColor = VARIANT_COLORS.find((c) => c.id === params.variantColorId) || VARIANT_COLORS[0];
  const selectedTexture = VARIANT_TEXTURES.find((t) => t.id === params.variantTextureId) || VARIANT_TEXTURES[0];
  const selectedPackaging = VARIANT_PACKAGINGS.find((p) => p.id === params.variantPackagingId) || VARIANT_PACKAGINGS[0];

  return (
    <div className={`max-w-7xl mx-auto px-4 py-6 space-y-6 ${isClassic ? 'font-sans text-black' : ''}`}>
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Import Notification Toast Banner */}
      {importNotification && (
        <div
          className={`p-3.5 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-md animate-fadeIn ${
            importNotification.type === 'success'
              ? isClassic
                ? 'bg-[#dff0d8] text-[#3c763d] border-[#d6e9c6]'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
              : isClassic
              ? 'bg-[#f2dede] text-[#a94442] border-[#ebccd1]'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-950/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {importNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Top Banner & Quick Action Buttons */}
      <div
        className={`rounded-xl p-5 shadow-lg border relative overflow-hidden ${
          isClassic
            ? 'bg-[#ece9d8] border-[#7f9db9]'
            : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isClassic
                  ? 'bg-white text-[#1e395b] border-[#7f9db9]'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Khởi Tạo Tham Số Đơn Hàng & Tính Giá Thành (CK11N / CK24)</span>
            </div>
            <h2 className={`text-xl font-bold tracking-tight ${isClassic ? 'text-[#0a246a]' : 'text-white'}`}>
              Cấu hình Thông số Đơn hàng & Bảng Định Mức Sản Xuất MTO
            </h2>
            <p className={`text-xs sm:text-sm max-w-3xl ${isClassic ? 'text-[#444444]' : 'text-slate-400'}`}>
              Nhập các chỉ tiêu kỹ thuật BOM & Routing của đơn hàng gia công ép nhựa OEM tại SAVA Precision Technology.
              Hệ thống tự động tính toán giá thành kế hoạch (Cost Rollup), doanh thu, VAT và biên lợi nhuận theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Download Sample Excel Template */}
            <button
              onClick={() => generateSampleExcelTemplate()}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                isClassic
                  ? 'bg-[#ffffff] hover:bg-[#f0f0f0] text-[#1e395b] border-[#7f9db9]'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
              title="Tải file Excel mẫu chuẩn (.xlsx) chứa tham số đơn hàng, BOM và Routing"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Tải file Excel mẫu</span>
            </button>

            {/* Import Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-sm transition-all cursor-pointer ${
                isClassic
                  ? 'bg-[#ffffff] hover:bg-[#f0f0f0] text-[#006600] border-[#7f9db9]'
                  : 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="Nhập file Excel (.xlsx) để tự động điền thông số đơn hàng, BOM và Routing"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import Excel Tham Số</span>
            </button>

            {/* Enter Simulation Button */}
            <button
              onClick={onStartSimulation}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                isClassic
                  ? 'bg-[#316ac5] hover:bg-[#20509e] text-white border border-[#1e395b]'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950'
              }`}
            >
              <span>Vào 7 bước SAP MTO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Grid (Left: Inputs, Right: Live Cost Rollup Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Customer & Component */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-4 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b text-sm font-bold ${
                isClassic ? 'border-[#cccccc] text-[#0a246a]' : 'border-slate-800 text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4 text-cyan-500" />
              <span>1. Thông tin Khách hàng OEM & Sản phẩm Ép Nhựa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Khách hàng OEM (Customer)
                </label>
                <input
                  type="text"
                  value={params.customer}
                  onChange={(e) => updateField('customer', e.target.value)}
                  placeholder="Ví dụ: Samsung Electronics Vietnam"
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Mã linh kiện nhựa (Component Code)
                </label>
                <input
                  type="text"
                  value={params.componentCode}
                  onChange={(e) => updateField('componentCode', e.target.value)}
                  placeholder="Ví dụ: PL-SEVT-CAM08"
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 font-mono focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Tên chi tiết sản phẩm / Mô tả kỹ thuật
                </label>
                <input
                  type="text"
                  value={params.componentName}
                  onChange={(e) => updateField('componentName', e.target.value)}
                  placeholder="Ví dụ: Vỏ bảo vệ cụm camera Polycarbonate chịu lực"
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Order Quantity & Selling Price */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-4 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b text-sm font-bold ${
                isClassic ? 'border-[#cccccc] text-[#0a246a]' : 'border-slate-800 text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4 text-teal-500" />
              <span>2. Số lượng Đặt hàng & Đơn giá Thương mại (VA01)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Số lượng sản xuất (Cái / Units)
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={params.orderQuantity}
                  onChange={(e) => updateField('orderQuantity', Math.max(1, Number(e.target.value) || 0))}
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 font-mono focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Quy mô lô đơn hàng OEM
                </span>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Đơn giá bán (VND / Cái)
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={params.sellingPrice}
                  onChange={(e) => updateField('sellingPrice', Math.max(0, Number(e.target.value) || 0))}
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 font-mono focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                />
                <span className="text-[11px] text-teal-500 font-medium mt-1 block">
                  ≈ {formatVND(params.sellingPrice)} / cái
                </span>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Thuế suất GTGT (VAT)
                </label>
                <select
                  value={params.vatRate}
                  onChange={(e) => updateField('vatRate', Number(e.target.value))}
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:border-cyan-500'
                  }`}
                >
                  <option value={0.1}>10% (Chuẩn linh kiện nhựa TT99/TT200)</option>
                  <option value={0.08}>8% (Ưu đãi chính phủ)</option>
                  <option value={0}>0% (Khu chế xuất / Xuất khẩu EPE)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tài khoản 3331 đầu ra
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic BOM Engine (MM/PP - CS01/CS03/CK11N) */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-4 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Package className="w-4 h-4 text-emerald-500" />
                <span className={isClassic ? 'text-[#0a246a]' : 'text-slate-100'}>
                  3. Định Mức Nguyên Vật Liệu BOM (CS01 / CK11N — TK 621 / 152)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddBOMItem}
                className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 border transition-colors cursor-pointer ${
                  isClassic
                    ? 'bg-[#e0e8f5] hover:bg-[#c8d8f0] text-[#1e395b] border-[#7f9db9]'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-600/50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vật tư</span>
              </button>
            </div>

            <p className={`text-xs ${isClassic ? 'text-[#444444]' : 'text-slate-400'}`}>
              Cơ cấu các nguyên liệu cấu thành 1.000 sản phẩm ép nhựa. Chi phí trực tiếp (TK 621) được tự động tính bằng:
              <span className="font-mono text-cyan-400"> Tổng [ Định mức × (1 + Hao hụt%) × Đơn giá × Sản lượng ]</span>.
            </p>

            {/* Dynamic BOM Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className={isClassic ? 'bg-[#ece9d8] text-[#333333]' : 'bg-slate-950 text-slate-300 font-semibold'}>
                  <tr>
                    <th className="p-2 border-b border-slate-800">Mã vật tư</th>
                    <th className="p-2 border-b border-slate-800">Tên nguyên vật liệu</th>
                    <th className="p-2 border-b border-slate-800 text-center">Định mức/1000</th>
                    <th className="p-2 border-b border-slate-800 text-center">Hao hụt %</th>
                    <th className="p-2 border-b border-slate-800 text-right">Đơn giá (VND)</th>
                    <th className="p-2 border-b border-slate-800 text-center">ĐVT</th>
                    <th className="p-2 border-b border-slate-800 text-right">Thành tiền NVL</th>
                    <th className="p-2 border-b border-slate-800 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isClassic ? 'divide-[#cccccc]' : 'divide-slate-800'}`}>
                  {bomItems.map((item, index) => {
                    const grossQty = item.qtyPer1000 * (1 + item.scrapRatePercent / 100);
                    const lineCost = (grossQty / 1000) * item.unitPrice * params.orderQuantity;

                    return (
                      <tr key={item.id} className={isClassic ? 'hover:bg-[#f5f5f5]' : 'hover:bg-slate-850/50'}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemCode}
                            onChange={(e) => handleUpdateBOMItem(index, { itemCode: e.target.value })}
                            className={`w-24 px-1.5 py-1 rounded font-mono text-xs border ${
                              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateBOMItem(index, { name: e.target.value })}
                            className={`w-44 px-1.5 py-1 rounded text-xs border ${
                              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={item.qtyPer1000}
                            onChange={(e) => handleUpdateBOMItem(index, { qtyPer1000: Number(e.target.value) || 0 })}
                            className={`w-16 px-1 py-1 rounded text-center font-mono text-xs border ${
                              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={item.scrapRatePercent}
                            onChange={(e) =>
                              handleUpdateBOMItem(index, { scrapRatePercent: Number(e.target.value) || 0 })
                            }
                            className={`w-14 px-1 py-1 rounded text-center font-mono text-xs border ${
                              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="1000"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateBOMItem(index, { unitPrice: Number(e.target.value) || 0 })}
                            className={`w-20 px-1 py-1 rounded text-right font-mono text-xs border ${
                              isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <span className="font-mono text-[11px] text-slate-400">{item.uom}</span>
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                          {formatVND(lineCost)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMItem(index)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded cursor-pointer"
                            title="Xóa vật tư này khỏi BOM"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Material Cost Summary Strip */}
            <div
              className={`p-3 rounded-lg flex items-center justify-between border ${
                isClassic
                  ? 'bg-[#eaf4e9] border-[#c3e6cb] text-[#155724]'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold">
                  Tổng Chi Phí Nguyên Liệu Trực Tiếp (TK 621 - Direct Material Cost):
                </span>
              </div>
              <strong className="font-mono text-sm text-emerald-400">
                {formatVND(computed.directMaterialCost621 || computed.materialCost)}
              </strong>
            </div>
          </div>

          {/* Section 4: Work Center & Routing Engine (CA01 / CR01 / CK11N) */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-4 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b text-sm font-bold ${
                isClassic ? 'border-[#cccccc] text-[#0a246a]' : 'border-slate-800 text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-500" />
              <span>4. Định Mức Chuyền Ép & Work Center Routing (CA01 / CR01 — TK 622 & 627)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Mã & Tên Work Center (Xưởng máy ép)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={routing.workCenterCode}
                    onChange={(e) => handleUpdateRouting({ workCenterCode: e.target.value })}
                    className={`w-28 text-xs font-mono rounded px-2.5 py-1.5 border ${
                      isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  />
                  <input
                    type="text"
                    value={routing.workCenterName}
                    onChange={(e) => handleUpdateRouting({ workCenterName: e.target.value })}
                    className={`flex-1 text-xs rounded px-2.5 py-1.5 border ${
                      isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                    Setup máy (Giờ)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={routing.machineSetupTimeHours}
                    onChange={(e) => handleUpdateRouting({ machineSetupTimeHours: Number(e.target.value) || 0 })}
                    className={`w-full text-xs font-mono rounded px-2.5 py-1.5 border ${
                      isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                    Chu kỳ ép (Giây/SP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={routing.cycleTimeSeconds}
                    onChange={(e) => handleUpdateRouting({ cycleTimeSeconds: Number(e.target.value) || 0 })}
                    className={`w-full text-xs font-mono rounded px-2.5 py-1.5 border ${
                      isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Đơn giá giờ máy ép (VND/giờ — TK 627)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={routing.machineHourlyRate}
                  onChange={(e) => handleUpdateRouting({ machineHourlyRate: Number(e.target.value) || 0 })}
                  className={`w-full text-xs font-mono rounded px-2.5 py-1.5 border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Khấu hao máy ép 350T & điện năng 3 pha
                </span>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Đơn giá giờ nhân công (VND/giờ — TK 622)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={routing.laborHourlyRate}
                  onChange={(e) => handleUpdateRouting({ laborHourlyRate: Number(e.target.value) || 0 })}
                  className={`w-full text-xs font-mono rounded px-2.5 py-1.5 border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Lương thợ kỹ thuật bậc 4 đứng máy ép
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Tỷ lệ Phân bổ Chi phí Chung nhà máy (%) (Factory Overhead Rate — TK 627)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={routing.factoryOverheadRatePercent}
                    onChange={(e) =>
                      handleUpdateRouting({ factoryOverheadRatePercent: Number(e.target.value) || 0 })
                    }
                    className="flex-1 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded">
                    {routing.factoryOverheadRatePercent}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Phân bổ chi phí quản lý xưởng, bảo trì khuôn đúc, xử lý nước làm mát
                </span>
              </div>
            </div>

            {/* Computed Routing Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div
                className={`p-2.5 rounded-lg border ${
                  isClassic ? 'bg-[#f7f7f7] border-[#cccccc]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="text-[11px] text-slate-400 block">Thời gian chạy máy:</span>
                <strong className="font-mono text-xs text-cyan-400">
                  {computed.operatingHours || 0} giờ làm việc
                </strong>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  isClassic ? 'bg-[#f7f7f7] border-[#cccccc]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="text-[11px] text-slate-400 block">Nhân công trực tiếp (622):</span>
                <strong className="font-mono text-xs text-amber-400">
                  {formatVND(computed.directLaborCost622 || computed.effectiveLaborCost)}
                </strong>
              </div>

              <div
                className={`p-2.5 rounded-lg border ${
                  isClassic ? 'bg-[#f7f7f7] border-[#cccccc]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className="text-[11px] text-slate-400 block">Máy & SXC nhà máy (627):</span>
                <strong className="font-mono text-xs text-cyan-300">
                  {formatVND(computed.totalOverhead627 || computed.effectiveMachineCost)}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 5: Strategy & Stock Type */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-4 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div
              className={`flex items-center gap-2 pb-2 border-b text-sm font-bold ${
                isClassic ? 'border-[#cccccc] text-[#0a246a]' : 'border-slate-800 text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>5. Chiến Lược Sản Xuất SAP & Loại Kho Sales Order Stock E</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Chiến lược MTO (Strategy)
                </label>
                <select
                  value={params.strategy}
                  onChange={(e) => updateField('strategy', e.target.value as StrategyType)}
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="Strategy 20">Strategy 20 — MTO Thuần Túy (Make-to-Order Standard)</option>
                  <option value="Strategy 25">Strategy 25 — MTO Đa Biến Thể (Variant Configuration LO-VC)</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                  Loại kho Sales Order Stock (Special Stock E)
                </label>
                <select
                  value={params.stockType}
                  onChange={(e) => updateField('stockType', e.target.value as StockType)}
                  className={`w-full text-xs sm:text-sm rounded-lg px-3 py-2 focus:outline-none border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                >
                  <option value="Valuated">Valuated Stock E (Định giá tức thời — PGI ghi nhận Nợ 632 / Có 155)</option>
                  <option value="Non-valuated">Non-valuated Stock E (Phi định giá — COGS ghi nhận tại VA88 Settlement)</option>
                </select>
              </div>
            </div>

            {/* Variant Option selectors if Strategy 25 is active */}
            {params.strategy === 'Strategy 25' && (
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-lg space-y-3">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cấu Hình Biến Thể Sản Phẩm Ép Nhựa (LO-VC Variant Configuration)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Màu sắc hạt nhựa:</span>
                    <select
                      value={params.variantColorId || 'col_black'}
                      onChange={(e) => {
                        const opt = VARIANT_COLORS.find((c) => c.id === e.target.value);
                        onChangeParams({
                          ...params,
                          variantColorId: e.target.value,
                          variantColorName: opt?.name || '',
                        });
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {VARIANT_COLORS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (+{formatVND(c.unitCostAddon)}/cái)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Bề mặt khuôn (Texture):</span>
                    <select
                      value={params.variantTextureId || 'txt_spi_a2'}
                      onChange={(e) => {
                        const opt = VARIANT_TEXTURES.find((t) => t.id === e.target.value);
                        onChangeParams({
                          ...params,
                          variantTextureId: e.target.value,
                          variantTextureName: opt?.name || '',
                        });
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {VARIANT_TEXTURES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (+{formatVND(t.unitCostAddon)}/cái)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Quy cách bao bì:</span>
                    <select
                      value={params.variantPackagingId || 'pkg_standard'}
                      onChange={(e) => {
                        const opt = VARIANT_PACKAGINGS.find((p) => p.id === e.target.value);
                        onChangeParams({
                          ...params,
                          variantPackagingId: e.target.value,
                          variantPackagingName: opt?.name || '',
                        });
                      }}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {VARIANT_PACKAGINGS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (+{formatVND(p.unitCostAddon)}/cái)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-indigo-300 pt-1 flex justify-between border-t border-indigo-900/50">
                  <span>Tổng chi phí cộng thêm biến thể:</span>
                  <strong className="font-mono text-cyan-300">
                    +{formatVND(computed.variantAddonTotal || 0)}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Target vs. Actual Variance */}
          <div
            className={`rounded-xl p-4 sm:p-5 space-y-3 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Percent className="w-4 h-4 text-rose-400" />
                <span className={isClassic ? 'text-[#0a246a]' : 'text-slate-100'}>
                  6. Chênh Lệch Chi Phí Thực Tế Tại Xưởng (Actual Cost Variance %)
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  (params.actualVariancePercent || 0) > 0
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : (params.actualVariancePercent || 0) < 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {(params.actualVariancePercent || 0) > 0 ? '+' : ''}
                {params.actualVariancePercent || 0}%
              </span>
            </div>

            <p className={`text-xs ${isClassic ? 'text-[#444444]' : 'text-slate-400'}`}>
              Mô phỏng sai lệch giữa định mức kế hoạch (Standard Costing) và chi phí thực tế phát sinh tại xưởng
              (hao hụt NVL hoặc tăng giờ chạy máy). Được xử lý chênh lệch giá thành tại Bước 7 (VA88 Settlement).
            </p>

            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min="-15"
                max="30"
                step="1"
                value={params.actualVariancePercent || 0}
                onChange={(e) => updateField('actualVariancePercent', Number(e.target.value))}
                className="flex-1 accent-rose-500 cursor-pointer"
              />
              <div className="w-24">
                <input
                  type="number"
                  min="-15"
                  max="30"
                  value={params.actualVariancePercent || 0}
                  onChange={(e) => updateField('actualVariancePercent', Number(e.target.value))}
                  className={`w-full text-xs text-center rounded py-1.5 font-mono border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Product Costing Sheet (CK11N / CK24 Cost Rollup Card) (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div
            className={`rounded-xl p-5 shadow-xl space-y-4 sticky top-24 border ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9]'
                : 'bg-slate-900 border-cyan-500/30 shadow-slate-950/50'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isClassic ? 'text-[#0a246a]' : 'text-white'}`}>
                    Bảng Tính Giá Thành CK11N (Cost Rollup)
                  </h3>
                  <p className="text-[11px] text-slate-400">Tự động bóc tách 621 · 622 · 627</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                REAL-TIME
              </span>
            </div>

            {/* Main Summary Metric */}
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                isClassic
                  ? 'bg-[#eaf0fb] border-[#b0c8ef]'
                  : 'bg-gradient-to-br from-slate-950 to-slate-900 border-slate-800'
              }`}
            >
              <span className={`text-xs font-semibold ${isClassic ? 'text-[#333333]' : 'text-slate-400'}`}>
                Tổng Giá Thành Sản Xuất Kế Hoạch (Planned Cost — CK11N)
              </span>
              <div className={`text-2xl font-extrabold font-mono tracking-tight ${isClassic ? 'text-[#0a246a]' : 'text-cyan-300'}`}>
                {formatVND(computed.plannedCost)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span>Giá thành đơn vị / cái:</span>
                <strong className="text-cyan-400 font-mono">{formatVND(computed.unitPlannedCost)}</strong>
              </div>
            </div>

            {/* Cost Rollup Breakdown lines */}
            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex justify-between py-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  Chi phí NVL trực tiếp (TK 621):
                </span>
                <span className="font-mono font-medium text-slate-200">
                  {formatVND(computed.directMaterialCost621 || computed.materialCost)}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  Chi phí Nhân công trực tiếp (TK 622):
                </span>
                <span className="font-mono font-medium text-slate-200">
                  {formatVND(computed.directLaborCost622 || computed.effectiveLaborCost)}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Chi phí Máy ép & SXC (TK 627):
                </span>
                <span className="font-mono font-medium text-slate-200">
                  {formatVND(computed.totalOverhead627 || computed.effectiveMachineCost)}
                </span>
              </div>

              {params.strategy === 'Strategy 25' && (computed.variantAddonTotal || 0) > 0 && (
                <div className="flex justify-between py-2 text-indigo-300 bg-indigo-950/20 px-2 rounded">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Chi phí tùy biến Option:
                  </span>
                  <span className="font-mono font-bold">
                    +{formatVND(computed.variantAddonTotal || 0)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                  Tổng Doanh thu chưa thuế (TK 511):
                </span>
                <span className="font-mono font-bold text-teal-300">{formatVND(computed.totalRevenue)}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">Thuế GTGT đầu ra (TK 3331 - {params.vatRate * 100}%):</span>
                <span className="font-mono text-slate-300">{formatVND(computed.vatAmount)}</span>
              </div>

              <div className="flex justify-between py-2 bg-slate-950/40 px-2 rounded">
                <span className="text-slate-300 font-semibold">Tổng thanh toán Hóa đơn (TK 131):</span>
                <span className="font-mono font-bold text-slate-100">{formatVND(computed.totalBillingAmount)}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">Giá vốn hàng bán kế hoạch (TK 632):</span>
                <span className="font-mono font-medium text-rose-300">{formatVND(computed.plannedCOGS)}</span>
              </div>
            </div>

            {/* Profit Margin Box */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isClassic
                  ? 'bg-[#eaf4e9] border-[#c3e6cb]'
                  : 'bg-emerald-950/20 border-emerald-500/30'
              }`}
            >
              <div>
                <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block">
                  Lợi Nhuận Gộp Kế Hoạch (Gross Profit)
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {formatVND(computed.grossProfit)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Tỷ suất lãi gộp</span>
                <span className="text-base font-extrabold text-emerald-300 font-mono">
                  {computed.grossMarginPercent}%
                </span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={onStartSimulation}
              className={`w-full py-3 text-sm font-extrabold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isClassic
                  ? 'bg-[#316ac5] hover:bg-[#20509e] text-white border border-[#1e395b]'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-900/40'
              }`}
            >
              <span>Vào Quy Trình 7 Bước SAP MTO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Section: Interactive Costed BOM Tree Visualizer */}
      <div className="pt-2" id="bom-visualizer-section">
        <BOMVisualizer params={params} computed={computed} />
      </div>
    </div>
  );
};

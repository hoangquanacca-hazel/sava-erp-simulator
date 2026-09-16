import React, { useState, useMemo } from 'react';
import {
  MTOParameters,
  MTOComputed,
  BOMComponentNode,
  VARIANT_COLORS,
  VARIANT_TEXTURES,
  VARIANT_PACKAGINGS,
} from '../types';
import { buildBOMTree, formatVND, formatNumber } from '../utils/calculator';
import {
  FolderTree,
  Package,
  Layers,
  Cpu,
  UserCheck,
  Tag,
  Boxes,
  ChevronDown,
  ChevronRight,
  Calculator,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Flame,
  Wrench,
  Factory,
} from 'lucide-react';

interface BOMVisualizerProps {
  params: MTOParameters;
  computed: MTOComputed;
  onSelectComponent?: (node: BOMComponentNode) => void;
  className?: string;
}

export type CostCategory = 'raw_material' | 'labor' | 'overhead';

interface ItemizedCostGroup {
  category: CostCategory;
  name: string;
  sapCostElement: string;
  tt200Account: string;
  totalCost: number;
  unitCost: number;
  sharePercent: number;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: Array<{
    name: string;
    code: string;
    spec: string;
    cost: number;
    unitCost: number;
    share: number;
  }>;
}

export const BOMVisualizer: React.FC<BOMVisualizerProps> = ({
  params,
  computed,
  onSelectComponent,
  className = '',
}) => {
  const rootNode = useMemo(() => buildBOMTree(params, computed), [params, computed]);

  // Flattened array for lookup
  const allNodes = useMemo(() => {
    const list: BOMComponentNode[] = [];
    const traverse = (node: BOMComponentNode) => {
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(rootNode);
    return list;
  }, [rootNode]);

  // State: selected component node for drill-down inspection (defaults to Root Product)
  const [selectedNodeId, setSelectedNodeId] = useState<string>(rootNode.id);

  // State: expanded nodes for recursive flexbox tree
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['bom-root', 'bom-subassembly'])
  );

  // State: Active cost category tab in itemized inspector
  const [activeCategory, setActiveCategory] = useState<CostCategory | 'all'>('all');

  const selectedNode = useMemo(() => {
    return allNodes.find((n) => n.id === selectedNodeId) || rootNode;
  }, [allNodes, selectedNodeId, rootNode]);

  // Compute 3 Major Cost Pillars: Raw Material, Labor, Overhead
  const costGroups = useMemo<Record<CostCategory, ItemizedCostGroup>>(() => {
    const totalPlanned = Math.max(1, computed.plannedCost);
    const qty = Math.max(1, params.orderQuantity);

    const selectedColor =
      VARIANT_COLORS.find((c) => c.id === params.variantColorId) || VARIANT_COLORS[0];
    const selectedTexture =
      VARIANT_TEXTURES.find((t) => t.id === params.variantTextureId) || VARIANT_TEXTURES[0];
    const selectedPackaging =
      VARIANT_PACKAGINGS.find((p) => p.id === params.variantPackagingId) || VARIANT_PACKAGINGS[0];

    // Raw Material: Base Resin + Color Masterbatch
    const baseResinCost = Math.round(computed.totalResinKg * params.resinPricePerKg);
    const colorAddonCost = Math.round(computed.totalResinKg * (selectedColor.resinCostAddonPerKg || 0));
    const totalRawMaterial = baseResinCost + colorAddonCost;

    // Labor: Direct labor routing
    const totalLabor = computed.effectiveLaborCost;

    // Overhead: Machine depreciation/power + Surface treatment + Packaging
    const machineCost = computed.effectiveMachineCost;
    const surfaceCost = Math.round(
      (selectedTexture.unitCostAddon || 0) * qty +
        computed.totalResinKg * (selectedTexture.resinCostAddonPerKg || 0)
    );
    const packagingCost = Math.round((selectedPackaging.unitCostAddon || 0) * qty);
    const totalOverhead = machineCost + surfaceCost + packagingCost;

    return {
      raw_material: {
        category: 'raw_material',
        name: 'Chi Phí Nguyên Vật Liệu (Raw Material)',
        sapCostElement: 'Cost Element 400000 (Direct Materials)',
        tt200Account: 'TK 621 - Chi Phí NVL Trực Tiếp (Có TK 152)',
        totalCost: totalRawMaterial,
        unitCost: Math.round(totalRawMaterial / qty),
        sharePercent: Number(((totalRawMaterial / totalPlanned) * 100).toFixed(1)),
        colorClass: 'text-amber-400',
        borderClass: 'border-amber-500/30',
        bgClass: 'bg-amber-950/30',
        icon: Boxes,
        description: 'Hạt nhựa polymer kỹ thuật nguyên sinh nạp buồng sấy và hạt màu Masterbatch chịu nhiệt gia công.',
        items: [
          {
            name: `Hạt nhựa kỹ thuật ${params.resinType || 'ABS'}`,
            code: `ROH-RESIN`,
            spec: `${formatNumber(computed.totalResinKg, 2)} kg @ ${formatVND(params.resinPricePerKg)}/kg`,
            cost: baseResinCost,
            unitCost: Math.round(baseResinCost / qty),
            share: Number(((baseResinCost / totalPlanned) * 100).toFixed(1)),
          },
          {
            name: `Hạt màu Masterbatch (${selectedColor.name})`,
            code: `ROH-MB-COLOR`,
            spec: `Phụ gia màu 2% & Masterbatch UV`,
            cost: colorAddonCost,
            unitCost: Math.round(colorAddonCost / qty),
            share: Number(((colorAddonCost / totalPlanned) * 100).toFixed(1)),
          },
        ],
      },
      labor: {
        category: 'labor',
        name: 'Chi Phí Nhân Công Trực Tiếp (Labor)',
        sapCostElement: 'Cost Element 420000 (Direct Labor Activity)',
        tt200Account: 'TK 622 - Chi Phí Nhân Công Trực Tiếp (Có TK 334)',
        totalCost: totalLabor,
        unitCost: Math.round(totalLabor / qty),
        sharePercent: Number(((totalLabor / totalPlanned) * 100).toFixed(1)),
        colorClass: 'text-cyan-400',
        borderClass: 'border-cyan-500/30',
        bgClass: 'bg-cyan-950/30',
        icon: UserCheck,
        description: 'Tiền lương, phụ cấp đứng máy và bảo hộ lao động thợ ép phun (Routing Op 0010, Work Center WC-INJ-01).',
        items: [
          {
            name: 'Thợ ép phun vận hành & gọt bavia (Routing Op 0010)',
            code: 'ACT-LAB-OP01',
            spec:
              params.laborCostMode === 'hourly'
                ? `${params.laborHours} giờ @ ${formatVND(params.laborRatePerHour)}/h`
                : `${formatVND(params.laborCostPerUnit)}/cái`,
            cost: totalLabor,
            unitCost: Math.round(totalLabor / qty),
            share: Number(((totalLabor / totalPlanned) * 100).toFixed(1)),
          },
        ],
      },
      overhead: {
        category: 'overhead',
        name: 'Chi Phí Sản Xuất Chung (Overhead)',
        sapCostElement: 'Cost Element 430000 / 440000 (MOH & Utilities)',
        tt200Account: 'TK 627 - Chi Phí Sản Xuất Chung (Có TK 214, 152)',
        totalCost: totalOverhead,
        unitCost: Math.round(totalOverhead / qty),
        sharePercent: Number(((totalOverhead / totalPlanned) * 100).toFixed(1)),
        colorClass: 'text-violet-400',
        borderClass: 'border-violet-500/30',
        bgClass: 'bg-violet-950/30',
        icon: Factory,
        description: 'Khấu hao máy ép 350T, điện năng 3 pha nung trục vít, xử lý bề mặt ESD và vật liệu bao bì đóng gói OEM.',
        items: [
          {
            name: 'Khấu hao máy ép Haitian 350T & Điện năng',
            code: 'ACT-MACH-350T',
            spec:
              params.machineCostMode === 'hourly'
                ? `${params.machineHours} giờ @ ${formatVND(params.machineRatePerHour)}/h`
                : `${formatVND(params.machineCostPerUnit)}/cái`,
            cost: machineCost,
            unitCost: Math.round(machineCost / qty),
            share: Number(((machineCost / totalPlanned) * 100).toFixed(1)),
          },
          {
            name: `Xử lý bề mặt (${selectedTexture.name})`,
            code: 'SRF-TEXTURE',
            spec: 'Ăn mòn khuôn hoặc phủ hóa chất chống tĩnh điện',
            cost: surfaceCost,
            unitCost: Math.round(surfaceCost / qty),
            share: Number(((surfaceCost / totalPlanned) * 100).toFixed(1)),
          },
          {
            name: `Bao bì đóng gói (${selectedPackaging.name})`,
            code: 'VERP-PACKAGING',
            spec: 'Khay vỉ định hình, túi cleanroom bảo vệ ngoại quan',
            cost: packagingCost,
            unitCost: Math.round(packagingCost / qty),
            share: Number(((packagingCost / totalPlanned) * 100).toFixed(1)),
          },
        ],
      },
    };
  }, [params, computed]);

  // Toggle expand / collapse
  const handleToggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    allNodes.forEach((n) => {
      if (n.children && n.children.length > 0) all.add(n.id);
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSelectNode = (node: BOMComponentNode) => {
    setSelectedNodeId(node.id);
    if (onSelectComponent) {
      onSelectComponent(node);
    }
  };

  // Recursive Flexbox Tree Node Renderer
  const renderFlexTreeNode = (node: BOMComponentNode, isLast: boolean = false, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    // Material type badge styling
    const badgeMap: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
      FERT: { label: 'FERT · Thành phẩm', cls: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', icon: Package },
      HALB: { label: 'HALB · Bán TP thô', cls: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40', icon: Layers },
      ROH: { label: 'ROH · Nguyên vật liệu', cls: 'bg-amber-950/80 text-amber-300 border-amber-500/40', icon: Boxes },
      ACT: { label: 'ACT · Giờ máy/Công', cls: 'bg-sky-950/80 text-sky-300 border-sky-500/40', icon: Cpu },
      VERP: { label: 'VERP · Bao bì', cls: 'bg-purple-950/80 text-purple-300 border-purple-500/40', icon: Tag },
    };

    const meta = badgeMap[node.materialType] || badgeMap.ROH;
    const BadgeIcon = meta.icon;

    return (
      <div key={node.id} className="relative flex flex-col">
        {/* Horizontal Connector Line for child nodes */}
        {depth > 0 && (
          <span
            className="absolute left-[-20px] top-[18px] w-5 h-px bg-slate-700 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Node Card Row */}
        <div
          onClick={() => handleSelectNode(node)}
          className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer mb-2 ${
            isSelected
              ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50 scale-[1.01] z-10'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* Left info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Expand / Collapse Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => handleToggleExpand(node.id, e)}
                className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title={isExpanded ? 'Thu gọn nhánh' : 'Mở rộng nhánh'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <span className="w-5 flex justify-center text-slate-600 shrink-0 font-bold">•</span>
            )}

            {/* Type badge */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 flex items-center gap-1 ${meta.cls}`}
            >
              <BadgeIcon className="w-3 h-3" />
              <span>{node.materialType}</span>
            </span>

            {/* Code and title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  {node.materialNumber}
                </span>
                <span className="text-[11px] text-slate-300 truncate max-w-[170px] sm:max-w-xs">
                  {node.description}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>
                  Định mức:{' '}
                  <strong className="text-slate-200 font-mono">
                    {formatNumber(node.quantityPerUnit, 4)} {node.unitOfMeasure}/cái
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Tổng lô:{' '}
                  <strong className="text-slate-200 font-mono">
                    {formatNumber(node.totalQuantity, 2)} {node.unitOfMeasure}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right cost rollup */}
          <div className="text-right shrink-0 min-w-[130px] sm:min-w-[160px]">
            <span className="text-xs sm:text-sm font-mono font-extrabold text-cyan-300 block">
              {formatVND(node.totalCost)}
            </span>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">
                {formatVND(node.unitCost)}/{node.unitOfMeasure}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {node.costSharePercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Children Sub-tree Container (CSS Recursive Flexbox with Tree Line Connector) */}
        {hasChildren && isExpanded && (
          <div className="relative pl-6 ml-3.5 flex flex-col before:absolute before:left-0 before:top-[-2px] before:bottom-3 before:w-px before:bg-slate-700">
            {node.children!.map((child, index) =>
              renderFlexTreeNode(child, index === node.children!.length - 1, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="bom-visualizer-section"
      className={`bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-5 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Visual background ambient accent */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Cấu Trúc Cây BOM & Bóc Tách Chi Phí Định Mức (BOM Visualizer)
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                SAP CS03 & CK51N
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Nhấp vào linh kiện trong cây để khoan sâu (drill-down) bóc tách 3 nhóm chi phí cấu thành:
              <span className="text-amber-300 font-semibold ml-1">Raw Material</span>,
              <span className="text-cyan-300 font-semibold ml-1">Labor</span>, và
              <span className="text-violet-300 font-semibold ml-1">Overhead</span>.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Mở rộng toàn bộ cây"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mở hết cây</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            title="Thu gọn cây"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Thu gọn</span>
          </button>
        </div>
      </div>

      {/* 3 Major Cost Pillars Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Raw Material Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'raw_material' ? 'all' : 'raw_material')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === 'raw_material'
              ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">1. Raw Material (TK 621)</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-amber-400">
              {costGroups.raw_material.sharePercent}%
            </span>
          </div>
          <div className="text-lg font-mono font-extrabold text-amber-300">
            {formatVND(costGroups.raw_material.totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>Đơn vị: {formatVND(costGroups.raw_material.unitCost)}/cái</span>
            <span className="text-[10px] text-amber-400/90 font-medium">Hạt nhựa & Masterbatch</span>
          </div>
        </div>

        {/* Labor Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'labor' ? 'all' : 'labor')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === 'labor'
              ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">2. Labor (TK 622)</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-cyan-400">
              {costGroups.labor.sharePercent}%
            </span>
          </div>
          <div className="text-lg font-mono font-extrabold text-cyan-300">
            {formatVND(costGroups.labor.totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>Đơn vị: {formatVND(costGroups.labor.unitCost)}/cái</span>
            <span className="text-[10px] text-cyan-400/90 font-medium">Thợ đứng máy ép</span>
          </div>
        </div>

        {/* Overhead Card */}
        <div
          onClick={() => setActiveCategory(activeCategory === 'overhead' ? 'all' : 'overhead')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeCategory === 'overhead'
              ? 'bg-violet-950/40 border-violet-400 ring-2 ring-violet-500/30'
              : 'bg-slate-950/70 border-slate-800 hover:border-violet-500/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Factory className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-200">3. Overhead (TK 627)</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-violet-400">
              {costGroups.overhead.sharePercent}%
            </span>
          </div>
          <div className="text-lg font-mono font-extrabold text-violet-300">
            {formatVND(costGroups.overhead.totalCost)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
            <span>Đơn vị: {formatVND(costGroups.overhead.unitCost)}/cái</span>
            <span className="text-[10px] text-violet-400/90 font-medium">Máy 350T & Bao bì OEM</span>
          </div>
        </div>
      </div>

      {/* Proportional Cost Bar */}
      <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cơ Cấu Giá Thành Kế Hoạch (Planned Cost Rollup = Material + Labor + Overhead):</span>
          </span>
          <span className="font-mono font-bold text-cyan-300">
            {formatVND(computed.plannedCost)} ({formatVND(computed.unitPlannedCost)}/cái)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${costGroups.raw_material.sharePercent}%` }}
            className="bg-amber-400 h-full transition-all duration-300"
            title={`Raw Material: ${costGroups.raw_material.sharePercent}%`}
          />
          <div
            style={{ width: `${costGroups.labor.sharePercent}%` }}
            className="bg-cyan-400 h-full transition-all duration-300"
            title={`Labor: ${costGroups.labor.sharePercent}%`}
          />
          <div
            style={{ width: `${costGroups.overhead.sharePercent}%` }}
            className="bg-violet-400 h-full transition-all duration-300"
            title={`Overhead: ${costGroups.overhead.sharePercent}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Raw Material: {costGroups.raw_material.sharePercent}%
          </span>
          <span className="flex items-center gap-1 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            Labor: {costGroups.labor.sharePercent}%
          </span>
          <span className="flex items-center gap-1 text-violet-300">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            Overhead: {costGroups.overhead.sharePercent}%
          </span>
        </div>
      </div>

      {/* Main Split Layout: Left Recursive Flexbox Tree (7 cols) + Right Itemized Drill-down Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Recursive Flexbox Tree (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>SƠ ĐỒ CÂY BOM (CSS RECURSIVE FLEXBOX)</span>
            <span className="font-mono text-cyan-400 text-[11px]">
              Đang chọn: #{selectedNode.itemNumber} {selectedNode.materialNumber}
            </span>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl max-h-[500px] overflow-y-auto pr-2">
            {renderFlexTreeNode(rootNode)}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Nhấp chuột vào bất kỳ linh kiện nào để mở bảng bóc tách chi phí bên phải</span>
            </span>
            <span className="font-mono text-slate-300">
              Tổng số linh kiện: <strong className="text-cyan-400">{allNodes.length} mục</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Itemized Cost Breakdown Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>KHOAN SÂU CHI TIẾT (ITEMIZED DRILL-DOWN)</span>
            <span className="font-mono text-[11px] text-slate-400">Cấp bậc {selectedNode.level}</span>
          </div>

          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* Component Summary Card */}
            <div className="pb-3 border-b border-slate-800 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedNode.materialType} · Item #{selectedNode.itemNumber}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {selectedNode.costSharePercent}% tổng giá thành
                </span>
              </div>
              <h4 className="text-base font-bold text-white font-mono tracking-tight">
                {selectedNode.materialNumber}
              </h4>
              <p className="text-xs text-slate-300">{selectedNode.description}</p>
            </div>

            {/* Selected Node Direct Metrics */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400 font-medium">Tổng Chi Phí Kế Hoạch:</span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {formatVND(selectedNode.totalCost)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[11px] text-slate-400 block">Định mức cho 1 SP:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatNumber(selectedNode.quantityPerUnit, 4)} {selectedNode.unitOfMeasure}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Chi phí trên 1 SP:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {formatVND(
                      params.orderQuantity > 0
                        ? Math.round(selectedNode.totalCost / params.orderQuantity)
                        : 0
                    )}
                    /cái
                  </span>
                </div>
              </div>
            </div>

            {/* Drill-down Category Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Khoan Sâu 3 Nhóm Chi Phí Cấu Thành:
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('raw_material')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeCategory === 'raw_material'
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    NVL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('labor')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeCategory === 'labor'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Công
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCategory('overhead')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeCategory === 'overhead'
                        ? 'bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SXC
                  </button>
                </div>
              </div>

              {/* Itemized list of costs feeding into calculations */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {(activeCategory === 'all' || activeCategory === 'raw_material') && (
                  <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Raw Material (TK 621)</span>
                      </span>
                      <span className="font-mono">{formatVND(costGroups.raw_material.totalCost)}</span>
                    </div>
                    {costGroups.raw_material.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] text-slate-300 pl-3 border-l border-amber-500/30"
                      >
                        <div>
                          <span className="text-slate-200 block">{it.name}</span>
                          <span className="text-[10px] text-slate-400">{it.spec}</span>
                        </div>
                        <span className="font-mono text-amber-300">{formatVND(it.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(activeCategory === 'all' || activeCategory === 'labor') && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Direct Labor (TK 622)</span>
                      </span>
                      <span className="font-mono">{formatVND(costGroups.labor.totalCost)}</span>
                    </div>
                    {costGroups.labor.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] text-slate-300 pl-3 border-l border-cyan-500/30"
                      >
                        <div>
                          <span className="text-slate-200 block">{it.name}</span>
                          <span className="text-[10px] text-slate-400">{it.spec}</span>
                        </div>
                        <span className="font-mono text-cyan-300">{formatVND(it.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(activeCategory === 'all' || activeCategory === 'overhead') && (
                  <div className="p-2.5 rounded-lg bg-violet-950/20 border border-violet-500/30 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-violet-300">
                      <span className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5" />
                        <span>Manufacturing Overhead (TK 627)</span>
                      </span>
                      <span className="font-mono">{formatVND(costGroups.overhead.totalCost)}</span>
                    </div>
                    {costGroups.overhead.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] text-slate-300 pl-3 border-l border-violet-500/30"
                      >
                        <div>
                          <span className="text-slate-200 block">{it.name}</span>
                          <span className="text-[10px] text-slate-400">{it.spec}</span>
                        </div>
                        <span className="font-mono text-violet-300">{formatVND(it.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cost Feed-in Formula */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Công Thức Tập Hợp Chi Phí Giá Thành (CK51N):</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Giá thành kế hoạch = <strong className="text-amber-300">NVL (621)</strong> +{' '}
                <strong className="text-cyan-300">Nhân công (622)</strong> +{' '}
                <strong className="text-violet-300">SXC (627)</strong>
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between font-mono">
                <span>Hạch toán Thông tư 200:</span>
                <span className="text-indigo-300 font-bold">{selectedNode.tt200Account}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOMVisualizer;

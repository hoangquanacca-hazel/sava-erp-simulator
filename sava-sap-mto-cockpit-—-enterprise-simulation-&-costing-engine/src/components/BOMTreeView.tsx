import React, { useState, useMemo } from 'react';
import {
  BOMComponentNode,
  MTOParameters,
  MTOComputed,
} from '../types';
import { buildBOMTree, formatVND, formatNumber } from '../utils/calculator';
import {
  FolderTree,
  Package,
  Layers,
  Cpu,
  UserCheck,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Table,
  CheckCircle2,
  ShieldCheck,
  FileCode,
  Tag,
  Boxes,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';

interface BOMTreeViewProps {
  params: MTOParameters;
  computed: MTOComputed;
  onSelectComponent?: (node: BOMComponentNode) => void;
  className?: string;
  defaultExpanded?: boolean;
}

const MATERIAL_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  FERT: {
    label: 'FERT · Thành phẩm',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    icon: Package,
  },
  HALB: {
    label: 'HALB · Bán TP ép thô',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
    icon: Layers,
  },
  ROH: {
    label: 'ROH · Nguyên vật liệu',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    icon: Boxes,
  },
  ACT: {
    label: 'ACT · Giờ máy & công',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/50',
    icon: Cpu,
  },
  VERP: {
    label: 'VERP · Bao bì đóng gói',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    icon: Tag,
  },
};

export const BOMTreeView: React.FC<BOMTreeViewProps> = ({
  params,
  computed,
  onSelectComponent,
  className = '',
  defaultExpanded = true,
}) => {
  const rootNode = useMemo(() => buildBOMTree(params, computed), [params, computed]);

  // Flattened list of all components for quick table view & filtering
  const allNodes = useMemo(() => {
    const list: BOMComponentNode[] = [];
    const traverse = (n: BOMComponentNode) => {
      list.push(n);
      if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(rootNode);
    return list;
  }, [rootNode]);

  // Selected node for inspector panel (defaults to the first main raw material node: resin base)
  const defaultSelected = useMemo(() => {
    const resin = allNodes.find((n) => n.id === 'bom-resin-base');
    return resin || rootNode;
  }, [allNodes, rootNode]);

  const [selectedNode, setSelectedNode] = useState<BOMComponentNode>(defaultSelected);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(['bom-root', 'bom-subassembly'])
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');

  // Toggle expand / collapse node
  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collect = (n: BOMComponentNode) => {
      if (n.children && n.children.length > 0) {
        allIds.add(n.id);
        n.children.forEach(collect);
      }
    };
    collect(rootNode);
    setExpandedNodeIds(allIds);
  };

  const collapseAll = () => {
    setExpandedNodeIds(new Set());
  };

  const handleSelect = (node: BOMComponentNode) => {
    setSelectedNode(node);
    if (onSelectComponent) {
      onSelectComponent(node);
    }
  };

  // Filtered nodes for table view
  const filteredTableNodes = useMemo(() => {
    if (filterType === 'all') return allNodes;
    return allNodes.filter((n) => n.materialType === filterType);
  }, [allNodes, filterType]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: BOMComponentNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNode.id === node.id;
    const typeMeta = MATERIAL_TYPE_CONFIG[node.materialType] || MATERIAL_TYPE_CONFIG.ROH;
    const IconComponent = typeMeta.icon;

    // Filter check for tree view: if a filter is active, highlight matching nodes or dim non-matching
    const matchesFilter = filterType === 'all' || node.materialType === filterType;

    return (
      <div key={node.id} className="relative select-none">
        {/* Node Card Row */}
        <div
          onClick={() => handleSelect(node)}
          className={`group flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
            isSelected
              ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/50 scale-[1.008] z-10'
              : matchesFilter
              ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
              : 'bg-slate-950/40 border-slate-850 opacity-40 hover:opacity-80'
          }`}
          style={{ marginLeft: `${Math.min(depth * 20, 80)}px` }}
        >
          {/* Left: Expand toggle, icons, codes and descriptions */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            {/* Expand / Collapse Chevron Button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                className="w-5 h-5 rounded hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                title={isExpanded ? 'Thu gọn nhánh BOM' : 'Mở rộng nhánh BOM'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <span className="w-5 flex justify-center text-slate-600 shrink-0 text-xs">
                •
              </span>
            )}

            {/* Material Type Badge */}
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 flex items-center gap-1 ${typeMeta.badgeClass}`}
            >
              <IconComponent className="w-3 h-3" />
              <span>{node.materialType}</span>
            </span>

            {/* Item Number (SAP BOM Item 0010, 0020...) */}
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
              #{node.itemNumber}
            </span>

            {/* Component Title & Code */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                  {node.materialNumber}
                </span>
                <span className="text-[11px] text-slate-300 truncate max-w-[200px] sm:max-w-xs">
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
                {node.scrapPercent && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400/90 font-mono">
                      Hao hụt: {node.scrapPercent}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cost rollup & Cost share bar */}
          <div className="text-right shrink-0 min-w-[130px] sm:min-w-[170px]">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xs sm:text-sm font-mono font-extrabold text-cyan-300">
                {formatVND(node.totalCost)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">
                {formatVND(node.unitCost)}/{node.unitOfMeasure}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {node.costSharePercent}%
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  node.materialType === 'FERT'
                    ? 'bg-emerald-400'
                    : node.materialType === 'HALB'
                    ? 'bg-cyan-400'
                    : node.materialType === 'ROH'
                    ? 'bg-amber-400'
                    : node.materialType === 'ACT'
                    ? 'bg-sky-400'
                    : 'bg-purple-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, node.costSharePercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Children nodes */}
        {hasChildren && isExpanded && (
          <div className="space-y-1.5 mt-1.5 pl-3 border-l-2 border-slate-800 ml-3.5">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="bom-tree-viewer-component"
      className={`bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Background visual glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Cấu Trúc Cây Định Mức BOM & Chi Phí Linh Kiện (CK51N Costed BOM)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                SAP CS03 / CK51N
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Nhấp vào từng linh kiện trong cây phân cấp để xem chi phí định mức dự kiến, tỷ trọng và tài khoản hạch toán Thông tư 200.
            </p>
          </div>
        </div>

        {/* View Mode & Controls */}
        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Dạng Cây</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Bảng Kê</span>
            </button>
          </div>

          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                title="Mở rộng toàn bộ nhánh"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Mở hết</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                title="Thu gọn cây BOM"
              >
                <Minimize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Thu gọn</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center flex-wrap gap-1.5 text-xs">
        <span className="text-[11px] text-slate-400 font-semibold mr-1">Lọc linh kiện:</span>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'ROH', label: 'ROH · Hạt nhựa & Phụ gia' },
          { id: 'HALB', label: 'HALB · Bán thành phẩm' },
          { id: 'ACT', label: 'ACT · Giờ máy & Thợ ép' },
          { id: 'VERP', label: 'VERP · Bao bì đóng gói' },
          { id: 'FERT', label: 'FERT · Thành phẩm' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterType(f.id)}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
              filterType === f.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Split Content: Left Tree / Table (7 cols) + Right Selected Component Inspector (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Tree or Table View (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {viewMode === 'tree' ? (
            <div className="space-y-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl max-h-[520px] overflow-y-auto pr-1">
              {renderTreeNode(rootNode)}
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/70 max-h-[520px]">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Mã vật tư / Tên</th>
                    <th className="py-2.5 px-2">Loại</th>
                    <th className="py-2.5 px-2 text-right">Định mức</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá định mức</th>
                    <th className="py-2.5 px-3 text-right">Tổng chi phí</th>
                    <th className="py-2.5 px-2 text-center">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTableNodes.map((n) => {
                    const isSelected = selectedNode.id === n.id;
                    const meta = MATERIAL_TYPE_CONFIG[n.materialType] || MATERIAL_TYPE_CONFIG.ROH;
                    return (
                      <tr
                        key={n.id}
                        onClick={() => handleSelect(n)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/60 font-semibold'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <div className="font-mono font-bold text-slate-200">{n.materialNumber}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {n.description}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${meta.badgeClass}`}
                          >
                            {n.materialType}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-300">
                          {formatNumber(n.quantityPerUnit, 4)} {n.unitOfMeasure}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">
                          {formatVND(n.unitCost)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-cyan-300">
                          {formatVND(n.totalCost)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {n.costSharePercent}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick instructions / Legend */}
          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Nhấp chuột vào bất kỳ dòng nào ở trên để xem chi tiết chi phí bên phải</span>
            </span>
            <span className="font-mono text-slate-300">
              Tổng số linh kiện:{' '}
              <strong className="text-cyan-400">{allNodes.length} mục</strong>
            </span>
          </div>
        </div>

        {/* Right Side: Component Cost Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-4 sm:p-5 space-y-4 shadow-xl relative">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${
                      MATERIAL_TYPE_CONFIG[selectedNode.materialType]?.badgeClass ||
                      'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {selectedNode.materialType} · CẤP BẬC {selectedNode.level}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    BOM Item #{selectedNode.itemNumber}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white font-mono tracking-tight">
                  {selectedNode.materialNumber}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {selectedNode.description}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Tỷ trọng giá thành
                </span>
                <span className="text-xl font-mono font-black text-cyan-300">
                  {selectedNode.costSharePercent}%
                </span>
              </div>
            </div>

            {/* Primary Cost Metric Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-900 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Tổng Chi Phí Định Mức Kế Hoạch (Planned Cost):
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  CK51N Cost Rollup
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                <span className="text-cyan-300">{formatVND(selectedNode.totalCost)}</span>
                <span className="text-xs font-normal text-slate-400">
                  (toàn bộ lô {formatNumber(params.orderQuantity)} cái)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Định mức cho 1 thành phẩm:</span>
                  <strong className="font-mono text-slate-200">
                    {formatNumber(selectedNode.quantityPerUnit, 4)} {selectedNode.unitOfMeasure}/cái
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Chi phí định mức trên 1 cái:</span>
                  <strong className="font-mono text-cyan-400">
                    {formatVND(
                      params.orderQuantity > 0
                        ? Math.round(selectedNode.totalCost / params.orderQuantity)
                        : 0
                    )}
                    /cái
                  </strong>
                </div>
              </div>
            </div>

            {/* In-depth Specifications & Quantities */}
            <div className="space-y-2 text-xs divide-y divide-slate-800/80">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Tổng nhu cầu toàn lô đơn hàng:</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatNumber(selectedNode.totalQuantity, 2)} {selectedNode.unitOfMeasure}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Đơn giá định mức kế hoạch (Standard Price):</span>
                <span className="font-mono font-medium text-slate-200">
                  {formatVND(selectedNode.unitCost)} / {selectedNode.unitOfMeasure}
                </span>
              </div>

              {selectedNode.scrapPercent !== undefined && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Tỷ lệ hao hụt / bavia định mức (Scrap %):</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {selectedNode.scrapPercent}% (Component Scrap)
                  </span>
                </div>
              )}

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Tài khoản kế toán (TT200/2014):</span>
                <span className="font-mono font-bold text-indigo-300">
                  {selectedNode.tt200Account}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Phân hệ SAP & T-Code quản lý:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {selectedNode.sapModule} · {selectedNode.sapTCode}
                </span>
              </div>
            </div>

            {/* Accounting & Technical Notes Callout */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diễn giải kế toán & Quy trình SAP:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {selectedNode.tt200AccountName}
              </p>
              {selectedNode.technicalNotes && (
                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80 leading-relaxed">
                  <strong className="text-slate-300">Kỹ thuật ép nhựa: </strong>
                  {selectedNode.technicalNotes}
                </div>
              )}
            </div>

            {/* Visual Indicator of Cost Contribution */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Đóng góp vào Tổng giá thành:</span>
                <span className="text-cyan-400 font-bold">{selectedNode.costSharePercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, selectedNode.costSharePercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

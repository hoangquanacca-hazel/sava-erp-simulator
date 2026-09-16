import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Play,
  RotateCcw,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { UIMode } from '../types';

export interface SAPClassicMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepId: number;
  onNavigateToStep: (stepId: number, tCode?: string) => void;
  onGoToSimulation?: () => void;
  stepStates?: Record<number, { isExecuted: boolean }>;
  uiMode: UIMode;
}

interface TreeNode {
  id: string;
  label: string;
  tCode?: string;
  stepId?: number;
  subLabel?: string;
  icon?: 'folder' | 'transaction' | 'favorite';
  children?: TreeNode[];
  defaultExpanded?: boolean;
}

// Hierarchical SAP Menu Structure mimicking standard SAP R/3 / ECC Easy Access tree
const SAP_EASY_ACCESS_TREE: TreeNode[] = [
  {
    id: 'favorites',
    label: 'Favorites (Các bước MTO cốt lõi)',
    icon: 'folder',
    defaultExpanded: true,
    children: [
      {
        id: 'fav-step-1',
        label: 'VA01 — Tạo đơn hàng bán MTO & CK51N',
        tCode: 'VA01',
        stepId: 1,
        subLabel: 'Bước 1: Mở Sales Order & Tính giá thành kế hoạch',
        icon: 'favorite',
      },
      {
        id: 'fav-step-2',
        label: 'MD02 — Hoạch định nhu cầu vật tư MRP',
        tCode: 'MD02',
        stepId: 2,
        subLabel: 'Bước 2: Chạy MRP hạt nhựa Special Stock E',
        icon: 'favorite',
      },
      {
        id: 'fav-step-3',
        label: 'CO01 / MIGO — Sản xuất ép nhựa & Nhập kho',
        tCode: 'CO01',
        stepId: 3,
        subLabel: 'Bước 3: MIGO 261E, CO11N, MIGO 101E',
        icon: 'favorite',
      },
      {
        id: 'fav-step-4',
        label: 'QA11 — Kiểm định KCS & Quyết định sử dụng',
        tCode: 'QA11',
        stepId: 4,
        subLabel: 'Bước 4: Usage Decision (Pass / Fail / Rework)',
        icon: 'favorite',
      },
      {
        id: 'fav-step-5',
        label: 'VL01N / 601E — Xuất kho giao hàng OEM',
        tCode: 'VL01N',
        stepId: 5,
        subLabel: 'Bước 5: Outbound Delivery & Post Goods Issue (PGI)',
        icon: 'favorite',
      },
      {
        id: 'fav-step-6',
        label: 'VF01 — Phát hành hóa đơn thương mại',
        tCode: 'VF01',
        stepId: 6,
        subLabel: 'Bước 6: Lập hóa đơn & ghi nhận Doanh thu',
        icon: 'favorite',
      },
      {
        id: 'fav-step-7',
        label: 'VA88 / KKA2 — Quyết toán đơn hàng & Khóa sổ',
        tCode: 'VA88',
        stepId: 7,
        subLabel: 'Bước 7: Settlement sang CO-PA & Xác định KQKD (TK 911)',
        icon: 'favorite',
      },
    ],
  },
  {
    id: 'sap-menu',
    label: 'SAP menu',
    icon: 'folder',
    defaultExpanded: true,
    children: [
      {
        id: 'logistics',
        label: 'Logistics',
        icon: 'folder',
        defaultExpanded: true,
        children: [
          {
            id: 'sd',
            label: 'Sales and Distribution',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'sd-sales',
                label: 'Sales',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'sd-sales-order',
                    label: 'Order',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'va01',
                        label: 'VA01 — Create',
                        tCode: 'VA01',
                        stepId: 1,
                        subLabel: 'Bước 1: Tạo Sales Order Make-to-Order',
                        icon: 'transaction',
                      },
                      {
                        id: 'va02',
                        label: 'VA02 — Change',
                        tCode: 'VA02',
                        stepId: 1,
                        subLabel: 'Chỉnh sửa đơn hàng bán',
                        icon: 'transaction',
                      },
                      {
                        id: 'va03',
                        label: 'VA03 — Display',
                        tCode: 'VA03',
                        stepId: 1,
                        subLabel: 'Xem chi tiết đơn hàng bán',
                        icon: 'transaction',
                      },
                    ],
                  },
                ],
              },
              {
                id: 'sd-shipping',
                label: 'Shipping and Transportation',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'sd-outbound-deliv',
                    label: 'Outbound Delivery',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'sd-deliv-create',
                        label: 'Create',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'vl01n',
                            label: 'VL01N — Single Document with Order Reference',
                            tCode: 'VL01N',
                            stepId: 5,
                            subLabel: 'Bước 5: Lập phiếu giao hàng Outbound Delivery',
                            icon: 'transaction',
                          },
                        ],
                      },
                      {
                        id: 'sd-pgi',
                        label: 'Post Goods Issue',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'vl02n-pgi',
                            label: 'VL02N / 601E — Post Goods Issue (PGI)',
                            tCode: 'MIGO 601E',
                            stepId: 5,
                            subLabel: 'Bước 5: Xuất kho giao hàng chuyển giao quyền sở hữu',
                            icon: 'transaction',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'sd-billing',
                label: 'Billing',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'sd-billing-doc',
                    label: 'Billing Document',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'vf01',
                        label: 'VF01 — Create',
                        tCode: 'VF01',
                        stepId: 6,
                        subLabel: 'Bước 6: Lập Hóa đơn thương mại gửi khách OEM',
                        icon: 'transaction',
                      },
                      {
                        id: 'vf03',
                        label: 'VF03 — Display',
                        tCode: 'VF03',
                        stepId: 6,
                        subLabel: 'Hiển thị Hóa đơn bán hàng',
                        icon: 'transaction',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'mm',
            label: 'Materials Management',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'mm-mrp',
                label: 'Material Requirements Planning (MRP)',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'mm-mrp-planning',
                    label: 'Planning',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'md02',
                        label: 'MD02 — Single-Item, Multi-Level',
                        tCode: 'MD02',
                        stepId: 2,
                        subLabel: 'Bước 2: Hoạch định nhu cầu hạt nhựa đơn hàng riêng',
                        icon: 'transaction',
                      },
                      {
                        id: 'md04',
                        label: 'MD04 — Display Stock/Requirements Situation',
                        tCode: 'MD04',
                        stepId: 2,
                        subLabel: 'Xem bảng cung cầu vật tư MRP',
                        icon: 'transaction',
                      },
                    ],
                  },
                ],
              },
              {
                id: 'mm-im',
                label: 'Inventory Management',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'mm-goods-mov',
                    label: 'Goods Movement',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'migo-gi-261e',
                        label: 'MIGO (261E) — Goods Issue for Order',
                        tCode: 'MIGO 261E',
                        stepId: 3,
                        subLabel: 'Bước 3: Xuất kho hạt nhựa cho Lệnh SX (Nợ 621 / Có 152)',
                        icon: 'transaction',
                      },
                      {
                        id: 'migo-gr-101e',
                        label: 'MIGO (101E) — Goods Receipt for Order',
                        tCode: 'MIGO 101E',
                        stepId: 3,
                        subLabel: 'Bước 3: Nhập kho thành phẩm ép nhựa vào kho E',
                        icon: 'transaction',
                      },
                      {
                        id: 'migo-pgi-601e',
                        label: 'MIGO (601E) — Goods Issue for Delivery (PGI)',
                        tCode: 'MIGO 601E',
                        stepId: 5,
                        subLabel: 'Bước 5: Xuất kho giao hàng OEM (Nợ 632 / Có 155)',
                        icon: 'transaction',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'pp',
            label: 'Production',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'pp-sfc',
                label: 'Shop Floor Control',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'pp-order',
                    label: 'Order',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'pp-order-create',
                        label: 'Create',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'co01',
                            label: 'CO01 — With Material (Lệnh SX PP04)',
                            tCode: 'CO01',
                            stepId: 3,
                            subLabel: 'Bước 3: Mở Lệnh sản xuất ép nhựa chính xác',
                            icon: 'transaction',
                          },
                          {
                            id: 'co07',
                            label: 'CO07 — Without Material (Rework)',
                            tCode: 'CO07',
                            stepId: 4,
                            subLabel: 'Bước 4: Mở Lệnh gia công sửa lại chi tiết lỗi KCS',
                            icon: 'transaction',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'pp-confirm',
                    label: 'Confirmation',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'pp-confirm-enter',
                        label: 'Enter',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'co11n',
                            label: 'CO11N — For Operation',
                            tCode: 'CO11N',
                            stepId: 3,
                            subLabel: 'Bước 3: Xác nhận sản lượng, giờ công & giờ máy ép',
                            icon: 'transaction',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'qm',
            label: 'Quality Management',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'qm-qi',
                label: 'Quality Inspection',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'qm-lot',
                    label: 'Inspection Lot',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'qm-ud',
                        label: 'Usage Decision',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'qa11',
                            label: 'QA11 — Record Usage Decision (UD)',
                            tCode: 'QA11',
                            stepId: 4,
                            subLabel: 'Bước 4: Kiểm định KCS & Quyết định sử dụng (Pass / Reject)',
                            icon: 'transaction',
                          },
                          {
                            id: 'qa32',
                            label: 'QA32 — Inspection Lot List',
                            tCode: 'QA32',
                            stepId: 4,
                            subLabel: 'Danh sách lô kiểm tra chất lượng',
                            icon: 'transaction',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'accounting',
        label: 'Accounting',
        icon: 'folder',
        defaultExpanded: true,
        children: [
          {
            id: 'fi',
            label: 'Financial Accounting',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'fi-gl',
                label: 'General Ledger',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'fi-gl-acc',
                    label: 'Account',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'fs10n',
                        label: 'FS10N — Balance Display',
                        tCode: 'FS10N',
                        stepId: 7,
                        subLabel: 'Bước 7: Xem số dư và đối chiếu phát sinh Sổ Cái',
                        icon: 'transaction',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'co',
            label: 'Controlling',
            icon: 'folder',
            defaultExpanded: true,
            children: [
              {
                id: 'co-pc',
                label: 'Product Cost Controlling',
                icon: 'folder',
                defaultExpanded: true,
                children: [
                  {
                    id: 'co-pc-coc',
                    label: 'Cost Object Controlling',
                    icon: 'folder',
                    defaultExpanded: true,
                    children: [
                      {
                        id: 'co-pc-mto',
                        label: 'Product Cost by Sales Order',
                        icon: 'folder',
                        defaultExpanded: true,
                        children: [
                          {
                            id: 'co-pc-costing',
                            label: 'Costing',
                            icon: 'folder',
                            defaultExpanded: true,
                            children: [
                              {
                                id: 'ck51n',
                                label: 'CK51N — Sales Order Cost Estimate',
                                tCode: 'CK51N',
                                stepId: 1,
                                subLabel: 'Bước 1: Tính toán giá thành kế hoạch đơn hàng',
                                icon: 'transaction',
                              },
                            ],
                          },
                          {
                            id: 'co-pc-period-end',
                            label: 'Period-End Closing',
                            icon: 'folder',
                            defaultExpanded: true,
                            children: [
                              {
                                id: 'co-pc-single-func',
                                label: 'Single Functions',
                                icon: 'folder',
                                defaultExpanded: true,
                                children: [
                                  {
                                    id: 'kka2',
                                    label: 'KKA2 — Results Analysis',
                                    tCode: 'KKA2',
                                    stepId: 7,
                                    subLabel: 'Bước 7: Phân tích kết quả chi phí dở dang WIP & Doanh thu',
                                    icon: 'transaction',
                                  },
                                  {
                                    id: 'va88',
                                    label: 'VA88 — Settlement',
                                    tCode: 'VA88',
                                    stepId: 7,
                                    subLabel: 'Bước 7: Quyết toán Sales Order sang CO-PA & Sổ Cái',
                                    icon: 'transaction',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const SAPClassicMenu: React.FC<SAPClassicMenuProps> = ({
  isOpen,
  onClose,
  currentStepId,
  onNavigateToStep,
  onGoToSimulation,
  stepStates = {},
  uiMode,
}) => {
  // CRITICAL REQUIREMENT: Strictly ensure it only appears when UI Mode is set to 'classic'
  if (uiMode !== 'classic') {
    return null;
  }

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {
      favorites: true,
      'sap-menu': true,
      logistics: true,
      sd: true,
      'sd-sales': true,
      'sd-sales-order': true,
      'sd-shipping': true,
      'sd-outbound-deliv': true,
      'sd-deliv-create': true,
      'sd-pgi': true,
      'sd-billing': true,
      'sd-billing-doc': true,
      mm: true,
      'mm-mrp': true,
      'mm-mrp-planning': true,
      'mm-im': true,
      'mm-goods-mov': true,
      pp: true,
      'pp-sfc': true,
      'pp-order': true,
      'pp-order-create': true,
      'pp-confirm': true,
      'pp-confirm-enter': true,
      qm: true,
      'qm-qi': true,
      'qm-lot': true,
      'qm-ud': true,
      accounting: true,
      fi: true,
      'fi-gl': true,
      'fi-gl-acc': true,
      co: true,
      'co-pc': true,
      'co-pc-coc': true,
      'co-pc-mto': true,
      'co-pc-costing': true,
      'co-pc-period-end': true,
      'co-pc-single-func': true,
    };
    return init;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Expand all nodes
  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        allExpanded[node.id] = true;
        if (node.children) traverse(node.children);
      });
    };
    traverse(SAP_EASY_ACCESS_TREE);
    setExpandedNodes(allExpanded);
  };

  // Collapse all nodes except roots
  const handleCollapseAll = () => {
    setExpandedNodes({
      favorites: false,
      'sap-menu': false,
    });
  };

  // Reset to default tree state
  const handleResetTree = () => {
    setSearchTerm('');
    handleExpandAll();
  };

  // Handle clicking on an executable step node
  const handleItemClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    if (node.stepId) {
      if (onGoToSimulation) {
        onGoToSimulation();
      }
      onNavigateToStep(node.stepId, node.tCode);
    }
  };

  // Filter tree recursively if search is active
  const filteredTree = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return SAP_EASY_ACCESS_TREE;

    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = [];
      for (const node of nodes) {
        const matchLabel = node.label.toLowerCase().includes(term);
        const matchTCode = node.tCode ? node.tCode.toLowerCase().includes(term) : false;
        const matchSub = node.subLabel ? node.subLabel.toLowerCase().includes(term) : false;
        const matchSelf = matchLabel || matchTCode || matchSub;

        let matchingChildren: TreeNode[] | undefined = undefined;
        if (node.children) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            matchingChildren = filteredChildren;
          }
        }

        if (matchSelf || matchingChildren) {
          result.push({
            ...node,
            children: matchingChildren || (matchSelf ? node.children : undefined),
          });
        }
      }
      return result;
    };

    return filterNodes(SAP_EASY_ACCESS_TREE);
  }, [searchTerm]);

  if (!isOpen) {
    return null;
  }

  // Recursive tree node renderer with authentic SAP GUI dotted treeview styling
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? false;
    const isClickable = !!node.stepId;
    const isCurrent = node.stepId === currentStepId;
    const isExecuted = node.stepId ? stepStates[node.stepId]?.isExecuted : false;
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className="relative select-none text-[12px] font-sans">
        <div
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else if (isClickable) {
              handleItemClick(node);
            }
          }}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors border ${
            isCurrent
              ? 'bg-[#316ac5] text-white font-semibold border-[#204a87] shadow-sm'
              : isSelected
              ? 'bg-[#c5d8f7] text-[#0a246a] border-[#7f9db9]'
              : 'hover:bg-[#d8e4f8] text-[#111111] border-transparent'
          }`}
          style={{ paddingLeft: `${depth * 18 + 6}px` }}
          title={node.subLabel || node.label}
        >
          {/* Classic Win32 / SAP [+] / [-] Expand Icon */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="w-4 h-4 flex items-center justify-center border border-[#808080] bg-white text-black text-[10px] leading-none font-mono hover:bg-[#e0e0e0] shrink-0"
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="w-4 h-4 inline-block shrink-0 text-center text-[#666666] text-[10px]">
              {depth > 0 ? '•' : ''}
            </span>
          )}

          {/* Authentic SAP Folder / Document Icons */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-[#d49b00] shrink-0 fill-[#ffe082]" />
            ) : (
              <Folder className="w-4 h-4 text-[#d49b00] shrink-0 fill-[#ffe082]" />
            )
          ) : (
            <div className="flex items-center shrink-0">
              <FileText className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-[#316ac5]'}`} />
            </div>
          )}

          {/* Node Label */}
          <span className="truncate flex-1 tracking-tight">{node.label}</span>

          {/* Quick Badges for Step & Execution Status */}
          {node.stepId && (
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {isExecuted && (
                <span
                  title="Đã thực hiện bút toán thành công"
                  className={`text-[10px] px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5 ${
                    isCurrent
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Xong</span>
                </span>
              )}
              <span
                className={`text-[10px] font-mono px-1 py-0.2 rounded font-bold border ${
                  isCurrent
                    ? 'bg-white text-[#316ac5] border-white'
                    : 'bg-[#e0e8f5] text-[#1e395b] border-[#a0b8df]'
                }`}
              >
                B{node.stepId}
              </span>
            </div>
          )}
        </div>

        {/* Child nodes */}
        {hasChildren && isExpanded && (
          <div className="border-l border-dotted border-[#808080]/40 ml-4">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto bg-black/40 backdrop-blur-[1px] animate-fadeIn">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* SAP Classic GUI Window / Drawer Frame */}
      <aside
        className="relative z-10 w-full max-w-[460px] h-full bg-[#ece9d8] border-r-2 border-[#808080] shadow-2xl flex flex-col font-sans text-black"
        style={{
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* 1. Classic SAP Window Title Bar */}
        <div className="bg-[#0a246a] text-white px-3 py-1.5 flex items-center justify-between select-none shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ece9d8] text-[#0a246a] font-bold text-[10px] flex items-center justify-center rounded-xs border border-white">
              SAP
            </div>
            <span className="font-bold text-xs tracking-wide">
              SAP Easy Access — SAVA MTO Manufacturing Tree
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-5 h-5 bg-[#ece9d8] hover:bg-[#d4d0c8] text-black font-bold text-xs flex items-center justify-center rounded border border-[#ffffff] border-r-[#808080] border-b-[#808080] active:border-[#808080] cursor-pointer"
              title="Đóng menu SAP Easy Access"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Classic SAP GUI Sub-Header Menu Strip */}
        <div className="bg-[#ece9d8] border-b border-[#808080] px-3 py-1 flex items-center justify-between text-xs border-t border-t-white">
          <div className="flex items-center gap-3 text-[#111111]">
            <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded cursor-pointer">
              <u>T</u>ree
            </span>
            <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded cursor-pointer">
              <u>V</u>iew
            </span>
            <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded cursor-pointer">
              Fa<u>v</u>orites
            </span>
            <span className="hover:bg-[#316ac5] hover:text-white px-1.5 py-0.5 rounded cursor-pointer">
              <u>H</u>elp
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#555555]">
            PRD(1)/010
          </div>
        </div>

        {/* 3. Toolbar: Search Filter & Tree Expand/Collapse Controls */}
        <div className="bg-[#f0ece0] border-b border-[#a0a0a0] p-2 flex flex-col gap-2 shadow-inner">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-[#666666]" />
              <input
                type="text"
                placeholder="Tìm T-Code (VA01, MD02...), nghiệp vụ hoặc Bước..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#7f9db9] rounded px-7 py-1 text-xs text-black focus:outline-none focus:border-[#316ac5] font-sans"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 text-[#666666] hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleExpandAll}
                title="Mở rộng toàn bộ cây thư mục"
                className="px-2 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-[#808080] text-xs font-bold rounded text-black cursor-pointer"
              >
                [+] Mở hết
              </button>
              <button
                onClick={handleCollapseAll}
                title="Thu gọn toàn bộ cây"
                className="px-2 py-1 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-[#808080] text-xs font-bold rounded text-black cursor-pointer"
              >
                [−] Thu gọn
              </button>
              <button
                onClick={handleResetTree}
                title="Đặt lại cấu trúc mặc định"
                className="p-1 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-[#808080] rounded text-black cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick instructions strip */}
          <div className="text-[11px] text-[#444444] flex items-center justify-between px-1">
            <span>💡 Nhấp vào T-Code hoặc Bước để chuyển hướng ngay lập tức</span>
            <span className="font-bold text-[#0a246a]">
              Bước hiện tại: B{currentStepId}
            </span>
          </div>
        </div>

        {/* 4. Tree View Container */}
        <div className="flex-1 overflow-y-auto p-2.5 bg-white border-y border-[#7f9db9] m-2 rounded shadow-inner select-none font-sans">
          {filteredTree.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#777777] italic">
              Không tìm thấy T-Code hoặc mục menu phù hợp với từ khóa &quot;{searchTerm}&quot;.
            </div>
          ) : (
            filteredTree.map((node) => renderTreeNode(node, 0))
          )}
        </div>

        {/* 5. Classic SAP Status Bar at Bottom */}
        <div className="bg-[#ece9d8] border-t border-[#808080] px-3 py-1 text-[11px] font-mono flex items-center justify-between text-[#333333]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>PRD (010)</span>
            <span className="text-[#888888]">|</span>
            <span>SAVA-PRD</span>
            <span className="text-[#888888]">|</span>
            <span>SAPLSMTR_NAVIGATION</span>
          </div>
          <div className="text-[10px] text-[#555555]">
            MTO 7-Steps Navigation Engine
          </div>
        </div>
      </aside>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  X,
  Download,
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  PlusCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  Sliders,
} from 'lucide-react';
import { AdminSettings, RegisteredUser, UIMode } from '../types';

export interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminSettings: AdminSettings;
  onUpdateAdminSettings: (settings: AdminSettings) => void;
  uiMode?: UIMode;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminSettings,
  onUpdateAdminSettings,
  uiMode = 'fiori',
}) => {
  const isClassic = uiMode === 'classic';
  const [leads, setLeads] = useState<RegisteredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');

  // Load captured leads from localStorage
  const refreshLeads = () => {
    try {
      const raw = localStorage.getItem('sava_captured_leads');
      if (raw) {
        setLeads(JSON.parse(raw));
      } else {
        setLeads([]);
      }
    } catch {
      setLeads([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLeads();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Add sample lead for instant demonstration / testing
  const handleAddSampleLead = () => {
    const sampleLeads: RegisteredUser[] = [
      {
        fullName: 'Trần Thị Mai',
        email: 'mai.tran@oemparts.com.vn',
        phone: '0903 889 123',
        role: 'Kế toán trưởng',
        company: 'Công ty Cổ phần Công nghiệp Nhựa Tân Á',
        receiveMaterials: true,
        consentPolicy: true,
        registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        fullName: 'Lê Hoàng Nam',
        email: 'nam.le@fpt.com',
        phone: '0918 554 321',
        role: 'Tư vấn viên ERP',
        company: 'FPT Information System (FIS ERP)',
        receiveMaterials: true,
        consentPolicy: true,
        registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        fullName: 'Đặng Minh Quân',
        email: 'quan.dang@ueh.edu.vn',
        phone: '0987 654 321',
        role: 'Sinh viên',
        company: 'Đại học Kinh tế TP.HCM (UEH)',
        receiveMaterials: true,
        consentPolicy: true,
        registeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];

    const updated = [...sampleLeads, ...leads];
    setLeads(updated);
    try {
      localStorage.setItem('sava_captured_leads', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Clear all leads
  const handleClearLeads = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách Lead đã thu thập không?')) {
      setLeads([]);
      try {
        localStorage.removeItem('sava_captured_leads');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Export to CSV formatted for CRM (HubSpot / Salesforce / Excel with UTF-8 BOM)
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('Chưa có dữ liệu Lead để xuất CSV.');
      return;
    }

    const headers = [
      'STT',
      'Thời gian đăng ký',
      'Họ và tên',
      'Số điện thoại / Zalo',
      'Email',
      'Chức danh',
      'Đơn vị / Doanh nghiệp',
      'Nhận tài liệu TT99',
      'Tuân thủ NĐ13',
    ];

    const rows = leads.map((l, idx) => [
      idx + 1,
      `"${new Date(l.registeredAt).toLocaleString('vi-VN')}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.role}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      l.receiveMaterials ? 'Có' : 'Không',
      l.consentPolicy ? 'Đã đồng ý' : 'Chưa',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nowStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Savafinlab_CRM_Leads_${nowStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter leads by search
  const filteredLeads = leads.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.fullName.toLowerCase().includes(term) ||
      l.email.toLowerCase().includes(term) ||
      l.phone.includes(term) ||
      l.company.toLowerCase().includes(term) ||
      l.role.toLowerCase().includes(term)
    );
  });

  const optInCount = leads.filter((l) => l.receiveMaterials).length;
  const optInRate = leads.length > 0 ? Math.round((optInCount / leads.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col ${
          isClassic
            ? 'bg-[#ece9d8] border-[#808080] text-black font-sans'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Top Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isClassic
              ? 'bg-[#0a246a] text-white border-[#808080]'
              : 'bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                  CONFIDENTIAL · SAVA ADMIN CENTER
                </span>
                <span className="text-xs text-amber-400 font-semibold">
                  (Dành riêng cho Mr. Hoàng Quân)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Trung Tâm Quản Trị Khách Hàng Tiềm Năng & Điều Phối Phiên Dùng Thử
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Action Bar */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            isClassic ? 'bg-[#f5f5f5] border-[#d0d0d0]' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách Lead Thu Thập ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Cấu Hình Phiên & Webinar Live</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Xuất danh sách Lead ra file CSV chuẩn CRM"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV CRM ({leads.length})</span>
            </button>
            {leads.length === 0 && (
              <button
                onClick={handleAddSampleLead}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-cyan-800/60 cursor-pointer"
                title="Tạo 3 Lead mẫu để kiểm thử"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nạp Lead Mẫu</span>
              </button>
            )}
            {leads.length > 0 && (
              <button
                onClick={handleClearLeads}
                className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer border border-rose-900/60"
                title="Xóa danh sách Lead test"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'leads' ? (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-400 block font-medium">Tổng số Lead đăng ký</span>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{leads.length}</div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Thu thập từ Demo MTO</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-400 block font-medium">Muốn nhận Tài liệu TT99</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {optInCount} <span className="text-xs font-normal text-slate-400">({optInRate}%)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Sẵn sàng gửi cẩm nang</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-400 block font-medium">Chế độ Giảng dạy Live</span>
                  <div className="text-sm font-bold text-amber-400 mt-2 flex items-center gap-1.5">
                    {adminSettings.bypassSessionLimits ? (
                      <span className="text-emerald-400">Đang Bật (Bypass On)</span>
                    ) : (
                      <span className="text-slate-400">Đang Tắt (Bật Gatekeeper)</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Không bị chặn khi Demo</span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <span className="text-xs text-slate-400 block font-medium">Session trống hiện tại</span>
                  <div className="text-2xl font-black text-cyan-300 mt-1">
                    {adminSettings.simulatedAvailableSessions}/5
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Tối đa 5 demo user</span>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm Lead theo tên, email, số điện thoại, công ty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                  }`}
                />
              </div>

              {/* Leads Table */}
              <div
                className={`rounded-xl border overflow-hidden shadow-inner ${
                  isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                {filteredLeads.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <p>Chưa có Lead nào được ghi nhận qua form đăng ký.</p>
                    <button
                      onClick={handleAddSampleLead}
                      className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      + Nạp dữ liệu Lead mẫu để trải nghiệm thử
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr
                          className={`border-b ${
                            isClassic
                              ? 'bg-[#ece9d8] text-[#0a246a]'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          <th className="p-3 font-bold">Thời gian</th>
                          <th className="p-3 font-bold">Họ và tên</th>
                          <th className="p-3 font-bold">Số điện thoại / Zalo</th>
                          <th className="p-3 font-bold">Email</th>
                          <th className="p-3 font-bold">Chức danh</th>
                          <th className="p-3 font-bold">Đơn vị / Doanh nghiệp</th>
                          <th className="p-3 font-bold text-center">Tài liệu TT99</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredLeads.map((lead, i) => (
                          <tr
                            key={i}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isClassic ? 'hover:bg-[#d8e4f8]' : ''
                            }`}
                          >
                            <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {new Date(lead.registeredAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="p-3 font-bold text-white whitespace-nowrap">
                              {lead.fullName}
                            </td>
                            <td className="p-3 font-mono font-semibold text-cyan-400 whitespace-nowrap">
                              <a href={`tel:${lead.phone}`} className="hover:underline">
                                {lead.phone}
                              </a>
                            </td>
                            <td className="p-3 text-slate-300 whitespace-nowrap">
                              <a href={`mailto:${lead.email}`} className="hover:underline">
                                {lead.email}
                              </a>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                                {lead.role}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300">{lead.company}</td>
                            <td className="p-3 text-center">
                              {lead.receiveMaterials ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Có
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Settings Tab */
            <div className="max-w-2xl space-y-6">
              <div
                className={`p-5 rounded-xl border space-y-4 ${
                  isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Chế độ Giảng dạy Live & Bỏ qua Giới hạn (Webinar Mode)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Khi bật tính năng này, học viên hoặc người xem trong buổi đào tạo sẽ không bị chặn bởi form đăng ký Lead ở Bước 3 hay giới hạn 3 lần chạy simulation. Giúp Mr. Quân thuyết trình và thao tác liên tục mà không bị gián đoạn.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateAdminSettings({
                        ...adminSettings,
                        bypassSessionLimits: !adminSettings.bypassSessionLimits,
                      })
                    }
                    className="p-1 rounded cursor-pointer"
                  >
                    {adminSettings.bypassSessionLimits ? (
                      <ToggleRight className="w-10 h-10 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border space-y-4 ${
                  isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <h3 className="text-sm font-bold text-white">
                  Điều chỉnh Số lượng Session còn trống hiển thị trên Header
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tạo cảm giác khan hiếm và bảo vệ tài nguyên máy chủ ảo SAP (Mặc định: 2/5).
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() =>
                        onUpdateAdminSettings({
                          ...adminSettings,
                          simulatedAvailableSessions: val,
                        })
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        adminSettings.simulatedAvailableSessions === val
                          ? 'bg-cyan-600 text-white border-cyan-400 shadow-md ring-2 ring-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {val} / 5
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border text-xs text-slate-400 flex items-center justify-between ${
                  isClassic ? 'bg-white border-[#7f9db9]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span>Website chính thức: savafinlab.com.vn</span>
                <a
                  href="https://savafinlab.com.vn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Mở trang web <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
            isClassic ? 'bg-[#ece9d8] border-[#808080]' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <span>Savafinlab Admin Protocol · Phiên bản 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Đóng bảng điều khiển
          </button>
        </div>
      </div>
    </div>
  );
};

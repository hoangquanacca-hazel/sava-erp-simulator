import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Sparkles,
  FileSpreadsheet,
  Cpu,
  CheckCircle,
  ExternalLink,
  Lock,
  BookOpen,
  ArrowRight,
  Send,
} from 'lucide-react';
import { RegisteredUser, UIMode } from '../types';

export interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: RegisteredUser) => void;
  triggerReason?: 'step3' | 'excel' | 'ai_tutor' | 'general';
  uiMode?: UIMode;
}

const REASON_MESSAGES = {
  step3: {
    badge: 'Mở khóa Bước 3: Sản xuất ép nhựa nội bộ (In-house Production)',
    title: 'Đăng ký Miễn phí để tiếp tục Trải nghiệm Chu trình Sản xuất',
    desc: 'Để mô phỏng hạch toán lệnh sản xuất CO01, xuất kho hạt nhựa 261E và nhập kho thành phẩm 101E theo Thông tư 99 & 200, vui lòng hoàn tất thông tin đăng ký bên dưới.',
    icon: Cpu,
  },
  excel: {
    badge: 'Mở khóa Tính năng: Xuất trọn bộ Báo cáo ERP ra Excel',
    title: 'Đăng ký Nhận Báo Cáo Kế Toán Toàn Diện & File Excel Thực Chiến',
    desc: 'Gói báo cáo Excel 3 sheet gồm: Sổ Nhật ký chung, Bảng cân đối tài khoản (TB), và Báo cáo KQKD (P&L) đa chiều chuẩn SAP.',
    icon: FileSpreadsheet,
  },
  ai_tutor: {
    badge: 'Mở khóa Trợ giảng AI Savafinlab (AI Tutor)',
    title: 'Đăng ký để Hỏi đáp Chuyên sâu cùng Trợ Giảng AI',
    desc: 'Hỏi đáp trực tiếp mọi vướng mắc về hạch toán giá thành Make-to-Order, Special Stock E và đối chiếu tài khoản kế toán.',
    icon: Sparkles,
  },
  general: {
    badge: 'Đăng ký Học viên & Trải nghiệm Trọn vẹn Sava Cockpit',
    title: 'Đăng ký Trải nghiệm Thực chiến SAP FICO & Nhận Tài liệu',
    desc: 'Mở khóa toàn bộ tính năng mô phỏng tài chính, hạch toán chuyên sâu và tải tài liệu độc quyền từ Savafinlab.',
    icon: ShieldCheck,
  },
};

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  triggerReason = 'step3',
  uiMode = 'fiori',
}) => {
  const isClassic = uiMode === 'classic';
  const reasonInfo = REASON_MESSAGES[triggerReason] || REASON_MESSAGES.general;
  const ReasonIcon = reasonInfo.icon;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Kế toán viên');
  const [company, setCompany] = useState('');
  const [receiveMaterials, setReceiveMaterials] = useState(true);
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Vui lòng nhập số điện thoại / Zalo hợp lệ (ít nhất 8 chữ số).');
      return;
    }
    if (!company.trim()) {
      setErrorMsg('Vui lòng nhập tên Đơn vị / Công ty / Trường học.');
      return;
    }
    if (!consentPolicy) {
      setErrorMsg('Vui lòng đồng ý với điều khoản bảo mật dữ liệu theo Nghị định 13/2023/NĐ-CP để tiếp tục.');
      return;
    }

    const newUser: RegisteredUser = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      company: company.trim(),
      receiveMaterials,
      consentPolicy,
      registeredAt: new Date().toISOString(),
    };

    // 1. Store in active session user
    try {
      localStorage.setItem('sava_registered_user', JSON.stringify(newUser));

      // 2. Append to all captured leads list for Admin Dashboard
      const existingLeadsRaw = localStorage.getItem('sava_captured_leads');
      let leadsList: RegisteredUser[] = [];
      if (existingLeadsRaw) {
        try {
          leadsList = JSON.parse(existingLeadsRaw);
        } catch {
          leadsList = [];
        }
      }
      leadsList.unshift(newUser);
      localStorage.setItem('sava_captured_leads', JSON.stringify(leadsList));
    } catch (err) {
      console.warn('Could not write lead to localStorage:', err);
    }

    onSuccess(newUser);
  };

  const isFormValid =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    email.includes('@') &&
    phone.trim().length >= 8 &&
    company.trim() !== '' &&
    consentPolicy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border transition-all ${
          isClassic
            ? 'bg-[#ece9d8] border-[#808080] text-black font-sans'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
        style={{
          boxShadow: isClassic
            ? '4px 4px 16px rgba(0,0,0,0.5)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)',
        }}
      >
        {/* Top Header Strip */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isClassic
              ? 'bg-[#0a246a] text-white border-[#808080]'
              : 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg border ${
                isClassic
                  ? 'bg-white text-[#0a246a] border-white'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}
            >
              <ReasonIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isClassic
                      ? 'bg-white text-[#0a246a] border-white'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  }`}
                >
                  {reasonInfo.badge}
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight mt-0.5">
                {reasonInfo.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isClassic
                ? 'hover:bg-[#316ac5] text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isClassic ? 'text-[#333333]' : 'text-slate-300'
            }`}
          >
            {reasonInfo.desc}
          </p>

          {/* Quick Perks Strip */}
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs ${
              isClassic
                ? 'bg-[#ffffff] border-[#7f9db9] text-[#1e395b]'
                : 'bg-slate-950/70 border-cyan-900/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Trải nghiệm trọn vẹn 7 Bước SAP MTO</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Nhận file Excel định dạng chuẩn ERP</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Bộ cẩm nang Kế toán TT99/2025</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs font-medium animate-fadeIn">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Họ và tên */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMsg(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold">
                  Email công tác / cá nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nguyenvana@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />
              </div>

              {/* Số điện thoại / Zalo */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold">
                  Số điện thoại / Zalo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrorMsg(null);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                  }`}
                />
              </div>

              {/* Chức danh hiện tại */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold">
                  Chức danh hiện tại <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs border transition-all cursor-pointer ${
                    isClassic
                      ? 'bg-white border-[#7f9db9] text-black'
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                  }`}
                >
                  <option value="Kế toán viên">Kế toán viên (General / Cost Accountant)</option>
                  <option value="Kế toán trưởng">Kế toán trưởng / Trưởng phòng TC-KT</option>
                  <option value="Chuyên viên FP&A">Chuyên viên FP&A / Tài chính Doanh nghiệp</option>
                  <option value="Tư vấn viên ERP">Tư vấn viên ERP (SAP FICO / PP / MM)</option>
                  <option value="Sinh viên">Sinh viên chuyên ngành Kế toán - Tài chính</option>
                  <option value="Giám đốc / Quản lý">Giám đốc Tài chính / Chủ doanh nghiệp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            {/* Tên công ty */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold">
                Tên Đơn vị / Doanh nghiệp / Trường học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Công ty Nhựa SAVA / Đại học Kinh tế..."
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setErrorMsg(null);
                }}
                className={`w-full px-3 py-2 rounded-lg text-xs border transition-all ${
                  isClassic
                    ? 'bg-white border-[#7f9db9] text-black focus:border-[#316ac5]'
                    : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
                }`}
              />
            </div>

            {/* Checkbox 1: Nhận bộ tài liệu */}
            <label className="flex items-start gap-2.5 pt-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={receiveMaterials}
                onChange={(e) => setReceiveMaterials(e.target.checked)}
                className="mt-0.5 text-cyan-500 rounded focus:ring-0 cursor-pointer"
              />
              <span className={isClassic ? 'text-[#333333]' : 'text-slate-300'}>
                <strong>Tôi muốn nhận bộ tài liệu:</strong> Hướng dẫn Hạch toán SAP FICO & Cẩm nang Thông tư 99/2025/TT-BTC qua Email/Zalo.
              </span>
            </label>

            {/* Checkbox 2: VIETNAM DATA PRIVACY COMPLIANCE (ND13/2023/ND-CP) */}
            <div
              className={`p-3 rounded-xl border space-y-1.5 ${
                isClassic
                  ? 'bg-[#ffffff] border-[#7f9db9]'
                  : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentPolicy}
                  onChange={(e) => {
                    setConsentPolicy(e.target.checked);
                    if (e.target.checked) setErrorMsg(null);
                  }}
                  className="mt-0.5 text-cyan-500 rounded focus:ring-0 cursor-pointer"
                />
                <span className={`leading-relaxed ${isClassic ? 'text-[#222222]' : 'text-slate-300'}`}>
                  Tôi đồng ý cho <strong>Savafinlab</strong> thu thập và xử lý dữ liệu cá nhân (Họ tên, SĐT, Email) để cấp quyền trải nghiệm Demo, gửi tài liệu Kế toán và tư vấn dịch vụ theo Chính sách bảo mật.{' '}
                  <a
                    href="https://savafinlab.com.vn/chinh-sach-bao-mat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline font-semibold inline-flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Xem Chính sách bảo mật <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
              </label>
            </div>

            {/* Submit CTA Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isClassic
                    ? 'bg-[#d4d0c8] text-black hover:bg-[#c0bcba] border border-[#808080]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={!isFormValid}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                  isFormValid
                    ? isClassic
                      ? 'bg-[#316ac5] hover:bg-[#204a87] text-white border border-[#204a87] cursor-pointer'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-950/50 cursor-pointer font-extrabold'
                    : isClassic
                    ? 'bg-[#e0e0e0] text-[#888888] border border-[#cccccc] cursor-not-allowed'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
                title={!consentPolicy ? 'Vui lòng đánh dấu đồng ý chính sách bảo mật ND13' : 'Đăng ký & Tiếp tục'}
              >
                <span>Đăng ký & Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Trust Footer */}
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bảo mật dữ liệu tuân thủ NĐ 13/2023/NĐ-CP</span>
            </div>
            <span>Phát triển bởi Mr. Hoàng Quân · Savafinlab</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  BookOpen,
  Rocket,
  ListOrdered,
  LayoutDashboard,
  KeyRound,
  Terminal,
  Download,
  Bot,
  HelpCircle,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { UIMode } from '../types';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiMode?: UIMode;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: Section[] = [
  { id: 'ug-intro', label: 'Giới thiệu', icon: BookOpen },
  { id: 'ug-start', label: 'Bắt đầu nhanh', icon: Rocket },
  { id: 'ug-steps', label: 'Quy trình 7 bước', icon: ListOrdered },
  { id: 'ug-panels', label: 'Đọc 3 bảng theo dõi', icon: LayoutDashboard },
  { id: 'ug-core', label: 'Điểm học cốt lõi', icon: KeyRound },
  { id: 'ug-tools', label: 'Công cụ nhanh', icon: Terminal },
  { id: 'ug-export', label: 'Xuất dữ liệu', icon: Download },
  { id: 'ug-ai', label: 'Trợ giảng AI', icon: Bot },
  { id: 'ug-faq', label: 'Câu hỏi thường gặp', icon: HelpCircle },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, uiMode = 'fiori' }) => {
  const isClassic = uiMode === 'classic';
  if (!isOpen) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Theme helpers
  const panelBg = isClassic ? 'bg-[#ece9d8] text-black' : 'bg-slate-900 text-slate-100';
  const panelBorder = isClassic ? 'border-[#7f9db9]' : 'border-slate-700';
  const headBg = isClassic
    ? 'bg-[#0a246a] text-white border-[#7f9db9]'
    : 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-slate-800';
  const tocActive = isClassic ? 'hover:bg-[#d7d2be] text-[#0a246a]' : 'hover:bg-slate-800 text-slate-300';
  const heading = isClassic ? 'text-[#0a246a]' : 'text-cyan-400';
  const sub = isClassic ? 'text-[#555555]' : 'text-slate-400';
  const card = isClassic ? 'bg-white border-[#c9c4ac]' : 'bg-slate-800/50 border-slate-700';
  const mono = isClassic ? 'text-[#0a246a] font-semibold' : 'text-cyan-300 font-semibold';

  const AccountTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${isClassic ? 'bg-[#eef2f8] text-[#0a246a] border border-[#c9c4ac]' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-5xl h-[90vh] rounded-xl overflow-hidden border shadow-2xl flex flex-col ${panelBg} ${panelBorder}`}>
        {/* Header */}
        <div className={`px-5 py-3.5 flex items-center justify-between border-b ${headBg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isClassic ? 'bg-white text-[#0a246a]' : 'bg-cyan-500/20 text-cyan-300'}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight">Hướng dẫn sử dụng — Sava SAP MTO Cockpit</h3>
              <p className="text-[11px] opacity-80">Cách vận hành mô phỏng chu trình sản xuất theo đơn hàng (MTO) & hạch toán TT200/TT99</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/20 transition-colors cursor-pointer" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* TOC */}
          <nav className={`hidden md:block w-56 shrink-0 border-r overflow-y-auto p-2 ${panelBorder} ${isClassic ? 'bg-[#f4f2e7]' : 'bg-slate-950/40'}`}>
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-left transition-colors cursor-pointer ${tocActive}`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-8 text-sm leading-relaxed">
            {/* 1. Intro */}
            <section id="ug-intro" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>1. Đây là công cụ gì?</h4>
              <div className={`flex items-start gap-2 p-3 rounded border ${isClassic ? 'bg-[#fff8e1] border-[#e0c068]' : 'bg-amber-500/10 border-amber-500/40'}`}>
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                <p><b>MÔ PHỎNG ĐÀO TẠO — không phải hệ thống SAP thật.</b> Mọi số liệu do bạn nhập và được tính bằng công thức thật (giá thành, giá vốn, cân đối Nợ = Có), không có kết quả "PASS" giả.</p>
              </div>
              <p className={sub}>Mục tiêu: giúp kế toán viên, sinh viên và tư vấn ERP hiểu trọn <b>chu trình Make-to-Order (sản xuất theo đơn hàng bán)</b> tích hợp SD · MM · PP · QM · FICO, với các bút toán theo <b>Thông tư 200/2014/TT-BTC</b> và <b>Thông tư 99/2025/TT-BTC</b>. Bối cảnh: công ty ép nhựa chính xác giao hàng cho khách OEM.</p>
            </section>

            {/* 2. Quick start */}
            <section id="ug-start" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>2. Bắt đầu nhanh (3 bước)</h4>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Ở <b>màn Thiết lập thông số</b>: tự nhập tham số (khách hàng, số lượng, đơn giá, định mức hạt nhựa, chi phí nhân công/máy...), hoặc <b>nạp 1 trong 3 kịch bản mẫu</b> (Samsung / Canon / Denso), hoặc <b>Import Excel tham số</b>.</li>
                <li>Chọn <b>Chiến lược</b> — Strategy 20 (MTO thuần) hoặc Strategy 25 (MTO + cấu hình biến thể) — và <b>Loại kho riêng</b>: Valuated (có định giá) hoặc Non-valuated (phi định giá). Hai lựa chọn này thay đổi cách ghi sổ, xem mục 5.</li>
                <li>Xem <b>cây BOM</b> để hiểu giá thành cấu thành từ đâu, rồi bấm <b>Bắt đầu mô phỏng</b> để vào quy trình 7 bước.</li>
              </ol>
            </section>

            {/* 3. 7 steps */}
            <section id="ug-steps" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>3. Chạy quy trình 7 bước</h4>
              <p className={sub}>Mỗi bước là một thẻ. Bấm <b>"Thực hiện"</b> để chạy logic thật, sinh bút toán và mở khóa bước sau. Nút <b>"Giải thích bước này"</b> gọi Trợ giảng AI phân tích đúng ngữ cảnh.</p>
              <div className={`rounded border divide-y ${card} ${isClassic ? 'divide-[#e0dcc8]' : 'divide-slate-700'}`}>
                {[
                  ['B1', 'VA01 · CK51N', 'Tạo đơn hàng bán (Sales Order) + tính giá thành kế hoạch. Chưa ghi sổ tài chính.'],
                  ['B2', 'MD02', 'Chạy MRP: sinh lệnh sản xuất kế hoạch & yêu cầu mua hạt nhựa. Chưa ghi sổ.'],
                  ['B3', 'MIGO 261E · CO11N · 101E', 'Sản xuất: xuất NVL (Nợ 621/Có 152), nhân công & máy (Nợ 622, 627), kết chuyển Nợ 154, nhập kho thành phẩm 101E.'],
                  ['B4', 'QA11', 'Kiểm định KCS: chọn Đạt (Pass) hoặc Lỗi (Fail). Fail sẽ khóa bước 5 tới khi xử lý.'],
                  ['B5', 'VL01N · PGI 601E', 'Xuất kho giao hàng OEM. Kho Valuated ghi giá vốn Nợ 632/Có 155.'],
                  ['B6', 'VF01', 'Lập hóa đơn: Nợ 131 / Có 511 + Có 3331 (thuế GTGT).'],
                  ['B7', 'KKA2 · VA88', 'Phân tích kết quả & quyết toán: xử lý chênh lệch, kết chuyển 911 xác định lãi/lỗ đơn hàng.'],
                ].map(([b, tcode, desc]) => (
                  <div key={b} className="flex items-start gap-3 p-3">
                    <span className={`shrink-0 w-9 text-center py-0.5 rounded text-xs font-bold ${isClassic ? 'bg-[#0a246a] text-white' : 'bg-cyan-500/20 text-cyan-300'}`}>{b}</span>
                    <div>
                      <span className={`text-xs ${mono}`}>{tcode}</span>
                      <p className="text-[13px]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Panels */}
            <section id="ug-panels" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>4. Đọc 3 bảng theo dõi (luôn hiển thị)</h4>
              <ul className="space-y-2">
                <li><b>Sổ Nhật ký Chung (GL Ledger):</b> mọi bút toán phát sinh. Huy hiệu <b>CÂN SỔ ✓</b> nghĩa là Tổng Nợ = Tổng Có (kiểm tra thật). Lọc nhanh theo số tài khoản (<AccountTag>154</AccountTag> <AccountTag>632</AccountTag>) hoặc theo bước. Có tab <b>Bảng Cân đối Phát sinh</b> để xem số dư từng tài khoản.</li>
                <li><b>Kho riêng Special Stock E:</b> số lượng & giá trị Hạt nhựa (<AccountTag>152</AccountTag>), Dở dang (<AccountTag>154</AccountTag>), Thành phẩm (<AccountTag>155</AccountTag>) — cập nhật theo từng chuyển động 261E/101E/601E.</li>
                <li><b>Thẻ Chi phí Đơn hàng:</b> lũy kế 621/622/627, doanh thu 511, giá vốn 632, lợi nhuận gộp thực tế — cập nhật realtime qua các bước.</li>
              </ul>
            </section>

            {/* 5. Core */}
            <section id="ug-core" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>5. Điểm học cốt lõi (quan trọng nhất)</h4>
              <div className={`p-3 rounded border ${card}`}>
                <p className="font-semibold mb-1">① Valuated vs Non-valuated — khi nào ghi giá vốn 632?</p>
                <p className="text-[13px]">Kho <b>Valuated</b>: ghi giá vốn <AccountTag>Nợ 632/Có 155</AccountTag> <b>ngay ở Bước 5</b> (PGI). Kho <b>Non-valuated</b>: <b>không</b> ghi ở Bước 5, mà dồn toàn bộ giá vốn <AccountTag>Nợ 632/Có 154</AccountTag> vào <b>Bước 7</b> (quyết toán VA88). Hãy bật/tắt để thấy sổ sách đổi khác — đây là khác biệt cốt tử của MTO.</p>
              </div>
              <div className={`p-3 rounded border ${card}`}>
                <p className="font-semibold mb-1">② Nhánh QM khi Fail (Bước 4)</p>
                <p className="text-[13px]">Bước 5 bị khóa; phải xử lý một trong ba: <b>Rework (CO07)</b> — phát sinh thêm 621/622 kết chuyển 154; <b>Scrap</b> — hủy phế phẩm + sản xuất bù; hoặc <b>Concession</b> (nhượng bộ kỹ thuật) — mở khóa không phát sinh chi phí.</p>
              </div>
              <div className={`p-3 rounded border ${card}`}>
                <p className="font-semibold mb-1">③ Chênh lệch giá thành (Bước 7)</p>
                <p className="text-[13px]">Thực tế ≠ kế hoạch: bất lợi ghi <AccountTag>Nợ 632/Có 154</AccountTag>, có lợi ghi ngược lại. Sau đó kết chuyển doanh thu & giá vốn vào <AccountTag>911</AccountTag> để ra lãi gộp đơn hàng.</p>
              </div>
            </section>

            {/* 6. Tools */}
            <section id="ug-tools" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>6. Công cụ nhanh</h4>
              <ul className="space-y-2">
                <li><b>Thanh lệnh SAP (Command Bar):</b> gõ mã T-Code (ví dụ <span className={mono}>VA01</span>, <span className={mono}>MIGO</span>, <span className={mono}>VF01</span>) rồi Enter để nhảy thẳng tới bước tương ứng.</li>
                <li><b>Nút "Tra cứu T-Code":</b> mở bảng giải nghĩa toàn bộ T-Code trong chu trình kèm vai trò kế toán.</li>
                <li><b>Chuyển giao diện:</b> đổi giữa SAP Fiori (hiện đại) và SAP Classic GUI (cổ điển) trên Header.</li>
              </ul>
            </section>

            {/* 7. Export */}
            <section id="ug-export" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>7. Xuất dữ liệu</h4>
              <ul className="space-y-1.5">
                <li><b>Xuất CSV / JSON:</b> tải nhật ký chứng từ để mở bằng Excel hoặc xử lý dữ liệu.</li>
                <li><b>Xuất Excel (3 sheet):</b> Sổ Nhật ký · Bảng Cân đối Phát sinh · Báo cáo KQKD đơn hàng.</li>
                <li><b>Báo cáo PDF:</b> bản in A4 chuẩn TT200 để lưu trữ hồ sơ.</li>
              </ul>
            </section>

            {/* 8. AI */}
            <section id="ug-ai" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>8. Trợ giảng AI</h4>
              <p>Mở panel <b>"Trợ giảng AI"</b> và hỏi bằng tiếng Việt, ví dụ: <i>"Tại sao Bước 5 ghi Nợ 632?"</i> hoặc <i>"So sánh Valuated và Non-valuated stock"</i>. Trợ giảng trả lời theo đúng ngữ cảnh bước hiện tại.</p>
              <p className={`text-[13px] ${sub}`}>Lưu ý: bản demo có thể trả lời ở <b>chế độ dự phòng ngoại tuyến</b> (nội dung nghiệp vụ chuẩn) khi trí tuệ AI động chưa được bật — câu trả lời vẫn đúng chuẩn mực.</p>
            </section>

            {/* 9. FAQ */}
            <section id="ug-faq" className="scroll-mt-4 space-y-3">
              <h4 className={`text-base font-bold ${heading}`}>9. Câu hỏi thường gặp</h4>
              <div className="space-y-2">
                <div className={`p-3 rounded border ${card}`}>
                  <p className="font-semibold text-[13px]">Sổ báo "LỆCH ✗" thì sao?</p>
                  <p className="text-[13px]">Thường do chưa chạy hết bước kết chuyển (ví dụ chưa quyết toán 154 → 632 ở Bước 7). Chạy tiếp cho đủ chu trình, sổ sẽ cân.</p>
                </div>
                <div className={`p-3 rounded border ${card}`}>
                  <p className="font-semibold text-[13px]">Muốn chạy kịch bản khác?</p>
                  <p className="text-[13px]">Bấm <b>Reset</b> trên Header để nhập bộ tham số mới từ đầu.</p>
                </div>
                <div className={`p-3 rounded border ${card}`}>
                  <p className="font-semibold text-[13px]">Số liệu có phải của doanh nghiệp thật không?</p>
                  <p className="text-[13px]">Không. Toàn bộ là dữ liệu minh họa hư cấu phục vụ đào tạo.</p>
                </div>
              </div>
            </section>

            {/* Footer CTA */}
            <div className={`mt-4 pt-4 border-t ${panelBorder} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
              <p className={`text-xs ${sub}`}>Savafinlab — Tư vấn Tài chính, Thuế & Kế toán · savafinlab.com.vn</p>
              <a
                href="https://savafinlab.com.vn"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${isClassic ? 'bg-[#0a246a] text-white hover:bg-[#0c2e86]' : 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30'}`}
              >
                Liên hệ tư vấn / Đào tạo SAP FICO
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

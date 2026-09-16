import React from 'react';
import {
  Sparkles,
  ExternalLink,
  PhoneCall,
  GraduationCap,
  X,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { UIMode } from '../types';

export interface SessionLimitBannerProps {
  completedRunsCount: number;
  onResetDemo: () => void;
  onClose?: () => void;
  uiMode?: UIMode;
}

export const SessionLimitBanner: React.FC<SessionLimitBannerProps> = ({
  completedRunsCount,
  onResetDemo,
  onClose,
  uiMode = 'fiori',
}) => {
  const isClassic = uiMode === 'classic';

  return (
    <div
      className={`rounded-2xl border p-5 shadow-2xl relative overflow-hidden transition-all animate-fadeIn ${
        isClassic
          ? 'bg-[#ffffff] border-[#7f9db9] text-black font-sans shadow-md'
          : 'bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border-cyan-500/50 text-white shadow-cyan-950/40'
      }`}
      style={{
        boxShadow: isClassic
          ? '0 4px 12px rgba(0,0,0,0.15)'
          : '0 10px 30px -10px rgba(6, 182, 212, 0.3)',
      }}
    >
      {/* Background Ambient Glow */}
      {!isClassic && (
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div
            className={`p-2.5 rounded-xl shrink-0 border ${
              isClassic
                ? 'bg-[#316ac5] text-white border-[#204a87]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
            }`}
          >
            <GraduationCap className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isClassic
                    ? 'bg-[#ece9d8] text-[#0a246a] border-[#808080]'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                🎉 Đã hoàn thành {completedRunsCount} chu trình Simulation
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Chứng nhận hoàn thành phiên trải nghiệm
              </span>
            </div>

            <p className="text-sm font-semibold leading-relaxed">
              Bạn đã hoàn thành phiên dùng thử miễn phí! Để đăng ký tài khoản VIP không giới hạn hoặc tham gia Khóa đào tạo Thực chiến SAP FICO & FP&A, vui lòng liên hệ Mr. Hoàng Quân - Savafinlab.
            </p>

            <p className="text-xs text-slate-400">
              Chương trình đào tạo chuyên sâu: Kế toán chi phí giá thành Make-to-Order (MTO), kết chuyển dở dang KKA2/VA88, đối chiếu tài khoản Thông tư 99 và xây dựng mô hình FP&A tự động hóa.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={onResetDemo}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              isClassic
                ? 'bg-[#ece9d8] hover:bg-[#d8d4c4] text-black border-[#808080]'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Làm mới lại dữ liệu để chạy thử nghiệm mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chạy Lại Demo</span>
          </button>

          <a
            href="https://savafinlab.com.vn"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              isClassic
                ? 'bg-[#316ac5] hover:bg-[#204a87] text-white border border-[#204a87]'
                : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-extrabold shadow-cyan-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Liên hệ Tư vấn / Đăng ký Khóa học</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Tạm ẩn thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

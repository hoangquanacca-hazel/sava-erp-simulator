import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Copy,
  Check,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import { MTOParameters, MTOComputed, StepDefinition, JournalEntry } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
}

interface AITutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  params: MTOParameters;
  computed: MTOComputed;
  activeStepDef?: StepDefinition;
  lastGeneratedEntries?: JournalEntry[];
  allEntriesCount: number;
  initialQuestion?: string;
}

export const AITutorDrawer: React.FC<AITutorDrawerProps> = ({
  isOpen,
  onClose,
  currentStep,
  params,
  computed,
  activeStepDef,
  lastGeneratedEntries = [],
  allEntriesCount,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Xin chào bạn! Tôi là **Trợ Giảng AI Chuyên Gia SAP ERP & Kế Toán TT200** tại PIC Vietnam. 🎓

Tôi sẵn sàng giải thích chi tiết cho bạn về:
- Các bút toán hạch toán theo **Thông tư 200/2014/TT-BTC** (TK 621, 622, 627, 154, 155, 632, 511, 3331, 131).
- Chuyển động kho đặc thù **Movement 261E, 101E, 601E** cho Special Stock E.
- Khác biệt bản chất giữa **Valuated Stock** và **Non-valuated Stock**.
- Bất kỳ thắc mắc nào ở bước **${currentStep}** hiện tại!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle triggered explanation from "Giải thích bước này"
  useEffect(() => {
    if (initialQuestion && isOpen) {
      sendMessage(initialQuestion);
    }
  }, [initialQuestion, isOpen]);

  const quickQuestions = [
    'Tại sao bước 5 ghi Nợ 632?',
    'Sự khác nhau giữa Valuated và Non-valuated Stock?',
    'Tại sao bước 1 và 2 không có bút toán tài chính?',
    'Tài khoản 154 tất toán như thế nào ở bước 7?',
    'Movement type 261E khác 261 thường ở điểm gì?',
  ];

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const contextPayload = {
        currentStep,
        stepName: activeStepDef?.title || `Bước ${currentStep}`,
        tCode: activeStepDef?.tCode,
        stockType: params.stockType,
        strategy: params.strategy,
        customer: params.customer,
        componentCode: params.componentCode,
        orderQuantity: params.orderQuantity,
        plannedCost: computed.plannedCost,
        variancePercent: params.actualVariancePercent,
        varianceAmount: computed.varianceAmount,
        actualCost: computed.plannedCost + computed.varianceAmount,
        totalRevenue: computed.totalRevenue,
        variantDetails:
          params.strategy === 'Strategy 25'
            ? {
                color: params.variantColorName,
                texture: params.variantTextureName,
                packaging: params.variantPackagingName,
                variantAddonTotal: computed.variantAddonTotal,
              }
            : null,
        recentEntries: lastGeneratedEntries.map((e) => ({
          voucherNo: e.voucherNo,
          tCode: e.tCode,
          debit: e.debitAccount,
          credit: e.creditAccount,
          amount: e.amount,
          desc: e.description,
        })),
        totalAccumulatedEntries: allEntriesCount,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context: contextPayload,
          step: currentStep,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Xin lỗi, tôi không thể xử lý câu trả lời ngay lúc này.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isFallback: data.isFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Failed to send AI message:', error);
      const fallbackMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          '⚠️ Có sự cố kết nối tới máy chủ AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau giây lát.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Trợ Giảng AI Kế Toán SAP</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                TT 200
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Đang phân tích Bước {currentStep} · {params.stockType} Stock
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick context chip */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
        <span className="truncate">
          SO: <strong>{params.componentCode}</strong> ({params.customer})
        </span>
        <span className="font-mono text-cyan-400 font-semibold">{params.stockType}</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
              <span>{m.role === 'user' ? 'Học viên' : 'Trợ giảng AI'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed max-w-[95%] relative group ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              {/* Markdown-like simple styling rendering */}
              <div className="whitespace-pre-wrap space-y-2">
                {m.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {m.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(m.id, m.content)}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Sao chép câu trả lời"
                >
                  {copiedId === m.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2 bg-slate-950 rounded-lg border border-slate-800 w-fit animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Trợ giảng AI đang suy nghĩ và tra cứu chuẩn mực SAP TT200...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          <span>Gợi ý câu hỏi thực chiến:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/70 hover:border-cyan-500/50 transition-colors text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputMessage);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Hỏi trợ giảng (vd: tại sao bước 5 ghi Nợ 632?)..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className={`p-2 rounded-lg font-bold transition-colors cursor-pointer ${
              inputMessage.trim() && !loading
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    app: 'SAP MTO Simulator — PIC Vietnam',
  });
});

// AI Tutor chat & explanation endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, step } = req.body;
    const client = getGeminiClient();

    const systemInstruction = `Bạn là Trợ Giảng Chuyên Gia Cấp Cao về Hệ Thống SAP ERP (tích hợp SD, MM, PP, QM, CO, FI) và Kế toán Doanh nghiệp Việt Nam theo Thông tư 200/2014/TT-BTC tại Công ty Cổ phần Nhựa Kỹ thuật PIC Vietnam.
PIC Vietnam chuyên sản xuất linh kiện ép phun nhựa chính xác cho các khách hàng OEM (Samsung, Canon, Denso, Panasonic,...).
Nhiệm vụ của bạn là giải thích cặn kẽ, chính xác, sư phạm cho nhân viên kế toán và kỹ sư sản xuất về:
1. Quy trình Sản xuất theo Đơn hàng MTO (Make-to-Order):
   - Strategy 20 (MTO Thuần túy): Sản xuất riêng cho Sales Order, vật tư hạt nhựa phân bổ cố định, không dùng chung.
   - Strategy 25 (MTO với Variant Configuration LO-VC): Sử dụng Super BOM và Super Routing. Khách hàng lựa chọn đặc tính (Màu sắc Masterbatch, Độ nhám khuôn Texture VDI, Quy cách đóng gói ESD), từ đó tự động tính toán phụ phí vào Giá thành kế hoạch và Giá bán.
2. Bản chất các chuyển động kho trong SAP:
   - 261E: Xuất kho nguyên vật liệu hạt nhựa riêng cho Đơn hàng bán (Special Stock E).
   - 101E: Nhập kho thành phẩm sản xuất hoàn thành theo Đơn hàng bán (Special Stock E).
   - 601E: Xuất giao hàng cho khách hàng từ kho riêng E (PGI - Post Goods Issue).
3. Sự khác nhau CỰC KỲ QUAN TRỌNG giữa 2 loại kho Special Stock E:
   - Valuated Sales Order Stock (Kho có định giá): Thành phẩm 101E nhập kho ghi Nợ 155 / Có 154 theo giá thành kế hoạch. Khi PGI 601E (Giao hàng) ghi nhận ngay Giá vốn hàng bán Nợ 632 / Có 155.
   - Non-valuated Sales Order Stock (Kho phi định giá): Thành phẩm 101E chỉ ghi nhận số lượng vật lý vào kho E, KHÔNG sinh bút toán tài chính (TK 155 = 0 đ ghi sổ). Khi PGI 601E cũng KHÔNG ghi nhận 632. Toàn bộ chi phí sản xuất treo trên Sales Order (hoặc TK 154) và chỉ được kết chuyển thành Giá vốn Nợ 632 / Có 154 ở Bước 7 khi chạy Result Analysis (KKA2) & Settlement (VA88).
4. Hệ thống tài khoản Thông tư 200/2014/TT-BTC và Chu trình Giá thành 2 giai đoạn:
   - Giai đoạn 1: Tập hợp chi phí sản xuất trực tiếp
     * Nợ 621 / Có 152: Chi phí NVL hạt nhựa trực tiếp.
     * Nợ 622 / Có 334: Chi phí nhân công thợ ép trực tiếp.
     * Nợ 627 / Có 214, 331: Chi phí sản xuất chung (khấu hao máy ép, điện 3 pha, khuôn mẫu).
   - Giai đoạn trung gian (Tập hợp chi phí dở dang):
     * Nợ 154 / Có 621, 622, 627.
   - Giai đoạn 2: Nhập kho thành phẩm (Valuated: Nợ 155 / Có 154; Non-valuated: Không ghi sổ).
5. Xử lý Chênh lệch Chi phí Thực tế (Actual Cost Variance) tại Bước 7 (VA88 / CO-PA):
   - Sai lệch giữa Actual Cost vs. Standard Cost do tỷ lệ phế phẩm, hao hụt hạt nhựa, hoặc vượt giờ chạy máy.
   - Chênh lệch bất lợi (Unfavorable: Thực tế > Kế hoạch): Nợ 632 / Có 154 (hoặc Có 155).
   - Chênh lệch thuận lợi (Favorable: Thực tế < Kế hoạch): Nợ 154 (hoặc Nợ 155) / Có 632.
   - Kết chuyển xác định KQKD vào TK 911: Nợ 511 / Có 911 và Nợ 911 / Có 632.
6. Quản lý chất lượng QM (QA11) và các nhánh xử lý:
   - Pass (Đạt): Lô hàng chuyển Unrestricted Use, mở khóa xuất kho giao hàng.
   - Fail (Lỗi): Khóa vào Blocked Stock, CHẶN quy trình giao hàng.
   - 3 phương án giải quyết QM:
     * Gia công sửa chữa (Rework Order CO07): Phát sinh thêm chi phí NVL ép bù (621) và công gọt ba-via (622), tập hợp vào 154.
     * Phế liệu & Sản xuất bù (Scrap & Replacement): Hạch toán tổn thất phế phẩm ngoài định mức Nợ 632 / Có 154 (hoặc Có 155), mở lệnh sản xuất bù lô mới.
     * Nhượng bộ kỹ thuật (Concession): Biên bản đặc cách kỹ thuật OEM, chuyển Unrestricted Use không phát sinh chi phí phụ trội.
7. Trả lời bằng tiếng Việt chuyên nghiệp, chuẩn mực thuật ngữ SAP và kế toán Việt Nam, có cấu trúc bullet point rõ ràng, dẫn chứng số liệu thực tế từ ngữ cảnh mô phỏng hiện tại.`;

    if (!client) {
      // Fallback domain-specific intelligent answer when Gemini API key is not configured
      const fallbackResponse = generateLocalExplanation(message, context, step);
      return res.json({ reply: fallbackResponse, isFallback: true });
    }

    const promptText = `Ngữ cảnh mô phỏng MTO chi tiết tại PIC Vietnam:
${JSON.stringify(context, null, 2)}

Câu hỏi hoặc yêu cầu giải thích của học viên kế toán:
${message}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || 'Xin lỗi, không nhận được phản hồi từ mô hình AI.';
    return res.json({ reply, isFallback: false });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // Intelligent domain fallback on error
    const fallbackResponse = generateLocalExplanation(
      req.body?.message || '',
      req.body?.context || {},
      req.body?.step || 1
    );
    return res.json({
      reply: fallbackResponse,
      isFallback: true,
      error: error?.message || 'Gemini API call failed',
    });
  }
});

function generateLocalExplanation(message: string, context: any, step: number): string {
  const stockType = context?.stockType || 'Valuated';
  const isValuated = stockType === 'Valuated';
  const strategy = context?.strategy || 'Strategy 20';
  const lowerMsg = (message || '').toLowerCase();

  if (lowerMsg.includes('strategy 25') || lowerMsg.includes('biến thể') || lowerMsg.includes('variant')) {
    return `### 📌 Giải thích Chiến lược Sản xuất Strategy 25 (Make-to-Order with Variant Configuration LO-VC)
1. **Bản chất trong SAP:**
   - Khác với **Strategy 20** (sản xuất đơn chiếc cố định), **Strategy 25** cho phép khách hàng cấu hình linh kiện ép nhựa theo các đặc tính kỹ thuật (*Characteristics*): Màu sắc hạt nhựa (Color Masterbatch), Độ nhám khuôn (*Mold Texture* theo chuẩn VDI 3400), và Quy cách đóng gói (*Packaging Specification*).
2. **Super BOM & Super Routing:**
   - Hệ thống lưu trữ một Định mức vật tư tổng (*Super BOM*) và Quy trình công nghệ tổng (*Super Routing*).
   - Khi tạo Sales Order (VA01), dựa vào việc lựa chọn biến thể, SAP tự động chọn lọc linh kiện và thao tác gia công tương ứng, tự động cộng thêm chi phí (*Variant Add-on Cost*) vào giá thành và đơn giá bán.
3. **Ý nghĩa kế toán:**
   - Kế toán chi phí theo dõi chính xác từng biến thể để tính toán biên lợi nhuận thực tế theo từng cấu hình sản phẩm của khách hàng OEM.`;
  }

  if (lowerMsg.includes('chênh lệch') || lowerMsg.includes('variance') || step === 7 || lowerMsg.includes('va88')) {
    return `### 📌 Quyết toán Đơn hàng & Xử lý Chênh lệch Giá thành (VA88 / CO-PA Settlement)
1. **Bản chất Chênh lệch Giá thành (Cost Variance):**
   - Trong sản xuất ép nhựa, chi phí thực tế (*Actual Cost*) thường sai lệch so với giá thành kế hoạch (*Standard/Planned Cost*) do:
     - Tỷ lệ phế phẩm, ba-via hoặc hao hụt hạt nhựa vượt định mức.
     - Thời gian ép chu kỳ máy kéo dài (*Cycle Time Overrun*) làm tăng chi phí điện và nhân công.
2. **Hạch toán theo Thông tư 200/2014/TT-BTC tại Bước 7 (VA88):**
   - **Chênh lệch Bất lợi (Unfavorable Variance - Thực tế > Kế hoạch):**
     - Khoản chi phí vượt định mức không được vốn hóa vào giá trị hàng tồn kho mà phải ghi nhận ngay vào giá vốn:
     - **Nợ TK 632** (Giá vốn hàng bán - Chi phí vượt định mức) / **Có TK 154** (Chi phí SX KD dở dang).
   - **Chênh lệch Thuận lợi (Favorable Variance - Thực tế < Kế hoạch):**
     - Do tiết kiệm định mức NVL hoặc tối ưu chu kỳ máy:
     - **Nợ TK 154** / **Có TK 632** (Ghi giảm giá vốn hàng bán).
3. **Đặc biệt với Non-valuated Stock:**
   - Toàn bộ chi phí sản xuất thực tế trên TK 154 được kết chuyển toàn bộ vào Giá vốn hàng bán: **Nợ TK 632 / Có TK 154**.
4. **Kết chuyển cuối kỳ sang TK 911 (Xác định Kết quả Kinh doanh):**
   - Kết chuyển Doanh thu: **Nợ TK 511 / Có TK 911**.
   - Kết chuyển Giá vốn: **Nợ TK 911 / Có TK 632**.
   - Chênh lệch Nợ/Có trên TK 911 chính là Lợi nhuận gộp thực tế của Đơn hàng bán MTO.`;
  }

  if (lowerMsg.includes('qm') || lowerMsg.includes('qa11') || lowerMsg.includes('rework') || lowerMsg.includes('scrap') || step === 4) {
    return `### 📌 Kiểm soát Chất lượng QM (QA11) và Các Nhánh Xử lý Rework / Scrap
1. **Kiểm tra KCS tại xưởng ép nhựa (Usage Decision - UD):**
   - KCS đo lường dung sai kích thước (+/-0.02mm), kiểm tra độ co ngót, bọt khí và ba-via.
   - **Nếu PASS:** Lô hàng chuyển từ trạng thái Kiểm định (*Quality Inspection - QI*) sang Sử dụng tự do (*Unrestricted Use*), cho phép tạo chứng từ giao hàng Outbound Delivery (VL01N).
   - **Nếu FAIL:** Lô hàng bị khóa chặt trong *Blocked Stock*. Quy trình giao hàng bị Chặn đứng hoàn toàn.
2. **Ba Nhánh Xử Lý Khi Lô Hàng Bị Lỗi:**
   - **Phương án 1: Gia công sửa chữa (Rework Order CO07):**
     - Cấp thêm hạt nhựa ép bù: **Nợ TK 621 / Có TK 152**.
     - Chi phí nhân công gọt ba-via, đánh bóng: **Nợ TK 622 / Có TK 334**.
     - Kết chuyển vào dở dang: **Nợ TK 154 / Có TK 621, 622**.
     - Sau khi KCS tái kiểm định Đạt, cập nhật tăng giá trị kho thành phẩm E: **Nợ TK 155 / Có TK 154** (với Valuated Stock).
   - **Phương án 2: Phế liệu & Sản xuất bù (Scrap & Replacement):**
     - Hủy phế phẩm không thể khắc phục: **Nợ TK 632 / Có TK 155** (hoặc Nợ 632 / Có 154) ghi nhận tổn thất sản xuất ngoài định mức.
     - Phát hành Lệnh sản xuất bù lô mới thay thế để đủ số lượng giao cho khách OEM.
   - **Phương án 3: Nhượng bộ kỹ thuật (Concession / Technical Waiver):**
     - Trình Biên bản ngoại lệ kỹ thuật cho Giám đốc Nhà máy OEM phê duyệt chấp thuận lô hàng. Không phát sinh chi phí phụ trội, chuyển trạng thái kho sang Unrestricted Use để mở khóa.`;
  }

  if (lowerMsg.includes('632') || lowerMsg.includes('giá vốn') || step === 5) {
    if (isValuated) {
      return `### 📌 Giải thích ghi nhận Giá vốn hàng bán (TK 632) — Kho Valuated Stock E
1. **Tại Bước 5 (PGI 601E - Post Goods Issue):**
   - Với **Valuated Sales Order Stock**, thành phẩm đã được định giá ghi nhận vào TK 155 ở Bước 3.
   - Khi tạo Outbound Delivery (VL01N) và xuất kho giao hàng (PGI 601E), quyền sở hữu hàng hóa chuyển giao cho khách hàng.
   - SAP tự động sinh bút toán hạch toán giá vốn theo TT 200:
     - **Nợ TK 632** (Giá vốn hàng bán): Ghi nhận chi phí cấu thành sản phẩm tương ứng số lượng giao.
     - **Có TK 155** (Thành phẩm - Kho riêng E): Giảm số dư thành phẩm kho E tương ứng.
2. **Nguyên tắc phù hợp (Matching Principle):** Chi phí giá vốn được ghi nhận đồng bộ hoặc chuẩn bị đối chiếu với Doanh thu xuất hóa đơn (Bước 6 - VF01).`;
    } else {
      return `### 📌 Giải thích đặc thù Giá vốn hàng bán — Kho Non-valuated Stock E
1. **Tại Bước 5 (PGI 601E):**
   - Do chọn **Non-valuated Sales Order Stock**, thành phẩm trong kho E không có giá trị tiền tệ trên sổ cái kế toán (số dư TK 155 = 0 đ).
   - Vì vậy, khi PGI 601E, hệ thống **CHỈ GIẢM SỐ LƯỢNG VẬT LÝ**, hoàn toàn **KHÔNG sinh bút toán Nợ 632 / Có 155**!
2. **Khi nào giá vốn được ghi nhận?**
   - Toàn bộ chi phí sản xuất đang được tập hợp tại Đơn hàng bán (Sales Order) hoặc TK 154.
   - Đến **Bước 7** khi chạy **Result Analysis (KKA2)** và **Settlement (VA88)**, toàn bộ chi phí thực tế mới được kết chuyển thành Giá vốn hàng bán:
     - **Nợ TK 632** / **Có TK 154**.`;
    }
  }

  if (lowerMsg.includes('261e') || lowerMsg.includes('152') || lowerMsg.includes('621') || step === 3) {
    return `### 📌 Chu trình Chi phí 2 Giai đoạn tại Xưởng Ép Nhựa (MIGO 261E, CO11N, MIGO 101E)
1. **Giai đoạn 1: Tập hợp chi phí sản xuất trực tiếp:**
   - **Xuất hạt nhựa cho Lệnh sản xuất (MIGO 261E):**
     - **Nợ TK 621** (Chi phí NVL trực tiếp) / **Có TK 152** (Hạt nhựa kỹ thuật).
   - **Xác nhận giờ công thợ ép (CO11N Confirmation):**
     - **Nợ TK 622** (Chi phí nhân công trực tiếp) / **Có TK 334** (Phải trả người lao động).
   - **Xác nhận giờ máy & chi phí SXC (CO11N Confirmation):**
     - **Nợ TK 627** (Chi phí sản xuất chung) / **Có TK 214** (Hao mòn máy ép) & **TK 331** (Điện lực).
2. **Giai đoạn Trung gian (Tập hợp chi phí dở dang cuối kỳ):**
   - Kết chuyển toàn bộ chi phí phát sinh trong kỳ sang tài khoản tính giá thành:
     - **Nợ TK 154** / **Có TK 621**: Chi phí NVL trực tiếp.
     - **Nợ TK 154** / **Có TK 622**: Chi phí nhân công trực tiếp.
     - **Nợ TK 154** / **Có TK 627**: Chi phí sản xuất chung.
3. **Giai đoạn 2: Nhập kho thành phẩm hoàn thành (MIGO 101E):**
   - ${isValuated ? '**Kho Valuated Stock:** Nhập kho thành phẩm ghi nhận: **Nợ TK 155 / Có TK 154** theo giá thành kế hoạch (Standard Cost).' : '**Kho Non-valuated Stock:** Nhập kho thành phẩm CHỈ ghi nhận số lượng vật lý vào kho E, KHÔNG sinh bút toán Nợ 155/Có 154 (Số dư TK 155 = 0 đ). Toàn bộ chi phí dở dang lưu lại trên TK 154 cho đến Bước 7 quyết toán!'}`;
  }

  if (lowerMsg.includes('131') || lowerMsg.includes('511') || lowerMsg.includes('doanh thu') || step === 6) {
    return `### 📌 Lập hóa đơn bán hàng OEM (VF01 - Billing)
1. **Căn cứ ghi nhận Doanh thu:**
   - Sau khi giao hàng thành công (PGI), bộ phận kế toán chạy T-code VF01 để lập hóa đơn thương mại gửi khách hàng OEM (Samsung, Canon,...).
2. **Định khoản theo TT 200/2014/TT-BTC:**
   - **Nợ TK 131** (Phải thu của khách hàng): Tổng thanh toán bao gồm thuế GTGT.
   - **Có TK 511** (Doanh thu bán hàng và cung cấp dịch vụ): Doanh thu chưa thuế (Số lượng × Đơn giá bán thỏa thuận).
   - **Có TK 3331** (Thuế GTGT đầu ra phải nộp): 10% thuế GTGT.
3. **Lưu ý trong SAP:** Tài liệu Billing SD (VF01) tự động sinh ra Accounting Document (FI Document) hạch toán đồng thời vào sổ cái.`;
  }

  return `### 📌 Hướng dẫn nghiệp vụ MTO tại PIC Vietnam (Bước ${step})
- **Quy trình MTO (Make-to-Order):** Sản xuất chỉ bắt đầu khi có Đơn hàng bán (Sales Order VA01). Mọi chi phí, kế hoạch vật tư và thành phẩm đều gắn chặt với số hiệu đơn hàng (Special Stock E).
- **Chiến lược:** ${strategy} · **Loại kho:** ${stockType === 'Valuated' ? 'Valuated (Kho có định giá)' : 'Non-valuated (Kho phi định giá)'}.
- **Kiểm tra cân bằng sổ cái:** Mọi bút toán phải thỏa mãn nguyên tắc Kép: Tổng Nợ = Tổng Có. Hệ thống luôn kiểm tra thời gian thực ở bảng Sổ Cái Kế Toán bên dưới.
- Bạn có thể bấm nút **"Giải thích bước này"** ở từng thẻ hoặc hỏi thêm về bất kỳ tài khoản nào (621, 622, 627, 154, 155, 632, 131, 511, 3331, 911).`;
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAP MTO Simulator running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

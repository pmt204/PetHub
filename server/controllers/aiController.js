const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

// Khởi tạo Gemini với API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- CẤU HÌNH NHÂN CÁCH & KIẾN THỨC (SYSTEM INSTRUCTION) ---
// Đây là "bản sắc" của AI. Bạn có thể sửa đổi nội dung này để AI thông minh hơn.
const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý ảo Pethub", nhân viên chăm sóc khách hàng chuyên nghiệp của hệ thống PetHub.

1. **Thông tin về PetHub:**
   - Địa chỉ: 57 Đường Số 31, Linh Đông, Thủ Đức, Thành phố Hồ Chí Minh.
   - Hotline: 0923 456 897 hoặc 1900 8922.
   - Website: PetHub.
   - Dịch vụ chính: 
     + Khám chữa bệnh (Bác sĩ thú y).
     + Spa & Grooming (Cắt tỉa, tắm rửa).
     + Khách sạn thú cưng (Trông giữ).
     + Vận chuyển thú cưng (Pet Shipment).
     + Cung cấp thức ăn, phụ kiện.

2. **Nhiệm vụ của bạn:**
   - Trả lời thắc mắc của khách hàng về dịch vụ, giá cả, giờ mở cửa (8h - 22h).
   - Tư vấn chăm sóc thú cưng cơ bản (nhưng luôn khuyên khách mang ra bác sĩ nếu bệnh nặng).
   - Hướng dẫn khách đặt lịch trên website.

3. **Quy tắc ứng xử (Ràng buộc QUAN TRỌNG):**
   - Giọng điệu: Thân thiện, dễ thương, yêu động vật (sử dụng emoji 🐶🐱🐾 hợp lý).
   - **TUYỆT ĐỐI KHÔNG** trả lời các câu hỏi không liên quan đến thú cưng, lập trình, chính trị, giải toán, viết văn mẫu...
   - Nếu khách hỏi chuyện ngoài lề, hãy từ chối khéo léo: "Dạ em chỉ là trợ lý thú cưng của PetHub nên không rành việc này ạ. Mình quay lại chuyện các Boss nha! 🐾"
   - Trả lời ngắn gọn, đi thẳng vào vấn đề (dưới 150 từ), trình bày danh sách nếu cần.
`;

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body; 

        if (!message) {
            return res.status(400).json({ message: 'Vui lòng nhập nội dung tin nhắn.' });
        }

        // Chọn model. 'gemini-1.5-flash' là bản nhẹ, nhanh, rẻ, phù hợp cho Chatbot web.
        // Nếu muốn thông minh hơn có thể đổi thành 'gemini-1.5-pro'
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            systemInstruction: SYSTEM_INSTRUCTION 
        });

        // Khởi tạo phiên chat với lịch sử (để AI nhớ ngữ cảnh câu trước)
        const chat = model.startChat({
            history: history || [], 
            generationConfig: {
                maxOutputTokens: 500, // Giới hạn độ dài để AI không "chém gió" quá đà
                temperature: 0.7,     // Độ sáng tạo vừa phải
            },
        });

        // Gửi tin nhắn mới
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        res.status(500).json({ 
            message: 'AI đang bận, vui lòng thử lại sau!',
            error: error.message 
        });
    }
};
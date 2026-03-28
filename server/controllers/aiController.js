const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const Doctor = require('../models/Doctors');
const Booking = require('../models/Booking');
const moment = require('moment'); // Cần cài: npm install moment

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 1. ĐỊNH NGHĨA CÔNG CỤ (TOOLS) CHO AI ---
// Đây là các hàm mà AI có thể "nhờ" server chạy để lấy dữ liệu

const toolsFunctions = {
    // Hàm 1: Lấy danh sách bác sĩ
    get_doctor_list: async () => {
        try {
            const doctors = await Doctor.find({ status: 'active' }).select('name specialty experienceYears');
            return JSON.stringify(doctors);
        } catch (e) {
            return "Lỗi khi lấy danh sách bác sĩ.";
        }
    },

    // Hàm 2: Kiểm tra lịch trống của bác sĩ theo ngày
    check_doctor_availability: async ({ doctorName, date }) => {
        try {
            // 1. Tìm bác sĩ theo tên (tìm gần đúng)
            const doctor = await Doctor.findOne({ 
                name: { $regex: new RegExp(doctorName, 'i') },
                status: 'active'
            });

            if (!doctor) return `Không tìm thấy bác sĩ nào tên là "${doctorName}".`;

            // 2. Xác định ngày cần xem
            const queryDate = date ? new Date(date) : new Date();
            const startOfDay = new Date(queryDate); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(queryDate); endOfDay.setHours(23, 59, 59, 999);

            // 3. Lấy các booking đã đặt của bác sĩ đó trong ngày
            const bookings = await Booking.find({
                doctorId: doctor._id,
                bookingDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['pending', 'active', 'paid'] }
            });

            // 4. Danh sách khung giờ cố định
            const allSlots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
                '14:00', '14:30', '15:00'
            ];

            // 5. Loại bỏ giờ đã đặt
            const bookedTimes = bookings.map(b => {
                const d = new Date(b.bookingDate);
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                return `${h}:${m}`;
            });

            const availableSlots = allSlots.filter(t => !bookedTimes.includes(t));

            if (availableSlots.length === 0) return `Bác sĩ ${doctor.name} đã kín lịch vào ngày ${moment(queryDate).format('DD/MM/YYYY')}.`;
            
            return JSON.stringify({
                doctor: doctor.name,
                date: moment(queryDate).format('DD/MM/YYYY'),
                available_slots: availableSlots
            });

        } catch (e) {
            console.error(e);
            return "Lỗi khi kiểm tra lịch.";
        }
    }
};

// --- 2. KHAI BÁO CÔNG CỤ CHO GEMINI HIỂU ---
const toolsDeclaration = [
    {
        function_declarations: [
            {
                name: "get_doctor_list",
                description: "Lấy danh sách tất cả bác sĩ đang hoạt động tại phòng khám, bao gồm tên và chuyên khoa.",
            },
            {
                name: "check_doctor_availability",
                description: "Kiểm tra các khung giờ còn trống của một bác sĩ cụ thể vào một ngày cụ thể.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        doctorName: {
                            type: "STRING",
                            description: "Tên của bác sĩ cần kiểm tra (ví dụ: An, Bình, John...)",
                        },
                        date: {
                            type: "STRING",
                            description: "Ngày cần kiểm tra (định dạng YYYY-MM-DD). Nếu người dùng nói 'hôm nay' hoặc 'ngày mai', hãy tự tính ra ngày.",
                        },
                    },
                    required: ["doctorName"],
                },
            },
        ],
    },
];

// --- 3. CẤU HÌNH SYSTEM INSTRUCTION ---
const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý ảo PetHub".
Thông tin hiện tại: Thời gian server là ${new Date().toLocaleString('vi-VN')}.

1. **Nhiệm vụ:**
   - Trả lời về dịch vụ (Khám, Spa, Hotel, Vận chuyển).
   - **Hỗ trợ tra cứu:** Bạn có quyền truy cập vào dữ liệu bác sĩ và lịch trình. Khi khách hỏi "Có bác sĩ nào?" hoặc "Bác sĩ A rảnh không?", hãy SỬ DỤNG CÔNG CỤ (Function Calling) để lấy dữ liệu thực tế. Đừng tự bịa ra.
   - Sau khi lấy được dữ liệu từ công cụ, hãy trả lời lại khách hàng một cách tự nhiên, dễ thương.

2. **Quy tắc:**
   - Giọng điệu: Thân thiện, dùng emoji 🐶🐱.
   - Trả lời ngắn gọn, xuống dòng rõ ràng.
   - Nếu khách hỏi lịch trống, hãy liệt kê các giờ còn nhận khách.
   - Tuyệt đối KHÔNG trả lời chuyện ngoài lề thú cưng.
`;

exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body; 

        if (!message) return res.status(400).json({ message: 'Vui lòng nhập tin nhắn.' });

        // Cấu hình Model với Tools
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp", // Hoặc gemini-1.5-flash
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: toolsDeclaration,
        });

        const chat = model.startChat({
            history: history || [], 
        });

        // Gửi tin nhắn lần 1
        let result = await chat.sendMessage(message);
        let response = await result.response;
        let text = response.text();

        // --- XỬ LÝ FUNCTION CALLING (Nếu AI yêu cầu dữ liệu) ---
        const functionCalls = response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
            // Nếu AI muốn gọi hàm, ta thực thi hàm đó
            const call = functionCalls[0];
            const functionName = call.name;
            const args = call.args;

            console.log(`🤖 AI đang gọi hàm: ${functionName}`, args);

            let apiResponse = "";
            
            // Chạy hàm tương ứng
            if (functionName === "get_doctor_list") {
                apiResponse = await toolsFunctions.get_doctor_list();
            } else if (functionName === "check_doctor_availability") {
                apiResponse = await toolsFunctions.check_doctor_availability(args);
            }

            // Gửi kết quả từ Database ngược lại cho AI
            // AI sẽ tổng hợp và trả lời câu cuối cùng cho khách
            const result2 = await chat.sendMessage([
                {
                    functionResponse: {
                        name: functionName,
                        response: { content: apiResponse }
                    }
                }
            ]);
            
            text = result2.response.text();
        }

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("Lỗi Gemini AI:", error);
        res.status(500).json({ 
            message: 'Boss ơi, AI đang bị rối lông một xíu, thử lại sau nhé! 🐾',
            error: error.message 
        });
    }
};
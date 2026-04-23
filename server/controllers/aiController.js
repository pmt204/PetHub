const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const Doctor = require('../models/Doctors');
const Booking = require('../models/Booking');
const moment = require('moment');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const toolsFunctions = {
    get_doctor_list: async () => {
        try {
            const doctors = await Doctor.find({ status: 'active' }).select('name specialty experienceYears');
            return { content: JSON.stringify(doctors) }; 
        } catch (e) {
            return { content: "Lỗi khi lấy danh sách bác sĩ." };
        }
    },

    check_doctor_availability: async ({ doctorName, date }) => {
        try {
            const doctor = await Doctor.findOne({ 
                name: { $regex: new RegExp(doctorName, 'i') },
                status: 'active'
            });

            if (!doctor) return { content: `Không tìm thấy bác sĩ nào tên là "${doctorName}".` };

            const queryDate = date ? new Date(date) : new Date();
            const startOfDay = moment(queryDate).startOf('day').toDate();
            const endOfDay = moment(queryDate).endOf('day').toDate();

            const bookings = await Booking.find({
                doctorId: doctor._id,
                bookingDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['pending', 'active', 'paid'] }
            });

            const allSlots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
                '14:00', '14:30', '15:00'
            ];

            const bookedTimes = bookings.map(b => moment(b.bookingDate).format('HH:mm'));
            const availableSlots = allSlots.filter(t => !bookedTimes.includes(t));

            if (availableSlots.length === 0) return { content: `Bác sĩ ${doctor.name} đã kín lịch ngày ${moment(queryDate).format('DD/MM/YYYY')}.` };
            
            return {
                content: JSON.stringify({
                    doctor: doctor.name,
                    date: moment(queryDate).format('DD/MM/YYYY'),
                    available_slots: availableSlots
                })
            };
        } catch (e) {
            return { content: "Lỗi hệ thống khi kiểm tra lịch." };
        }
    }
};

const tools = [
    {
        functionDeclarations: [ 
            {
                name: "get_doctor_list",
                description: "Lấy danh sách bác sĩ tại PetHub.",
            },
            {
                name: "check_doctor_availability",
                description: "Kiểm tra lịch trống của bác sĩ.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        doctorName: { type: "STRING", description: "Tên bác sĩ" },
                        date: { type: "STRING", description: "Ngày (YYYY-MM-DD)" },
                    },
                    required: ["doctorName"],
                },
            },
        ],
    },
];
const SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý ảo PetHub". 
Thông tin hiện tại: Thời gian server là ${new Date().toLocaleString('vi-VN')}.

1. **Nhiệm vụ:**
   - Trả lời về các dịch vụ của PetHub (Khám bệnh, Spa, Hotel, Vận chuyển).
   - **Hỗ trợ tra cứu:** Khi khách hỏi về bác sĩ hoặc lịch hẹn, hãy dùng công cụ (Function Calling) để lấy dữ liệu. Đừng tự bịa tên bác sĩ hay giờ rảnh.
   - Sau khi lấy dữ liệu từ database, hãy trả lời khách hàng một cách tự nhiên.

2. **Quy tắc ứng xử:**
   - Giọng điệu: Thân thiện, nhiệt tình, sử dụng emoji 🐶🐱 để tạo cảm giác gần gũi.
   - Trả lời ngắn gọn, rõ ràng, xuống dòng hợp lý.
   - Tuyệt đối không trả lời các câu hỏi không liên quan đến thú cưng hoặc dịch vụ của phòng khám.
`;
exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ message: 'Vui lòng nhập tin nhắn.' });

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const chat = model.startChat({
            history: history || [],
            tools: tools,
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        
        const functionCalls = response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const apiResponse = await toolsFunctions[call.name](call.args);

            const result2 = await chat.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: apiResponse
                }
            }]);
            
            return res.status(200).json({ reply: result2.response.text() });
        }

        res.status(200).json({ reply: response.text() });

    } catch (error) {
        console.error("Lỗi chi tiết:", error);
        res.status(500).json({ message: 'AI đang bận khám cho bé cưng khác, thử lại nhé! 🐾' });
    }
};
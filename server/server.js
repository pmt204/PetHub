const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const newsRoutes = require('./routes/news');
const categoryServicesRoutes = require('./routes/categoryservices');
const serviceRoutes = require('./routes/services');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const petRoutes = require('./routes/pets');
const customerRoutes = require('./routes/customerRoutes');
const paymentVNPayRoutes = require('./routes/paymentVNPayRoutes');
const paymentMoMoRoutes = require('./routes/paymentMoMoRoutes');
const paymentPayPalRoutes = require('./routes/paymentPayPalRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const upload = require('./upload');
const path = require('path');
const doctorUserRoutes = require('./routes/doctorUserRoutes');
const doctorAdminRoutes = require('./routes/doctorAdminRoutes');
const mapRoutes = require('./routes/mapRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Import các model cần thiết
const Service = require('./models/Service');
const News = require('./models/News');
const Booking = require('./models/Booking');
const Customer = require('./models/Customer');
const Doctor = require('./models/Doctors');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Endpoint upload ảnh
app.post('/api/categoryservices/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không tìm thấy file ảnh' });
  }
  res.json({ image: req.file.filename });
});

app.post('/api/news/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không tìm thấy file ảnh' });
  }
  res.json({ image: req.file.filename });
});

app.post('/api/services/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không tìm thấy file ảnh' });
  }
  console.log('Uploaded file for service:', req.file.filename);
  res.json({ image: req.file.filename });
});

// Endpoint để tải ảnh từ backend
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public/images', filename);
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('Error sending image:', err);
      res.status(404).json({ message: 'Ảnh không tồn tại' });
    }
  });
});

// Endpoint lấy số liệu tổng quan cho dashboard
app.get('/api/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    // 1. Check quyền Admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin được phép truy cập.' });
    }

    const { startDate, endDate } = req.query;

    // 2. Tạo bộ lọc ngày tháng (chỉ lấy đơn đã hoàn thành)
    const filter = { status: 'completed' };
    if (startDate && endDate) {
      // Xử lý endDate để lấy hết ngày cuối cùng (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filter.bookingDate = { 
        $gte: new Date(startDate), 
        $lte: end 
      };
    }

    // 3. Thực hiện truy vấn song song
    // Thay vì Aggregate, ta dùng Find để lấy chi tiết từng đơn hàng
    const [totalServices, totalNews, totalBookings, totalCustomers, completedBookings] = await Promise.all([
      Service.countDocuments(),
      News.countDocuments(),
      Booking.countDocuments(), // Tổng số đơn (tất cả trạng thái)
      Customer.countDocuments(),
      Booking.find(filter)
        .populate('serviceId', 'name price category') // Lấy tên, giá, loại dịch vụ chính
        .populate('subServices', 'name price')        // Lấy tên, giá dịch vụ phụ (QUAN TRỌNG CHO ĐƠN GỘP)
        .populate('customerId', 'name phone')         // Lấy thông tin khách
        .sort({ bookingDate: -1 })                    // Sắp xếp mới nhất lên đầu
    ]);

    // 4. Tính tổng doanh thu từ danh sách đơn hàng đã lấy
    // Sử dụng trường 'totalAmount' của Booking vì nó đã bao gồm (Giá DV + Phụ phí + Vận chuyển) * Số lượng/Ngày
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // 5. Trả về kết quả
    res.json({
      totalServices,
      totalNews,
      totalBookings,
      totalCustomers,
      totalRevenue, 
      revenueDetails: completedBookings // Trả về mảng chi tiết để Frontend vẽ bảng và xuất Excel
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu dashboard' });
  }
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/categoryservices', categoryServicesRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/customers', customerRoutes);
app.use('/auth', authRoutes);
app.use('/api/payment/vnpay', paymentVNPayRoutes);
app.use('/api/payment/momo', paymentMoMoRoutes);
app.use('/api/payment/paypal', paymentPayPalRoutes);
app.use('/api/doctors', doctorUserRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/ai', aiRoutes);

// Tạo router riêng cho admin
const adminRouter = express.Router();
adminRouter.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ message: 'Truy cập thành công', user: req.user });
});
app.use('/admin', adminRouter);
app.use('/api/admin/doctors', authMiddleware, doctorAdminRoutes);

app.get('/', (req, res) => {
  res.send('NekoKin Backend API');
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
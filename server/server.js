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

const Service = require('./models/Service');
const News = require('./models/News');
const Booking = require('./models/Booking');
const Customer = require('./models/Customer');
const Doctor = require('./models/Doctors');

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

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

app.get('/api/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin được phép truy cập.' });
    }

    const { startDate, endDate } = req.query;

    const filter = { status: 'completed' };
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filter.bookingDate = { 
        $gte: new Date(startDate), 
        $lte: end 
      };
    }

    const [totalServices, totalNews, totalBookings, totalCustomers, completedBookings] = await Promise.all([
      Service.countDocuments(),
      News.countDocuments(),
      Booking.countDocuments(), 
      Customer.countDocuments(),
      Booking.find(filter)
        .populate('serviceId', 'name price category') 
        .populate('subServices', 'name price')        
        .populate('customerId', 'name phone')         
        .sort({ bookingDate: -1 })                    
    ]);

    const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    res.json({
      totalServices,
      totalNews,
      totalBookings,
      totalCustomers,
      totalRevenue, 
      revenueDetails: completedBookings 
    });

  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu dashboard' });
  }
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

const adminRouter = express.Router();
adminRouter.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ message: 'Truy cập thành công', user: req.user });
});
app.use('/admin', adminRouter);
app.use('/api/admin/doctors', authMiddleware, doctorAdminRoutes);

app.get('/', (req, res) => {
  res.send('NekoKin Backend API');
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
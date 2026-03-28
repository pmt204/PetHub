const Doctor = require('../models/Doctors'); 
const Customer = require('../models/Customer');

// 1. CREATE DOCTOR
exports.createDoctor = async (req, res) => {
  try {
    const {
      name, specialty, experienceYears, image,
      description, fullDescription, 
      services, // Lưu ý: Frontend phải gửi mảng ID dịch vụ, ví dụ: ["65a...", "65b..."]
      status    // <--- [MỚI] Thêm status để set trạng thái ban đầu nếu cần
    } = req.body;

    const doctor = new Doctor({
      name, specialty, experienceYears, image,
      description, fullDescription, services,
      status: status || 'active' // Mặc định là active nếu không gửi
    });

    const createdDoctor = await doctor.save();
    res.status(201).json(createdDoctor);
  } catch (error) {
    res.status(400).json({ message: 'Tạo bác sĩ thất bại', error: error.message });
  }
};

// 2. GET ALL DOCTORS
exports.getAllDoctors = async (req, res) => {
  try {
    // Không populate services để Frontend lấy được ID so sánh trong BookingModal
    const doctors = await Doctor.find({});
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. GET DOCTOR BY ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('services', 'name');
    if (doctor) {
      res.status(200).json(doctor);
    } else {
      res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. UPDATE DOCTOR (QUAN TRỌNG: Đã thêm cập nhật status)
exports.updateDoctor = async (req, res) => {
  try {
    const {
      name, specialty, experienceYears, image,
      description, fullDescription, 
      services, // Frontend gửi mảng ID mới lên
      status    // <--- [MỚI] Nhận status từ Admin (active/busy)
    } = req.body;

    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
      doctor.name = name || doctor.name;
      doctor.specialty = specialty || doctor.specialty;
      doctor.experienceYears = experienceYears !== undefined ? experienceYears : doctor.experienceYears;
      doctor.image = image || doctor.image;
      doctor.description = description || doctor.description;
      doctor.fullDescription = fullDescription || doctor.fullDescription;
      
      // Cập nhật mảng ID dịch vụ
      if (services) doctor.services = services;

      // Cập nhật trạng thái (active/busy)
      if (status) doctor.status = status; 

      const updatedDoctor = await doctor.save();
      res.status(200).json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại', error: error.message });
  }
};

// 5. DELETE DOCTOR
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
      await doctor.deleteOne();
      res.status(200).json({ message: 'Bác sĩ đã được xóa' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 6. CREATE REVIEW
exports.createDoctorReview = async (req, res) => {
  const { rating, comment } = req.body;
  const doctorId = req.params.id;

  if (!rating || !comment) {
    return res.status(400).json({ message: 'Vui lòng nhập rating và bình luận' });
  }

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }

    const customer = await Customer.findById(req.user.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin customer' });
    }

    const alreadyReviewed = doctor.reviews.find(
      (r) => r.user.toString() === customer._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Bạn đã đánh giá bác sĩ này rồi' });
    }

    const review = {
      user: customer._id,
      name: customer.name,
      rating: Number(rating),
      comment: comment,
    };

    doctor.reviews.push(review);

    doctor.numReviews = doctor.reviews.length;
    doctor.rating =
      doctor.reviews.reduce((acc, item) => item.rating + acc, 0) /
      doctor.reviews.length;

    await doctor.save();
    res.status(201).json({ message: 'Đánh giá đã được thêm' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
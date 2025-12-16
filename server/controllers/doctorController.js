const Doctor = require('../models/Doctors'); // Đảm bảo tên file đúng với thực tế
const Customer = require('../models/Customer');

// 1. CREATE DOCTOR
exports.createDoctor = async (req, res) => {
  try {
    const {
      name, specialty, experienceYears, image,
      description, fullDescription, services,
    } = req.body;

    const doctor = new Doctor({
      name, specialty, experienceYears, image,
      description, fullDescription, services,
    });

    const createdDoctor = await doctor.save();
    res.status(201).json(createdDoctor);
  } catch (error) {
    res.status(400).json({ message: 'Tạo bác sĩ thất bại', error: error.message });
  }
};

// 2. GET ALL DOCTORS (Đã sửa: Bỏ populate)
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. GET DOCTOR BY ID (Đã sửa: Bỏ populate)
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
      res.status(200).json(doctor);
    } else {
      res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. UPDATE DOCTOR (Đã đồng bộ tốt)
exports.updateDoctor = async (req, res) => {
  try {
    const {
      name, specialty, experienceYears, image,
      description, fullDescription, services,
    } = req.body;

    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
      doctor.name = name || doctor.name;
      doctor.specialty = specialty || doctor.specialty;
      // Kiểm tra undefined để cho phép giá trị 0
      doctor.experienceYears = experienceYears !== undefined ? experienceYears : doctor.experienceYears;
      doctor.image = image || doctor.image;
      doctor.description = description || doctor.description;
      doctor.fullDescription = fullDescription || doctor.fullDescription;
      doctor.services = services || doctor.services;

      const updatedDoctor = await doctor.save();
      res.status(200).json(updatedDoctor);
    } else {
      res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Cập nhật thất bại', error: error.message });
  }
};

// 5. DELETE DOCTOR (Đã đồng bộ tốt)
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

// 6. CREATE REVIEW (Đã đồng bộ tốt với reviewSchema)
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
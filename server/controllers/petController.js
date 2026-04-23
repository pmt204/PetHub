const Pet = require('../models/Pet');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');

exports.getPets = async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const pets = await Pet.find({ customerId }).sort({ createdAt: -1 }).lean();
    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    const pet = await Pet.findOne({ _id: id, customerId }).lean();

    if (!pet) {
      return res.status(404).json({ message: 'Thú cưng không tồn tại hoặc không thuộc về bạn' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Get pet detail error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.createPet = async (req, res) => {
  const { name, type, ageRange } = req.body;
  
  if (!name || !type) {
      return res.status(400).json({ message: 'Tên và loài là bắt buộc' });
  }

  try {
    const customerId = req.user.customerId;
    
    const pet = await Pet.create({ name, type, ageRange, customerId });
    
    await Customer.findByIdAndUpdate(customerId, { $push: { pets: pet._id } });
    
    res.status(201).json(pet);
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.updatePet = async (req, res) => {
  const { name, type, ageRange } = req.body;
  const petId = req.params.id;

  try {
    const pet = await Pet.findOneAndUpdate(
      { _id: petId, customerId: req.user.customerId }, 
      { name, type, ageRange }, 
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({ message: 'Thú cưng không tồn tại hoặc không thuộc về bạn' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.deletePet = async (req, res) => {
  const petId = req.params.id;
  const customerId = req.user.customerId;

  try {
    const pet = await Pet.findOneAndDelete({ _id: petId, customerId });

    if (!pet) {
      return res.status(404).json({ message: 'Thú cưng không tồn tại hoặc không thuộc về bạn' });
    }

    await Customer.findByIdAndUpdate(customerId, { $pull: { pets: petId } });

    res.json({ message: 'Thú cưng đã được xóa' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.getServiceHistory = async (req, res) => {
  try {
    const { petId } = req.params;
    const customerId = req.user.customerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const isOwner = await Pet.exists({ _id: petId, customerId });
    if (!isOwner) {
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn không có quyền xem lịch sử của thú cưng này' 
        });
    }

    const query = { 
      petId, 
      status: 'completed' 
    };

    const bookings = await Booking.find(query)
      .select('serviceId subServices bookingDate checkIn checkOut totalAmount doctorId notes shipmentDetails')
      .populate('serviceId', 'name image price category')
      .populate('subServices', 'name price') 
      .populate('doctorId', 'name image specialty') 
      .sort({ bookingDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Lỗi getServiceHistory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message 
    });
  }
};
const Customer = require('../models/Customer');
const Pet = require('../models/Pet');
const Booking = require('../models/Booking');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate('pets');
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách khách hàng' });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('pets');
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin khách hàng' });
  }
};

exports.getBookingsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const bookings = await Booking.find({ customerId })
      .populate('serviceId', 'name price category')
      .populate('petId', 'name type');
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by customer ID:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách booking' });
  }
};
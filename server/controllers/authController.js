const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { username, password, email, customerName, phone } = req.body;
  console.log('Register attempt:', { username, email });
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
    }

    let customerId = null;
    if (customerName && phone) {
      const customer = new Customer({ name: customerName, phone, pets: [] });
      await customer.save();
      customerId = customer._id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new User({ username, password: hashedPassword, email, customerId }).save();
    console.log('User saved:', user);

    const token = jwt.sign(
      { id: user._id, username: user.username, role: 'user', customerId: user.customerId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { username: user.username, email: user.email, role: 'user', customerId: user.customerId },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });
  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    const query = isEmail ? { email: username } : { username: username };

    const user = await User.findOne(query).populate('customerId');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Tên đăng nhập, email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role || 'user', customerId: user.customerId?._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful:', user);
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        customerId: user.customerId?._id,
        customer: user.customerId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('customerId');
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });
    res.json({
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      customerId: user.customerId?._id,
      customer: user.customerId,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

exports.updateCustomer = async (req, res) => {
  const { name, phone } = req.body;
  const customerId = req.params.id;
  try {
    const customer = await Customer.findByIdAndUpdate(customerId, { name, phone }, { new: true });
    if (!customer) return res.status(404).json({ message: 'Khách hàng không tồn tại' });
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
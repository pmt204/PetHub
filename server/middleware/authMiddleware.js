const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    if (!decoded.role) {
      return res.status(401).json({ message: 'Token không chứa vai trò (role)' });
    }

    if (decoded.role === 'customer' && !decoded.customerId) {
      return res.status(401).json({ message: 'Token của customer phải chứa customerId' });
    }

    req.user = {
      id: decoded.id, 
      customerId: decoded.customerId || null, 
      role: decoded.role
    };

    if (req.path.startsWith('/admin') && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Chỉ admin có quyền truy cập' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
    }
    console.error('JWT verification error:', error.message); 
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

module.exports = authMiddleware;
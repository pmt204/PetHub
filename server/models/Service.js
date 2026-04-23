const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }, 
  category: { 
    type: Number, 
    required: true 
  },
  totalRooms: { 
    type: Number, 
    min: 0 
  }
});

serviceSchema.pre('validate', async function(next) {
  try {
    if (this.category != null) {
      const category = await mongoose.model('CategoryService').findOne({ _id: this.category });
      if (category && category.name === 'Khách sạn thú cưng' && this.totalRooms == null) {
        return next(new Error('totalRooms là bắt buộc cho dịch vụ Khách sạn thú cưng'));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

serviceSchema.index({ category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
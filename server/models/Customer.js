const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
});

module.exports = mongoose.model('Customer', CustomerSchema);
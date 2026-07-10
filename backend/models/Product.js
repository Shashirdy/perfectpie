const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the pizza name'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide the price'],
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['Veg', 'Non-Veg', 'Custom'],
      default: 'Veg',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);

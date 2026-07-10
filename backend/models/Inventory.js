const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the item name'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Please provide the item type'],
      enum: ['base', 'sauce', 'cheese', 'veggie'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide the item price'],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Please provide the stock count'],
      default: 100,
    },
    threshold: {
      type: Number,
      required: [true, 'Please provide the low-stock threshold'],
      default: 20,
    },
    image: {
      type: String,
      default: '',
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

module.exports = mongoose.model('Inventory', inventorySchema);

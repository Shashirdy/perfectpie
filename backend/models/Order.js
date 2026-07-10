const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pizzas: [
      {
        name: {
          type: String,
          default: 'Custom Pizza',
        },
        base: {
          type: String,
          required: true,
        },
        sauce: {
          type: String,
          required: true,
        },
        cheese: {
          type: String,
          required: true,
        },
        veggies: {
          type: [String],
          default: [],
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Received', 'Preparing', 'Baking', 'Packaging', 'Out for Delivery', 'Delivered'],
      default: 'Received',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    paymentDetails: {
      paymentId: String,
      signature: String,
      method: String,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please provide a delivery address'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
    },
    statusLogs: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to push log when status changes
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusLogs.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

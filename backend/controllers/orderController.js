const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { pizzas, totalAmount, discountAmount, finalAmount, deliveryAddress, phone, paymentDetails } = req.body;

    if (!pizzas || pizzas.length === 0) {
      return res.status(400).json({ success: false, message: 'No pizzas in order' });
    }

    // 1. Verify and deduct inventory
    for (const pizza of pizzas) {
      const qty = pizza.quantity || 1;

      // Check base stock
      const baseItem = await Inventory.findOne({ name: pizza.base, type: 'base' });
      if (!baseItem || baseItem.stock < qty) {
        return res.status(400).json({ success: false, message: `Ingredient '${pizza.base}' is out of stock` });
      }

      // Check sauce stock
      const sauceItem = await Inventory.findOne({ name: pizza.sauce, type: 'sauce' });
      if (!sauceItem || sauceItem.stock < qty) {
        return res.status(400).json({ success: false, message: `Ingredient '${pizza.sauce}' is out of stock` });
      }

      // Check cheese stock
      const cheeseItem = await Inventory.findOne({ name: pizza.cheese, type: 'cheese' });
      if (!cheeseItem || cheeseItem.stock < qty) {
        return res.status(400).json({ success: false, message: `Ingredient '${pizza.cheese}' is out of stock` });
      }

      // Check veggie stock
      for (const veggie of pizza.veggies) {
        const veggieItem = await Inventory.findOne({ name: veggie, type: 'veggie' });
        if (!veggieItem || veggieItem.stock < qty) {
          return res.status(400).json({ success: false, message: `Ingredient '${veggie}' is out of stock` });
        }
      }
    }

    // Deduct stock after all ingredients are verified
    for (const pizza of pizzas) {
      const qty = pizza.quantity || 1;

      await Inventory.findOneAndUpdate({ name: pizza.base, type: 'base' }, { $inc: { stock: -qty } });
      await Inventory.findOneAndUpdate({ name: pizza.sauce, type: 'sauce' }, { $inc: { stock: -qty } });
      await Inventory.findOneAndUpdate({ name: pizza.cheese, type: 'cheese' }, { $inc: { stock: -qty } });

      for (const veggie of pizza.veggies) {
        await Inventory.findOneAndUpdate({ name: veggie, type: 'veggie' }, { $inc: { stock: -qty } });
      }
    }

    // 2. Create the order in database
    const order = await Order.create({
      customer: req.user._id,
      pizzas,
      totalAmount,
      discountAmount,
      finalAmount,
      deliveryAddress,
      phone,
      paymentStatus: paymentDetails && paymentDetails.paymentId ? 'Completed' : 'Pending',
      paymentDetails,
    });

    // 3. Create Admin Notifications
    await Notification.create({
      recipient: null, // Admin
      message: `New order received for $${finalAmount.toFixed(2)} from ${req.user.name}`,
      type: 'Order',
    });

    // 4. Emit Socket.IO event to Admins
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', {
        id: order._id,
        customerName: req.user.name,
        finalAmount: order.finalAmount,
        status: order.status,
      });
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to create order.' });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get orders error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve orders.' });
  }
};

// @desc    Get log-in customer's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('Get customer orders error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve your orders.' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order by ID error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve order details.' });
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update status. Order pre-save middleware will push log.
    order.status = status;
    await order.save();

    // Create Notification for the specific customer
    await Notification.create({
      recipient: order.customer,
      message: `Your order status has been updated to: ${status}`,
      type: 'Order',
    });

    // Send real-time Socket.IO notification to client
    const io = req.app.get('io');
    if (io) {
      // Emit status update event targeting the order's ID
      io.emit(`order_status_${order._id}`, { status, statusLogs: order.statusLogs });
      // Emit general updates for notification panel
      io.emit(`notification_${order.customer}`, {
        message: `Your order status has been updated to: ${status}`,
        type: 'Order',
      });
    }

    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to update status.' });
  }
};

const express = require('express');
const { createOrder, getOrders, getCustomerOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, authorize('admin'), getOrders);

router.get('/my-orders', protect, getCustomerOrders);

router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;

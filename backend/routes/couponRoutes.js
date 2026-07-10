const express = require('express');
const { getCoupons, createCoupon, validateCoupon, deleteCoupon, seedCoupons } = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getCoupons);
router.post('/validate', protect, validateCoupon);

// Admin operations
router.post('/', protect, authorize('admin'), createCoupon);
router.post('/seed', protect, authorize('admin'), seedCoupons);
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

module.exports = router;

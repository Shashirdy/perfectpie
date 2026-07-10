const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Public / Private
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    console.error('Get coupons error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve coupons.' });
  }
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiryDate } = req.body;

    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderValue,
      expiryDate,
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', data: coupon });
  } catch (error) {
    console.error('Create coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to create coupon.' });
  }
};

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon code has expired' });
    }

    // Check minimum order value
    if (orderAmount < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of $${coupon.minOrderValue.toFixed(2)} required for this coupon`,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = orderAmount * (coupon.discountValue / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    // Cap discount to order amount
    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        finalAmount: parseFloat((orderAmount - discountAmount).toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to validate coupon.' });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to delete coupon.' });
  }
};

// @desc    Seed initial coupons
// @route   POST /api/coupons/seed
// @access  Private/Admin
exports.seedCoupons = async (req, res) => {
  try {
    const count = await Coupon.countDocuments();
    if (count > 0) {
      return res.status(400).json({ success: false, message: 'Coupons already seeded' });
    }

    const defaultCoupons = [
      {
        code: 'PIZZA20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 20,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        code: 'WELCOME10',
        discountType: 'flat',
        discountValue: 10,
        minOrderValue: 15,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        code: 'CHEESEOVERLOAD',
        discountType: 'percentage',
        discountValue: 15,
        minOrderValue: 10,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    ];

    const seeded = await Coupon.insertMany(defaultCoupons);
    res.status(201).json({ success: true, count: seeded.length, message: 'Coupons seeded successfully' });
  } catch (error) {
    console.error('Seed coupons error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to seed coupons.' });
  }
};

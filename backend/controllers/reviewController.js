const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Get reviews for a pizza name
// @route   GET /api/reviews/:pizzaName
// @access  Public
exports.getReviews = async (req, res) => {
  try {
    const { pizzaName } = req.params;
    const reviews = await Review.find({ pizzaName }).populate('user', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error('Get reviews error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to load reviews.' });
  }
};

// @desc    Add review for a pizza
// @route   POST /api/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { pizzaName, rating, comment } = req.body;

    if (!pizzaName || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide all review details' });
    }

    const review = await Review.create({
      user: req.user._id,
      pizzaName,
      rating,
      comment,
    });

    // Recalculate and update the rating of the preset product if it exists
    const product = await Product.findOne({ name: pizzaName });
    if (product) {
      const allReviews = await Review.find({ pizzaName });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.rating = parseFloat(avgRating.toFixed(1));
      await product.save();
    }

    // Populate user's name before sending back
    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    res.status(201).json({ success: true, message: 'Review added successfully', data: populatedReview });
  } catch (error) {
    console.error('Add review error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to post review.' });
  }
};

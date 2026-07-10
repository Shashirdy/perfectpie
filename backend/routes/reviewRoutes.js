const express = require('express');
const { getReviews, addReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:pizzaName', getReviews);
router.post('/', protect, addReview);

module.exports = router;

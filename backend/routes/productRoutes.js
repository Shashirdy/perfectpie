const express = require('express');
const { getProducts, getProductById, createProduct, seedProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only creation & seeding
router.post('/', protect, authorize('admin'), createProduct);
router.post('/seed', protect, authorize('admin'), seedProducts);

module.exports = router;

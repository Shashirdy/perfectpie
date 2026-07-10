const express = require('express');
const { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateStock, seedInventory } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Publicly available to load customizations in Pizza Builder
router.get('/', getInventory);

// Admin-only endpoints
router.post('/', protect, authorize('admin'), addInventoryItem);
router.post('/seed', protect, authorize('admin'), seedInventory);
router.put('/:id', protect, authorize('admin'), updateInventoryItem);
router.patch('/:id/stock', protect, authorize('admin'), updateStock);
router.delete('/:id', protect, authorize('admin'), deleteInventoryItem);

module.exports = router;

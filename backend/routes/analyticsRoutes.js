const express = require('express');
const { getDashboardSummary, getChartData } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/summary', getDashboardSummary);
router.get('/charts', getChartData);

module.exports = router;

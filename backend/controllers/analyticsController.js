const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

// Helper to get past dates
const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// @desc    Get dashboard summary statistics
// @route   GET /api/analytics/summary
// @access  Private/Admin
exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Revenue (Completed payments)
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 2. Total Orders
    const totalOrders = await Order.countDocuments({});

    // 3. Registered Customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Pending Orders (Not Delivered yet)
    const pendingOrders = await Order.countDocuments({ status: { $ne: 'Delivered' } });

    // 5. Low Stock Alert count
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$stock', '$threshold'] },
    });

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        pendingOrders,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((item) => ({
          id: item._id,
          name: item.name,
          type: item.type,
          stock: item.stock,
          threshold: item.threshold,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics summary error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to load analytics summary.' });
  }
};

// @desc    Get chart data for sales (daily, monthly)
// @route   GET /api/analytics/charts
// @access  Private/Admin
exports.getChartData = async (req, res) => {
  try {
    // Let's run a check. If there are 0 completed orders, return realistic mock data for preview.
    const completedCount = await Order.countDocuments({ paymentStatus: 'Completed' });

    if (completedCount === 0) {
      // Return high-fidelity preview mock data
      return res.status(200).json({
        success: true,
        isMock: true,
        data: {
          dailySales: [
            { date: 'Mon', sales: 4, revenue: 120.5 },
            { date: 'Tue', sales: 6, revenue: 185.0 },
            { date: 'Wed', sales: 8, revenue: 240.25 },
            { date: 'Thu', sales: 5, revenue: 150.8 },
            { date: 'Fri', sales: 12, revenue: 380.0 },
            { date: 'Sat', sales: 18, revenue: 540.5 },
            { date: 'Sun', sales: 14, revenue: 410.2 },
          ],
          monthlySales: [
            { month: 'Jan', sales: 120, revenue: 3200 },
            { month: 'Feb', sales: 150, revenue: 4100 },
            { month: 'Mar', sales: 180, revenue: 4900 },
            { month: 'Apr', sales: 210, revenue: 5800 },
            { month: 'May', sales: 250, revenue: 6900 },
            { month: 'Jun', sales: 290, revenue: 8100 },
          ],
          popularIngredients: [
            { name: 'Cheese Burst', count: 45 },
            { name: 'BBQ Sauce', count: 38 },
            { name: 'Mushroom', count: 65 },
            { name: 'Paneer', count: 52 },
            { name: 'Mozzarella', count: 88 },
          ],
        },
      });
    }

    // Otherwise, perform real MongoDB aggregations
    // Daily sales for last 7 days
    const sevenDaysAgo = getPastDate(7);
    const dailyAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'Completed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailySales = dailyAgg.map((item) => ({
      date: item._id,
      sales: item.sales,
      revenue: parseFloat(item.revenue.toFixed(2)),
    }));

    // Monthly sales for current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const monthlyAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'Completed',
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%b', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$finalAmount' },
        },
      },
    ]);

    const monthlySales = monthlyAgg.map((item) => ({
      month: item._id,
      sales: item.sales,
      revenue: parseFloat(item.revenue.toFixed(2)),
    }));

    res.status(200).json({
      success: true,
      isMock: false,
      data: {
        dailySales,
        monthlySales,
      },
    });
  } catch (error) {
    console.error('Analytics chart error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to load chart data.' });
  }
};

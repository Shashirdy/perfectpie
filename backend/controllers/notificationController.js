const Notification = require('../models/Notification');

// @desc    Get current user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      // Admins get admin-wide notifications (recipient = null)
      query = { recipient: null };
    } else {
      // Customers get their own specific notifications
      query = { recipient: req.user._id };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve notifications.' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Verify recipient matches
    if (req.user.role !== 'admin' && notification.recipient?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to read this notification' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    console.error('Mark notification read error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to update notification.' });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllRead = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = { recipient: null, isRead: false };
    } else {
      query = { recipient: req.user._id, isRead: false };
    }

    await Notification.updateMany(query, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to clear notifications.' });
  }
};

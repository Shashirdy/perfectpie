const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/email');

// Function to check inventory levels and create notifications + send emails
const checkStockLevels = async () => {
  try {
    console.log('[Cron Job] Checking stock levels...');
    
    // Find all items where stock <= threshold and available
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$stock', '$threshold'] },
    });

    if (lowStockItems.length === 0) {
      console.log('[Cron Job] All stock levels are healthy.');
      return;
    }

    // Get all admin users
    const admins = await User.find({ role: 'admin' }).select('email name');
    const adminEmails = admins.map((admin) => admin.email);

    if (adminEmails.length === 0) {
      console.warn('[Cron Job] No admin emails found. Alerts will only be logged.');
    }

    for (const item of lowStockItems) {
      // Avoid spamming: Check if an unread notification for this specific item exists
      const queryMessage = `Stock alert: Ingredient '${item.name}' is low. Current stock: ${item.stock} (Threshold: ${item.threshold})`;
      const existingNotification = await Notification.findOne({
        recipient: null,
        type: 'Inventory',
        message: queryMessage,
        isRead: false,
      });

      if (existingNotification) {
        // Notification already exists and is unread, skip sending email/alerts
        continue;
      }

      // Create new admin notification
      await Notification.create({
        recipient: null, // admin
        message: queryMessage,
        type: 'Inventory',
      });

      console.log(`[Cron Job] Created stock warning notification for item: ${item.name}`);

      // Send email to admins
      if (adminEmails.length > 0) {
        const emailContent = `
          <h3>Low Stock Alert - PerfectPie Inventory</h3>
          <p>Dear Administrator,</p>
          <p>The following ingredient in the PerfectPie inventory is running low:</p>
          <table border="1" cellpadding="5" style="border-collapse: collapse; border-color: #E2E8F0;">
            <tr bgcolor="#F7FAFC">
              <th>Ingredient Name</th>
              <th>Type</th>
              <th>Current Stock</th>
              <th>Threshold Limit</th>
            </tr>
            <tr>
              <td><strong>${item.name}</strong></td>
              <td>${item.type}</td>
              <td style="color: #E53E3E; font-weight: bold;">${item.stock} units</td>
              <td>${item.threshold} units</td>
            </tr>
          </table>
          <br/>
          <p>Please restock this ingredient soon using your Administrator Dashboard.</p>
          <p>Thank you,<br/>PerfectPie System Scheduler</p>
        `;

        await sendEmail({
          to: adminEmails.join(','),
          subject: `⚠️ Low Stock Warning: ${item.name}`,
          html: emailContent,
        });
      }
    }
  } catch (error) {
    console.error('[Cron Job Error] Failed to check stock levels:', error.message);
  }
};

// Initialize Cron Job
const initCron = (io) => {
  // Run once on server startup (after a short delay to let DB connect)
  setTimeout(() => {
    checkStockLevels();
  }, 10000);

  // Schedule to run every hour: "0 * * * *"
  // For safety and testing, we run every hour. We can do '0 * * * *'
  cron.schedule('0 * * * *', () => {
    checkStockLevels();
  });
  
  console.log('Cron Job Scheduler Initialized.');
};

module.exports = { initCron, checkStockLevels };

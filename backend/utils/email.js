const nodemailer = require('nodemailer');

// Helper to create a nodemailer transporter
const getTransporter = async () => {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587');
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;

  // If user/pass are not specified, create an Ethereal test account dynamically
  if (!user || !pass) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log(`Generated Ethereal SMTP User: ${user}`);
    } catch (err) {
      console.warn('Failed to generate Ethereal account. Emails will be logged to console.');
      return {
        sendMail: async (options) => {
          console.log(`[MOCK EMAIL SENT] To: ${options.to}, Subject: ${options.subject}`);
          console.log(`Body: ${options.text || options.html}`);
          return { messageId: 'mock-id-' + Date.now() };
        },
      };
    }
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async (options) => {
  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"PerfectPie Notifications" <noreply@perfectpie.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email Sent: ${info.messageId}`);
    
    // Log Ethereal preview link if applicable
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Return mock success so it doesn't block the rest of the application
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;

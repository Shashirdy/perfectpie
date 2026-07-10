const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_perfect_pie_key_2026_safe_hash', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create user (pre-save handles password hashing)
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'customer', // Guard admin role allocation if necessary
      verificationToken,
    });

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    const emailMessage = `Welcome to PerfectPie, ${name}!\n\nPlease verify your email by clicking the following link:\n\n${verificationUrl}\n\nThank you!`;

    await sendEmail({
      to: user.email,
      subject: 'PerfectPie Email Verification',
      text: emailMessage,
      html: `
        <h3>Welcome to PerfectPie, ${name}!</h3>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="background-color: #EAB308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
        <br/><p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. A verification link has been sent to your email.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to register user.' });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      // Return HTML page for browser-direct link clicks
      return res.status(400).send(`
        <div style="text-align: center; margin-top: 100px; font-family: sans-serif;">
          <h2 style="color: #EF4444;">Verification Failed</h2>
          <p>Invalid or expired verification token.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #3B82F6;">Back to PerfectPie</a>
        </div>
      `);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).send(`
      <div style="text-align: center; margin-top: 100px; font-family: sans-serif;">
        <h2 style="color: #10B981;">Verification Successful!</h2>
        <p>Thank you for verifying your email. You can now login to PerfectPie.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #EAB308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
      </div>
    `);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).send(`<h3>Server error during email verification.</h3>`);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Retrieve user and explicitly select password since it was hidden
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to log in.' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set expiry
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailMessage = `You requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link expires in 10 minutes.`;

    await sendEmail({
      to: user.email,
      subject: 'PerfectPie Password Reset Request',
      text: emailMessage,
      html: `
        <h3>PerfectPie Password Reset</h3>
        <p>You requested a password reset. Please click the button below to update your password:</p>
        <a href="${resetUrl}" style="background-color: #EAB308; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        <br/><p>The link is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      `,
    });

    res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to send reset email.' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Update password (pre-save hook will re-hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error. Failed to reset password.' });
  }
};

// @desc    Get user profile (current session)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

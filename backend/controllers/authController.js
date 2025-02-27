// controllers/authController.js
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const Buddy = require('../models/Buddy');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    return next(new ErrorResponse('Email already in use', 400));
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password
  });
  
  // Find default buddy
  const defaultBuddy = await Buddy.findOne({ isDefault: true });
  
  if (defaultBuddy) {
    user.preferences.defaultBuddy = defaultBuddy._id;
    await user.save();
  }
  
  // Create user stats for the new user
  await UserStats.create({ user: user._id });
  
  // Create verification token and send email
  const verificationToken = crypto.randomBytes(20).toString('hex');
  
  user.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  await user.save({ validateBeforeSave: false });
  
  // Send verification email (commented out for development)
  /*
  try {
    const verificationUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/verify-email/${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      text: `Please verify your email by clicking on the following link: ${verificationUrl}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      data: { userId: user._id }
    });
  } catch (err) {
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Email could not be sent', 500));
  }
  */
  
  // For development, just send success without email verification
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }
  
  // Check for user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  // Check if password matches
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  
  // Update last login time
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('preferences.defaultBuddy');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {}
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const verificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  
  const user = await User.findOne({
    verificationToken
  });
  
  if (!user) {
    return next(new ErrorResponse('Invalid verification token', 400));
  }
  
  // Set user as verified and remove verification token
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {}
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }
  
  // Get reset token
  const resetToken = user.getResetPasswordToken();
  
  await user.save({ validateBeforeSave: false });
  
  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/reset-password/${resetToken}`;
  
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please follow this link to reset your password: \n\n ${resetUrl}`;
  
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password reset token',
      text: message
    });
    
    res.status(200).json({
      success: true,
      message: 'Email sent'
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save({ validateBeforeSave: false });
    
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }
  
  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});

// @desc    Update user details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };
  
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }
  
  user.password = req.body.newPassword;
  await user.save();
  
  sendTokenResponse(user, 200, res);
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  
  // Remove password from output
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: user
  });
};

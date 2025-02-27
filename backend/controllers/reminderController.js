// controllers/reminderController.js
const Reminder = require('../models/Reminder');
const UserStats = require('../models/UserStats');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all reminders for a user
// @route   GET /api/reminders
// @access  Private
exports.getReminders = asyncHandler(async (req, res, next) => {
  // Build query
  let query = { user: req.user.id };
  
  // Filtering
  if (req.query.completed) {
    query.completed = req.query.completed === 'true';
  }
  
  if (req.query.priority) {
    query.priority = req.query.priority;
  }
  
  if (req.query.tag) {
    query.tags = { $in: [req.query.tag] };
  }
  
  // Date filtering
  if (req.query.from) {
    query.dueDate = { ...query.dueDate, $gte: new Date(req.query.from) };
  }
  
  if (req.query.to) {
    const toDate = new Date(req.query.to);
    toDate.setHours(23, 59, 59, 999); // End of the day
    query.dueDate = { ...query.dueDate, $lte: toDate };
  }
  
  // Today's reminders
  if (req.query.today === 'true') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    query.dueDate = { $gte: startOfDay, $lte: endOfDay };
  }
  
  // Overdue reminders
  if (req.query.overdue === 'true') {
    const now = new Date();
    query.dueDate = { $lt: now };
    query.completed = false;
  }
  
  // Execute query with sorting
  const sortField = req.query.sort || 'dueDate';
  const sortOrder = req.query.order === 'desc' ? -1 : 1;
  
  const reminders = await Reminder.find(query)
    .sort({ [sortField]: sortOrder })
    .limit(req.query.limit ? parseInt(req.query.limit) : 100);
  
  res.status(200).json({
    success: true,
    count: reminders.length,
    data: reminders
  });
});

// @desc    Get single reminder
// @route   GET /api/reminders/:id
// @access  Private
exports.getReminder = asyncHandler(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return next(new ErrorResponse(`Reminder not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user owns the reminder
  if (reminder.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to access this reminder`, 401));
  }
  
  res.status(200).json({
    success: true,
    data: reminder
  });
});

// More methods (createReminder, updateReminder, etc.) follow similar patterns
// @desc    Create new reminder
// @route   POST /api/reminders
// @access  Private
exports.createReminder = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;
  
  // Create reminder
  const reminder = await Reminder.create(req.body);
  
  res.status(201).json({
    success: true,
    data: reminder
  });
});

// @desc    Update reminder
// @route   PUT /api/reminders/:id
// @access  Private
exports.updateReminder = asyncHandler(async (req, res, next) => {
  let reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return next(new ErrorResponse(`Reminder not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user owns the reminder
  if (reminder.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this reminder`, 401));
  }
  
  // Update reminder
  reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: reminder
  });
});

// @desc    Delete reminder
// @route   DELETE /api/reminders/:id
// @access  Private
exports.deleteReminder = asyncHandler(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return next(new ErrorResponse(`Reminder not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user owns the reminder
  if (reminder.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to delete this reminder`, 401));
  }
  
  await reminder.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle reminder completion status
// @route   PUT /api/reminders/:id/complete
// @access  Private
exports.toggleComplete = asyncHandler(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return next(new ErrorResponse(`Reminder not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user owns the reminder
  if (reminder.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to update this reminder`, 401));
  }
  
  // Toggle completion status
  reminder.completed = !reminder.completed;
  
  if (reminder.completed) {
    reminder.completedAt = Date.now();
  } else {
    reminder.completedAt = null;
  }
  
  await reminder.save();
  
  res.status(200).json({
    success: true,
    data: reminder
  });
});

// @desc    Snooze reminder
// @route   PUT /api/reminders/:id/snooze
// @access  Private
exports.snoozeReminder = asyncHandler(async (req, res, next) => {
  const reminder = await Reminder.findById(req.params.id);
  
  if (!reminder) {
    return next(new ErrorResponse(`Reminder not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user owns the reminder
  if (reminder.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User not authorized to snooze this reminder`, 401));
  }
  
  // Validate snooze duration
  if (!req.body.snoozeDuration) {
    return next(new ErrorResponse('Please provide a snooze duration', 400));
  }
  
  // Calculate new due date based on snooze duration
  const newDueDate = new Date();
  const duration = req.body.snoozeDuration;
  
  if (duration === '15min') {
    newDueDate.setMinutes(newDueDate.getMinutes() + 15);
  } else if (duration === '1hour') {
    newDueDate.setHours(newDueDate.getHours() + 1);
  } else if (duration === '3hours') {
    newDueDate.setHours(newDueDate.getHours() + 3);
  } else if (duration === 'tomorrow') {
    newDueDate.setDate(newDueDate.getDate() + 1);
    // Reset to 9 AM
    newDueDate.setHours(9, 0, 0, 0);
  } else if (duration === 'nextweek') {
    newDueDate.setDate(newDueDate.getDate() + 7);
    // Reset to 9 AM
    newDueDate.setHours(9, 0, 0, 0);
  } else {
    return next(new ErrorResponse('Invalid snooze duration', 400));
  }
  
  // Update reminder with new due date
  reminder.dueDate = newDueDate;
  await reminder.save();
  
  res.status(200).json({
    success: true,
    data: reminder
  });
});

// @desc    Get reminder analytics
// @route   GET /api/reminders/analytics
// @access  Private
exports.getReminderAnalytics = asyncHandler(async (req, res, next) => {
  // Time period filtering
  const endDate = new Date();
  let startDate = new Date();
  
  // Default is last 30 days
  const period = req.query.period || '30days';
  
  if (period === '7days') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30days') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === '90days') {
    startDate.setDate(startDate.getDate() - 90);
  } else if (period === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  // Calculate basic stats
  const stats = {
    total: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

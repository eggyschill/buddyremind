// routes/reminders.js
const express = require('express');
const {
  getReminders,
  getReminder,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleComplete,
  snoozeReminder,
  getReminderAnalytics
} = require('../controllers/reminderController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Analytics route
router.get('/analytics', getReminderAnalytics);

// Base routes
router
  .route('/')
  .get(getReminders)
  .post(createReminder);

router
  .route('/:id')
  .get(getReminder)
  .put(updateReminder)
  .delete(deleteReminder);

// Additional operations
router.put('/:id/complete', toggleComplete);
router.put('/:id/snooze', snoozeReminder);

module.exports = router;

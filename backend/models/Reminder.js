// models/Reminder.js
const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    customPattern: {
      type: String
    },
    endDate: {
      type: Date
    }
  },
  tags: [String],
  notifications: [{
    time: {
      type: Date
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  userResponses: [{
    response: {
      type: String,
      enum: ['completed', 'snoozed', 'dismissed'],
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  reminderHistory: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'completed', 'snoozed', 'reopened']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ReminderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index on user and dueDate for efficient queries
ReminderSchema.index({ user: 1, dueDate: 1 });

// Method to check if a reminder is overdue
ReminderSchema.methods.isOverdue = function() {
  if (this.completed) return false;
  
  const now = new Date();
  return this.dueDate < now;
};

// Method to generate the next occurrence of a recurring reminder
ReminderSchema.methods.getNextOccurrence = function() {
  if (!this.recurring.isRecurring) return null;
  
  const currentDueDate = new Date(this.dueDate);
  let nextDueDate = new Date(currentDueDate);
  
  switch (this.recurring.frequency) {
    case 'daily':
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case 'custom':
      // Custom patterns would need to be implemented based on the pattern string
      // For example, "every 3 days" or "Mon,Wed,Fri"
      break;
  }
  
  // Check if the next occurrence is after the end date
  if (this.recurring.endDate && nextDueDate > this.recurring.endDate) {
    return null;
  }
  
  return nextDueDate;
};

module.exports = mongoose.model('Reminder', ReminderSchema);

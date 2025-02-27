// models/UserStats.js - Updated model with enum fixes
const mongoose = require('mongoose');

const UserStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  reminderStats: {
    completed: {
      total: { type: Number, default: 0 },
      onTime: { type: Number, default: 0 },
      late: { type: Number, default: 0 }
    },
    created: { type: Number, default: 0 },
    snoozed: { type: Number, default: 0 },
    deleted: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 }, // in hours
    preferredTags: [
      {
        name: String,
        count: Number
      }
    ]
  },
  timePatterns: {
    mostProductiveDay: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', null],
      default: null
    },
    mostProductiveTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', null],
      default: null
    },
    averageLoginTime: { type: Date },
    averageCompletionTimeOfDay: { type: Date },
    consistencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  categoryPerformance: [
    {
      tag: String,
      completionRate: Number, // percentage
      averagePriority: String,
      count: Number
    }
  ],
  buddyInteraction: {
    preferredBuddy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buddy',
      default: null
    },
    interactionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    responsiveness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    preferredMessageStyle: {
      type: String,
      enum: ['motivational', 'direct', 'friendly', 'professional', 'humorous', null],
      default: null
    }
  },
  userBehavior: {
    streakLength: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActive: { type: Date },
    averageSessionDuration: { type: Number, default: 0 }, // in minutes
    procrastinationIndex: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    adaptabilityScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  recommendations: {
    suggestedTimes: [Date],
    suggestedBuddyType: String,
    suggestedMessageStyle: String,
    personalizationLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp before saving
UserStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to update completion stats
UserStatsSchema.methods.updateCompletionStats = function(onTime) {
  this.reminderStats.completed.total += 1;
  
  if (onTime) {
    this.reminderStats.completed.onTime += 1;
  } else {
    this.reminderStats.completed.late += 1;
  }
  
  // Update streak
  const now = new Date();
  const lastActive = this.userBehavior.lastActive || new Date(0);
  
  // Check if last activity was within 24 hours
  const timeDiff = Math.abs(now - lastActive) / (1000 * 60 * 60); // hours
  
  if (timeDiff <= 24) {
    this.userBehavior.streakLength += 1;
    
    if (this.userBehavior.streakLength > this.userBehavior.longestStreak) {
      this.userBehavior.longestStreak = this.userBehavior.streakLength;
    }
  } else {
    this.userBehavior.streakLength = 1; // reset streak but count today
  }
  
  this.userBehavior.lastActive = now;
  
  return this.save();
};

// Method to analyze task tag preferences
UserStatsSchema.methods.updateTagPreferences = function(tags) {
  if (!tags || tags.length === 0) return;
  
  // Update tag counts
  tags.forEach(tag => {
    const existingTag = this.reminderStats.preferredTags.find(t => t.name === tag);
    
    if (existingTag) {
      existingTag.count += 1;
    } else {
      this.reminderStats.preferredTags.push({
        name: tag,
        count: 1
      });
    }
  });
  
  // Sort tags by count (most frequent first)
  this.reminderStats.preferredTags.sort((a, b) => b.count - a.count);
  
  return this.save();
};

// Static method to get or create user stats
UserStatsSchema.statics.getOrCreate = async function(userId) {
  let userStats = await this.findOne({ user: userId });
  
  if (!userStats) {
    userStats = await this.create({ user: userId });
  }
  
  return userStats;
};

module.exports = mongoose.model('UserStats', UserStatsSchema);
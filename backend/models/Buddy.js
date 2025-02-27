// models/Buddy.js
const mongoose = require('mongoose');

const BuddySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the buddy'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  personality: {
    type: String,
    required: [true, 'Please provide a personality type'],
    enum: [
      'helper', // Supportive and helpful
      'motivator', // Energetic and encouraging
      'organizer', // Structured and systematic
      'cheerleader', // Positive and uplifting
      'coach', // Challenging and direct
      'zen', // Calm and mindful
      'custom' // User-defined personality
    ],
    default: 'helper'
  },
  customTraits: {
    type: [String],
    validate: {
      validator: function(v) {
        // Only required if personality is 'custom'
        return this.personality !== 'custom' || v.length > 0;
      },
      message: 'Custom traits are required for custom personality'
    }
  },
  avatarUrl: {
    type: String,
    default: '/assets/buddies/default.png'
  },
  defaultMessages: {
    greeting: [String],
    reminder: [String],
    encouragement: [String],
    completion: [String],
    overdue: [String],
    inactivity: [String]
  },
  adaptiveBehavior: {
    userStyle: {
      type: String,
      enum: ['verbose', 'concise', 'casual', 'formal', 'auto-detect'],
      default: 'auto-detect'
    },
    adaptToTimeOfDay: {
      type: Boolean,
      default: true
    },
    adaptToCompletion: {
      type: Boolean,
      default: true
    },
    adaptToMood: {
      type: Boolean,
      default: false
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usageStats: {
    userCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0
    }
  },
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
BuddySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Populate default messages based on personality type
BuddySchema.pre('save', function(next) {
  // Only set default messages if they're not already set
  if (this.isNew || this.isModified('personality')) {
    // Default messages for each personality type
    const defaultMessagesMap = {
      helper: {
        greeting: [
          "Hi there! Ready to tackle your tasks?",
          "Hello! I'm here to help you stay organized.",
          "Welcome back! What would you like to accomplish today?"
        ],
        reminder: [
          "Just a friendly reminder about {title}.",
          "Don't forget about {title}.",
          "Remember, you have {title} coming up."
        ],
        encouragement: [
          "You're doing well! Keep it up.",
          "You've got this!",
          "I believe in you - you can do it!"
        ],
        completion: [
          "Great job completing {title}!",
          "Excellent! One more task completed.",
          "Well done on finishing {title}!"
        ],
        overdue: [
          "It looks like {title} is overdue. Would you like to reschedule it?",
          "You missed {title}. No worries, let's find a new time for it.",
          "{title} has passed. Should we move it to today's list?"
        ],
        inactivity: [
          "I haven't seen you in a while. Everything going okay?",
          "It's been a few days since you've checked in. Need help getting back on track?",
          "Welcome back! Ready to get organized again?"
        ]
      },
      motivator: {
        greeting: [
          "Let's crush those tasks today!",
          "Hey there, superstar! Ready to be amazing?",
          "Today is a perfect day for productivity!"
        ],
        reminder: [
          "You've got {title} coming up - I know you'll ace it!",
          "Time to shine! {title} is on your schedule.",
          "{title} is on the horizon - you're going to do great!"
        ],
        encouragement: [
          "You're unstoppable! Keep pushing forward!",
          "Remember why you started - you're making amazing progress!",
          "Each task completed is a victory. You're winning!"
        ],
        completion: [
          "BOOM! {title} completed! You're on fire!",
          "You just conquered {title}! What's next on your path to greatness?",
          "That's what I'm talking about! {title} - DONE!"
        ],
        overdue: [
          "Hey champion, {title} slipped by. Let's regroup and conquer it!",
          "No sweat about missing {title}. Champions adjust and keep moving!",
          "{title} is overdue, but that's just a temporary setback. Let's reschedule and win!"
        ],
        inactivity: [
          "Hey rockstar! Missing your energy around here!",
          "Time to get back in the game! I know you've got what it takes!",
          "The comeback is always stronger than the setback. Ready to return to greatness?"
        ]
      },
      // Additional personalities would be defined similarly
    };
    
    // If it's a pre-defined personality, set the default messages
    if (this.personality !== 'custom' && defaultMessagesMap[this.personality]) {
      // Only set default messages if they're not already set
      for (const [key, messages] of Object.entries(defaultMessagesMap[this.personality])) {
        if (!this.defaultMessages[key] || this.defaultMessages[key].length === 0) {
          this.defaultMessages[key] = messages;
        }
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Buddy', BuddySchema);

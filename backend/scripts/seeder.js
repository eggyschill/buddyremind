// scripts/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Buddy = require('../models/Buddy');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Default buddies to seed
const buddies = [
  {
    name: 'Helper',
    personality: 'helper',
    avatarUrl: '/assets/buddies/helper.png',
    defaultMessages: {
      greeting: [
        "Hi there! Ready to get things done today?",
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
    adaptiveBehavior: {
      userStyle: 'auto-detect',
      adaptToTimeOfDay: true,
      adaptToCompletion: true,
      adaptToMood: false
    },
    isDefault: true,
    isPublic: true
  },
  {
    name: 'Motivator',
    personality: 'motivator',
    avatarUrl: '/assets/buddies/motivator.png',
    defaultMessages: {
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
    adaptiveBehavior: {
      userStyle: 'auto-detect',
      adaptToTimeOfDay: true,
      adaptToCompletion: true,
      adaptToMood: true
    },
    isDefault: true,
    isPublic: true
  }
];

// Function to seed buddies
const seedBuddies = async () => {
  try {
    // Delete existing buddies
    await Buddy.deleteMany({});
    console.log('Existing buddies deleted');
    
    // Create new buddies
    const createdBuddies = await Buddy.create(buddies);
    console.log(`${createdBuddies.length} buddies created`);
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

// Run the seeder
seedBuddies();

// server.js - Main entry point for the BuddyRemind backend

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Import route files
const authRoutes = require('./routes/auth');
const reminderRoutes = require('./routes/reminders');
const userRoutes = require('./routes/users');
const buddyRoutes = require('./routes/buddies');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
	origin: 'http://localhost:3000',
	credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buddies', buddyRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'production' ? null : err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

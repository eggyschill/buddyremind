// middleware/async.js

// Middleware to handle async functions and eliminate try-catch blocks
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

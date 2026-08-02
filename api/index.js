// Vercel Serverless Function Handler
// This file exports the Express app as a serverless function

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  console.error('[API] WARNING: DATABASE_URL is not set');
}

// Import and export the Express app directly
const app = require('../backend/gor-api/dist/app.js');

// For Vercel, export as default
module.exports = app;


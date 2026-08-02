// Vercel Serverless Handler - Minimal working Express app

const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug info
app.get('/api/v1/debug', (req, res) => {
  res.json({
    node: process.version,
    env: process.env.NODE_ENV || 'production',
    status: 'API running',
    database: process.env.DATABASE_URL ? 'configured' : 'not set'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'GOR Booking API - Vercel Serverless', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

module.exports = app;


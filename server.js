require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./server/config/db');
const apiRoutes = require('./server/routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable security headers (CORS & Helmet)
// Relax Helmet's CSP so that inline scripts, styles, and external CDNs function correctly
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure database connection is established for API requests
// This is critical for Vercel's serverless environment to handle cold starts
const dbConnectionMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error: Database connection could not be established.' 
    });
  }
};

// Mount API routes
app.use('/api', dbConnectionMiddleware, apiRoutes);

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve the frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Centralized Server Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server.'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start listening if not running under a serverless function wrapper
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Export the Express app for Vercel serverless deployment
module.exports = app;

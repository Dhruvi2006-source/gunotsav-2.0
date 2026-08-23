const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  // If connection is already established, reuse it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('CRITICAL: MONGODB_URI is not set in environment variables.');
    throw new Error('MONGODB_URI is not set');
  }

  try {
    console.log('Initiating MongoDB connection...');
    
    // Cache the connection promise so concurrent requests reuse the same connection attempt
    if (!cachedConnection) {
      cachedConnection = mongoose.connect(uri);
    }
    
    await cachedConnection;
    console.log('MongoDB connection established successfully.');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cachedConnection = null; // Clear cache on error so subsequent requests can try again
    throw error;
  }
}

module.exports = connectDB;

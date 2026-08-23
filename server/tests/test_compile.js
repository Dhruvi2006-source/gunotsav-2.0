console.log("--- Starting backend module compilation tests ---");

try {
  console.log("Loading School model...");
  const School = require('../models/School');
  console.log("✓ School model loaded successfully.");

  console.log("Loading ItemData model...");
  const ItemData = require('../models/ItemData');
  console.log("✓ ItemData model loaded successfully.");

  console.log("Loading Media model...");
  const Media = require('../models/Media');
  console.log("✓ Media model loaded successfully.");

  console.log("Loading DB config...");
  const db = require('../config/db');
  console.log("✓ DB connection utility loaded successfully.");

  console.log("Loading Cloudinary config...");
  const cloudinary = require('../config/cloudinary');
  console.log("✓ Cloudinary configuration loaded successfully.");

  console.log("Loading API routes...");
  const api = require('../routes/api');
  console.log("✓ API routes loaded successfully.");

  console.log("Loading Main server file...");
  // Set NODE_ENV to production and VERCEL to true to prevent server from listening during load test
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = 'true';
  const app = require('../../server');
  console.log("✓ Express server instance loaded successfully.");

  console.log("\n✅ ALL BACKEND MODULES COMPILED AND IMPORTED SUCCESSFULY! NO SYNTAX ERRORS.");
  process.exit(0);
} catch (error) {
  console.error("\n❌ COMPILATION TEST FAILED!");
  console.error(error);
  process.exit(1);
}

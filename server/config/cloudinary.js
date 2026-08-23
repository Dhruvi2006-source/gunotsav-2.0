const cloudinary = require('cloudinary').v2;

// Check if credentials are set
const hasCredentials = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (!hasCredentials) {
  console.warn('WARNING: Cloudinary credentials are not fully set in environment variables. File uploads will fail.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

module.exports = cloudinary;

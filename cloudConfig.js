// utils/cloudConfig.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer setup: store files in memory before uploading to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };
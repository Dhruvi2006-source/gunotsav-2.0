const express = require('express');
const router = express.Router();
const multer = require('multer');
const School = require('../models/School');
const ItemData = require('../models/ItemData');
const Media = require('../models/Media');
const cloudinary = require('../config/cloudinary');

// Configure multer for in-memory uploads
const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB) || 10;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024
  }
});

// Helper for Cloudinary stream upload from memory buffer
const uploadToCloudinary = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    // If it's a PDF, force resource_type to 'raw' (or let auto handle it, but raw is safer for PDFs on some Cloudinary tiers)
    // Actually, 'auto' works great, but we can specify options.
    const isPdf = mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
    
    const options = {
      folder: 'gunotsav_docs',
      resource_type: 'image', // Upload PDFs as 'image' resources to allow image preview generation
      // If it's a PDF, keep its original extension in raw format
      public_id: isPdf ? `${Date.now()}_${originalName.replace(/\.[^/.]+$/, "")}` : undefined
    };

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });

    uploadStream.end(fileBuffer);
  });
};

// -------------------------------------------------------------
// School Routes
// -------------------------------------------------------------

// GET /api/schools/:udise - Get school by UDISE code
router.get('/schools/:udise', async (req, res, next) => {
  try {
    const school = await School.findOne({ udise: req.params.udise });
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }
    res.json({ success: true, school });
  } catch (error) {
    next(error);
  }
});

// POST /api/schools - Upsert school details
router.post('/schools', async (req, res, next) => {
  try {
    const { udise, name, year, village, taluka, district, principal, mobile } = req.body;
    
    if (!udise || !name || !year) {
      return res.status(400).json({ success: false, message: 'UDISE code, school name, and year are required.' });
    }

    // Find and update, or create a new school (upsert)
    const school = await School.findOneAndUpdate(
      { udise },
      { name, year, village, taluka, district, principal, mobile },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, school });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Item Data (checklists, text drafts, and tables)
// -------------------------------------------------------------

// GET /api/schools/:schoolId/items - Get all item configurations/drafts for a school
router.get('/schools/:schoolId/items', async (req, res, next) => {
  try {
    const items = await ItemData.find({ schoolId: req.params.schoolId });
    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
});

// PUT /api/schools/:schoolId/items/:itemKey - Upsert draft text and table data for a checklist item
router.put('/schools/:schoolId/items/:itemKey', async (req, res, next) => {
  try {
    const { schoolId, itemKey } = req.params;
    const { draftText, tableData } = req.body;

    const item = await ItemData.findOneAndUpdate(
      { schoolId, itemKey },
      { draftText, tableData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
});

// -------------------------------------------------------------
// Media Routes (PDF / Image Uploads)
// -------------------------------------------------------------

// GET /api/schools/:schoolId/media - Get all media uploaded for a school
router.get('/schools/:schoolId/media', async (req, res, next) => {
  try {
    const media = await Media.find({ schoolId: req.params.schoolId }).sort({ uploadedAt: 1 });
    res.json({ success: true, media });
  } catch (error) {
    next(error);
  }
});

// POST /api/schools/:schoolId/items/:itemKey/media - Upload media for a checklist item
router.post('/schools/:schoolId/items/:itemKey/media', upload.single('file'), async (req, res, next) => {
  try {
    const { schoolId, itemKey } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Validate mime-type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Only PDFs and images (PNG, JPEG, GIF, WebP) are allowed.' 
      });
    }

    // Upload to Cloudinary
    console.log(`Uploading file ${file.originalname} (${file.size} bytes) to Cloudinary...`);
    const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
    console.log('Cloudinary upload successful:', uploadResult.secure_url);

    // Save metadata to MongoDB
    const media = new Media({
      schoolId,
      itemKey,
      fileName: file.originalname,
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type || (file.mimetype === 'application/pdf' ? 'raw' : 'image'),
      format: uploadResult.format || (file.mimetype === 'application/pdf' ? 'pdf' : file.mimetype.split('/')[1]),
      size: file.size
    });

    await media.save();

    res.status(201).json({ success: true, media });
  } catch (error) {
    console.error('File upload controller error:', error);
    next(error);
  }
});

// DELETE /api/media/:mediaId - Delete media from MongoDB and Cloudinary
router.delete('/media/:mediaId', async (req, res, next) => {
  try {
    const media = await Media.findById(req.params.mediaId);
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media asset not found' });
    }

    // Delete from Cloudinary
    console.log(`Deleting asset ${media.publicId} (${media.resourceType}) from Cloudinary...`);
    try {
      await cloudinary.uploader.destroy(media.publicId, { resource_type: media.resourceType });
      console.log('Cloudinary asset deleted.');
    } catch (cloudinaryError) {
      // Log error but continue deleting database record in case it was already deleted manually
      console.error('Cloudinary deletion warning:', cloudinaryError);
    }

    // Delete from MongoDB
    await Media.findByIdAndDelete(req.params.mediaId);
    console.log('Database media record deleted.');

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/schools/:schoolId/reset - Reset all checklist drafts and media for a school
router.post('/schools/:schoolId/reset', async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    
    // Find all media files to delete from Cloudinary
    console.log(`Resetting school ${schoolId}... Fetching all media records to delete from Cloudinary...`);
    const mediaList = await Media.find({ schoolId });
    for (const media of mediaList) {
      try {
        await cloudinary.uploader.destroy(media.publicId, { resource_type: media.resourceType });
      } catch (cloudinaryError) {
        console.error(`Cloudinary deletion warning in school reset for asset ${media.publicId}:`, cloudinaryError);
      }
    }
    
    // Delete all media from MongoDB
    await Media.deleteMany({ schoolId });
    console.log('All school media records deleted from MongoDB.');
    
    // Delete all checklist items (will revert back to defaults on next load)
    await ItemData.deleteMany({ schoolId });
    console.log('All school item data records deleted from MongoDB.');

    res.json({ success: true, message: 'School checklist data and media successfully reset.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


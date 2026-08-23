const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  itemKey: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true
  },
  format: {
    type: String
  },
  size: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Media', MediaSchema);

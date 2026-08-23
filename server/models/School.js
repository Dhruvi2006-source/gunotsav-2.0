const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  udise: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  village: {
    type: String,
    trim: true
  },
  taluka: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  principal: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('School', SchoolSchema);

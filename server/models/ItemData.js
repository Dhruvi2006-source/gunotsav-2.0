const mongoose = require('mongoose');

const ItemDataSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  itemKey: {
    type: String,
    required: true,
    trim: true
  },
  draftText: {
    type: String,
    default: ''
  },
  tableData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Ensure a school only has one entry per checklist item
ItemDataSchema.index({ schoolId: 1, itemKey: 1 }, { unique: true });

module.exports = mongoose.model('ItemData', ItemDataSchema);

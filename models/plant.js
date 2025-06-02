const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  scientificName: { type: String },
  description: { type: String },
  toxicity: {
    toxic: { type: Boolean, default: false },
    toxicTo: [{
      type: String,
      enum: ['dogs', 'cats', 'horses', 'birds', 'reptiles', 'fish', 'small-mammals']
    }],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  },
  careInstructions: {
    light: String,
    water: String,
    temperature: String,
    soil: String
  },
  imageUrl: String
});

module.exports = mongoose.model('Plant', plantSchema);

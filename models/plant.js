// mongoose schema for plant data
const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // common name of the plant
  scientificName: { type: String }, // scientific or Latin name of the plant
  description: { type: String }, // brief description of the plant
  toxicity: {
    toxic: { type: Boolean, default: false }, // indicates if the plant is toxic
    toxicTo: [{ // list of animals that the plant is toxic to
      type: String,
      enum: ['dogs', 'cats', 'horses', 'birds', 'reptiles', 'fish', 'small-mammals']
    }],
    severity: { // severity of the toxicity
      type: String,
      enum: ['mild', 'moderate', 'severe']
    }
  },
  imageUrl: String // URL for an image of the plant
});

module.exports = mongoose.model('Plant', plantSchema);

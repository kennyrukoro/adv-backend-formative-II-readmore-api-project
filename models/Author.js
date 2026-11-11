const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  // Required: every author needs a name so books can be attributed to someone.
  name: { type: String, required: true, trim: true },

  // Required: a bookstore lists authors by country, so it can't be blank.
  country: { type: String, required: true, trim: true },

  // Optional: a bio is nice to have, but an author is still valid without one.
  bio: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Author', authorSchema);
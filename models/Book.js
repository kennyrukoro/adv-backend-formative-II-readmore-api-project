const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Required: a book without a title can't be listed or searched.
  title: { type: String, required: true, trim: true },

  // Required: genre drives filtering in Part 4, so every book needs one.
  genre: { type: String, required: true, trim: true },

  // Required: a price is needed to sell the book. The value check (> 0) happens in the controller for a 422.
  price: { type: Number, required: true },

  // Number, not Date: the README asks for a year, and a year is a plain integer.
  // The range check (1450 to the current year) happens in the controller.
  publishedYear: { type: Number, required: true },

  // The link to an Author. The 'Author' string must match mongoose.model('Author', ...) above.
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
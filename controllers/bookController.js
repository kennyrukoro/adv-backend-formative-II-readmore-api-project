const Book = require('../models/Book');
const Author = require('../models/Author');
// POST /books
exports.createBook = async (req, res) => {
  try {
    const { title, price, publishedYear, author } = req.body;

    // Rule 3: value checks
    if (price !== undefined && price <= 0) {
      return res.status(422).json({ message: 'Price must be greater than 0' });
    }
    const currentYear = new Date().getFullYear();
    if (publishedYear !== undefined && (publishedYear < 1450 || publishedYear > currentYear)) {
      return res.status(422).json({ message: `publishedYear must be between 1450 and ${currentYear}` });
    }

    // Rule 1: the author must exist
    const authorExists = await Author.exists({ _id: author });
    if (!authorExists) {
      return res.status(400).json({ message: 'Author does not exist' });
    }

    // Rule 2: same author can't have two books with the same title (case-insensitive)
    const duplicate = await Book.findOne({ author, title })
      .collation({ locale: 'en', strength: 2 });
    if (duplicate) {
      return res.status(409).json({ message: 'This author already has a book with that title' });
    }

    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().populate('author');
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book id' });
    }
    res.status(500).json({ message: err.message });
  }
};
// PUT /books/:id
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book id' });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid book id' });
    }
    res.status(500).json({ message: err.message });
  }
};
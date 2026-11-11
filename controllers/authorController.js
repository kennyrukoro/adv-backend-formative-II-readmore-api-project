const Author = require('../models/Author');
const Book = require('../models/Book');

// POST /authors
exports.createAuthor = async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /authors
exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /authors/:id
exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }
    res.json(author);
  } catch (err) {
    // A malformed id (not a 24-character ObjectId) throws a CastError
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(500).json({ message: err.message });
  }
};
// PUT /authors/:id
exports.updateAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }
    res.json(author);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /authors/:id
// Plain delete for now. Part 4 asks you to decide what happens to this author's books.
exports.deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }
    res.json({ message: 'Author deleted' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(500).json({ message: err.message });
  }
};
// GET /authors/:id/books
exports.getBooksByAuthor = async (req, res) => {
  try {
    const books = await Book.find({ author: req.params.id }).populate('author');
    res.json(books);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(500).json({ message: err.message });
  }
};
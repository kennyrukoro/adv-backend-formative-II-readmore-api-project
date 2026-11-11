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
// Policy A: block. An author with books cannot be deleted, so catalogue and sales data are never lost by accident.
exports.deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const bookCount = await Book.countDocuments({ author: id });
    if (bookCount > 0) {
      return res.status(409).json({
        message: `Author has ${bookCount} book(s); delete or reassign them first`
      });
    }

    await Author.findByIdAndDelete(id);
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
// GET /authors/:id/stats
exports.getAuthorStats = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const books = await Book.find({ author: req.params.id });

    // Sensible defaults for an author with no books
    if (books.length === 0) {
      return res.json({
        author: author.name,
        bookCount: 0,
        averagePrice: 0,
        cheapestBook: null,
        mostExpensiveBook: null
      });
    }

    const total = books.reduce((sum, book) => sum + book.price, 0);
    const sorted = [...books].sort((a, b) => a.price - b.price);

    res.json({
      author: author.name,
      bookCount: books.length,
      averagePrice: Math.round((total / books.length) * 100) / 100,
      cheapestBook: sorted[0].title,
      mostExpensiveBook: sorted[sorted.length - 1].title
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    res.status(500).json({ message: err.message });
  }
};
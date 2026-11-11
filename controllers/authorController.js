const Author = require('../models/Author');
const Book = require('../models/Book');
const POLICY = process.env.DELETE_POLICY || 'block';

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
exports.deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const bookCount = await Book.countDocuments({ author: id });

    // A: Block. Refuse while the author still has books.
    if (POLICY === 'block') {
      if (bookCount > 0) {
        return res.status(409).json({
          message: `Author has ${bookCount} book(s); delete or reassign them first`
        });
      }
      await Author.findByIdAndDelete(id);
      return res.json({ message: 'Author deleted' });
    }

    // B: Cascade. Delete the author and all their books.
    if (POLICY === 'cascade') {
      const result = await Book.deleteMany({ author: id });
      await Author.findByIdAndDelete(id);
      return res.json({ message: 'Author and books deleted', booksDeleted: result.deletedCount });
    }

    // C: Reassign. Move the books to an "Unknown" fallback author, then delete.
    if (POLICY === 'reassign') {
      let fallback = await Author.findOne({ name: 'Unknown' });
      if (!fallback) {
        fallback = await Author.create({
          name: 'Unknown',
          country: 'Unknown',
          bio: 'Placeholder for books whose author was removed'
        });
      }
      if (fallback._id.equals(author._id)) {
        return res.status(400).json({ message: 'The fallback author cannot be deleted this way' });
      }
      const result = await Book.updateMany({ author: id }, { author: fallback._id });
      await Author.findByIdAndDelete(id);
      return res.json({
        message: 'Author deleted',
        booksReassigned: result.modifiedCount,
        reassignedTo: fallback._id
      });
    }

    res.status(500).json({ message: `Unknown DELETE_POLICY: ${POLICY}` });
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
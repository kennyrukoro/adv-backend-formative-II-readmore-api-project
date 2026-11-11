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

// Escape user text so characters like . or ( are matched literally in a search
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /books?genre=&minPrice=&maxPrice=&author=&search=&sort=&order=
exports.getAllBooks = async (req, res) => {
  try {
    const { genre, minPrice, maxPrice, author, search, sort, order } = req.query;
    const filter = {};

    if (genre) {
      filter.genre = genre;
    }

    if (author) {
      filter.author = author;
    }

    if (search) {
      filter.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        const min = Number(minPrice);
        if (Number.isNaN(min)) {
          return res.status(400).json({ message: 'minPrice must be a number' });
        }
        filter.price.$gte = min;
      }
      if (maxPrice !== undefined) {
        const max = Number(maxPrice);
        if (Number.isNaN(max)) {
          return res.status(400).json({ message: 'maxPrice must be a number' });
        }
        filter.price.$lte = max;
      }
    }

    const allowedSorts = ['price', 'title', 'publishedYear'];
    let sortOption = {};
    if (sort !== undefined) {
      if (!allowedSorts.includes(sort)) {
        return res.status(400).json({ message: `sort must be one of: ${allowedSorts.join(', ')}` });
      }
      const direction = order === 'desc' ? -1 : 1;
      sortOption = { [sort]: direction };
    }

    const books = await Book.find(filter)
      .sort(sortOption)
      .populate('author');
    res.json(books);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid author id' });
    }
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
    const { id } = req.params;
    const { title, price, publishedYear, author } = req.body;

    // Rule 3: value checks on the fields being changed
    if (price !== undefined && price <= 0) {
      return res.status(422).json({ message: 'Price must be greater than 0' });
    }
    const currentYear = new Date().getFullYear();
    if (publishedYear !== undefined && (publishedYear < 1450 || publishedYear > currentYear)) {
      return res.status(422).json({ message: `publishedYear must be between 1450 and ${currentYear}` });
    }

    const existing = await Book.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Rule 1: if the author is changing, the new author must exist
    if (author !== undefined) {
      const authorExists = await Author.exists({ _id: author });
      if (!authorExists) {
        return res.status(400).json({ message: 'Author does not exist' });
      }
    }

    // Rule 2: check the final (author, title) pair, excluding this book itself
    const finalAuthor = author ?? existing.author;
    const finalTitle = title ?? existing.title;
    const duplicate = await Book.findOne({
      _id: { $ne: id },
      author: finalAuthor,
      title: finalTitle
    }).collation({ locale: 'en', strength: 2 });
    if (duplicate) {
      return res.status(409).json({ message: 'This author already has a book with that title' });
    }

    const book = await Book.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('author');
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
const express = require('express');
const router = express.Router();
const authors = require('../controllers/authorController');

router.post('/', authors.createAuthor);
router.get('/', authors.getAllAuthors);
router.get('/:id', authors.getAuthorById);
router.put('/:id', authors.updateAuthor);
router.delete('/:id', authors.deleteAuthor);

module.exports = router;
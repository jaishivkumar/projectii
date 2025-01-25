const express = require('express');
const { createShortUrl, redirectShortUrl } = require('../controller/urlController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/shorten', authenticate, createShortUrl);
router.get('/shorten/:alias', redirectShortUrl);


module.exports = router;


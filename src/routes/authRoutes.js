const express = require('express');
const { googleSignIn } = require('../controllers/authController');

const router = express.Router();

router.post('/google-signin', googleSignIn);

module.exports = router;


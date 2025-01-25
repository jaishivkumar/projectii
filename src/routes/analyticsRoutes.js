const express = require('express');
const { getUrlAnalytics, getTopicAnalytics, getOverallAnalytics } = require('../controller/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:alias', authenticate, getUrlAnalytics);
router.get('/topic/:topic', authenticate, getTopicAnalytics);
router.get('/overall', authenticate, getOverallAnalytics);

module.exports = router;


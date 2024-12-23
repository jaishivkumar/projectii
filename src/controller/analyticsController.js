const Url = require('../models/url');

async function getUrlAnalytics(req, res) {
  const { alias } = req.params;
  try {
    const analytics = await Url.getAnalytics(alias);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting URL analytics:', error);
    res.status(500).json({ error: 'Error getting URL analytics' });
  }
}

async function getTopicAnalytics(req, res) {
  const { topic } = req.params;
  try {
    const analytics = await Url.getTopicAnalytics(topic);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting topic analytics:', error);
    res.status(500).json({ error: 'Error getting topic analytics' });
  }
}

async function getOverallAnalytics(req, res) {
  const userId = req.user.id;
  try {
    const analytics = await Url.getOverallAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting overall analytics:', error);
    res.status(500).json({ error: 'Error getting overall analytics' });
  }
}

module.exports = {
  getUrlAnalytics,
  getTopicAnalytics,
  getOverallAnalytics
};


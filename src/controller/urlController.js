const shortid = require('shortid');
const Url = require('../models/url');
const useragent = require('express-useragent');
const geoip = require('geoip-lite');

async function createShortUrl(req, res) {
  const { longUrl, customAlias, topic } = req.body;
  const userId = req.user.id;

  try {
    const shortUrl = customAlias || shortid.generate();
    await Url.create(userId, longUrl, shortUrl, customAlias, topic);
    res.json({
      shortUrl: `${process.env.BASE_URL}/${shortUrl}`,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    res.status(500).json({ error: 'Error creating short URL' });
  }
}

async function redirectShortUrl(req, res) {
  const { alias } = req.params;
  try {
    const url = await Url.findByShortUrl(alias);
    if (url) {
      const ua = useragent.parse(req.headers['user-agent']);
      const geo = geoip.lookup(req.ip);
      await Url.logAnalytics(
        url.id,
        req.ip,
        req.headers['user-agent'],
        ua.os,
        ua.isMobile ? 'mobile' : 'desktop',
        geo ? geo.country : 'Unknown'
      );
      res.redirect(url.long_url);
    } else {
      res.status(404).json({ error: 'Short URL not found' });
    }
  } catch (error) {
    console.error('Error redirecting short URL:', error);
    res.status(500).json({ error: 'Error redirecting short URL' });
  }
}

module.exports = {
  createShortUrl,
  redirectShortUrl
};


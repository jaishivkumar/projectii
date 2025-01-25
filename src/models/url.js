const { pool } = require('../config/database');
const { client } = require('../config/redis');


class Url {
  static async create(userId, longUrl, shortUrl, customAlias, topic) {
    const [result] = await pool.query(
      'INSERT INTO urls (user_id, long_url, short_url, custom_alias, topic) VALUES (?, ?, ?, ?, ?)',
      [userId, longUrl, shortUrl, customAlias, topic]
    );
    await client.set(`short:${shortUrl}`, longUrl);
    return result.insertId;
  }

  static async findByShortUrl(shortUrl) {
    const cachedUrl = await client.get(`short:${shortUrl}`);
    if (cachedUrl) {
      return { long_url: cachedUrl };
    }

    const [rows] = await pool.query(
      'SELECT * FROM urls WHERE short_url = ?',
      [shortUrl]
    );
    if (rows[0]) {
      await client.set(`short:${shortUrl}`, rows[0].long_url);
    }
    return rows[0];
  }

  static async logAnalytics(urlId, ipAddress, userAgent, osType, deviceType, country) {
    await pool.query(
      'INSERT INTO analytics (url_id, ip_address, user_agent, os_type, device_type, country) VALUES (?, ?, ?, ?, ?, ?)',
      [urlId, ipAddress, userAgent, osType, deviceType, country]
    );
  }

  static async getAnalytics(shortUrl) {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as totalClicks,
        COUNT(DISTINCT ip_address) as uniqueClicks,
        DATE(timestamp) as date,
        COUNT(*) as clicks,
        os_type,
        device_type
      FROM urls
      JOIN analytics ON urls.id = analytics.url_id
      WHERE urls.short_url = ?
      GROUP BY DATE(timestamp), os_type, device_type
      ORDER BY DATE(timestamp) DESC
      LIMIT 7
    `, [shortUrl]);

    const result = {
      totalClicks: 0,
      uniqueClicks: 0,
      clicksByDate: [],
      osType: [],
      deviceType: []
    };

    const osTypeMap = new Map();
    const deviceTypeMap = new Map();

    rows.forEach(row => {
      result.totalClicks += row.clicks;
      result.uniqueClicks += row.uniqueClicks;

      const existingDate = result.clicksByDate.find(item => item.date === row.date);
      if (existingDate) {
        existingDate.clicks += row.clicks;
      } else {
        result.clicksByDate.push({ date: row.date, clicks: row.clicks });
      }

      if (!osTypeMap.has(row.os_type)) {
        osTypeMap.set(row.os_type, { osName: row.os_type, uniqueClicks: 0, uniqueUsers: 0 });
      }
      osTypeMap.get(row.os_type).uniqueClicks += row.clicks;
      osTypeMap.get(row.os_type).uniqueUsers += row.uniqueClicks;

      if (!deviceTypeMap.has(row.device_type)) {
        deviceTypeMap.set(row.device_type, { deviceName: row.device_type, uniqueClicks: 0, uniqueUsers: 0 });
      }
      deviceTypeMap.get(row.device_type).uniqueClicks += row.clicks;
      deviceTypeMap.get(row.device_type).uniqueUsers += row.uniqueClicks;
    });

    result.osType = Array.from(osTypeMap.values());
    result.deviceType = Array.from(deviceTypeMap.values());

    return result;
  }

  static async getTopicAnalytics(topic) {
    const [rows] = await pool.query(`
      SELECT 
        urls.short_url,
        COUNT(*) as totalClicks,
        COUNT(DISTINCT analytics.ip_address) as uniqueClicks,
        DATE(analytics.timestamp) as date
      FROM urls
      JOIN analytics ON urls.id = analytics.url_id
      WHERE urls.topic = ?
      GROUP BY urls.short_url, DATE(analytics.timestamp)
      ORDER BY DATE(analytics.timestamp) DESC
    `, [topic]);

    const result = {
      totalClicks: 0,
      uniqueClicks: 0,
      clicksByDate: [],
      urls: []
    };

    const urlMap = new Map();
    const dateMap = new Map();

    rows.forEach(row => {
      result.totalClicks += row.totalClicks;

      if (!urlMap.has(row.short_url)) {
        urlMap.set(row.short_url, { shortUrl: row.short_url, totalClicks: 0, uniqueClicks: 0 });
      }
      urlMap.get(row.short_url).totalClicks += row.totalClicks;
      urlMap.get(row.short_url).uniqueClicks += row.uniqueClicks;

      if (!dateMap.has(row.date)) {
        dateMap.set(row.date, { date: row.date, clicks: 0 });
      }
      dateMap.get(row.date).clicks += row.totalClicks;
    });

    result.uniqueClicks = new Set(rows.map(row => row.ip_address)).size;
    result.clicksByDate = Array.from(dateMap.values());
    result.urls = Array.from(urlMap.values());

    return result;
  }

  static async getOverallAnalytics(userId) {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(DISTINCT urls.id) as totalUrls,
        COUNT(*) as totalClicks,
        COUNT(DISTINCT analytics.ip_address) as uniqueClicks,
        DATE(analytics.timestamp) as date,
        analytics.os_type,
        analytics.device_type
      FROM urls
      LEFT JOIN analytics ON urls.id = analytics.url_id
      WHERE urls.user_id = ?
      GROUP BY DATE(analytics.timestamp), analytics.os_type, analytics.device_type
      ORDER BY DATE(analytics.timestamp) DESC
    `, [userId]);

    const result = {
      totalUrls: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      clicksByDate: [],
      osType: [],
      deviceType: []
    };

    const dateMap = new Map();
    const osTypeMap = new Map();
    const deviceTypeMap = new Map();

    rows.forEach(row => {
      result.totalUrls = row.totalUrls;
      result.totalClicks += row.totalClicks;

      if (!dateMap.has(row.date)) {
        dateMap.set(row.date, { date: row.date, clicks: 0 });
      }
      dateMap.get(row.date).clicks += row.totalClicks;

      if (!osTypeMap.has(row.os_type)) {
        osTypeMap.set(row.os_type, { osName: row.os_type, uniqueClicks: 0, uniqueUsers: 0 });
      }
      osTypeMap.get(row.os_type).uniqueClicks += row.totalClicks;
      osTypeMap.get(row.os_type).uniqueUsers += row.uniqueClicks;

      if (!deviceTypeMap.has(row.device_type)) {
        deviceTypeMap.set(row.device_type, { deviceName: row.device_type, uniqueClicks: 0, uniqueUsers: 0 });
      }
      deviceTypeMap.get(row.device_type).uniqueClicks += row.totalClicks;
      deviceTypeMap.get(row.device_type).uniqueUsers += row.uniqueClicks;
    });

    result.uniqueClicks = new Set(rows.map(row => row.ip_address)).size;
    result.clicksByDate = Array.from(dateMap.values());
    result.osType = Array.from(osTypeMap.values());
    result.deviceType = Array.from(deviceTypeMap.values());

    return result;
  }
}

module.exports = Url;


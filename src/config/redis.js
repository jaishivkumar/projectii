const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL
});

async function initializeRedis() {
  try {
    await client.connect();
    console.log('Redis client connected');
  } catch (error) {
    console.error('Redis client error:', error);
  }
}

module.exports = { client, initializeRedis };


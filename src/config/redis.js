const redis = require('redis');
require('dotenv').config();

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on('error', (err) => {
    // Suppress connection errors to avoid terminal clutter when Redis isn't running
    const isConnRefused = err.code === 'ECONNREFUSED' ||
        (err.errors && err.errors.some(e => e.code === 'ECONNREFUSED'));

    if (isConnRefused) return;

    console.error('Redis Client Error', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis (Optional Caching Enabled)');
    } catch (err) {
        // Silently continue - caching is optional
    }
})();

module.exports = redisClient;

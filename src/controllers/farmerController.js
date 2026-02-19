const supabase = require('../config/supabase');
const redisClient = require('../config/redis');

exports.getFarmers = async (req, res) => {
    try {
        const cacheKey = 'all_farmers';

        // Try fetching from Redis first
        if (redisClient.isOpen) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log('Serving from Cache');
                return res.json(JSON.parse(cachedData));
            }
        }

        // If not in cache, fetch from Supabase
        const { data, error } = await supabase
            .from('farmers')
            .select('*');

        if (error) throw error;

        // Store in Redis for future requests (expire in 1 hour)
        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFarmerById = async (req, res) => {
    const { id } = req.params;
    try {
        const cacheKey = `farmer:${id}`;

        if (redisClient.isOpen) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
        }

        const { data, error } = await supabase
            .from('farmers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

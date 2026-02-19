const supabase = require('../config/supabase');
const ndviService = require('../services/ndviService');
const weatherService = require('../services/weatherService');
const marketPriceService = require('../services/marketPriceService');

/**
 * @route   GET /api/v1/validation/ndvi/:farm_id
 * @desc    Fetch NDVI (Normalized Difference Vegetation Index) for a farm
 * @access  Public
 */
exports.fetchNDVI = async (req, res) => {
    try {
        const { farm_id } = req.params;

        if (!farm_id) {
            return res.status(400).json({
                error: 'Missing farm_id',
                message: 'farm_id is required'
            });
        }

        // Get farm details with latest crop information
        const { data: farm, error: farmError } = await supabase
            .from('farms')
            .select(`
                *,
                farmers:farmer_id (
                    farmer_id,
                    full_name
                )
            `)
            .eq('farm_id', farm_id)
            .single();

        if (farmError || !farm) {
            return res.status(404).json({
                error: 'Farm not found',
                message: `No farm found with ID: ${farm_id}`
            });
        }

        // Get latest crop for the farm (if any)
        const { data: crops } = await supabase
            .from('crops')
            .select('*')
            .eq('farm_id', farm_id)
            .eq('crop_status', 'growing')
            .order('sowing_date', { ascending: false })
            .limit(1);

        const latestCrop = crops && crops.length > 0 ? crops[0] : null;

        // Check if farm has GPS coordinates
        if (!farm.gps_lat || !farm.gps_long) {
            return res.status(400).json({
                error: 'GPS coordinates not available',
                message: 'This farm does not have GPS coordinates. NDVI calculation requires location data.',
                suggestion: 'Update farm details with GPS coordinates'
            });
        }

        // Fetch NDVI data
        const ndviData = await ndviService.fetchNDVIData(farm, latestCrop);

        // Return response
        return res.status(200).json({
            farm_id: farm.farm_id,
            farmer_name: farm.farmers?.full_name,
            ndvi_score: ndviData.ndvi_score,
            health_status: ndviData.health_status,
            confidence_level: ndviData.confidence_level,
            measurement_date: ndviData.measurement_date,
            location: ndviData.location,
            crop_info: ndviData.crop_info,
            recommendations: ndviData.recommendations,
            data_source: ndviData.data_source,
            integration_note: 'Using mock data. In production, this integrates with Sentinel Hub / Google Earth Engine'
        });

    } catch (error) {
        console.error('Fetch NDVI Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch NDVI data',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/validation/weather/:farm_id
 * @desc    Fetch weather data for a farm location
 * @access  Public
 */
exports.fetchWeather = async (req, res) => {
    try {
        const { farm_id } = req.params;

        if (!farm_id) {
            return res.status(400).json({
                error: 'Missing farm_id',
                message: 'farm_id is required'
            });
        }

        // Get farm details with location information
        const { data: farm, error: farmError } = await supabase
            .from('farms')
            .select(`
                *,
                farmers:farmer_id (
                    farmer_id,
                    full_name
                )
            `)
            .eq('farm_id', farm_id)
            .single();

        if (farmError || !farm) {
            return res.status(404).json({
                error: 'Farm not found',
                message: `No farm found with ID: ${farm_id}`
            });
        }

        // Check if farm has location data
        if (!farm.state || !farm.district) {
            return res.status(400).json({
                error: 'Location data not available',
                message: 'This farm does not have complete location information.',
                suggestion: 'Update farm details with state and district'
            });
        }

        // Get latest crop for season information (if any)
        const { data: crops } = await supabase
            .from('crops')
            .select('*')
            .eq('farm_id', farm_id)
            .eq('crop_status', 'growing')
            .order('sowing_date', { ascending: false })
            .limit(1);

        const latestCrop = crops && crops.length > 0 ? crops[0] : null;

        // Fetch weather data
        const weatherData = await weatherService.fetchWeatherData(farm, latestCrop);

        // Return response
        return res.status(200).json({
            farm_id: farm.farm_id,
            farmer_name: farm.farmers?.full_name,
            location: weatherData.location,
            current_weather: {
                temperature: weatherData.temperature,
                rainfall_mm: weatherData.rainfall_mm,
                humidity_percent: weatherData.humidity_percent,
                wind_speed_kmph: weatherData.wind_speed_kmph
            },
            drought_risk: weatherData.drought_risk,
            irrigation_status: farm.irrigation_type,
            recommendations: weatherData.recommendations,
            season: weatherData.season,
            data_date: weatherData.data_date,
            data_source: weatherData.data_source,
            integration_note: 'Using mock data. In production, this integrates with OpenWeather API'
        });

    } catch (error) {
        console.error('Fetch Weather Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch weather data',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/validation/market-price/:crop
 * @desc    Fetch market price for a crop
 * @access  Public
 */
exports.fetchMarketPrice = async (req, res) => {
    try {
        const { crop } = req.params;
        const { state, season } = req.query; // Optional parameters

        if (!crop) {
            return res.status(400).json({
                error: 'Missing crop name',
                message: 'crop parameter is required'
            });
        }

        // Fetch market price data
        const marketData = await marketPriceService.fetchMarketPrice(
            crop,
            state || 'India',
            season || null
        );

        // Return response
        return res.status(200).json({
            crop: marketData.crop,
            current_price: {
                price_per_quintal: marketData.price_per_quintal,
                currency: marketData.currency,
                unit: marketData.unit
            },
            market_analysis: {
                trend: marketData.market_trend,
                price_change_percent: marketData.price_change_percent,
                average_price: marketData.average_price
            },
            nearby_markets: marketData.nearby_markets,
            best_market: marketData.best_market,
            recommendations: marketData.recommendations,
            location: marketData.location,
            season: marketData.season,
            date: marketData.date,
            data_source: marketData.data_source,
            integration_note: 'Using mock data. In production, this integrates with Agmarknet API'
        });

    } catch (error) {
        console.error('Fetch Market Price Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch market price',
            message: error.message
        });
    }
};

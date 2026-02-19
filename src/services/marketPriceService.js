const axios = require('axios');

/**
 * Mock Market Price Service
 * In production, this would integrate with:
 * - Agmarknet (Government of India)
 * - National Commodity & Derivatives Exchange (NCDEX)
 * - Multi Commodity Exchange (MCX)
 */

/**
 * Mock market prices for common crops (per quintal in INR)
 */
const basePrices = {
    'Wheat': 2200,
    'Rice': 2800,
    'Maize': 1850,
    'Sugarcane': 350,
    'Cotton': 6500,
    'Soybean': 4200,
    'Groundnut': 5500,
    'Mustard': 5200,
    'Pulses': 6000,
    'Chickpea': 5800,
    'Lentil': 6200,
    'Potato': 800,
    'Onion': 1200,
    'Tomato': 1500,
    'Turmeric': 8000,
    'Chilli': 12000,
    'Barley': 1650,
    'Bajra': 2100,
    'Jowar': 3200
};

/**
 * Calculate mock market price with regional and seasonal variations
 */
const calculateMarketPrice = (cropType, state, season) => {
    // Get base price
    let price = basePrices[cropType] || 3000; // Default if crop not in list
    
    // Regional price variation
    const highPriceStates = ['Punjab', 'Haryana', 'Maharashtra', 'Gujarat'];
    const moderatePriceStates = ['Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan'];
    
    if (highPriceStates.includes(state)) {
        price *= 1.1; // 10% higher in these states
    } else if (moderatePriceStates.includes(state)) {
        price *= 1.05; // 5% higher
    }
    
    // Seasonal variation
    if (season === 'Rabi') {
        price *= 1.05; // Rabi crops generally fetch better prices
    }
    
    // Market fluctuation (±10%)
    const fluctuation = (Math.random() - 0.5) * 0.2 + 1;
    price *= fluctuation;
    
    return Math.round(price);
};

/**
 * Determine price trend
 */
const getPriceTrend = () => {
    const trends = ['Rising', 'Stable', 'Falling'];
    const random = Math.random();
    
    if (random < 0.4) return 'Stable';
    if (random < 0.7) return 'Rising';
    return 'Falling';
};

/**
 * Calculate potential revenue
 */
const calculatePotentialRevenue = (pricePerQuintal, expectedYield) => {
    if (!expectedYield) return null;
    
    const totalRevenue = pricePerQuintal * expectedYield;
    return {
        total_revenue: Math.round(totalRevenue),
        price_per_quintal: pricePerQuintal,
        expected_yield_qtl: expectedYield,
        currency: 'INR'
    };
};

/**
 * Generate market recommendations
 */
const generateMarketRecommendations = (cropType, price, trend, avgPrice) => {
    const recommendations = [];
    
    const priceDiff = ((price - avgPrice) / avgPrice) * 100;
    
    if (priceDiff > 10) {
        recommendations.push(`✅ ${cropType} prices are ${priceDiff.toFixed(1)}% above average - Good time to sell`);
        recommendations.push('Consider harvesting if crop is ready');
    } else if (priceDiff < -10) {
        recommendations.push(`⚠️ ${cropType} prices are ${Math.abs(priceDiff).toFixed(1)}% below average`);
        recommendations.push('Consider storage options if available');
        recommendations.push('Wait for better market conditions if possible');
    } else {
        recommendations.push(`${cropType} prices are near market average`);
        recommendations.push('Normal selling conditions');
    }
    
    if (trend === 'Rising') {
        recommendations.push('📈 Price trend is upward - May benefit from holding');
    } else if (trend === 'Falling') {
        recommendations.push('📉 Price trend is downward - Consider selling soon');
    } else {
        recommendations.push('➡️ Price trend is stable');
    }
    
    return recommendations;
};

/**
 * Fetch market price for a crop
 */
exports.fetchMarketPrice = async (cropType, state = 'India', season = null) => {
    try {
        // In production, this would call Agmarknet API:
        // const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`;
        // const response = await axios.get(url, { params: { api-key: API_KEY, filters: {...} } });
        
        // Normalize crop name
        const normalizedCrop = cropType.charAt(0).toUpperCase() + cropType.slice(1).toLowerCase();
        
        // Calculate market price
        const price_per_quintal = calculateMarketPrice(normalizedCrop, state, season);
        const avg_price = basePrices[normalizedCrop] || 3000;
        const trend = getPriceTrend();
        
        // Get nearby market prices (mock data)
        const nearbyMarkets = [
            {
                market_name: `${state} Mandi`,
                price: Math.round(price_per_quintal * (0.95 + Math.random() * 0.1)),
                distance_km: Math.round(Math.random() * 30 + 5)
            },
            {
                market_name: `District Market`,
                price: Math.round(price_per_quintal * (0.93 + Math.random() * 0.14)),
                distance_km: Math.round(Math.random() * 20 + 10)
            },
            {
                market_name: `Regional Hub`,
                price: Math.round(price_per_quintal * (0.96 + Math.random() * 0.08)),
                distance_km: Math.round(Math.random() * 50 + 20)
            }
        ].sort((a, b) => b.price - a.price);
        
        return {
            crop: normalizedCrop,
            price_per_quintal,
            currency: 'INR',
            unit: 'Quintal (100 kg)',
            market_trend: trend,
            price_change_percent: ((price_per_quintal - avg_price) / avg_price * 100).toFixed(2),
            average_price: avg_price,
            date: new Date().toISOString().split('T')[0],
            location: state,
            season: season || 'Current',
            nearby_markets: nearbyMarkets,
            best_market: nearbyMarkets[0],
            recommendations: generateMarketRecommendations(
                normalizedCrop,
                price_per_quintal,
                trend,
                avg_price
            ),
            data_source: 'Mock Market Data',
            integration_note: 'In production, integrates with Agmarknet and NCDEX'
        };
        
    } catch (error) {
        console.error('Market Price Fetch Error:', error);
        throw new Error('Failed to fetch market price');
    }
};

/**
 * Calculate revenue potential for a crop
 */
exports.calculateRevenuePotential = async (cropType, expectedYield, state = 'India') => {
    try {
        const marketData = await exports.fetchMarketPrice(cropType, state);
        return calculatePotentialRevenue(marketData.price_per_quintal, expectedYield);
    } catch (error) {
        console.error('Revenue Calculation Error:', error);
        throw error;
    }
};

/**
 * Integration placeholder for real Agmarknet API
 */
exports.fetchAgmarknetAPI = async (commodity, state, district) => {
    // Placeholder for Agmarknet API integration
    // API: https://api.data.gov.in/catalog/agmarknet
    // const API_KEY = process.env.AGMARKNET_API_KEY;
    // const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`;
    // const response = await axios.get(url, {
    //     params: {
    //         'api-key': API_KEY,
    //         'format': 'json',
    //         'filters[commodity]': commodity,
    //         'filters[state]': state
    //     }
    // });
    // return response.data;
    
    throw new Error('Agmarknet API integration not implemented yet');
};

/**
 * Fetch historical price trends
 */
exports.fetchHistoricalPrices = async (cropType, startDate, endDate) => {
    // Placeholder for historical price data
    throw new Error('Historical price data not implemented yet');
};

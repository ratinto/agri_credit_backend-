const axios = require('axios');

/**
 * Mock Weather Service
 * In production, this would integrate with OpenWeather API
 * API: https://openweathermap.org/api
 */

/**
 * Calculate mock rainfall based on location and season
 */
const calculateMockRainfall = (state, district, season, month) => {
    let baseRainfall = 0;
    
    // Base rainfall by region
    const highRainfallStates = ['Kerala', 'Maharashtra', 'West Bengal', 'Assam'];
    const moderateRainfallStates = ['Bihar', 'Uttar Pradesh', 'Madhya Pradesh'];
    
    if (highRainfallStates.includes(state)) {
        baseRainfall = 150;
    } else if (moderateRainfallStates.includes(state)) {
        baseRainfall = 80;
    } else {
        baseRainfall = 60;
    }
    
    // Adjust by season
    if (season === 'Kharif') {
        baseRainfall *= 1.5; // Monsoon season
    } else if (season === 'Rabi') {
        baseRainfall *= 0.4; // Winter season
    }
    
    // Add randomness
    const randomFactor = (Math.random() - 0.5) * 0.4 + 1;
    baseRainfall *= randomFactor;
    
    return Math.round(baseRainfall);
};

/**
 * Calculate mock temperature based on location and season
 */
const calculateMockTemperature = (state, season, month) => {
    let baseTemp = 28; // Base temperature in Celsius
    
    // Adjust by season
    if (season === 'Rabi') {
        baseTemp = 18; // Winter
    } else if (season === 'Kharif') {
        baseTemp = 30; // Monsoon
    } else if (season === 'Summer' || season === 'Zaid') {
        baseTemp = 38; // Summer
    }
    
    // Add regional variation
    const northernStates = ['Punjab', 'Haryana', 'Himachal Pradesh', 'Uttarakhand'];
    const southernStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh'];
    
    if (northernStates.includes(state)) {
        baseTemp -= 3;
    } else if (southernStates.includes(state)) {
        baseTemp += 2;
    }
    
    // Add slight randomness
    baseTemp += (Math.random() - 0.5) * 4;
    
    return {
        current: Math.round(baseTemp * 10) / 10,
        min: Math.round((baseTemp - 5) * 10) / 10,
        max: Math.round((baseTemp + 5) * 10) / 10
    };
};

/**
 * Determine drought risk based on rainfall and season
 */
const calculateDroughtRisk = (rainfall, season, irrigationType) => {
    if (irrigationType === 'Canal' || irrigationType === 'Tubewell') {
        return 'Low'; // Irrigation available
    }
    
    if (season === 'Kharif') {
        if (rainfall < 50) return 'High';
        if (rainfall < 100) return 'Medium';
        return 'Low';
    } else {
        if (rainfall < 30) return 'High';
        if (rainfall < 60) return 'Medium';
        return 'Low';
    }
};

/**
 * Generate weather-based recommendations
 */
const generateWeatherRecommendations = (rainfall, droughtRisk, temperature, season) => {
    const recommendations = [];
    
    if (droughtRisk === 'High') {
        recommendations.push('⚠️ High drought risk - Ensure adequate irrigation');
        recommendations.push('Consider drought-resistant crop varieties');
        recommendations.push('Implement water conservation measures');
    } else if (droughtRisk === 'Medium') {
        recommendations.push('⚠️ Moderate drought risk - Monitor water supply');
        recommendations.push('Plan irrigation schedule carefully');
    } else {
        recommendations.push('✅ Low drought risk - Normal farming practices');
    }
    
    if (temperature.current > 35) {
        recommendations.push('🌡️ High temperature - Increase irrigation frequency');
        recommendations.push('Protect crops from heat stress');
    }
    
    if (rainfall > 200) {
        recommendations.push('🌧️ Heavy rainfall expected - Ensure drainage');
        recommendations.push('Monitor for waterlogging');
    }
    
    if (season === 'Kharif' && rainfall < 80) {
        recommendations.push('💧 Below-average monsoon rainfall - Supplement with irrigation');
    }
    
    return recommendations;
};

/**
 * Fetch weather data for a farm
 */
exports.fetchWeatherData = async (farm, crop = null) => {
    try {
        // In production, this would call OpenWeather API:
        // const API_KEY = process.env.OPENWEATHER_API_KEY;
        // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        // const response = await axios.get(url);
        
        const currentMonth = new Date().getMonth() + 1;
        const season = crop?.season || 'Rabi';
        
        // Calculate mock weather data
        const rainfall_mm = calculateMockRainfall(
            farm.state,
            farm.district,
            season,
            currentMonth
        );
        
        const temperature = calculateMockTemperature(
            farm.state,
            season,
            currentMonth
        );
        
        const drought_risk = calculateDroughtRisk(
            rainfall_mm,
            season,
            farm.irrigation_type
        );
        
        const humidity = Math.round(60 + (Math.random() - 0.5) * 30);
        const wind_speed = Math.round(8 + (Math.random() - 0.5) * 6);
        
        return {
            rainfall_mm,
            temperature_celsius: temperature.current,
            temperature_range: {
                min: temperature.min,
                max: temperature.max
            },
            humidity_percent: humidity,
            wind_speed_kmph: wind_speed,
            drought_risk,
            weather_conditions: rainfall_mm > 50 ? 'Rainy' : 'Clear',
            forecast_period: '7 days',
            measurement_date: new Date().toISOString().split('T')[0],
            location: {
                state: farm.state,
                district: farm.district,
                latitude: farm.gps_lat || null,
                longitude: farm.gps_long || null
            },
            irrigation_status: farm.irrigation_type || 'Not specified',
            crop_season: season,
            recommendations: generateWeatherRecommendations(
                rainfall_mm,
                drought_risk,
                temperature,
                season
            ),
            data_source: 'Mock Weather Service'
        };
        
    } catch (error) {
        console.error('Weather Fetch Error:', error);
        throw new Error('Failed to fetch weather data');
    }
};

/**
 * Integration placeholder for real OpenWeather API
 */
exports.fetchOpenWeatherAPI = async (lat, lon) => {
    // Placeholder for OpenWeather API integration
    // const API_KEY = process.env.OPENWEATHER_API_KEY;
    // const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    // const response = await axios.get(url);
    // return response.data;
    
    throw new Error('OpenWeather API integration not implemented yet');
};

/**
 * Fetch historical weather data
 */
exports.fetchHistoricalWeather = async (lat, lon, startDate, endDate) => {
    // Placeholder for historical weather data
    // Would use OpenWeather History API or similar service
    
    throw new Error('Historical weather data not implemented yet');
};

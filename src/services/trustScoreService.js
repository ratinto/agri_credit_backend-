const supabase = require('../config/supabase');
const ndviService = require('./ndviService');
const weatherService = require('./weatherService');

/**
 * Agri-Trust Score Calculation Engine
 * 
 * Score Formula (0-100):
 * - Farm Data Validation: 30%
 * - Crop Health (NDVI): 30%
 * - Historical Performance: 25%
 * - Farmer Behavior: 15%
 */

/**
 * Calculate Farm Data Score (30 points)
 */
const calculateFarmDataScore = (farms) => {
    if (!farms || farms.length === 0) return 0;
    
    let score = 0;
    
    // Has registered farms: 10 points
    score += 10;
    
    // GPS coordinates available: 5 points
    const farmsWithGPS = farms.filter(f => f.gps_lat && f.gps_long).length;
    score += (farmsWithGPS / farms.length) * 5;
    
    // Complete farm details: 5 points
    const completeProfiles = farms.filter(f => 
        f.irrigation_type && f.soil_type && f.state && f.district
    ).length;
    score += (completeProfiles / farms.length) * 5;
    
    // Land ownership (>2 acres): 5 points
    const avgLandSize = farms.reduce((sum, f) => sum + parseFloat(f.land_size_acres || 0), 0) / farms.length;
    if (avgLandSize >= 5) score += 5;
    else if (avgLandSize >= 2) score += 3;
    else if (avgLandSize >= 1) score += 1;
    
    // Irrigation availability: 5 points
    const irrigatedFarms = farms.filter(f => 
        f.irrigation_type && f.irrigation_type !== 'Rainfed'
    ).length;
    score += (irrigatedFarms / farms.length) * 5;
    
    return Math.min(30, score);
};

/**
 * Calculate Crop Health Score (30 points)
 */
const calculateCropHealthScore = async (farms, crops) => {
    if (!crops || crops.length === 0) return 0;
    
    let totalScore = 0;
    let validCrops = 0;
    
    for (const crop of crops) {
        // Find associated farm
        const farm = farms.find(f => f.farm_id === crop.farm_id);
        if (!farm || !farm.gps_lat || !farm.gps_long) continue;
        
        try {
            // Get NDVI data
            const ndviData = await ndviService.fetchNDVIData(farm, crop);
            const ndvi = ndviData.ndvi_score;
            
            // Convert NDVI to score (0-10 points per crop)
            let cropScore = 0;
            if (ndvi >= 0.7) cropScore = 10;        // Excellent
            else if (ndvi >= 0.5) cropScore = 8;    // Healthy
            else if (ndvi >= 0.3) cropScore = 5;    // Moderate
            else if (ndvi >= 0.2) cropScore = 3;    // Poor
            else cropScore = 1;                      // Critical
            
            totalScore += cropScore;
            validCrops++;
        } catch (error) {
            console.error('Error calculating NDVI for crop:', crop.crop_id, error);
        }
    }
    
    if (validCrops === 0) return 15; // Default score if no NDVI available
    
    // Normalize to 30 points
    const avgScore = totalScore / validCrops;
    return (avgScore / 10) * 30;
};

/**
 * Calculate Historical Performance Score (25 points)
 */
const calculateHistoricalScore = (crops, farmer) => {
    let score = 0;
    
    if (!crops || crops.length === 0) {
        // New farmer - give benefit of doubt
        return 15;
    }
    
    // Crop diversity: 5 points
    const uniqueCrops = new Set(crops.map(c => c.crop_type)).size;
    if (uniqueCrops >= 3) score += 5;
    else if (uniqueCrops >= 2) score += 3;
    else score += 1;
    
    // Harvested crops: 10 points
    const harvestedCrops = crops.filter(c => c.crop_status === 'harvested').length;
    const totalCrops = crops.length;
    score += (harvestedCrops / totalCrops) * 10;
    
    // Yield achievement: 5 points
    const cropsWithYield = crops.filter(c => c.actual_yield_qtl && c.expected_yield_qtl);
    if (cropsWithYield.length > 0) {
        const avgAchievement = cropsWithYield.reduce((sum, c) => {
            return sum + (c.actual_yield_qtl / c.expected_yield_qtl);
        }, 0) / cropsWithYield.length;
        
        if (avgAchievement >= 1.0) score += 5;      // Met or exceeded
        else if (avgAchievement >= 0.8) score += 4;  // 80% achievement
        else if (avgAchievement >= 0.6) score += 2;  // 60% achievement
    } else {
        score += 3; // Default for new farmers
    }
    
    // Farming experience (years): 5 points
    const accountAge = farmer.created_at ? 
        (Date.now() - new Date(farmer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365) : 0;
    if (accountAge >= 2) score += 5;
    else if (accountAge >= 1) score += 3;
    else score += 1;
    
    return Math.min(25, score);
};

/**
 * Calculate Farmer Behavior Score (15 points)
 */
const calculateBehaviorScore = (farmer) => {
    let score = 0;
    
    // Profile completion: 5 points
    const profileCompletion = farmer.profile_completion || 0;
    score += (profileCompletion / 100) * 5;
    
    // Aadhaar verification: 5 points
    if (farmer.aadhaar_verified) score += 5;
    else score += 2; // Partial credit for registration
    
    // Regular platform usage: 5 points
    // For now, give default score based on verification status
    if (farmer.verification_status === 'verified' || farmer.verification_status === 'mock_verified') {
        score += 5;
    } else {
        score += 2;
    }
    
    return Math.min(15, score);
};

/**
 * Determine risk level based on trust score
 */
const determineRiskLevel = (score) => {
    if (score >= 75) return 'Low';
    if (score >= 50) return 'Medium';
    if (score >= 25) return 'High';
    return 'Very High';
};

/**
 * Generate recommendations based on score breakdown
 */
const generateRecommendations = (breakdown) => {
    const recommendations = [];
    
    if (breakdown.farm_data_score < 20) {
        recommendations.push('📍 Add GPS coordinates to all farms for better verification');
        recommendations.push('🌾 Complete farm details (soil type, irrigation type)');
    }
    
    if (breakdown.crop_health_score < 20) {
        recommendations.push('🌱 Improve crop health through better irrigation and fertilization');
        recommendations.push('📊 Monitor crop health regularly using satellite data');
    }
    
    if (breakdown.historical_score < 15) {
        recommendations.push('📈 Build farming history by recording all crops and harvests');
        recommendations.push('🎯 Try to meet or exceed expected yield targets');
    }
    
    if (breakdown.behavior_score < 10) {
        recommendations.push('✅ Complete your profile information');
        recommendations.push('🔐 Verify your Aadhaar for better trust score');
    }
    
    if (breakdown.total_score >= 75) {
        recommendations.push('🎉 Excellent trust score! You qualify for premium loan offers');
    } else if (breakdown.total_score >= 50) {
        recommendations.push('👍 Good trust score! Keep maintaining your farming records');
    } else {
        recommendations.push('💪 Keep improving your score to access better loan terms');
    }
    
    return recommendations;
};

/**
 * Calculate comprehensive trust score
 */
exports.calculateTrustScore = async (farmerId) => {
    try {
        // Get farmer details
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();
        
        if (farmerError || !farmer) {
            throw new Error('Farmer not found');
        }
        
        // Get all farms
        const { data: farms, error: farmsError } = await supabase
            .from('farms')
            .select('*')
            .eq('farmer_id', farmerId);
        
        if (farmsError) throw farmsError;
        
        // Get all crops
        const { data: crops, error: cropsError } = await supabase
            .from('crops')
            .select('*')
            .in('farm_id', farms.map(f => f.farm_id));
        
        if (cropsError) throw cropsError;
        
        // Calculate individual scores
        const farmDataScore = calculateFarmDataScore(farms || []);
        const cropHealthScore = await calculateCropHealthScore(farms || [], crops || []);
        const historicalScore = calculateHistoricalScore(crops || [], farmer);
        const behaviorScore = calculateBehaviorScore(farmer);
        
        // Calculate total score
        const totalScore = Math.round(farmDataScore + cropHealthScore + historicalScore + behaviorScore);
        const riskLevel = determineRiskLevel(totalScore);
        
        const breakdown = {
            farm_data_score: Math.round(farmDataScore),
            crop_health_score: Math.round(cropHealthScore),
            historical_score: Math.round(historicalScore),
            behavior_score: Math.round(behaviorScore),
            total_score: totalScore
        };
        
        // Update farmer's trust score in database
        await supabase
            .from('farmers')
            .update({
                trust_score: totalScore,
                risk_level: riskLevel
            })
            .eq('farmer_id', farmerId);
        
        return {
            farmer_id: farmerId,
            farmer_name: farmer.full_name,
            trust_score: totalScore,
            risk_level: riskLevel,
            score_breakdown: breakdown,
            recommendations: generateRecommendations(breakdown),
            calculation_date: new Date().toISOString(),
            validity: '90 days',
            factors: {
                farm_data: {
                    score: breakdown.farm_data_score,
                    max_score: 30,
                    weight: '30%',
                    description: 'Farm registration, GPS verification, land ownership'
                },
                crop_health: {
                    score: breakdown.crop_health_score,
                    max_score: 30,
                    weight: '30%',
                    description: 'NDVI-based crop health monitoring'
                },
                historical_performance: {
                    score: breakdown.historical_score,
                    max_score: 25,
                    weight: '25%',
                    description: 'Crop diversity, yield achievement, farming experience'
                },
                farmer_behavior: {
                    score: breakdown.behavior_score,
                    max_score: 15,
                    weight: '15%',
                    description: 'Profile completion, verification status, platform usage'
                }
            },
            statistics: {
                total_farms: farms?.length || 0,
                total_crops: crops?.length || 0,
                active_crops: crops?.filter(c => c.crop_status === 'growing').length || 0,
                harvested_crops: crops?.filter(c => c.crop_status === 'harvested').length || 0
            }
        };
        
    } catch (error) {
        console.error('Trust Score Calculation Error:', error);
        throw error;
    }
};

/**
 * Get cached trust score (if recent)
 */
exports.getTrustScore = async (farmerId) => {
    try {
        const { data: farmer, error } = await supabase
            .from('farmers')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();
        
        if (error || !farmer) {
            throw new Error('Farmer not found');
        }
        
        return {
            farmer_id: farmerId,
            farmer_name: farmer.full_name,
            trust_score: farmer.trust_score || 0,
            risk_level: farmer.risk_level || 'Not Calculated',
            last_updated: farmer.updated_at,
            note: 'Use calculate endpoint to refresh score'
        };
        
    } catch (error) {
        console.error('Get Trust Score Error:', error);
        throw error;
    }
};

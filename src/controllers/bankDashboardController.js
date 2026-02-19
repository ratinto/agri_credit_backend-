const supabase = require('../config/supabase');

/**
 * Get all pending loan applications
 * GET /api/v1/bank/loan-applications
 */
const getPendingLoanApplications = async (req, res) => {
    try {
        const { status, min_score, max_score, crop_type, risk_level } = req.query;

        let query = supabase
            .from('loans')
            .select(`
                loan_id,
                farmer_id,
                loan_amount,
                interest_rate,
                loan_duration_months,
                loan_purpose,
                trust_score_at_application,
                risk_level,
                loan_status,
                application_date,
                lender_name,
                lender_type,
                farmers (
                    full_name,
                    mobile_number,
                    state,
                    district,
                    village
                )
            `)
            .order('application_date', { ascending: false });

        // Filter by status (default: pending)
        if (status) {
            query = query.eq('loan_status', status);
        } else {
            query = query.eq('loan_status', 'pending');
        }

        // Filter by trust score range
        if (min_score) {
            query = query.gte('trust_score_at_application', parseInt(min_score));
        }
        if (max_score) {
            query = query.lte('trust_score_at_application', parseInt(max_score));
        }

        // Filter by risk level
        if (risk_level) {
            query = query.eq('risk_level', risk_level);
        }

        const { data: loans, error } = await query;

        if (error) {
            console.error('Fetch loan applications error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch loan applications',
                error: error.message
            });
        }

        // Format response
        const formattedLoans = loans.map(loan => ({
            loan_id: loan.loan_id,
            farmer_id: loan.farmer_id,
            farmer_name: loan.farmers?.full_name || 'Unknown',
            farmer_mobile: loan.farmers?.mobile_number,
            location: {
                state: loan.farmers?.state,
                district: loan.farmers?.district,
                village: loan.farmers?.village
            },
            requested_amount: loan.loan_amount,
            interest_rate: loan.interest_rate,
            duration_months: loan.loan_duration_months,
            loan_purpose: loan.loan_purpose,
            credit_score: loan.trust_score_at_application,
            risk_level: loan.risk_level,
            loan_status: loan.loan_status,
            application_date: loan.application_date,
            lender_name: loan.lender_name
        }));

        res.status(200).json({
            success: true,
            total_applications: formattedLoans.length,
            data: formattedLoans
        });

    } catch (error) {
        console.error('Get pending loan applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get farmer complete profile
 * GET /api/v1/bank/farmer/:farmer_id
 */
const getFarmerProfile = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        // Get farmer details
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('*')
            .eq('farmer_id', farmer_id)
            .single();

        if (farmerError || !farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }

        // Get farm details
        const { data: farms, error: farmsError } = await supabase
            .from('farms')
            .select('*')
            .eq('farmer_id', farmer_id);

        // Get crop details
        const { data: crops, error: cropsError } = await supabase
            .from('crops')
            .select('*')
            .eq('farm_id', farms?.[0]?.farm_id);

        // Get loan history
        const { data: loans, error: loansError } = await supabase
            .from('loans')
            .select('loan_id, loan_amount, loan_status, application_date, amount_repaid')
            .eq('farmer_id', farmer_id)
            .order('application_date', { ascending: false });

        // Calculate total land
        const total_land_acres = farms?.reduce((sum, farm) => sum + parseFloat(farm.land_size_acres || 0), 0) || 0;

        // Calculate estimated income (mock calculation)
        const estimated_income = crops?.reduce((sum, crop) => {
            const yield_qtl = parseFloat(crop.expected_yield_qtl || 0);
            const price_per_qtl = 2000; // Mock average price
            return sum + (yield_qtl * price_per_qtl);
        }, 0) || 0;

        // Build comprehensive profile
        const profile = {
            farmer_details: {
                farmer_id: farmer.farmer_id,
                farmer_name: farmer.full_name,
                mobile_number: farmer.mobile_number,
                aadhaar_verified: farmer.aadhaar_verified,
                verification_status: farmer.verification_status,
                location: {
                    village: farmer.village,
                    district: farmer.district,
                    state: farmer.state
                },
                profile_completion: farmer.profile_completion
            },
            credit_assessment: {
                credit_score: farmer.trust_score || 0,
                risk_level: farmer.risk_level || 'Unknown',
                last_updated: farmer.updated_at
            },
            farm_details: {
                total_farms: farms?.length || 0,
                total_land_acres: total_land_acres,
                farms: farms?.map(farm => ({
                    farm_id: farm.farm_id,
                    land_size_acres: farm.land_size_acres,
                    irrigation_type: farm.irrigation_type,
                    soil_type: farm.soil_type,
                    location: {
                        state: farm.state,
                        district: farm.district,
                        village: farm.village
                    }
                })) || []
            },
            crop_details: {
                total_crops: crops?.length || 0,
                active_crops: crops?.filter(c => c.crop_status === 'growing').length || 0,
                crops: crops?.map(crop => ({
                    crop_id: crop.crop_id,
                    crop_type: crop.crop_type,
                    season: crop.season,
                    area_acres: crop.area_acres,
                    expected_yield_qtl: crop.expected_yield_qtl,
                    crop_status: crop.crop_status,
                    sowing_date: crop.sowing_date
                })) || []
            },
            financial_summary: {
                estimated_annual_income: estimated_income,
                total_loans: loans?.length || 0,
                active_loans: loans?.filter(l => l.loan_status === 'approved' || l.loan_status === 'disbursed').length || 0,
                total_borrowed: loans?.reduce((sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0) || 0,
                total_repaid: loans?.reduce((sum, loan) => sum + parseFloat(loan.amount_repaid || 0), 0) || 0
            },
            loan_history: loans?.map(loan => ({
                loan_id: loan.loan_id,
                loan_amount: loan.loan_amount,
                loan_status: loan.loan_status,
                application_date: loan.application_date,
                amount_repaid: loan.amount_repaid
            })) || []
        };

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error('Get farmer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get credit score breakdown for a farmer
 * GET /api/v1/bank/score-breakdown/:farmer_id
 */
const getCreditScoreBreakdown = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        // Import trustScoreService for breakdown
        const trustScoreService = require('../services/trustScoreService');

        // Calculate trust score (which includes breakdown)
        const scoreData = await trustScoreService.calculateTrustScore(farmer_id);

        if (!scoreData) {
            return res.status(404).json({
                success: false,
                message: 'Unable to calculate credit score for this farmer'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                farmer_id: scoreData.farmer_id,
                farmer_name: scoreData.farmer_name,
                total_score: scoreData.trust_score,
                risk_level: scoreData.risk_level,
                breakdown: {
                    farm_fundamentals: {
                        score: scoreData.score_breakdown.farm_data_score,
                        max_score: 30,
                        percentage: ((scoreData.score_breakdown.farm_data_score / 30) * 100).toFixed(1),
                        weight: '30%'
                    },
                    crop_health: {
                        score: scoreData.score_breakdown.crop_health_score,
                        max_score: 30,
                        percentage: ((scoreData.score_breakdown.crop_health_score / 30) * 100).toFixed(1),
                        weight: '30%'
                    },
                    historical_performance: {
                        score: scoreData.score_breakdown.historical_score,
                        max_score: 25,
                        percentage: ((scoreData.score_breakdown.historical_score / 25) * 100).toFixed(1),
                        weight: '25%'
                    },
                    farmer_behavior: {
                        score: scoreData.score_breakdown.behavior_score,
                        max_score: 15,
                        percentage: ((scoreData.score_breakdown.behavior_score / 15) * 100).toFixed(1),
                        weight: '15%'
                    }
                },
                recommendation: scoreData.trust_score >= 75 ? 'Low Risk - Recommend Approval' :
                                scoreData.trust_score >= 50 ? 'Medium Risk - Approve with conditions' :
                                scoreData.trust_score >= 25 ? 'High Risk - Careful evaluation needed' :
                                'Very High Risk - Not recommended'
            }
        });

    } catch (error) {
        console.error('Get credit score breakdown error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Filter loan applications
 * GET /api/v1/bank/filter
 */
const filterLoanApplications = async (req, res) => {
    try {
        const { min_score, max_score, crop, state, district, status, risk_level } = req.query;

        let query = supabase
            .from('loans')
            .select(`
                *,
                farmers (
                    full_name,
                    state,
                    district
                )
            `)
            .order('application_date', { ascending: false });

        // Apply filters
        if (min_score) {
            query = query.gte('trust_score_at_application', parseInt(min_score));
        }
        if (max_score) {
            query = query.lte('trust_score_at_application', parseInt(max_score));
        }
        if (status) {
            query = query.eq('loan_status', status);
        }
        if (risk_level) {
            query = query.eq('risk_level', risk_level);
        }

        const { data: loans, error } = await query;

        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to filter applications',
                error: error.message
            });
        }

        // Additional filtering for crop and location (requires joins with farms/crops)
        let filteredLoans = loans;

        if (state) {
            filteredLoans = filteredLoans.filter(loan => loan.farmers?.state === state);
        }
        if (district) {
            filteredLoans = filteredLoans.filter(loan => loan.farmers?.district === district);
        }

        res.status(200).json({
            success: true,
            total_results: filteredLoans.length,
            filters_applied: { min_score, max_score, crop, state, district, status, risk_level },
            data: filteredLoans.map(loan => ({
                loan_id: loan.loan_id,
                farmer_id: loan.farmer_id,
                farmer_name: loan.farmers?.full_name,
                requested_amount: loan.loan_amount,
                credit_score: loan.trust_score_at_application,
                risk_level: loan.risk_level,
                loan_status: loan.loan_status,
                application_date: loan.application_date
            }))
        });

    } catch (error) {
        console.error('Filter loan applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getPendingLoanApplications,
    getFarmerProfile,
    getCreditScoreBreakdown,
    filterLoanApplications
};

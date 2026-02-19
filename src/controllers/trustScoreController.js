const trustScoreService = require('../services/trustScoreService');

/**
 * @route   POST /api/v1/trust-score/calculate/:farmer_id
 * @desc    Calculate Agri-Trust Score for a farmer
 * @access  Public
 */
exports.calculateTrustScore = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        if (!farmer_id) {
            return res.status(400).json({
                error: 'Missing farmer_id',
                message: 'farmer_id is required'
            });
        }

        // Calculate trust score
        const trustScoreData = await trustScoreService.calculateTrustScore(farmer_id);

        return res.status(200).json({
            success: true,
            message: 'Trust score calculated successfully',
            data: trustScoreData
        });

    } catch (error) {
        console.error('Calculate Trust Score Error:', error);
        
        if (error.message === 'Farmer not found') {
            return res.status(404).json({
                error: 'Farmer not found',
                message: `No farmer found with ID: ${req.params.farmer_id}`
            });
        }
        
        return res.status(500).json({
            error: 'Failed to calculate trust score',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/trust-score/:farmer_id
 * @desc    Get current trust score for a farmer
 * @access  Public
 */
exports.getTrustScore = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        if (!farmer_id) {
            return res.status(400).json({
                error: 'Missing farmer_id',
                message: 'farmer_id is required'
            });
        }

        // Get trust score
        const trustScoreData = await trustScoreService.getTrustScore(farmer_id);

        return res.status(200).json({
            success: true,
            data: trustScoreData
        });

    } catch (error) {
        console.error('Get Trust Score Error:', error);
        
        if (error.message === 'Farmer not found') {
            return res.status(404).json({
                error: 'Farmer not found',
                message: `No farmer found with ID: ${req.params.farmer_id}`
            });
        }
        
        return res.status(500).json({
            error: 'Failed to get trust score',
            message: error.message
        });
    }
};

const loanService = require('../services/loanService');

/**
 * @route   GET /api/v1/loan/offers/:farmer_id
 * @desc    Get loan offers for a farmer based on trust score
 * @access  Public
 */
exports.getLoanOffers = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        if (!farmer_id) {
            return res.status(400).json({
                error: 'Missing farmer_id',
                message: 'farmer_id is required'
            });
        }

        const offers = await loanService.generateLoanOffers(farmer_id);

        return res.status(200).json({
            success: true,
            data: offers
        });

    } catch (error) {
        console.error('Get Loan Offers Error:', error);
        
        if (error.message === 'Farmer not found') {
            return res.status(404).json({
                error: 'Farmer not found',
                message: `No farmer found with ID: ${req.params.farmer_id}`
            });
        }
        
        return res.status(500).json({
            error: 'Failed to get loan offers',
            message: error.message
        });
    }
};

/**
 * @route   POST /api/v1/loan/apply
 * @desc    Apply for a loan
 * @access  Public
 */
exports.applyLoan = async (req, res) => {
    try {
        const { farmer_id, loan_amount, interest_rate, loan_duration_months, loan_purpose, lender_name, lender_type } = req.body;

        // Validation
        if (!farmer_id || !loan_amount || !interest_rate || !loan_duration_months) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'farmer_id, loan_amount, interest_rate, and loan_duration_months are required'
            });
        }

        if (loan_amount <= 0 || loan_amount > 10000000) {
            return res.status(400).json({
                error: 'Invalid loan amount',
                message: 'Loan amount must be between ₹1 and ₹1 Crore'
            });
        }

        if (interest_rate <= 0 || interest_rate > 30) {
            return res.status(400).json({
                error: 'Invalid interest rate',
                message: 'Interest rate must be between 0% and 30%'
            });
        }

        if (loan_duration_months < 1 || loan_duration_months > 120) {
            return res.status(400).json({
                error: 'Invalid loan duration',
                message: 'Loan duration must be between 1 and 120 months'
            });
        }

        const result = await loanService.applyForLoan(req.body);

        return res.status(201).json({
            success: true,
            message: 'Loan application submitted successfully',
            data: result
        });

    } catch (error) {
        console.error('Apply Loan Error:', error);
        
        if (error.message === 'Farmer not found') {
            return res.status(404).json({
                error: 'Farmer not found',
                message: 'Invalid farmer_id'
            });
        }
        
        return res.status(500).json({
            error: 'Failed to apply for loan',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/loan/status/:loan_id
 * @desc    Get loan status and details
 * @access  Public
 */
exports.getLoanStatus = async (req, res) => {
    try {
        const { loan_id } = req.params;

        if (!loan_id) {
            return res.status(400).json({
                error: 'Missing loan_id',
                message: 'loan_id is required'
            });
        }

        const loanStatus = await loanService.getLoanStatus(loan_id);

        return res.status(200).json({
            success: true,
            data: loanStatus
        });

    } catch (error) {
        console.error('Get Loan Status Error:', error);
        
        if (error.message === 'Loan not found') {
            return res.status(404).json({
                error: 'Loan not found',
                message: `No loan found with ID: ${req.params.loan_id}`
            });
        }
        
        return res.status(500).json({
            error: 'Failed to get loan status',
            message: error.message
        });
    }
};

/**
 * @route   POST /api/v1/loan/accept/:loan_id
 * @desc    Accept a loan offer
 * @access  Public
 */
exports.acceptLoan = async (req, res) => {
    try {
        const { loan_id } = req.params;

        if (!loan_id) {
            return res.status(400).json({
                error: 'Missing loan_id',
                message: 'loan_id is required'
            });
        }

        const result = await loanService.acceptLoan(loan_id);

        return res.status(200).json({
            success: true,
            message: 'Loan accepted successfully',
            data: result
        });

    } catch (error) {
        console.error('Accept Loan Error:', error);
        
        if (error.message === 'Loan not found') {
            return res.status(404).json({
                error: 'Loan not found',
                message: `No loan found with ID: ${req.params.loan_id}`
            });
        }
        
        if (error.message.includes('Cannot accept loan')) {
            return res.status(400).json({
                error: 'Invalid operation',
                message: error.message
            });
        }
        
        return res.status(500).json({
            error: 'Failed to accept loan',
            message: error.message
        });
    }
};

/**
 * @route   GET /api/v1/loan/history/:farmer_id
 * @desc    Get loan history for a farmer
 * @access  Public
 */
exports.getLoanHistory = async (req, res) => {
    try {
        const { farmer_id } = req.params;

        if (!farmer_id) {
            return res.status(400).json({
                error: 'Missing farmer_id',
                message: 'farmer_id is required'
            });
        }

        const history = await loanService.getLoanHistory(farmer_id);

        return res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('Get Loan History Error:', error);
        
        return res.status(500).json({
            error: 'Failed to get loan history',
            message: error.message
        });
    }
};

/**
 * @route   POST /api/v1/loan/repay/:loan_id
 * @desc    Make a loan repayment
 * @access  Public
 */
exports.repayLoan = async (req, res) => {
    try {
        const { loan_id } = req.params;
        const { repayment_amount, payment_method } = req.body;

        if (!loan_id) {
            return res.status(400).json({
                error: 'Missing loan_id',
                message: 'loan_id is required'
            });
        }

        if (!repayment_amount || repayment_amount <= 0) {
            return res.status(400).json({
                error: 'Invalid repayment amount',
                message: 'repayment_amount must be greater than 0'
            });
        }

        const result = await loanService.repayLoan(loan_id, repayment_amount, payment_method);

        return res.status(200).json({
            success: true,
            message: 'Repayment processed successfully',
            data: result
        });

    } catch (error) {
        console.error('Repay Loan Error:', error);
        
        if (error.message === 'Loan not found') {
            return res.status(404).json({
                error: 'Loan not found',
                message: `No loan found with ID: ${req.params.loan_id}`
            });
        }
        
        if (error.message === 'Loan already fully repaid') {
            return res.status(400).json({
                error: 'Invalid operation',
                message: error.message
            });
        }
        
        return res.status(500).json({
            error: 'Failed to process repayment',
            message: error.message
        });
    }
};

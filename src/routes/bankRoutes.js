const express = require('express');
const router = express.Router();
const bankAuthController = require('../controllers/bankAuthController');
const bankDashboardController = require('../controllers/bankDashboardController');
const bankLoanController = require('../controllers/bankLoanController');

// Middleware to verify JWT token and role
const verifyBankToken = (req, res, next) => {
    const jwt = require('jsonwebtoken');
    const config = require('../config/environment');
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        if (decoded.role !== 'BANK') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bank role required.'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// ==========================================
// AUTHENTICATION ROUTES (Public)
// ==========================================

/**
 * @route   POST /api/v1/bank/register
 * @desc    Register a new bank/lending institution
 * @access  Public
 */
router.post('/register', bankAuthController.registerBank);

/**
 * @route   POST /api/v1/bank/login
 * @desc    Bank login
 * @access  Public
 */
router.post('/login', bankAuthController.loginBank);

// ==========================================
// PROTECTED ROUTES (Bank Role Required)
// ==========================================

/**
 * @route   GET /api/v1/bank/profile
 * @desc    Get bank profile
 * @access  Private (Bank)
 */
router.get('/profile', verifyBankToken, bankAuthController.getBankProfile);

/**
 * @route   GET /api/v1/bank/loan-applications
 * @desc    Get all pending loan applications
 * @access  Private (Bank)
 */
router.get('/loan-applications', verifyBankToken, bankDashboardController.getPendingLoanApplications);

/**
 * @route   GET /api/v1/bank/farmer/:farmer_id
 * @desc    Get farmer complete profile
 * @access  Private (Bank)
 */
router.get('/farmer/:farmer_id', verifyBankToken, bankDashboardController.getFarmerProfile);

/**
 * @route   GET /api/v1/bank/score-breakdown/:farmer_id
 * @desc    Get credit score breakdown for a farmer
 * @access  Private (Bank)
 */
router.get('/score-breakdown/:farmer_id', verifyBankToken, bankDashboardController.getCreditScoreBreakdown);

/**
 * @route   GET /api/v1/bank/filter
 * @desc    Filter loan applications by various criteria
 * @access  Private (Bank)
 */
router.get('/filter', verifyBankToken, bankDashboardController.filterLoanApplications);

/**
 * @route   POST /api/v1/bank/loan/approve
 * @desc    Approve a loan application
 * @access  Private (Bank)
 */
router.post('/loan/approve', verifyBankToken, bankLoanController.approveLoan);

/**
 * @route   POST /api/v1/bank/loan/reject
 * @desc    Reject a loan application
 * @access  Private (Bank)
 */
router.post('/loan/reject', verifyBankToken, bankLoanController.rejectLoan);

/**
 * @route   POST /api/v1/bank/loan/disburse
 * @desc    Disburse approved loan (Mock)
 * @access  Private (Bank)
 */
router.post('/loan/disburse', verifyBankToken, bankLoanController.disburseLoan);

/**
 * @route   GET /api/v1/bank/loan/schedule/:loan_id
 * @desc    Get repayment schedule for a loan
 * @access  Private (Bank)
 */
router.get('/loan/schedule/:loan_id', verifyBankToken, bankLoanController.getRepaymentSchedule);

/**
 * @route   GET /api/v1/bank/loan/track/:loan_id
 * @desc    Track loan status with repayment history
 * @access  Private (Bank)
 */
router.get('/loan/track/:loan_id', verifyBankToken, bankLoanController.trackLoanStatus);

module.exports = router;

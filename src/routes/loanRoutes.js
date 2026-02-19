const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// Loan routes
router.get('/offers/:farmer_id', loanController.getLoanOffers);
router.post('/apply', loanController.applyLoan);
router.get('/status/:loan_id', loanController.getLoanStatus);
router.post('/accept/:loan_id', loanController.acceptLoan);
router.get('/history/:farmer_id', loanController.getLoanHistory);
router.post('/repay/:loan_id', loanController.repayLoan);

module.exports = router;

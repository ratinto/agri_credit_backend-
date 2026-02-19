const supabase = require('../config/supabase');

/**
 * Approve a loan application
 * POST /api/v1/bank/loan/approve
 */
const approveLoan = async (req, res) => {
    try {
        const bank_id = req.user.id; // From JWT middleware
        const { loan_id, approved_amount, interest_rate, tenure_seasons } = req.body;

        // Validation
        if (!loan_id || !approved_amount || !interest_rate) {
            return res.status(400).json({
                success: false,
                message: 'loan_id, approved_amount, and interest_rate are required'
            });
        }

        // Check if loan exists and is pending
        const { data: loan, error: fetchError } = await supabase
            .from('loans')
            .select('*, farmers(full_name, mobile_number)')
            .eq('loan_id', loan_id)
            .single();

        if (fetchError || !loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }

        if (loan.loan_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Loan is already ${loan.loan_status}. Cannot approve.`
            });
        }

        // Validate approved amount
        if (parseFloat(approved_amount) > parseFloat(loan.loan_amount)) {
            return res.status(400).json({
                success: false,
                message: 'Approved amount cannot exceed requested amount'
            });
        }

        // Calculate repayment schedule
        const principal = parseFloat(approved_amount);
        const rate = parseFloat(interest_rate) / 100;
        const duration_months = loan.loan_duration_months;
        
        // Calculate EMI using compound interest formula
        const monthlyRate = rate / 12;
        const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, duration_months)) / 
                    (Math.pow(1 + monthlyRate, duration_months) - 1);
        
        const total_payable = emi * duration_months;
        const outstanding_amount = total_payable;

        // Calculate repayment due date
        const repayment_due_date = new Date();
        repayment_due_date.setMonth(repayment_due_date.getMonth() + duration_months);

        // Update loan status
        const { data: updatedLoan, error: updateError } = await supabase
            .from('loans')
            .update({
                bank_id: bank_id,
                loan_status: 'approved',
                approved_amount: approved_amount,
                interest_rate: interest_rate,
                tenure_seasons: tenure_seasons || Math.ceil(duration_months / 6),
                emi_amount: Math.round(emi),
                outstanding_amount: Math.round(outstanding_amount),
                approval_date: new Date().toISOString(),
                repayment_due_date: repayment_due_date.toISOString().split('T')[0]
            })
            .eq('loan_id', loan_id)
            .select()
            .single();

        if (updateError) {
            console.error('Loan approval error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to approve loan',
                error: updateError.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Loan approved successfully',
            data: {
                loan_id: updatedLoan.loan_id,
                farmer_id: updatedLoan.farmer_id,
                farmer_name: loan.farmers?.full_name,
                status: 'approved',
                approved_amount: updatedLoan.approved_amount,
                interest_rate: updatedLoan.interest_rate,
                tenure_seasons: updatedLoan.tenure_seasons,
                emi_amount: updatedLoan.emi_amount,
                total_payable: Math.round(outstanding_amount),
                approval_date: updatedLoan.approval_date,
                repayment_due_date: updatedLoan.repayment_due_date,
                next_steps: [
                    '✅ Loan approved',
                    '📄 Complete documentation',
                    '💰 Proceed to disbursement',
                    '📱 Farmer will be notified'
                ]
            }
        });

    } catch (error) {
        console.error('Approve loan error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Reject a loan application
 * POST /api/v1/bank/loan/reject
 */
const rejectLoan = async (req, res) => {
    try {
        const bank_id = req.user.id;
        const { loan_id, reason } = req.body;

        // Validation
        if (!loan_id || !reason) {
            return res.status(400).json({
                success: false,
                message: 'loan_id and rejection reason are required'
            });
        }

        // Check if loan exists and is pending
        const { data: loan, error: fetchError } = await supabase
            .from('loans')
            .select('*, farmers(full_name, mobile_number)')
            .eq('loan_id', loan_id)
            .single();

        if (fetchError || !loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }

        if (loan.loan_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Loan is already ${loan.loan_status}. Cannot reject.`
            });
        }

        // Update loan status to rejected
        const { data: updatedLoan, error: updateError } = await supabase
            .from('loans')
            .update({
                bank_id: bank_id,
                loan_status: 'rejected',
                rejection_reason: reason
            })
            .eq('loan_id', loan_id)
            .select()
            .single();

        if (updateError) {
            console.error('Loan rejection error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to reject loan',
                error: updateError.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Loan rejected',
            data: {
                loan_id: updatedLoan.loan_id,
                farmer_id: updatedLoan.farmer_id,
                farmer_name: loan.farmers?.full_name,
                status: 'rejected',
                rejection_reason: reason,
                rejected_by: bank_id,
                next_steps: [
                    '❌ Loan application rejected',
                    '📱 Farmer will be notified',
                    '📝 Reason: ' + reason,
                    '🔄 Farmer can apply again after improving conditions'
                ]
            }
        });

    } catch (error) {
        console.error('Reject loan error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Disburse approved loan (Mock)
 * POST /api/v1/bank/loan/disburse
 */
const disburseLoan = async (req, res) => {
    try {
        const bank_id = req.user.id;
        const { loan_id } = req.body;

        // Validation
        if (!loan_id) {
            return res.status(400).json({
                success: false,
                message: 'loan_id is required'
            });
        }

        // Check if loan exists and is approved
        const { data: loan, error: fetchError } = await supabase
            .from('loans')
            .select('*, farmers(full_name, mobile_number)')
            .eq('loan_id', loan_id)
            .single();

        if (fetchError || !loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        if (loan.loan_status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: `Loan must be approved before disbursement. Current status: ${loan.loan_status}`
            });
        }

        // Check if loan belongs to this bank
        if (loan.bank_id !== bank_id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to disburse this loan'
            });
        }

        // Generate transaction ID (mock)
        const transaction_id = `TXN${Date.now()}`;

        // Update loan status to disbursed
        const disbursement_date = new Date().toISOString();

        const { data: updatedLoan, error: updateError } = await supabase
            .from('loans')
            .update({
                loan_status: 'disbursed',
                disbursement_date: disbursement_date,
                transaction_id: transaction_id
            })
            .eq('loan_id', loan_id)
            .select()
            .single();

        if (updateError) {
            console.error('Loan disbursement error:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to disburse loan',
                error: updateError.message
            });
        }

        res.status(200).json({
            success: true,
            message: 'Loan disbursed successfully',
            data: {
                loan_id: updatedLoan.loan_id,
                farmer_id: updatedLoan.farmer_id,
                farmer_name: loan.farmers?.full_name,
                farmer_mobile: loan.farmers?.mobile_number,
                status: 'disbursed',
                disbursed_amount: updatedLoan.approved_amount,
                transaction_id: transaction_id,
                disbursement_date: disbursement_date,
                disbursement_method: 'Bank Transfer (Mock)',
                next_steps: [
                    '✅ Loan disbursed successfully',
                    '💰 Amount credited to farmer account',
                    '📱 SMS notification sent to farmer',
                    '📊 Repayment tracking activated',
                    '🔔 EMI reminders will be sent'
                ]
            }
        });

    } catch (error) {
        console.error('Disburse loan error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get repayment schedule for a loan
 * GET /api/v1/bank/loan/schedule/:loan_id
 */
const getRepaymentSchedule = async (req, res) => {
    try {
        const { loan_id } = req.params;

        // Get loan details
        const { data: loan, error } = await supabase
            .from('loans')
            .select('*, farmers(full_name)')
            .eq('loan_id', loan_id)
            .single();

        if (error || !loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Generate repayment schedule
        const emi_amount = parseFloat(loan.emi_amount);
        const duration_months = loan.loan_duration_months;
        const start_date = new Date(loan.disbursement_date || loan.approval_date);

        const schedule = [];
        for (let month = 1; month <= duration_months; month++) {
            const due_date = new Date(start_date);
            due_date.setMonth(due_date.getMonth() + month);

            schedule.push({
                installment_number: month,
                due_date: due_date.toISOString().split('T')[0],
                emi_amount: emi_amount,
                status: 'pending' // Would track actual status in production
            });
        }

        res.status(200).json({
            success: true,
            data: {
                loan_id: loan.loan_id,
                farmer_name: loan.farmers?.full_name,
                loan_amount: loan.approved_amount || loan.loan_amount,
                emi_amount: emi_amount,
                duration_months: duration_months,
                total_payable: loan.outstanding_amount,
                amount_repaid: loan.amount_repaid,
                outstanding: loan.outstanding_amount,
                schedule: schedule
            }
        });

    } catch (error) {
        console.error('Get repayment schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Track loan status
 * GET /api/v1/bank/loan/track/:loan_id
 */
const trackLoanStatus = async (req, res) => {
    try {
        const { loan_id } = req.params;

        // Get loan with repayment history
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .select(`
                *,
                farmers (
                    full_name,
                    mobile_number
                )
            `)
            .eq('loan_id', loan_id)
            .single();

        if (loanError || !loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        // Get repayment history
        const { data: repayments, error: repaymentError } = await supabase
            .from('loan_repayments')
            .select('*')
            .eq('loan_id', loan_id)
            .order('repayment_date', { ascending: false });

        // Calculate repayment progress
        const total_payable = parseFloat(loan.outstanding_amount) + parseFloat(loan.amount_repaid || 0);
        const repayment_percentage = total_payable > 0 
            ? ((parseFloat(loan.amount_repaid || 0) / total_payable) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                loan_details: {
                    loan_id: loan.loan_id,
                    farmer_id: loan.farmer_id,
                    farmer_name: loan.farmers?.full_name,
                    farmer_mobile: loan.farmers?.mobile_number,
                    loan_status: loan.loan_status,
                    loan_amount: loan.loan_amount,
                    approved_amount: loan.approved_amount,
                    interest_rate: loan.interest_rate,
                    duration_months: loan.loan_duration_months
                },
                dates: {
                    application_date: loan.application_date,
                    approval_date: loan.approval_date,
                    disbursement_date: loan.disbursement_date,
                    repayment_due_date: loan.repayment_due_date
                },
                financial_summary: {
                    total_payable: total_payable,
                    amount_repaid: loan.amount_repaid,
                    outstanding_amount: loan.outstanding_amount,
                    repayment_percentage: repayment_percentage + '%',
                    emi_amount: loan.emi_amount
                },
                repayment_history: repayments?.map(r => ({
                    repayment_id: r.repayment_id,
                    amount: r.repayment_amount,
                    date: r.repayment_date,
                    payment_method: r.payment_method,
                    transaction_id: r.transaction_id
                })) || []
            }
        });

    } catch (error) {
        console.error('Track loan status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    approveLoan,
    rejectLoan,
    disburseLoan,
    getRepaymentSchedule,
    trackLoanStatus
};

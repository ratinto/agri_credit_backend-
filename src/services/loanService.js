const supabase = require('../config/supabase');
const trustScoreService = require('./trustScoreService');

/**
 * Loan Management Service
 * Handles loan applications, approvals, and repayments
 */

/**
 * Generate loan offers based on trust score
 */
exports.generateLoanOffers = async (farmerId) => {
    try {
        // Get farmer's trust score
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('*')
            .eq('farmer_id', farmerId)
            .single();
        
        if (farmerError || !farmer) {
            throw new Error('Farmer not found');
        }
        
        const trustScore = farmer.trust_score || 0;
        const riskLevel = farmer.risk_level || 'High';
        
        // Get farmer's farms for collateral calculation
        const { data: farms } = await supabase
            .from('farms')
            .select('*')
            .eq('farmer_id', farmerId);
        
        const totalLandSize = farms?.reduce((sum, f) => sum + parseFloat(f.land_size_acres || 0), 0) || 0;
        
        // Generate loan offers based on trust score and risk level
        const offers = [];
        
        // Offer 1: Government Scheme (KCC - Kisan Credit Card)
        if (trustScore >= 40) {
            const kccLimit = Math.min(totalLandSize * 50000, 300000); // ₹50k per acre, max ₹3L
            offers.push({
                offer_id: 'KCC-001',
                lender_name: 'Government Kisan Credit Card',
                lender_type: 'Government',
                loan_amount_min: 10000,
                loan_amount_max: kccLimit,
                interest_rate: 7.0,
                duration_months: 12,
                emi_per_lakh: 8600,
                processing_fee_percent: 0,
                collateral_required: 'Hypothecation of crops',
                features: [
                    'Interest subvention benefit',
                    'Prompt repayment incentive (3% reduction)',
                    'Flexible repayment based on harvest',
                    'No processing fee'
                ],
                eligibility: 'Available for all farmers with land records',
                recommended: trustScore >= 60
            });
        }
        
        // Offer 2: Cooperative Bank
        if (trustScore >= 50) {
            const coopLimit = Math.min(totalLandSize * 75000, 500000);
            offers.push({
                offer_id: 'COOP-001',
                lender_name: 'District Cooperative Bank',
                lender_type: 'Cooperative',
                loan_amount_min: 25000,
                loan_amount_max: coopLimit,
                interest_rate: trustScore >= 70 ? 9.5 : 10.5,
                duration_months: 24,
                emi_per_lakh: 4650,
                processing_fee_percent: 0.5,
                collateral_required: 'Land papers or FD',
                features: [
                    'Lower interest rates for members',
                    'Flexible repayment schedule',
                    'Quick approval process',
                    'Local branch support'
                ],
                eligibility: 'Membership in cooperative required',
                recommended: trustScore >= 65 && trustScore < 75
            });
        }
        
        // Offer 3: Regional Rural Bank
        if (trustScore >= 45) {
            const rrbLimit = Math.min(totalLandSize * 100000, 1000000);
            offers.push({
                offer_id: 'RRB-001',
                lender_name: 'Regional Rural Bank',
                lender_type: 'Bank',
                loan_amount_min: 50000,
                loan_amount_max: rrbLimit,
                interest_rate: trustScore >= 75 ? 10.0 : 11.5,
                duration_months: 36,
                emi_per_lakh: 3230,
                processing_fee_percent: 1.0,
                collateral_required: 'Land mortgage',
                features: [
                    'Longer repayment tenure',
                    'Government-backed',
                    'Agricultural insurance options',
                    'Subsidy schemes available'
                ],
                eligibility: 'Trust score above 45',
                recommended: trustScore >= 70
            });
        }
        
        // Offer 4: Commercial Bank (Premium)
        if (trustScore >= 70) {
            const bankLimit = Math.min(totalLandSize * 150000, 2000000);
            offers.push({
                offer_id: 'COMM-001',
                lender_name: 'SBI Agri Loan',
                lender_type: 'Commercial Bank',
                loan_amount_min: 100000,
                loan_amount_max: bankLimit,
                interest_rate: trustScore >= 80 ? 10.5 : 11.75,
                duration_months: 48,
                emi_per_lakh: 2560,
                processing_fee_percent: 1.5,
                collateral_required: 'Land + Crop insurance',
                features: [
                    'Higher loan amounts',
                    'Competitive interest rates',
                    'Digital loan management',
                    'Crop insurance bundled',
                    'Overdraft facility'
                ],
                eligibility: 'Trust score 70+ and verified land ownership',
                recommended: trustScore >= 80
            });
        }
        
        // Offer 5: NBFC (For lower trust scores)
        if (trustScore >= 30 && trustScore < 70) {
            const nbfcLimit = Math.min(totalLandSize * 60000, 300000);
            offers.push({
                offer_id: 'NBFC-001',
                lender_name: 'AgriFintech Solutions',
                lender_type: 'NBFC',
                loan_amount_min: 20000,
                loan_amount_max: nbfcLimit,
                interest_rate: trustScore >= 50 ? 14.5 : 16.5,
                duration_months: 18,
                emi_per_lakh: 6110,
                processing_fee_percent: 2.0,
                collateral_required: 'Post-dated cheques',
                features: [
                    'Quick disbursement (24-48 hours)',
                    'Minimal documentation',
                    'Mobile-first application',
                    'Flexible eligibility'
                ],
                eligibility: 'Trust score 30+, Aadhaar verification',
                recommended: trustScore >= 40 && trustScore < 60
            });
        }
        
        if (offers.length === 0) {
            return {
                farmer_id: farmerId,
                trust_score: trustScore,
                risk_level: riskLevel,
                message: 'No loan offers available. Please improve your trust score.',
                improvement_tips: [
                    'Register all your farms with complete details',
                    'Add GPS coordinates to farms',
                    'Record crop cultivation and harvest data',
                    'Complete your profile verification'
                ]
            };
        }
        
        // Sort offers by recommendation and interest rate
        offers.sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return a.interest_rate - b.interest_rate;
        });
        
        return {
            farmer_id: farmerId,
            farmer_name: farmer.full_name,
            trust_score: trustScore,
            risk_level: riskLevel,
            total_land_acres: totalLandSize,
            eligible_offers: offers.length,
            offers: offers,
            note: 'Interest rates and loan amounts are indicative and subject to lender approval'
        };
        
    } catch (error) {
        console.error('Generate Loan Offers Error:', error);
        throw error;
    }
};

/**
 * Calculate EMI
 */
const calculateEMI = (principal, annualRate, months) => {
    const monthlyRate = annualRate / (12 * 100);
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(emi);
};

/**
 * Apply for loan
 */
exports.applyForLoan = async (loanApplication) => {
    try {
        const { farmer_id, loan_amount, interest_rate, loan_duration_months, loan_purpose, lender_name, lender_type } = loanApplication;
        
        // Validate farmer exists
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('*')
            .eq('farmer_id', farmer_id)
            .single();
        
        if (farmerError || !farmer) {
            throw new Error('Farmer not found');
        }
        
        // Generate loan ID
        const { data: seqData } = await supabase.rpc('get_next_loan_id');
        const loanId = `LOAN${seqData}`;
        
        // Calculate EMI and outstanding amount
        const emiAmount = calculateEMI(loan_amount, interest_rate, loan_duration_months);
        const totalAmount = emiAmount * loan_duration_months;
        
        // Calculate repayment due date
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + loan_duration_months);
        
        // Insert loan application
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .insert([{
                loan_id: loanId,
                farmer_id: farmer_id,
                loan_amount: loan_amount,
                interest_rate: interest_rate,
                loan_duration_months: loan_duration_months,
                loan_purpose: loan_purpose || 'Agricultural purposes',
                trust_score_at_application: farmer.trust_score || 0,
                risk_level: farmer.risk_level || 'Not Calculated',
                loan_status: 'pending',
                outstanding_amount: totalAmount,
                emi_amount: emiAmount,
                lender_name: lender_name || 'To be assigned',
                lender_type: lender_type || 'Bank',
                repayment_due_date: dueDate.toISOString().split('T')[0]
            }])
            .select()
            .single();
        
        if (loanError) throw loanError;
        
        return {
            success: true,
            loan_id: loanId,
            loan_details: {
                loan_amount: loan_amount,
                interest_rate: interest_rate,
                duration_months: loan_duration_months,
                emi_amount: emiAmount,
                total_payable: totalAmount,
                processing_fee: Math.round(loan_amount * 0.01), // 1% processing fee
                repayment_due_date: dueDate.toISOString().split('T')[0]
            },
            application_status: 'pending',
            next_steps: [
                'Application submitted successfully',
                'Lender will review your application',
                'Expected processing time: 3-5 business days',
                'You will be notified of approval status'
            ]
        };
        
    } catch (error) {
        console.error('Apply Loan Error:', error);
        throw error;
    }
};

/**
 * Get loan status
 */
exports.getLoanStatus = async (loanId) => {
    try {
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .select(`
                *,
                farmers:farmer_id (
                    farmer_id,
                    full_name,
                    mobile_number
                )
            `)
            .eq('loan_id', loanId)
            .single();
        
        if (loanError || !loan) {
            throw new Error('Loan not found');
        }
        
        // Get repayment history
        const { data: repayments } = await supabase
            .from('loan_repayments')
            .select('*')
            .eq('loan_id', loanId)
            .order('repayment_date', { ascending: false });
        
        return {
            loan_id: loan.loan_id,
            farmer_name: loan.farmers?.full_name,
            loan_status: loan.loan_status,
            loan_amount: loan.loan_amount,
            interest_rate: loan.interest_rate,
            duration_months: loan.loan_duration_months,
            emi_amount: loan.emi_amount,
            amount_repaid: loan.amount_repaid || 0,
            outstanding_amount: loan.outstanding_amount,
            application_date: loan.application_date,
            approval_date: loan.approval_date,
            disbursement_date: loan.disbursement_date,
            repayment_due_date: loan.repayment_due_date,
            lender_name: loan.lender_name,
            lender_type: loan.lender_type,
            repayment_history: repayments || [],
            total_repayments: repayments?.length || 0
        };
        
    } catch (error) {
        console.error('Get Loan Status Error:', error);
        throw error;
    }
};

/**
 * Accept loan offer
 */
exports.acceptLoan = async (loanId) => {
    try {
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .select('*')
            .eq('loan_id', loanId)
            .single();
        
        if (loanError || !loan) {
            throw new Error('Loan not found');
        }
        
        if (loan.loan_status !== 'pending') {
            throw new Error(`Cannot accept loan. Current status: ${loan.loan_status}`);
        }
        
        // Update loan status to approved
        const approvalDate = new Date().toISOString();
        const disbursementDate = new Date();
        disbursementDate.setDate(disbursementDate.getDate() + 3); // 3 days for disbursement
        
        const { data: updatedLoan, error: updateError } = await supabase
            .from('loans')
            .update({
                loan_status: 'approved',
                approval_date: approvalDate,
                disbursement_date: disbursementDate.toISOString()
            })
            .eq('loan_id', loanId)
            .select()
            .single();
        
        if (updateError) throw updateError;
        
        return {
            success: true,
            loan_id: loanId,
            message: 'Loan accepted successfully',
            status: 'approved',
            approval_date: approvalDate,
            expected_disbursement_date: disbursementDate.toISOString().split('T')[0],
            next_steps: [
                '✅ Loan approved',
                '📄 Complete documentation process',
                '💰 Funds will be disbursed within 3 business days',
                '📱 You will receive SMS notification'
            ]
        };
        
    } catch (error) {
        console.error('Accept Loan Error:', error);
        throw error;
    }
};

/**
 * Get loan history for a farmer
 */
exports.getLoanHistory = async (farmerId) => {
    try {
        const { data: loans, error: loansError } = await supabase
            .from('loans')
            .select('*')
            .eq('farmer_id', farmerId)
            .order('application_date', { ascending: false });
        
        if (loansError) throw loansError;
        
        const summary = {
            total_loans: loans?.length || 0,
            active_loans: loans?.filter(l => l.loan_status === 'approved' || l.loan_status === 'disbursed').length || 0,
            pending_applications: loans?.filter(l => l.loan_status === 'pending').length || 0,
            completed_loans: loans?.filter(l => l.loan_status === 'repaid').length || 0,
            total_borrowed: loans?.reduce((sum, l) => sum + parseFloat(l.loan_amount || 0), 0) || 0,
            total_repaid: loans?.reduce((sum, l) => sum + parseFloat(l.amount_repaid || 0), 0) || 0,
            total_outstanding: loans?.reduce((sum, l) => sum + parseFloat(l.outstanding_amount || 0), 0) || 0
        };
        
        return {
            farmer_id: farmerId,
            summary: summary,
            loans: loans || []
        };
        
    } catch (error) {
        console.error('Get Loan History Error:', error);
        throw error;
    }
};

/**
 * Repay loan
 */
exports.repayLoan = async (loanId, repaymentAmount, paymentMethod) => {
    try {
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .select('*')
            .eq('loan_id', loanId)
            .single();
        
        if (loanError || !loan) {
            throw new Error('Loan not found');
        }
        
        if (loan.loan_status === 'repaid') {
            throw new Error('Loan already fully repaid');
        }
        
        // Generate repayment ID
        const { data: seqData } = await supabase.rpc('get_next_repayment_id');
        const repaymentId = `REP${seqData}`;
        
        // Record repayment
        const { data: repayment, error: repaymentError } = await supabase
            .from('loan_repayments')
            .insert([{
                repayment_id: repaymentId,
                loan_id: loanId,
                repayment_amount: repaymentAmount,
                payment_method: paymentMethod || 'Online',
                transaction_id: `TXN${Date.now()}`
            }])
            .select()
            .single();
        
        if (repaymentError) throw repaymentError;
        
        // Update loan
        const newAmountRepaid = parseFloat(loan.amount_repaid || 0) + parseFloat(repaymentAmount);
        const newOutstanding = parseFloat(loan.outstanding_amount) - parseFloat(repaymentAmount);
        const newStatus = newOutstanding <= 0 ? 'repaid' : loan.loan_status;
        
        await supabase
            .from('loans')
            .update({
                amount_repaid: newAmountRepaid,
                outstanding_amount: Math.max(0, newOutstanding),
                loan_status: newStatus
            })
            .eq('loan_id', loanId);
        
        return {
            success: true,
            repayment_id: repaymentId,
            loan_id: loanId,
            repayment_amount: repaymentAmount,
            amount_repaid: newAmountRepaid,
            outstanding_amount: Math.max(0, newOutstanding),
            loan_status: newStatus,
            transaction_id: repayment.transaction_id,
            repayment_date: repayment.repayment_date,
            message: newStatus === 'repaid' ? '🎉 Congratulations! Loan fully repaid' : 'Payment recorded successfully'
        };
        
    } catch (error) {
        console.error('Repay Loan Error:', error);
        throw error;
    }
};

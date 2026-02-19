const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Register a new bank/lending institution
 * POST /api/v1/bank/register
 */
const registerBank = async (req, res) => {
    try {
        const { bank_name, contact_person, email, password, license_number, bank_type } = req.body;

        // Validation
        if (!bank_name || !contact_person || !email || !password || !license_number) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (bank_name, contact_person, email, password, license_number)'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Password validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if email already exists
        const { data: existingBank, error: checkError } = await supabase
            .from('banks')
            .select('email')
            .eq('email', email)
            .single();

        if (existingBank) {
            return res.status(409).json({
                success: false,
                message: 'Bank with this email already exists'
            });
        }

        // Check if license number already exists
        const { data: existingLicense } = await supabase
            .from('banks')
            .select('license_number')
            .eq('license_number', license_number)
            .single();

        if (existingLicense) {
            return res.status(409).json({
                success: false,
                message: 'Bank with this license number already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Generate bank_id
        const { data: seqData } = await supabase.rpc('get_next_bank_id');
        const bank_id = `BNK${seqData}`;

        // Insert bank
        const { data: newBank, error: insertError } = await supabase
            .from('banks')
            .insert([{
                bank_id,
                bank_name,
                contact_person,
                email,
                password_hash,
                license_number,
                bank_type: bank_type || 'NBFC',
                role: 'BANK'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Bank registration error:', insertError);
            return res.status(500).json({
                success: false,
                message: 'Failed to register bank',
                error: insertError.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Bank registered successfully',
            data: {
                bank_id: newBank.bank_id,
                bank_name: newBank.bank_name,
                email: newBank.email
            }
        });

    } catch (error) {
        console.error('Register bank error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during bank registration',
            error: error.message
        });
    }
};

/**
 * Bank login
 * POST /api/v1/bank/login
 */
const loginBank = async (req, res) => {
    try {
        const { bank_id, email, password } = req.body;

        // Validation
        if ((!bank_id && !email) || !password) {
            return res.status(400).json({
                success: false,
                message: 'Bank ID or Email and password are required'
            });
        }

        // Find bank by bank_id or email
        let query = supabase.from('banks').select('*');
        
        if (bank_id) {
            query = query.eq('bank_id', bank_id);
        } else {
            query = query.eq('email', email);
        }

        const { data: bank, error: fetchError } = await query.single();

        if (fetchError || !bank) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if bank is active
        if (!bank.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Bank account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, bank.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: bank.bank_id,
                role: 'BANK',
                email: bank.email
            },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                role: 'BANK',
                bank_id: bank.bank_id,
                bank_name: bank.bank_name,
                email: bank.email
            }
        });

    } catch (error) {
        console.error('Bank login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

/**
 * Get bank profile
 * GET /api/v1/bank/profile
 */
const getBankProfile = async (req, res) => {
    try {
        const bank_id = req.user.id; // From JWT middleware

        const { data: bank, error } = await supabase
            .from('banks')
            .select('bank_id, bank_name, contact_person, email, license_number, bank_type, is_active, created_at')
            .eq('bank_id', bank_id)
            .single();

        if (error || !bank) {
            return res.status(404).json({
                success: false,
                message: 'Bank not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bank
        });

    } catch (error) {
        console.error('Get bank profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    registerBank,
    loginBank,
    getBankProfile
};

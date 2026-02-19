const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwtHelper');
const { 
    validateAadhaar, 
    validateMobile, 
    validatePassword,
    mockAadhaarVerification 
} = require('../utils/validation');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register farmer using Aadhaar + password (Mock Aadhaar validation)
 * @access  Public
 */
exports.registerFarmer = async (req, res) => {
    try {
        const { 
            aadhaar_number, 
            full_name, 
            mobile_number, 
            password, 
            language_preference 
        } = req.body;

        // Validation: Check if all required fields are provided
        if (!aadhaar_number || !full_name || !mobile_number || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'aadhaar_number, full_name, mobile_number, and password are required'
            });
        }

        // Validate Aadhaar number (must be 12 digits)
        if (!validateAadhaar(aadhaar_number)) {
            return res.status(400).json({
                error: 'Invalid Aadhaar number',
                message: 'Aadhaar must be exactly 12 digits'
            });
        }

        // Validate mobile number (must be 10 digits)
        if (!validateMobile(mobile_number)) {
            return res.status(400).json({
                error: 'Invalid mobile number',
                message: 'Mobile number must be exactly 10 digits'
            });
        }

        // Validate password (minimum 8 characters)
        if (!validatePassword(password)) {
            return res.status(400).json({
                error: 'Invalid password',
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if Aadhaar already exists
        const { data: existingAadhaar, error: aadhaarCheckError } = await supabase
            .from('farmers')
            .select('aadhaar_number')
            .eq('aadhaar_number', aadhaar_number)
            .single();

        if (existingAadhaar) {
            return res.status(409).json({
                error: 'Aadhaar already registered',
                message: 'This Aadhaar number is already associated with an account'
            });
        }

        // Check if mobile number already exists
        const { data: existingMobile, error: mobileCheckError } = await supabase
            .from('farmers')
            .select('mobile_number')
            .eq('mobile_number', mobile_number)
            .single();

        if (existingMobile) {
            return res.status(409).json({
                error: 'Mobile number already registered',
                message: 'This mobile number is already associated with an account'
            });
        }

        // Mock Aadhaar verification
        const aadhaarVerification = mockAadhaarVerification(aadhaar_number);

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Generate unique farmer_id
        const { data: seqData } = await supabase
            .rpc('get_next_farmer_id');
        
        let farmer_id;
        if (seqData) {
            farmer_id = `FRM${seqData}`;
        } else {
            // Fallback: generate from timestamp if sequence fails
            farmer_id = `FRM${Date.now().toString().slice(-6)}`;
        }

        // Insert farmer into database
        const { data: newFarmer, error: insertError } = await supabase
            .from('farmers')
            .insert([{
                farmer_id,
                aadhaar_number,
                full_name,
                mobile_number,
                password_hash,
                language_preference: language_preference || 'English',
                aadhaar_verified: aadhaarVerification.verified,
                verification_status: aadhaarVerification.verification_status,
                profile_completion: 40 // Initial completion percentage
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Insert Error:', insertError);
            throw insertError;
        }

        // Return success response
        return res.status(201).json({
            message: 'Farmer registered successfully',
            farmer_id: newFarmer.farmer_id,
            aadhaar_status: newFarmer.verification_status
        });

    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login farmer with Aadhaar + password
 * @access  Public
 */
exports.loginFarmer = async (req, res) => {
    try {
        const { aadhaar_number, password } = req.body;

        // Validation: Check if required fields are provided
        if (!aadhaar_number || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'aadhaar_number and password are required'
            });
        }

        // Validate Aadhaar number format
        if (!validateAadhaar(aadhaar_number)) {
            return res.status(400).json({
                error: 'Invalid Aadhaar number',
                message: 'Aadhaar must be exactly 12 digits'
            });
        }

        // Find farmer by Aadhaar number
        const { data: farmer, error: fetchError } = await supabase
            .from('farmers')
            .select('*')
            .eq('aadhaar_number', aadhaar_number)
            .single();

        if (fetchError || !farmer) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Aadhaar number or password is incorrect'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, farmer.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Aadhaar number or password is incorrect'
            });
        }

        // Generate JWT token
        const token = generateToken({
            farmer_id: farmer.farmer_id,
            aadhaar_number: farmer.aadhaar_number,
            full_name: farmer.full_name
        });

        // Return success response with token
        return res.status(200).json({
            token: token,
            farmer_id: farmer.farmer_id,
            full_name: farmer.full_name,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset farmer password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
    try {
        // TODO: Implement password reset
        res.status(501).json({ message: 'Reset Password API - Coming soon' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Validation utility functions

/**
 * Validate Aadhaar number
 * Must be exactly 12 digits
 */
const validateAadhaar = (aadhaar) => {
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar);
};

/**
 * Validate mobile number
 * Must be exactly 10 digits
 */
const validateMobile = (mobile) => {
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobile);
};

/**
 * Validate password
 * Minimum 8 characters
 */
const validatePassword = (password) => {
    return password && password.length >= 8;
};

/**
 * Mock Aadhaar verification
 * If Aadhaar is 12 digits, mark as verified
 */
const mockAadhaarVerification = (aadhaar) => {
    if (validateAadhaar(aadhaar)) {
        return {
            verified: true,
            verification_status: 'mock_verified'
        };
    }
    return {
        verified: false,
        verification_status: 'invalid'
    };
};

module.exports = {
    validateAadhaar,
    validateMobile,
    validatePassword,
    mockAadhaarVerification
};

# Authentication API Tests

## 1. Register Farmer API

### Endpoint
```
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json
```

### Test Case 1: Successful Registration
```json
{
  "aadhaar_number": "123412341234",
  "full_name": "Ramesh Kumar",
  "mobile_number": "9876543210",
  "password": "securePassword123",
  "language_preference": "Hindi"
}
```

**Expected Response (201):**
```json
{
  "message": "Farmer registered successfully",
  "farmer_id": "FRM1023",
  "aadhaar_status": "mock_verified"
}
```

### Test Case 2: Invalid Aadhaar (Not 12 digits)
```json
{
  "aadhaar_number": "12345",
  "full_name": "Test User",
  "mobile_number": "9876543210",
  "password": "password123",
  "language_preference": "English"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid Aadhaar number",
  "message": "Aadhaar must be exactly 12 digits"
}
```

### Test Case 3: Invalid Mobile (Not 10 digits)
```json
{
  "aadhaar_number": "123412341234",
  "full_name": "Test User",
  "mobile_number": "98765",
  "password": "password123",
  "language_preference": "English"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid mobile number",
  "message": "Mobile number must be exactly 10 digits"
}
```

### Test Case 4: Weak Password (Less than 8 characters)
```json
{
  "aadhaar_number": "123412341234",
  "full_name": "Test User",
  "mobile_number": "9876543210",
  "password": "pass",
  "language_preference": "English"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid password",
  "message": "Password must be at least 8 characters long"
}
```

### Test Case 5: Duplicate Aadhaar
Register twice with same Aadhaar number.

**Expected Response (409):**
```json
{
  "error": "Aadhaar already registered",
  "message": "This Aadhaar number is already associated with an account"
}
```

### Test Case 6: Missing Required Fields
```json
{
  "aadhaar_number": "123412341234",
  "full_name": "Test User"
}
```

**Expected Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "aadhaar_number, full_name, mobile_number, and password are required"
}
```

---

## CURL Commands for Testing

### Successful Registration:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "123412341234",
    "full_name": "Ramesh Kumar",
    "mobile_number": "9876543210",
    "password": "securePassword123",
    "language_preference": "Hindi"
  }'
```

### Invalid Aadhaar:
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "12345",
    "full_name": "Test User",
    "mobile_number": "9876543210",
    "password": "password123"
  }'
```

---

## Implementation Details

### Validation Rules
- ✅ Aadhaar must be exactly 12 digits
- ✅ Mobile must be exactly 10 digits
- ✅ Password minimum 8 characters
- ✅ Aadhaar must be unique
- ✅ Mobile must be unique

### Mock Aadhaar Logic
- If Aadhaar = 12 digits → mark as `verified = true`
- Store `verification_status = "mock_verified"`
- In production, this would integrate with UIDAI APIs

### Security
- Passwords are hashed using bcrypt (salt rounds: 10)
- JWT tokens for authentication (7-day expiry)
- All sensitive data stored securely

### Database Schema
Table: `farmers`
- `id` (UUID, Primary Key)
- `farmer_id` (TEXT, Unique) - Format: FRM1000, FRM1001...
- `aadhaar_number` (TEXT, Unique)
- `full_name` (TEXT)
- `mobile_number` (TEXT, Unique)
- `password_hash` (TEXT)
- `language_preference` (TEXT)
- `aadhaar_verified` (BOOLEAN)
- `verification_status` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

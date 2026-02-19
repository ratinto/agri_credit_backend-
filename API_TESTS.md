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

---

## 2. Login Farmer API

### Endpoint
```
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json
```

### Test Case 1: Successful Login
```json
{
  "aadhaar_number": "123412341234",
  "password": "securePassword123"
}
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer_id": "FRM1023",
  "full_name": "Ramesh Kumar",
  "message": "Login successful"
}
```

### Test Case 2: Invalid Aadhaar Format
```json
{
  "aadhaar_number": "12345",
  "password": "password123"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid Aadhaar number",
  "message": "Aadhaar must be exactly 12 digits"
}
```

### Test Case 3: Wrong Password
```json
{
  "aadhaar_number": "123412341234",
  "password": "wrongPassword"
}
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials",
  "message": "Aadhaar number or password is incorrect"
}
```

### Test Case 4: Non-existent Aadhaar
```json
{
  "aadhaar_number": "111111111111",
  "password": "password123"
}
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials",
  "message": "Aadhaar number or password is incorrect"
}
```

### Test Case 5: Missing Fields
```json
{
  "aadhaar_number": "123412341234"
}
```

**Expected Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "aadhaar_number and password are required"
}
```

---

## CURL Commands for Login Testing

### Successful Login:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "123412341234",
    "password": "securePassword123"
  }'
```

### Wrong Password:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "123412341234",
    "password": "wrongPassword"
  }'
```

### Test with Mock Data:
First register a user, then login with same credentials:
```bash
# Step 1: Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "555555555555",
    "full_name": "Login Test User",
    "mobile_number": "5555555555",
    "password": "testpass123",
    "language_preference": "English"
  }'

# Step 2: Login with same credentials
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "555555555555",
    "password": "testpass123"
  }'
```

### Using the Token in Protected Routes:
Once you receive the token, use it in subsequent requests:
```bash
curl -X GET http://localhost:5000/api/farmers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Login Implementation Details

### Authentication Flow
1. ✅ Receive Aadhaar + password
2. ✅ Validate Aadhaar format (12 digits)
3. ✅ Check required fields
4. ✅ Query database for farmer
5. ✅ Compare password with bcrypt
6. ✅ Generate JWT token (7-day expiry)
7. ✅ Return token + farmer details

### Security Features
- ✅ Password comparison using bcrypt
- ✅ Generic error message (doesn't reveal if Aadhaar exists)
- ✅ JWT token with expiration
- ✅ Token includes farmer metadata
- ✅ HTTPS recommended for production

### Token Structure
The JWT token contains:
```json
{
  "farmer_id": "FRM1023",
  "aadhaar_number": "123412341234",
  "full_name": "Ramesh Kumar",
  "iat": 1708329600,
  "exp": 1708934400
}
```

---

# Farm Management API Tests

## 3. Add Farm API

### Endpoint
```
POST http://localhost:5000/api/v1/farm/add
Content-Type: application/json
```

### Test Case 1: Successful Farm Addition
```json
{
  "farmer_id": "FRM1023",
  "land_size_acres": 2.5,
  "gps_lat": 29.0588,
  "gps_long": 76.0856,
  "state": "Haryana",
  "district": "Sonipat",
  "village": "Bilaspur",
  "irrigation_type": "Canal",
  "soil_type": "Loamy"
}
```

**Expected Response (201):**
```json
{
  "message": "Farm added successfully",
  "farm_id": "FARM1004",
  "farmer_name": "Ramesh Kumar",
  "land_size_acres": 2.5,
  "location": {
    "state": "Haryana",
    "district": "Sonipat",
    "village": "Bilaspur"
  }
}
```

### Test Case 2: Missing Required Fields
```json
{
  "farmer_id": "FRM1023",
  "land_size_acres": 2.5
}
```

**Expected Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "farmer_id, land_size_acres, state, and district are required"
}
```

### Test Case 3: Invalid Land Size
```json
{
  "farmer_id": "FRM1023",
  "land_size_acres": -5,
  "state": "Haryana",
  "district": "Sonipat"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid land size",
  "message": "land_size_acres must be a positive number"
}
```

### Test Case 4: Invalid GPS Coordinates
```json
{
  "farmer_id": "FRM1023",
  "land_size_acres": 2.5,
  "gps_lat": 95.0,
  "gps_long": 76.0856,
  "state": "Haryana",
  "district": "Sonipat"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid GPS latitude",
  "message": "gps_lat must be between -90 and 90"
}
```

### Test Case 5: Non-existent Farmer
```json
{
  "farmer_id": "FRM9999",
  "land_size_acres": 2.5,
  "state": "Haryana",
  "district": "Sonipat"
}
```

**Expected Response (404):**
```json
{
  "error": "Farmer not found",
  "message": "No farmer found with ID: FRM9999"
}
```

### Test Case 6: Minimal Required Data
```json
{
  "farmer_id": "FRM1023",
  "land_size_acres": 3.0,
  "state": "Punjab",
  "district": "Ludhiana"
}
```

**Expected Response (201):**
```json
{
  "message": "Farm added successfully",
  "farm_id": "FARM1005",
  "farmer_name": "Ramesh Kumar",
  "land_size_acres": 3.0,
  "location": {
    "state": "Punjab",
    "district": "Ludhiana",
    "village": null
  }
}
```

---

## CURL Commands for Farm Management Testing

### Add Farm (Full Details):
```bash
curl -X POST http://localhost:5000/api/v1/farm/add \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "FRM1023",
    "land_size_acres": 2.5,
    "gps_lat": 29.0588,
    "gps_long": 76.0856,
    "state": "Haryana",
    "district": "Sonipat",
    "village": "Bilaspur",
    "irrigation_type": "Canal",
    "soil_type": "Loamy"
  }'
```

### Add Farm (Minimal Details):
```bash
curl -X POST http://localhost:5000/api/v1/farm/add \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "FRM1023",
    "land_size_acres": 3.0,
    "state": "Punjab",
    "district": "Ludhiana"
  }'
```

### Get All Farms for a Farmer:
```bash
curl -X GET http://localhost:5000/api/v1/farm/FRM1023
```

### Get Specific Farm Details:
```bash
curl -X GET http://localhost:5000/api/v1/farm/details/FARM1004
```

### Complete Workflow (Register → Login → Add Farm):
```bash
# Step 1: Register Farmer
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "666666666666",
    "full_name": "Farm Owner Test",
    "mobile_number": "6666666666",
    "password": "farmtest123",
    "language_preference": "English"
  }'

# Step 2: Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "666666666666",
    "password": "farmtest123"
  }'

# Step 3: Add Farm (use farmer_id from step 1)
curl -X POST http://localhost:5000/api/v1/farm/add \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "FRM1004",
    "land_size_acres": 5.0,
    "gps_lat": 30.7333,
    "gps_long": 76.7794,
    "state": "Punjab",
    "district": "Mohali",
    "irrigation_type": "Tubewell"
  }'
```

---

## Farm Management Implementation Details

### Validation Rules
- ✅ farmer_id is required and must exist
- ✅ land_size_acres is required and must be positive
- ✅ state and district are required
- ✅ GPS coordinates are optional but validated if provided
  - Latitude: -90 to 90
  - Longitude: -180 to 180
- ✅ village, irrigation_type, soil_type are optional

### Database Relationships
- ✅ Farm links to Farmer via farmer_id (foreign key)
- ✅ Cascade delete: deleting farmer removes their farms
- ✅ Each farm has unique farm_id (FARM1000, FARM1001...)

### Features
- ✅ Auto-generated farm_id
- ✅ GPS location tracking
- ✅ Multiple farms per farmer supported
- ✅ Detailed location information (state/district/village)
- ✅ Irrigation and soil type tracking
- ✅ Timestamps for audit trail

---

# Crop Management API Tests

## 4. Add Crop API

### Endpoint
```
POST http://localhost:5000/api/v1/crop/add
Content-Type: application/json
```

### Test Case 1: Successful Crop Addition
```json
{
  "farm_id": "FARM1000",
  "crop_type": "Wheat",
  "season": "Rabi",
  "sowing_date": "2026-11-15",
  "expected_harvest_date": "2027-04-15",
  "area_acres": 5.5,
  "expected_yield_qtl": 110.0
}
```

**Expected Response (201):**
```json
{
  "message": "Crop added successfully",
  "crop_id": "CROP1004",
  "farm_id": "FARM1000",
  "crop_type": "Wheat",
  "season": "Rabi",
  "sowing_date": "2026-11-15",
  "location": {
    "state": "Haryana",
    "district": "Sonipat"
  }
}
```

### Test Case 2: Missing Required Fields
```json
{
  "farm_id": "FARM1000",
  "crop_type": "Wheat"
}
```

**Expected Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "farm_id, crop_type, season, and sowing_date are required"
}
```

### Test Case 3: Invalid Season
```json
{
  "farm_id": "FARM1000",
  "crop_type": "Wheat",
  "season": "InvalidSeason",
  "sowing_date": "2026-11-15"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid season",
  "message": "Season must be one of: Kharif, Rabi, Zaid, Summer, Winter"
}
```

### Test Case 4: Harvest Date Before Sowing Date
```json
{
  "farm_id": "FARM1000",
  "crop_type": "Wheat",
  "season": "Rabi",
  "sowing_date": "2026-11-15",
  "expected_harvest_date": "2026-10-15"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid harvest date",
  "message": "expected_harvest_date must be after sowing_date"
}
```

### Test Case 5: Area Exceeds Farm Size
```json
{
  "farm_id": "FARM1000",
  "crop_type": "Wheat",
  "season": "Rabi",
  "sowing_date": "2026-11-15",
  "area_acres": 100
}
```

**Expected Response (400):**
```json
{
  "error": "Area exceeds farm size",
  "message": "Crop area (100 acres) cannot exceed farm size (5.5 acres)"
}
```

---

## CURL Commands for Crop Management Testing

### Add Crop (Full Details):
```bash
curl -X POST http://localhost:5000/api/v1/crop/add \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": "FARM1000",
    "crop_type": "Wheat",
    "season": "Rabi",
    "sowing_date": "2026-11-15",
    "expected_harvest_date": "2027-04-15",
    "area_acres": 5.5,
    "expected_yield_qtl": 110.0
  }'
```

### Add Crop (Minimal Details):
```bash
curl -X POST http://localhost:5000/api/v1/crop/add \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": "FARM1000",
    "crop_type": "Rice",
    "season": "Kharif",
    "sowing_date": "2026-07-10"
  }'
```

### Get All Crops for a Farm:
```bash
curl -X GET http://localhost:5000/api/v1/crop/FARM1000
```

### Get Specific Crop Details:
```bash
curl -X GET http://localhost:5000/api/v1/crop/details/CROP1004
```

### Update Crop Status (Mark as Harvested):
```bash
curl -X PUT http://localhost:5000/api/v1/crop/update/CROP1004 \
  -H "Content-Type: application/json" \
  -d '{
    "crop_status": "harvested",
    "actual_harvest_date": "2027-04-20",
    "actual_yield_qtl": 115.5
  }'
```

---

# Data Validation API Tests

## 5. Fetch NDVI API

### Endpoint
```
GET http://localhost:5000/api/v1/validation/ndvi/:farm_id
```

### Test Case 1: Successful NDVI Fetch (Farm with GPS)
```
GET /api/v1/validation/ndvi/FARM1000
```

**Expected Response (200):**
```json
{
  "farm_id": "FARM1000",
  "farmer_name": "Rajesh Kumar",
  "ndvi_score": 0.745,
  "health_status": "Excellent",
  "confidence_level": "High",
  "measurement_date": "2026-02-19",
  "location": {
    "latitude": 29.0588,
    "longitude": 76.0856,
    "state": "Uttar Pradesh",
    "district": "Rampur"
  },
  "crop_info": {
    "crop_type": "Wheat",
    "season": "Rabi",
    "sowing_date": "2025-11-15"
  },
  "recommendations": [
    "Crop health is excellent",
    "Continue current farming practices",
    "Monitor for any sudden changes"
  ],
  "data_source": "Mock Satellite Imagery",
  "integration_note": "Using mock data. In production, this integrates with Sentinel Hub / Google Earth Engine"
}
```

### Test Case 2: Farm Without GPS Coordinates
```
GET /api/v1/validation/ndvi/FARM9999
```

**Expected Response (400):**
```json
{
  "error": "GPS coordinates not available",
  "message": "This farm does not have GPS coordinates. NDVI calculation requires location data.",
  "suggestion": "Update farm details with GPS coordinates"
}
```

### Test Case 3: Non-existent Farm
```
GET /api/v1/validation/ndvi/FARM_INVALID
```

**Expected Response (404):**
```json
{
  "error": "Farm not found",
  "message": "No farm found with ID: FARM_INVALID"
}
```

---

## CURL Commands for NDVI Testing

### Fetch NDVI for a Farm:
```bash
curl -X GET http://localhost:5000/api/v1/validation/ndvi/FARM1000
```

### Complete Workflow (Farm → Crop → NDVI):
```bash
# Step 1: Add Farm with GPS
curl -X POST http://localhost:5000/api/v1/farm/add \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "FRM1000",
    "land_size_acres": 3.0,
    "gps_lat": 29.0588,
    "gps_long": 76.0856,
    "state": "Haryana",
    "district": "Sonipat",
    "irrigation_type": "Canal"
  }'

# Step 2: Add Crop to Farm
curl -X POST http://localhost:5000/api/v1/crop/add \
  -H "Content-Type: application/json" \
  -d '{
    "farm_id": "FARM1003",
    "crop_type": "Wheat",
    "season": "Rabi",
    "sowing_date": "2025-11-15",
    "area_acres": 3.0
  }'

# Step 3: Fetch NDVI
curl -X GET http://localhost:5000/api/v1/validation/ndvi/FARM1003
```

---

## NDVI Implementation Details

### NDVI Score Interpretation
- **0.7 to 1.0**: Excellent - Dense, healthy vegetation
- **0.5 to 0.7**: Healthy - Moderate vegetation
- **0.3 to 0.5**: Moderate - Sparse vegetation
- **0.2 to 0.3**: Poor - Very sparse vegetation
- **Below 0.2**: Critical - Barren land or water

### Mock Calculation Factors
- ✅ GPS location (climate zone)
- ✅ Season (Kharif/Rabi/Zaid)
- ✅ Crop type
- ✅ Random variation for realism

### Production Integration Points
- **Sentinel Hub**: Real-time satellite imagery
- **Google Earth Engine**: Historical NDVI data
- **NASA MODIS**: Global vegetation monitoring

### Confidence Levels
- **High**: GPS + Crop data available
- **Medium**: GPS or Crop data available
- **Low**: Minimal data available




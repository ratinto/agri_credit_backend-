# 🌾 Agri Credit Platform - Backend API

A comprehensive backend system for agricultural credit management with mock Aadhaar authentication, farm management, crop tracking, and AI-based trust scoring.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (via Supabase)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Shreyaa6/agri_credit_backend-.git
cd agri_credit_backend-
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup Environment Variables**

Create a `.env` file in the root directory:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
REDIS_URL=redis://localhost:6379
NODE_ENV=development
JWT_SECRET=agri-credit-secret-key-2026
```

4. **Setup Supabase Database**

- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Create a new project or use existing one
- Go to SQL Editor
- Copy and execute the SQL from `supabase_setup.sql`

5. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on: `http://localhost:5000`

## 📋 API Documentation

### ✅ Implemented APIs

#### 🔐 Authentication Module

**1. Register Farmer** ✅ COMPLETE
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "aadhaar_number": "123412341234",
  "full_name": "Ramesh Kumar",
  "mobile_number": "9876543210",
  "password": "securePassword123",
  "language_preference": "Hindi"
}
```

**Response (201):**
```json
{
  "message": "Farmer registered successfully",
  "farmer_id": "FRM1023",
  "aadhaar_status": "mock_verified"
}
```

**Validation Rules:**
- ✅ Aadhaar must be 12 digits
- ✅ Mobile must be 10 digits
- ✅ Password min 8 characters
- ✅ Aadhaar must be unique

See `API_TESTS.md` for complete test cases.

---

**2. Login Farmer** ✅ COMPLETE
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "aadhaar_number": "123412341234",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer_id": "FRM1023",
  "full_name": "Ramesh Kumar",
  "message": "Login successful"
}
```

**Features:**
- ✅ Aadhaar + password authentication
- ✅ Bcrypt password verification
- ✅ JWT token generation (7-day expiry)
- ✅ Secure credential validation

---

**3. Reset Password** 🚧 Coming Soon
```
POST /api/v1/auth/reset-password
```

### 🚧 Upcoming Modules

- 🌾 Farm Management (Add Farm, Add Crop)
- 🛰 Data Validation (NDVI, Weather, Market Prices)
- 🤖 Agri-Trust Score Engine
- 💰 Loan Management

## 🗄️ Database Schema

### Farmers Table
```sql
farmers (
  id UUID PRIMARY KEY,
  farmer_id TEXT UNIQUE,
  aadhaar_number TEXT UNIQUE,
  full_name TEXT,
  mobile_number TEXT UNIQUE,
  password_hash TEXT,
  language_preference TEXT,
  aadhaar_verified BOOLEAN,
  verification_status TEXT,
  trust_score INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🧪 Testing

### Using cURL
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

### Using Postman
1. Import the API collection (see `API_TESTS.md`)
2. Set base URL to `http://localhost:5000`
3. Test each endpoint

## 📁 Project Structure

```
agri_credit_backend-/
├── src/
│   ├── index.js                 # Entry point
│   ├── config/
│   │   ├── supabase.js         # Supabase client
│   │   └── redis.js            # Redis client
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   └── farmerController.js # Farmer CRUD
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   └── farmerRoutes.js     # Farmer endpoints
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification
│   └── utils/
│       ├── validation.js       # Input validation
│       └── jwtHelper.js        # JWT utilities
├── supabase_setup.sql          # Database schema
├── API_TESTS.md                # API test cases
├── IMPLEMENTATION_STATUS.md    # Progress tracker
└── package.json
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Input validation & sanitization
- ✅ Unique constraints on sensitive fields
- ✅ Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 📞 Support

For issues and questions, please create an issue on GitHub.

---

**Implementation Progress:** 2/15 APIs Complete (13.3%)  
**Last Updated:** February 19, 2026

## 🗄️ Database Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/wfhjhclkjttaquzdbibx
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Database Setup

Copy and paste the entire contents of `supabase_setup.sql` into the SQL Editor and click **Run**.

Alternatively, you can run this SQL directly:

```sql
-- Create Farmers table with authentication fields
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id TEXT UNIQUE NOT NULL,
    aadhaar_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    language_preference TEXT DEFAULT 'English',
    aadhaar_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending',
    village TEXT,
    district TEXT,
    state TEXT,
    trust_score INTEGER DEFAULT 0,
    risk_level TEXT,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (for demo purposes)
CREATE POLICY "Allow public read access" ON public.farmers
    FOR SELECT USING (true);

-- Create policy to allow insert for registration
CREATE POLICY "Allow public insert" ON public.farmers
    FOR INSERT WITH CHECK (true);

-- Create policy to allow update for own profile
CREATE POLICY "Allow users to update own profile" ON public.farmers
    FOR UPDATE USING (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON public.farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for farmer_id generation
CREATE SEQUENCE IF NOT EXISTS farmer_id_seq START WITH 1000;

-- Create function to get next farmer ID
CREATE OR REPLACE FUNCTION get_next_farmer_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('farmer_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Insert mock data (updated for new schema)
INSERT INTO public.farmers (farmer_id, aadhaar_number, full_name, mobile_number, password_hash, language_preference, aadhaar_verified, verification_status, village, district, state, trust_score, risk_level, profile_completion)
VALUES 
('FRM1000', '123456789012', 'Rajesh Kumar', '9876543210', '$2a$10$mockHashedPassword1', 'Hindi', true, 'mock_verified', 'Bilaspur', 'Rampur', 'Uttar Pradesh', 82, 'Low', 85),
('FRM1001', '123456789013', 'Suresh Singh', '9876543211', '$2a$10$mockHashedPassword2', 'Hindi', true, 'mock_verified', 'Makhdumpur', 'Jehanabad', 'Bihar', 64, 'Medium', 72),
('FRM1002', '123456789014', 'Anita Devi', '9876543212', '$2a$10$mockHashedPassword3', 'Hindi', true, 'mock_verified', 'Kishanpur', 'Supaul', 'Bihar', 71, 'Low', 60),
('FRM1003', '123456789015', 'Vikram Mehta', '9876543213', '$2a$10$mockHashedPassword4', 'English', true, 'mock_verified', 'Palampur', 'Kangra', 'Himachal Pradesh', 45, 'High', 40)
ON CONFLICT (aadhaar_number) DO NOTHING;
```

### Step 3: Verify Setup

After running the SQL, verify the setup by running this query:

```sql
SELECT * FROM public.farmers;
```

You should see 4 mock farmers in the database.

---

## ✅ Once Database is Setup, Test the API

### Test 1: Successful Registration

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "999999999999",
    "full_name": "Test Farmer",
    "mobile_number": "8888888888",
    "password": "password123",
    "language_preference": "English"
  }'
```

**Expected Response:**
```json
{
  "message": "Farmer registered successfully",
  "farmer_id": "FRM1004",
  "aadhaar_status": "mock_verified"
}
```

### Test 2: Invalid Aadhaar (Should Fail)

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "aadhaar_number": "12345",
    "full_name": "Test Farmer",
    "mobile_number": "8888888888",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid Aadhaar number",
  "message": "Aadhaar must be exactly 12 digits"
}
```

### Test 3: Duplicate Aadhaar (Should Fail)

Try registering with `aadhaar_number: "999999999999"` again - should get conflict error.

---

## 🎯 Current Status

✅ Server is running on: http://localhost:5000  
✅ Environment configured  
⏳ Database setup needed (follow steps above)  
✅ Register Farmer API ready to test  

## 📞 API Endpoints Available

- `GET /` - API info
- `POST /api/v1/auth/register` - Register new farmer
- `POST /api/v1/auth/login` - Login (stub)
- `POST /api/v1/auth/reset-password` - Reset password (stub)

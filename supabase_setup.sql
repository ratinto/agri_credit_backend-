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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.farmers;
DROP POLICY IF EXISTS "Allow public insert" ON public.farmers;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.farmers;

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

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_farmers_updated_at ON public.farmers;
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

-- Create Farms table
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id TEXT UNIQUE NOT NULL,
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    land_size_acres DECIMAL(10, 2) NOT NULL,
    gps_lat DECIMAL(10, 8),
    gps_long DECIMAL(11, 8),
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT,
    irrigation_type TEXT,
    soil_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for farms
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.farms;
DROP POLICY IF EXISTS "Allow public insert" ON public.farms;
DROP POLICY IF EXISTS "Allow users to update own farms" ON public.farms;

-- Create policies for farms
CREATE POLICY "Allow public read access" ON public.farms
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.farms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own farms" ON public.farms
    FOR UPDATE USING (true);

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_farms_updated_at ON public.farms;
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for farm_id generation
CREATE SEQUENCE IF NOT EXISTS farm_id_seq START WITH 1000;

-- Create function to get next farm ID
CREATE OR REPLACE FUNCTION get_next_farm_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('farm_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Insert mock data for farmers (updated for new schema)
INSERT INTO public.farmers (farmer_id, aadhaar_number, full_name, mobile_number, password_hash, language_preference, aadhaar_verified, verification_status, village, district, state, trust_score, risk_level, profile_completion)
VALUES 
('FRM1000', '123456789012', 'Rajesh Kumar', '9876543210', '$2a$10$mockHashedPassword1', 'Hindi', true, 'mock_verified', 'Bilaspur', 'Rampur', 'Uttar Pradesh', 82, 'Low', 85),
('FRM1001', '123456789013', 'Suresh Singh', '9876543211', '$2a$10$mockHashedPassword2', 'Hindi', true, 'mock_verified', 'Makhdumpur', 'Jehanabad', 'Bihar', 64, 'Medium', 72),
('FRM1002', '123456789014', 'Anita Devi', '9876543212', '$2a$10$mockHashedPassword3', 'Hindi', true, 'mock_verified', 'Kishanpur', 'Supaul', 'Bihar', 71, 'Low', 60),
('FRM1003', '123456789015', 'Vikram Mehta', '9876543213', '$2a$10$mockHashedPassword4', 'English', true, 'mock_verified', 'Palampur', 'Kangra', 'Himachal Pradesh', 45, 'High', 40)
ON CONFLICT (aadhaar_number) DO NOTHING;

-- Insert mock farms data
INSERT INTO public.farms (farm_id, farmer_id, land_size_acres, gps_lat, gps_long, state, district, village, irrigation_type, soil_type)
VALUES 
('FARM1000', 'FRM1000', 5.5, 29.058800, 76.085600, 'Uttar Pradesh', 'Rampur', 'Bilaspur', 'Canal', 'Loamy'),
('FARM1001', 'FRM1001', 3.0, 25.203800, 85.451500, 'Bihar', 'Jehanabad', 'Makhdumpur', 'Tubewell', 'Clay'),
('FARM1002', 'FRM1002', 2.5, 26.128700, 86.605100, 'Bihar', 'Supaul', 'Kishanpur', 'Rainfed', 'Sandy Loam')
ON CONFLICT (farm_id) DO NOTHING;

-- Create Crops table
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id TEXT UNIQUE NOT NULL,
    farm_id TEXT NOT NULL REFERENCES public.farms(farm_id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    season TEXT NOT NULL,
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_acres DECIMAL(10, 2),
    expected_yield_qtl DECIMAL(10, 2),
    actual_yield_qtl DECIMAL(10, 2),
    crop_status TEXT DEFAULT 'growing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for crops
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.crops;
DROP POLICY IF EXISTS "Allow public insert" ON public.crops;
DROP POLICY IF EXISTS "Allow users to update own crops" ON public.crops;

-- Create policies for crops
CREATE POLICY "Allow public read access" ON public.crops
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.crops
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own crops" ON public.crops
    FOR UPDATE USING (true);

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_crops_updated_at ON public.crops;
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for crop_id generation
CREATE SEQUENCE IF NOT EXISTS crop_id_seq START WITH 1000;

-- Create function to get next crop ID
CREATE OR REPLACE FUNCTION get_next_crop_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('crop_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Insert mock crops data
INSERT INTO public.crops (crop_id, farm_id, crop_type, season, sowing_date, expected_harvest_date, area_acres, expected_yield_qtl, crop_status)
VALUES 
('CROP1000', 'FARM1000', 'Wheat', 'Rabi', '2025-11-15', '2026-04-15', 5.5, 110.0, 'growing'),
('CROP1001', 'FARM1001', 'Rice', 'Kharif', '2025-07-10', '2025-11-30', 3.0, 75.0, 'growing'),
('CROP1002', 'FARM1002', 'Maize', 'Kharif', '2025-06-20', '2025-10-20', 2.5, 50.0, 'growing')
ON CONFLICT (crop_id) DO NOTHING;

-- Create Loans table
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id TEXT UNIQUE NOT NULL,
    farmer_id TEXT NOT NULL REFERENCES public.farmers(farmer_id) ON DELETE CASCADE,
    bank_id TEXT REFERENCES public.banks(bank_id) ON DELETE SET NULL,
    loan_amount DECIMAL(12, 2) NOT NULL,
    approved_amount DECIMAL(12, 2),
    interest_rate DECIMAL(5, 2) NOT NULL,
    loan_duration_months INTEGER NOT NULL,
    tenure_seasons INTEGER,
    loan_purpose TEXT,
    trust_score_at_application INTEGER,
    risk_level TEXT,
    loan_status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    repayment_due_date DATE,
    amount_repaid DECIMAL(12, 2) DEFAULT 0,
    outstanding_amount DECIMAL(12, 2),
    emi_amount DECIMAL(10, 2),
    lender_name TEXT,
    lender_type TEXT,
    collateral_type TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.loans;
DROP POLICY IF EXISTS "Allow public insert" ON public.loans;
DROP POLICY IF EXISTS "Allow users to update own loans" ON public.loans;

-- Create policies for loans
CREATE POLICY "Allow public read access" ON public.loans
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.loans
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own loans" ON public.loans
    FOR UPDATE USING (true);

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_loans_updated_at ON public.loans;
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for loan_id generation
CREATE SEQUENCE IF NOT EXISTS loan_id_seq START WITH 1000;

-- Create function to get next loan ID
CREATE OR REPLACE FUNCTION get_next_loan_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('loan_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Create Loan Repayments table
CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repayment_id TEXT UNIQUE NOT NULL,
    loan_id TEXT NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
    repayment_amount DECIMAL(12, 2) NOT NULL,
    repayment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for loan_repayments
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.loan_repayments;
DROP POLICY IF EXISTS "Allow public insert" ON public.loan_repayments;

-- Create policies for loan_repayments
CREATE POLICY "Allow public read access" ON public.loan_repayments
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.loan_repayments
    FOR INSERT WITH CHECK (true);

-- Create sequence for repayment_id generation
CREATE SEQUENCE IF NOT EXISTS repayment_id_seq START WITH 1000;

-- Create function to get next repayment ID
CREATE OR REPLACE FUNCTION get_next_repayment_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('repayment_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Create Banks table
CREATE TABLE IF NOT EXISTS public.banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id TEXT UNIQUE NOT NULL,
    bank_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    bank_type TEXT DEFAULT 'NBFC',
    role TEXT DEFAULT 'BANK',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for banks
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.banks;
DROP POLICY IF EXISTS "Allow public insert" ON public.banks;
DROP POLICY IF EXISTS "Allow banks to update own profile" ON public.banks;

-- Create policies for banks
CREATE POLICY "Allow public read access" ON public.banks
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.banks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow banks to update own profile" ON public.banks
    FOR UPDATE USING (true);

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_banks_updated_at ON public.banks;
CREATE TRIGGER update_banks_updated_at BEFORE UPDATE ON public.banks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for bank_id generation (starting after mock data)
CREATE SEQUENCE IF NOT EXISTS bank_id_seq START WITH 1004;

-- Create function to get next bank ID
CREATE OR REPLACE FUNCTION get_next_bank_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('bank_id_seq');
END;
$$ LANGUAGE plpgsql;

-- Insert mock banks data
INSERT INTO public.banks (bank_id, bank_name, contact_person, email, password_hash, license_number, bank_type)
VALUES 
('BNK1001', 'GreenAgro Finance Ltd', 'Amit Sharma', 'amit@greenagro.com', '$2a$10$mockHashedPassword5', 'NBFC123456', 'NBFC'),
('BNK1002', 'Rural Development Bank', 'Priya Mehta', 'priya@rdb.com', '$2a$10$mockHashedPassword6', 'RRB789012', 'RRB'),
('BNK1003', 'Kisan Credit Cooperative', 'Suresh Patel', 'suresh@kcc.com', '$2a$10$mockHashedPassword7', 'COOP345678', 'Cooperative')
ON CONFLICT (bank_id) DO NOTHING;


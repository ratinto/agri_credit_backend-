-- Create Farmers table
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    village TEXT,
    district TEXT,
    state TEXT,
    phone TEXT UNIQUE NOT NULL,
    trust_score INTEGER DEFAULT 0,
    risk_level TEXT,
    profile_completion INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (for demo purposes)
CREATE POLICY "Allow public read access" ON public.farmers
    FOR SELECT USING (true);

-- Insert mock data
INSERT INTO public.farmers (name, village, district, state, phone, trust_score, risk_level, profile_completion)
VALUES 
('Rajesh Kumar', 'Bilaspur', 'Rampur', 'Uttar Pradesh', '+919876543210', 82, 'Low Risk', 85),
('Suresh Singh', 'Makhdumpur', 'Jehanabad', 'Bihar', '+919876543211', 64, 'Medium Risk', 72),
('Anita Devi', 'Kishanpur', 'Supaul', 'Bihar', '+919876543212', 71, 'Low Risk', 60),
('Vikram Mehta', 'Palampur', 'Kangra', 'Himachal Pradesh', '+919876543213', 45, 'High Risk', 40);

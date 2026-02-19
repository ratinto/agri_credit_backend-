const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const farmRoutes = require('./routes/farmRoutes');
const cropRoutes = require('./routes/cropRoutes');
const validationRoutes = require('./routes/validationRoutes');
const trustScoreRoutes = require('./routes/trustScoreRoutes');
const loanRoutes = require('./routes/loanRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farm', farmRoutes);
app.use('/api/v1/crop', cropRoutes);
app.use('/api/v1/validation', validationRoutes);
app.use('/api/v1/trust-score', trustScoreRoutes);
app.use('/api/v1/loan', loanRoutes);
app.use('/api/farmers', farmerRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'AgriCredit API with Supabase & Redis',
        version: '1.0',
        endpoints: {
            auth: '/api/v1/auth',
            farm: '/api/v1/farm',
            crop: '/api/v1/crop',
            validation: '/api/v1/validation',
            trustScore: '/api/v1/trust-score',
            loan: '/api/v1/loan',
            farmers: '/api/farmers'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

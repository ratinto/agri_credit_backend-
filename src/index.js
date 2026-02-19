const express = require('express');
const cors = require('cors');
require('dotenv').config();
const config = require('./config/environment');

const app = express();
const PORT = config.PORT;

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
const bankRoutes = require('./routes/bankRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farm', farmRoutes);
app.use('/api/v1/crop', cropRoutes);
app.use('/api/v1/validation', validationRoutes);
app.use('/api/v1/trust-score', trustScoreRoutes);
app.use('/api/v1/loan', loanRoutes);
app.use('/api/v1/bank', bankRoutes);
app.use('/api/farmers', farmerRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'AgriCredit API with Supabase & Redis',
        version: '1.0',
        environment: config.NODE_ENV,
        baseUrl: config.API_BASE_URL,
        endpoints: {
            auth: '/api/v1/auth',
            farm: '/api/v1/farm',
            crop: '/api/v1/crop',
            validation: '/api/v1/validation',
            trustScore: '/api/v1/trust-score',
            loan: '/api/v1/loan',
            bank: '/api/v1/bank',
            farmers: '/api/farmers'
        }
    });
});

// Export the Express app for Vercel
module.exports = app;

// Only start the server if not running in Vercel
if (!config.isProduction) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Backend Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${config.NODE_ENV}`);
        console.log(`📍 Base URL: ${config.API_BASE_URL}`);
        console.log(`✅ Server ready at http://localhost:${PORT}\n`);
    });
}

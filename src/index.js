const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'AgriCredit API with Supabase & Redis',
        version: '1.0',
        endpoints: {
            auth: '/api/v1/auth',
            farmers: '/api/farmers'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

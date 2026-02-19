const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const farmerRoutes = require('./routes/farmerRoutes');
app.use('/api/farmers', farmerRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'AgriCredit API with Supabase & Redis' });
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

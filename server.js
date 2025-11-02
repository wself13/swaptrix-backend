const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Swaptrix API' });
});

// API Status
app.get('/api', (req, res) => {
  res.json({ 
    status: 'API is running', 
    version: '1.0.0',
    mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Missing',
    port: process.env.PORT || 10000
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: https://swaptrix-backend.onrender.com`);
});
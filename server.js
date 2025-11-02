const express = require('express');
const mongoose = require('mongoose');
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
  res.json({ status: 'API is running', version: '1.0.0' });
});

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    res.json({ status: 'MongoDB connected!' });
  } catch (err) {
    res.status(500).json({ error: 'MongoDB connection failed', details: err.message });
  }
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
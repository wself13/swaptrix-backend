const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Swaptrix API' });
});

// API Status Route
app.get('/api', (req, res) => {
  res.json({ status: 'API is running', version: '1.0.0' });
});

// Динамическая загрузка маршрутов (если файлы есть)
let authRoutes, userRoutes;
try {
  authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded');
} catch (err) {
  console.log('Auth routes not found:', err.message);
}

try {
  userRoutes = require('./routes/user');
  app.use('/api/user', userRoutes);
  console.log('User routes loaded');
} catch (err) {
  console.log('User routes not found:', err.message);
}

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Swaptrix API',
    status: 'LIVE',
    env: {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
      PORT: process.env.PORT || 10000
    }
  });
});

app.get('/api', (req, res) => {
  res.json({ status: 'API is running', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server LIVE on port ${PORT}`);
  console.log(`Visit: https://swaptrix-backend.onrender.com`);
});
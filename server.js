const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS — разрешаем фронтенд
app.use(cors({
  origin: 'https://swaptrix-frontend.vercel.app',
  credentials: true
}));
app.use(express.json());

// Хранилище пользователей (в памяти, для теста)
const users = [];

// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users.push({ email, password, verified: false });
  console.log('Registered:', email);
  res.json({ message: 'Check your email for verification' });
});

// Логин
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  if (!user.verified) {
    return res.status(400).json({ error: 'Email not verified' });
  }

  res.json({ 
    message: 'Login successful', 
    token: 'fake-jwt-token-12345',
    user: { email: user.email }
  });
});

// Верификация — АВТОМАТИЧЕСКАЯ (для теста)
app.get('/api/auth/verify/:token', (req, res) => {
  const lastUser = users[users.length - 1];
  if (lastUser && !lastUser.verified) {
    lastUser.verified = true;
    console.log('Email verified for:', lastUser.email);
    return res.json({ message: 'Email verified!' });
  }
  res.status(400).json({ error: 'No user to verify or already verified' });
});

// Главная
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Swaptrix API', 
    status: 'LIVE',
    users_count: users.length
  });
});

app.get('/api', (req, res) => {
  res.json({ status: 'API is running', version: '1.0.0' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Запуск
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server LIVE on port ${PORT}`);
  console.log(`Visit: https://swaptrix-backend.onrender.com`);
});
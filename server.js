const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://swaptrix-frontend.vercel.app',
  credentials: true
}));
app.use(express.json());

// Тестовый пользователь
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
  res.json({ message: 'Login successful', token: 'fake-jwt-token' });
});

// Верификация email (заглушка)
app.get('/api/auth/verify/:token', (req, res) => {
  const { token } = req.params;
  const user = users.find(u => u.email.includes(token.slice(0, 5)));
  if (user) {
    user.verified = true;
    res.json({ message: 'Email verified!' });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
});

// Главная
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Swaptrix API', status: 'LIVE' });
});

app.get('/api', (req, res) => {
  res.json({ status: 'API is running' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server LIVE on port ${PORT}`);
});
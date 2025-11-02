const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://swaptrix-frontend.vercel.app'],
  credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifyToken: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Email (если работает — ок, если нет — игнорируем)
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email transporter ready');
} catch (err) {
  console.log('Email not configured — using manual verify');
}

// Middleware: проверка токена
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware: админ
const adminOnly = async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// РЕГИСТРАЦИЯ
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  const token = Math.random().toString(36).substring(2, 15);

  const user = new User({ email, password: hashed, verifyToken: token });
  await user.save();

  // Попробуем отправить email
  if (transporter) {
    const verifyUrl = `https://swaptrix-backend.onrender.com/api/auth/verify/${token}`;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Swaptrix — Verify Email',
        html: `<h3>Click to verify:</h3><a href="${verifyUrl}">${verifyUrl}</a>`
      });
      console.log('Email sent to:', email);
    } catch (err) {
      console.log('Email failed:', err.message);
    }
  }

  res.json({ message: 'User created. Use /verify/any to verify (email may not work)' });
});

// ВЕРИФИКАЦИЯ — РУЧНАЯ (для теста)
app.get('/api/auth/verify/:token', async (req, res) => {
  const lastUser = (await User.find().sort({ createdAt: -1 }).limit(1))[0];
  if (!lastUser) return res.status(400).json({ error: 'No user to verify' });

  lastUser.verified = true;
  lastUser.verifyToken = null;
  await lastUser.save();

  res.json({ message: 'Email verified! You can login.' });
});

// ВХОД
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.verified) return res.status(400).json({ error: 'Verify email first' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    message: 'Login successful', 
    token,
    user: { email: user.email, role: user.role }
  });
});

// АДМИН: список пользователей
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  const users = await User.find().select('-password -verifyToken').sort({ createdAt: -1 });
  res.json(users);
});

// АДМИН: изменить роль
app.patch('/api/admin/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json({ message: 'Role updated', user: { email: user.email, role: user.role } });
});

// АДМИН: удалить
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// Главная
app.get('/', (req, res) => {
  res.json({ 
    message: 'Swaptrix Backend LIVE',
    status: 'OK',
    endpoints: ['/api/auth/register', '/api/auth/verify/any', '/api/auth/login', '/api/admin/users']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server LIVE: https://swaptrix-backend.onrender.com`);
});
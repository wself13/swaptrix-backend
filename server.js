const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000', // потом замени на Vercel URL
  credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  verified: { type: Boolean, default: false },
  verifyToken: String
});

const User = mongoose.model('User', userSchema);

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  const token = Math.random().toString(36).substring(2, 15);

  const user = new User({ email, password: hashed, verifyToken: token });
  await user.save();

  // Send Email
  const verifyUrl = `http://localhost:5000/api/auth/verify/${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Swaptrix — Verify Email',
    html: `<h3>Click to verify:</h3><a href="${verifyUrl}">${verifyUrl}</a>`
  });

  res.json({ message: 'Check your email' });
});

// Verify
app.get('/api/auth/verify/:token', async (req, res) => {
  const user = await User.findOne({ verifyToken: req.params.token });
  if (!user) return res.status(400).json({ error: 'Invalid token' });

  user.verified = true;
  user.verifyToken = null;
  await user.save();

  res.json({ message: 'Email verified! You can login.' });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.verified) return res.status(400).json({ error: 'Verify email first' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login successful', token, user: { email: user.email } });
});

// Test
app.get('/', (req, res) => {
  res.json({ message: 'Swaptrix Backend LIVE', api: '/api/auth/*' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
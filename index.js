const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'https://swaptrix-frontend.vercel.app'],
  credentials: true
}));
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
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

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Fill all fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashed });
  await user.save();

  res.json({ message: 'User created. Use /verify/any to verify.' });
});

// Верификация
app.get('/api/auth/verify/any', async (req, res) => {
  const lastUser = (await User.find().sort({ createdAt: -1 }).limit(1))[0];
  if (!lastUser) return res.status(400).json({ error: 'No user' });

  lastUser.verified = true;
  await lastUser.save();

  res.json({ message: 'Verified!' });
});

// Логин
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password))
    return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.verified) return res.status(400).json({ error: 'Verify first' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Login OK', token, role: user.role });
});

// Админ: пользователи
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  const users = await User.find().select('email role createdAt').sort({ createdAt: -1 });
  res.json(users);
});

app.patch('/api/admin/users/:id/role', auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ message: 'Role updated' });
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/', (req, res) => {
  res.json({ message: 'Swaptrix API LIVE' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
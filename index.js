// backend/index.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';

// ← Загружаем .env сразу
dotenv.config();

const app = express();

// === CORS: разрешаем фронтенду ===
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// === Middleware ===
app.use(express.json());

// === Маршруты ===
app.use('/api/auth', authRoutes);

// === Подключение к MongoDB ===
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MONGODB ПОДКЛЮЧЁН');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });

// === Принудительно загружаем email.js (чтобы .env подхватился) ===
import './utils/email.js';

// === Обработка ошибок ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ошибка сервера' });
});
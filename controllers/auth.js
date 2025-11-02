// backend/controllers/auth.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/email.js';

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Проверка на пустые поля
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12);

    // Генерация токена верификации
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      verificationToken
    });

    console.log(`Пользователь создан: ${email}`);

    // === ОТПРАВКА EMAIL С ЗАЩИТОЙ ОТ ПАДЕНИЯ ===
    try {
      await sendVerificationEmail(email, verificationToken);
      console.log(`Письмо отправлено на ${email}`);
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError.message);
      // ← Пользователь создан, но письмо не ушло — не падаем!
    }

    // Успешная регистрация
    res.status(201).json({ message: 'Проверьте email для подтверждения!' });
  } catch (error) {
    console.error('Ошибка регистрации:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Подтвердите email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token, message: 'Успешный вход!' });
  } catch (error) {
    console.error('Ошибка входа:', error.message);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, verificationToken: token });

    if (!user) return res.status(400).json({ message: 'Недействительная ссылка' });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    console.log(`Email подтверждён: ${user.email}`);
    res.status(200).json({ message: 'Email подтверждён! Теперь можно войти.' });
  } catch (error) {
    console.error('Ошибка верификации:', error.message);
    res.status(400).json({ message: 'Ссылка истекла или недействительна' });
  }
};
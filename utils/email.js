// backend/utils/email.js
import { createTransport } from 'nodemailer';

// ← УБРАЛ dotenv.config() — он уже в index.js!
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `http://localhost:5000/api/auth/verify/${token}`;

  await transporter.sendMail({
    from: `"Swaptrix" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Подтверждение email — Swaptrix',
    html: `
      <h2>Добро пожаловать в Swaptrix!</h2>
      <p>Подтвердите email, перейдя по ссылке:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Ссылка действительна 1 час.</p>
    `
  });
};
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

// Загрузка переменных окружения
config();

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateJWTToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
}

export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', { expiresIn: '7d' });
}

export function verifyJWTToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
  } catch (error) {
    return null;
  }
}

export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Ensure it starts with 7 or 8
  if (digits.startsWith('8')) {
    return '7' + digits.substring(1);
  } else if (digits.startsWith('7')) {
    return digits;
  } else if (digits.length === 10) {
    return '7' + digits;
  }
  
  return digits;
}

export function validatePhone(phone: string): boolean {
  const sanitized = sanitizePhone(phone);
  return sanitized.length === 11 && sanitized.startsWith('7');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isPasswordStrong(password: string): boolean {
  // Минимум 8 символов, хотя бы одна заглавная, одна строчная, одна цифра
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
}

export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatPhoneForDisplay(phone: string): string {
  const sanitized = sanitizePhone(phone);
  if (sanitized.length !== 11) return phone;
  
  return `+7 (${sanitized.substring(1, 4)}) ${sanitized.substring(4, 7)}-${sanitized.substring(7, 9)}-${sanitized.substring(9, 11)}`;
}
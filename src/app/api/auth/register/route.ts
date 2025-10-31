import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { eq, or } from 'drizzle-orm';
import type { UserRole } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { fullName, phone, email, password, role = 'STUDENT' as UserRole } = await request.json();

    // Валидация входных данных
    if (!fullName || !password) {
      return NextResponse.json(
        { error: 'ФИО и пароль обязательны' },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'Необходимо указать телефон или email' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Неверный формат телефона' },
        { status: 400 }
      );
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    if (!isPasswordStrong(password)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и цифры' },
        { status: 400 }
      );
    }

    // Проверка, существует ли пользователь
    const conditions = [];
    if (phone) conditions.push(eq(users.phone, phone.replace(/\D/g, '')));
    if (email) conditions.push(eq(users.email, email));

    const existingUser = await db.select().from(users).where(or(...conditions)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким телефоном или email уже существует' },
        { status: 409 }
      );
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(password);

    // Создание пользователя
    const newUser = await db.insert(users).values({
      fullName,
      phone: phone ? phone.replace(/\D/g, '') : null,
      email: email || null,
      passwordHash,
      role,
    }).returning({
      id: users.id,
      fullName: users.fullName,
      phone: users.phone,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
    });

    const user = newUser[0];

    return NextResponse.json({
      message: 'Пользователь успешно создан',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
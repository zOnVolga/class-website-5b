import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { fullName, phone, email, password, role = UserRole.STUDENT } = await request.json();

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
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          phone ? { phone: phone.replace(/\D/g, '') } : undefined,
          email ? { email } : undefined,
        ].filter(Boolean),
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким телефоном или email уже существует' },
        { status: 409 }
      );
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(password);

    // Создание пользователя
    const user = await db.user.create({
      data: {
        fullName,
        phone: phone ? phone.replace(/\D/g, '') : null,
        email: email || null,
        passwordHash,
        role,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: false,
        createdAt: true,
      },
    });

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
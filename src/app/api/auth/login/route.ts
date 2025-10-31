import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, sanitizePhone, generateSecureToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Определяем, что введено - телефон или email
    const isPhone = login.includes('@') ? false : true;
    
    // Ищем пользователя
    const user = await db.user.findFirst({
      where: {
        OR: [
          isPhone ? { phone: sanitizePhone(login) } : undefined,
          !isPhone ? { email: login.toLowerCase() } : undefined,
        ].filter(Boolean),
        isActive: true,
      },
    });

    if (!user) {
      // Записываем неудачную попытку входа
      await logLoginAttempt(null, request, false);
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      // Записываем неудачную попытку входа
      await logLoginAttempt(user.id, request, false);
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    // Записываем успешную попытку входа
    await logLoginAttempt(user.id, request, true);

    // Обновляем время последнего входа
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        fullName: user.fullName,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Создаем refresh token
    const refreshToken = generateSecureToken();
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

    // Сохраняем refresh token в базу
    await db.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    // Создаем ответ с куками
    const response = NextResponse.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      token,
    });

    // Устанавливаем куки
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 часа
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

async function logLoginAttempt(userId: string | null, request: NextRequest, success: boolean) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (userId) {
      await db.loginAttempt.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          success,
        },
      });
    }
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { hashPassword, verifyPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function checkAuth(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  try {
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const userResult = await db.select({
      id: users.id,
      fullName: users.fullName,
      phone: users.phone,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    }).from(users).where(eq(users.id, auth.userId)).limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { fullName, phone, email, currentPassword, newPassword } = await request.json();

    const currentUserResult = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    const user = currentUserResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Обновление ФИО
    if (fullName && fullName !== user.fullName) {
      updateData.fullName = fullName;
    }

    // Обновление телефона
    if (phone && phone !== user.phone) {
      if (!validatePhone(phone)) {
        return NextResponse.json(
          { error: 'Неверный формат телефона' },
          { status: 400 }
        );
      }
      
      // Проверка, что телефон не занят
      const existingPhoneUser = await db.select().from(users).where(
        and(
          eq(users.phone, phone.replace(/\D/g, '')),
          ne(users.id, auth.userId)
        )
      ).limit(1);
      
      if (existingPhoneUser.length > 0) {
        return NextResponse.json(
          { error: 'Этот телефон уже используется другим пользователем' },
          { status: 409 }
        );
      }
      
      updateData.phone = phone.replace(/\D/g, '');
      updateData.isVerified = false; // Сбрасываем верификацию при смене телефона
    }

    // Обновление email
    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return NextResponse.json(
          { error: 'Неверный формат email' },
          { status: 400 }
        );
      }
      
      // Проверка, что email не занят
      const existingEmailUser = await db.select().from(users).where(
        and(
          eq(users.email, email),
          ne(users.id, auth.userId)
        )
      ).limit(1);
      
      if (existingEmailUser.length > 0) {
        return NextResponse.json(
          { error: 'Этот email уже используется другим пользователем' },
          { status: 409 }
        );
      }
      
      updateData.email = email;
    }

    // Обновление пароля
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Для смены пароля необходимо ввести текущий пароль' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Неверный текущий пароль' },
          { status: 400 }
        );
      }

      if (!isPasswordStrong(newPassword)) {
        return NextResponse.json(
          { error: 'Новый пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и цифры' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    // Обновляем данные пользователя
    const updatedUserResult = await db.update(users).set(updateData).where(eq(users.id, auth.userId)).returning({
      id: users.id,
      fullName: users.fullName,
      phone: users.phone,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    });

    const updatedUser = updatedUserResult[0];

    return NextResponse.json({
      message: 'Профиль успешно обновлен',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
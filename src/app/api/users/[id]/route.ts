import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions, verificationCodes, loginAttempts } from '@/lib/db/schema';
import { hashPassword, verifyPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function checkAuth(request: NextRequest): Promise<{ userId: string; role: UserRole } | null> {
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

async function hasPermission(userRole: UserRole, requiredRole: UserRole): Promise<boolean> {
  const roleHierarchy = {
    ADMIN: 4,
    TEACHER: 3,
    PARENT: 2,
    STUDENT: 1,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await checkAuth(request);
    if (!auth || !(await hasPermission(auth.role, 'TEACHER'))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
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
    }).from(users).where(eq(users.id, params.id)).limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await checkAuth(request);
    if (!auth || !(await hasPermission(auth.role, 'TEACHER'))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { fullName, phone, email, password, role, isActive } = await request.json();

    const existingUserResult = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    const existingUser = existingUserResult[0];

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Обновление полей
    if (fullName !== undefined) updateData.fullName = fullName;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(role)) {
      // Только админ может менять роль
      if (await hasPermission(auth.role, 'ADMIN')) {
        updateData.role = role;
      }
    }

    // Обновление телефона
    if (phone !== undefined && phone !== existingUser.phone) {
      if (phone && !validatePhone(phone)) {
        return NextResponse.json(
          { error: 'Неверный формат телефона' },
          { status: 400 }
        );
      }
      
      if (phone) {
        const existingPhoneUserResult = await db.select().from(users).where(
          and(
            eq(users.phone, phone.replace(/\D/g, '')),
            ne(users.id, params.id)
          )
        ).limit(1);
        
        if (existingPhoneUserResult.length > 0) {
          return NextResponse.json(
            { error: 'Этот телефон уже используется другим пользователем' },
            { status: 409 }
          );
        }
      }
      
      updateData.phone = phone ? phone.replace(/\D/g, '') : null;
      if (phone) updateData.isVerified = false;
    }

    // Обновление email
    if (email !== undefined && email !== existingUser.email) {
      if (email && !validateEmail(email)) {
        return NextResponse.json(
          { error: 'Неверный формат email' },
          { status: 400 }
        );
      }
      
      if (email) {
        const existingEmailUserResult = await db.select().from(users).where(
          and(
            eq(users.email, email),
            ne(users.id, params.id)
          )
        ).limit(1);
        
        if (existingEmailUserResult.length > 0) {
          return NextResponse.json(
            { error: 'Этот email уже используется другим пользователем' },
            { status: 409 }
          );
        }
      }
      
      updateData.email = email || null;
    }

    // Обновление пароля
    if (password) {
      if (!isPasswordStrong(password)) {
        return NextResponse.json(
          { error: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и цифры' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUserResult = await db.update(users).set(updateData).where(eq(users.id, params.id)).returning({
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
      message: 'Пользователь успешно обновлен',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await checkAuth(request);
    if (!auth || !(await hasPermission(auth.role, 'ADMIN'))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const userResult = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Нельзя удалить самого себя
    if (user.id === auth.userId) {
      return NextResponse.json(
        { error: 'Нельзя удалить свою учетную запись' },
        { status: 400 }
      );
    }

    // Удаляем связанные данные
    await db.delete(sessions).where(eq(sessions.userId, params.id));
    await db.delete(verificationCodes).where(eq(verificationCodes.userId, params.id));
    await db.delete(loginAttempts).where(eq(loginAttempts.userId, params.id));

    // Удаляем пользователя
    await db.delete(users).where(eq(users.id, params.id));

    return NextResponse.json({
      message: 'Пользователь успешно удален',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
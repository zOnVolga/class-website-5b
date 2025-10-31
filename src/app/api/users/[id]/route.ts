import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

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

    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

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
    if (role !== undefined && Object.values(UserRole).includes(role)) {
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
        const existingPhoneUser = await db.user.findFirst({
          where: {
            phone: phone.replace(/\D/g, ''),
            id: { not: params.id },
          },
        });
        
        if (existingPhoneUser) {
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
        const existingEmailUser = await db.user.findFirst({
          where: {
            email,
            id: { not: params.id },
          },
        });
        
        if (existingEmailUser) {
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

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

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

    const user = await db.user.findUnique({
      where: { id: params.id },
    });

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
    await db.session.deleteMany({
      where: { userId: params.id },
    });

    await db.verificationCode.deleteMany({
      where: { userId: params.id },
    });

    await db.loginAttempt.deleteMany({
      where: { userId: params.id },
    });

    // Удаляем пользователя
    await db.user.delete({
      where: { id: params.id },
    });

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
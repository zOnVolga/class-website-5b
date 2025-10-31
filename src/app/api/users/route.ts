import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware для проверки прав доступа
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

async function hasPermission(role: UserRole): Promise<boolean> {
  return [UserRole.ADMIN, UserRole.TEACHER].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth || !(await hasPermission(auth.role))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { search, role, page = 1, limit = 10 } = new URL(request.url).searchParams;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAuth(request);
    if (!auth || !(await hasPermission(auth.role))) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { fullName, phone, email, password, role = UserRole.STUDENT } = await request.json();

    // Валидация
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

    // Проверка на существование пользователя
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

    // Создание пользователя
    const passwordHash = await hashPassword(password);
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
        isVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Пользователь успешно создан',
      user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
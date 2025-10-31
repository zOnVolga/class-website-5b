import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword, validatePhone, validateEmail, isPasswordStrong } from '@/lib/auth';
import { eq, or, and, ilike, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@/lib/db/schema';

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
  return ['ADMIN', 'TEACHER'].includes(role);
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

    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.phone, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    
    if (role && ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(role)) {
      whereConditions.push(eq(users.role, role as UserRole));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [usersResult, totalCount] = await Promise.all([
      db.select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      }).from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(Number(limit))
        .offset(skip),
      
      db.select({ count: users.id }).from(users).where(whereClause)
    ]);

    const total = totalCount.length;

    return NextResponse.json({
      users: usersResult,
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

    const { fullName, phone, email, password, role = 'STUDENT' as UserRole } = await request.json();

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

    // Создание пользователя
    const passwordHash = await hashPassword(password);
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
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
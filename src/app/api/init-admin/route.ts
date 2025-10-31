import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Проверяем, существует ли уже администратор
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Администратор уже существует' 
      });
    }

    // Данные для создания администратора
    const adminData = {
      fullName: 'Администратор Системы',
      phone: '+79999999999',
      email: 'admin@school.ru',
      passwordHash: await hashPassword('Admin123!'),
      role: 'ADMIN',
      isActive: true,
      isVerified: true
    };

    // Создаем администратора
    const admin = await db.user.create({
      data: adminData
    });

    // Удаляем пароль из ответа
    const { passwordHash, ...adminWithoutPassword } = admin;

    return NextResponse.json({ 
      success: true, 
      message: 'Администратор успешно создан',
      admin: adminWithoutPassword 
    });

  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Ошибка при создании администратора' 
    }, { status: 500 });
  }
}
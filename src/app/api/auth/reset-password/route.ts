import { NextRequest, NextResponse } from 'next/server';
import { db, users, verificationCodes } from '@/lib/db';
import { generateVerificationCode, sanitizePhone, hashPassword, isPasswordStrong } from '@/lib/auth';
import { sendVerificationSMS } from '@/lib/sms';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { VerificationType } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Телефон обязателен' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);

    // Ищем пользователя по телефону
    const userResult = await db.select().from(users).where(
      and(
        eq(users.phone, sanitizedPhone),
        eq(users.isActive, true)
      )
    ).limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь с таким телефоном не найден' },
        { status: 404 }
      );
    }

    // Генерируем код восстановления
    const code = generateVerificationCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Удаляем старые коды восстановления
    await db.delete(verificationCodes).where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.type, 'PASSWORD_RESET' as VerificationType)
      )
    );

    // Сохраняем новый код
    await db.insert(verificationCodes).values({
      userId: user.id,
      code,
      type: 'PASSWORD_RESET' as VerificationType,
      expiresAt,
    });

    // Отправляем СМС с кодом восстановления
    const smsResult = await sendVerificationSMS(sanitizedPhone, code);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      // В режиме разработки возвращаем код для тестирования
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          message: 'Код восстановления отправлен (режим разработки)',
          code,
          smsResult,
        });
      }
    }

    return NextResponse.json({
      message: 'Код восстановления отправлен на ваш телефон',
      // В режиме разработки возвращаем код для тестирования
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { phone, code, newPassword } = await request.json();

    if (!phone || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Телефон, код и новый пароль обязательны' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);

    // Проверяем сложность нового пароля
    if (!isPasswordStrong(newPassword)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, и цифры' },
        { status: 400 }
      );
    }

    // Ищем пользователя
    const userResult = await db.select().from(users).where(
      and(
        eq(users.phone, sanitizedPhone),
        eq(users.isActive, true)
      )
    ).limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Ищем код восстановления
    const verificationCodeResult = await db.select().from(verificationCodes).where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, 'PASSWORD_RESET' as VerificationType),
        isNull(verificationCodes.usedAt),
        gt(verificationCodes.expiresAt, new Date())
      )
    ).limit(1);

    const verificationCode = verificationCodeResult[0];

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Неверный или просроченный код восстановления' },
        { status: 400 }
      );
    }

    // Хешируем новый пароль
    const passwordHash = await hashPassword(newPassword);

    // Обновляем пароль пользователя
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

    // Помечаем код как использованный
    await db.update(verificationCodes).set({ usedAt: new Date() }).where(
      eq(verificationCodes.id, verificationCode.id)
    );

    return NextResponse.json({
      message: 'Пароль успешно изменен',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationCodes } from '@/lib/db/schema';
import { generateVerificationCode, sanitizePhone } from '@/lib/auth';
import { sendVerificationSMS } from '@/lib/sms';
import { eq, and, gt, isNull } from 'drizzle-orm';
import type { VerificationType } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { phone, type = 'PHONE_VERIFICATION' as VerificationType } = await request.json();

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

    // Генерируем код верификации
    const code = generateVerificationCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые коды этого типа
    await db.delete(verificationCodes).where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.type, type)
      )
    );

    // Сохраняем новый код
    await db.insert(verificationCodes).values({
      userId: user.id,
      code,
      type,
      expiresAt,
    });

    // Отправляем СМС через наш SMS-сервис
    const smsResult = await sendVerificationSMS(sanitizedPhone, code);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      // Не прерываем процесс, если СМС не отправилось
      // Пользователь может ввести код вручную (в демо режиме)
    }

    return NextResponse.json({
      message: 'Код подтверждения отправлен',
      // Для демонстрации возвращаем код (в продакшене так делать нельзя!)
      code: process.env.NODE_ENV === 'development' ? code : undefined,
      smsResult: process.env.NODE_ENV === 'development' ? smsResult : undefined,
    });
  } catch (error) {
    console.error('Verification request error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { phone, code, type = 'PHONE_VERIFICATION' as VerificationType } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Телефон и код обязательны' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);

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

    // Ищем код верификации
    const verificationCodeResult = await db.select().from(verificationCodes).where(
      and(
        eq(verificationCodes.userId, user.id),
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, type),
        isNull(verificationCodes.usedAt),
        gt(verificationCodes.expiresAt, new Date())
      )
    ).limit(1);

    const verificationCode = verificationCodeResult[0];

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    // Помечаем код как использованный
    await db.update(verificationCodes).set({ usedAt: new Date() }).where(
      eq(verificationCodes.id, verificationCode.id)
    );

    // Обновляем статус верификации пользователя
    await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));

    return NextResponse.json({
      message: 'Телефон успешно подтвержден',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
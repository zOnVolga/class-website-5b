import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateVerificationCode, sanitizePhone } from '@/lib/auth';
import { sendVerificationSMS } from '@/lib/sms';
import { VerificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { phone, type = VerificationType.PHONE_VERIFICATION } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Телефон обязателен' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);

    // Ищем пользователя по телефону
    const user = await db.user.findFirst({
      where: {
        phone: sanitizedPhone,
        isActive: true,
      },
    });

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
    await db.verificationCode.deleteMany({
      where: {
        userId: user.id,
        type,
      },
    });

    // Сохраняем новый код
    await db.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type,
        expiresAt,
      },
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
    const { phone, code, type = VerificationType.PHONE_VERIFICATION } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Телефон и код обязательны' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);

    // Ищем пользователя
    const user = await db.user.findFirst({
      where: {
        phone: sanitizedPhone,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Ищем код верификации
    const verificationCode = await db.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        type,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Неверный или просроченный код' },
        { status: 400 }
      );
    }

    // Помечаем код как использованный
    await db.verificationCode.update({
      where: { id: verificationCode.id },
      data: { usedAt: new Date() },
    });

    // Обновляем статус верификации пользователя
    await db.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

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
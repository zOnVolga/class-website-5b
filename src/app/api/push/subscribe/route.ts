import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePushSubscription } from '@/lib/push';

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Подписка и userId обязательны' },
        { status: 400 }
      );
    }

    if (!validatePushSubscription(subscription)) {
      return NextResponse.json(
        { error: 'Невалидная подписка' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем, существует ли уже такая подписка
    const existingSubscription = await db.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint
      }
    });

    if (existingSubscription) {
      // Обновляем существующую подписку
      await db.pushSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Подписка успешно обновлена'
      });
    }

    // Создаем новую подписку
    const newSubscription = await db.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Подписка успешно создана',
      subscriptionId: newSubscription.id
    });

  } catch (error) {
    console.error('Ошибка создания подписки:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Подписка и userId обязательны' },
        { status: 400 }
      );
    }

    // Удаляем подписку
    const deletedSubscription = await db.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint: subscription.endpoint
      }
    });

    if (deletedSubscription.count === 0) {
      return NextResponse.json(
        { error: 'Подписка не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Подписка успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления подписки:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPushNotification, sendBulkPushNotifications } from '@/lib/push';
import { hasPermission } from '@/hooks/use-auth';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      targetRole, 
      notification, 
      sendToAll = false 
    } = await request.json();

    if (!notification || !notification.title) {
      return NextResponse.json(
        { error: 'Данные уведомления обязательны' },
        { status: 400 }
      );
    }

    // Получаем подписки для отправки
    let subscriptions = [];

    if (sendToAll) {
      // Отправка всем активным пользователям
      const allSubscriptions = await db.pushSubscription.findMany({
        include: {
          user: {
            select: {
              isActive: true,
              isVerified: true
            }
          }
        },
        where: {
          user: {
            isActive: true,
            isVerified: true
          }
        }
      });

      subscriptions = allSubscriptions
        .filter(sub => sub.user.isActive && sub.user.isVerified)
        .map(sub => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        }));

    } else if (targetRole) {
      // Отправка по роли
      const roleSubscriptions = await db.pushSubscription.findMany({
        include: {
          user: {
            select: {
              isActive: true,
              isVerified: true,
              role: true
            }
          }
        },
        where: {
          user: {
            role: targetRole,
            isActive: true,
            isVerified: true
          }
        }
      });

      subscriptions = roleSubscriptions
        .filter(sub => sub.user.isActive && sub.user.isVerified)
        .map(sub => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        }));

    } else if (userId) {
      // Отправка конкретному пользователю
      const userSubscriptions = await db.pushSubscription.findMany({
        where: {
          userId,
          user: {
            isActive: true,
            isVerified: true
          }
        }
      });

      subscriptions = userSubscriptions
        .filter(sub => sub.user.isActive && sub.user.isVerified)
        .map(sub => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dhKey,
            auth: sub.authKey
          }
        }));
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет активных подписок для отправки',
        sent: 0,
        failed: 0
      });
    }

    // Отправляем уведомления
    const result = await sendBulkPushNotifications(subscriptions, notification);

    return NextResponse.json({
      success: true,
      message: 'Уведомления отправлены',
      sent: result.success,
      failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error) {
    console.error('Ошибка отправки push-уведомлений:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Утилитарный endpoint для получения статистики
export async function GET(request: NextRequest) {
  try {
    const { userId } = new URL(request.url).searchParams;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      );
    }

    // Проверяем права пользователя
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получаем статистику
    const totalSubscriptions = await db.pushSubscription.count({
      where: {
        user: {
          isActive: true,
          isVerified: true
        }
      }
    });

    const roleStats = await db.user.groupBy({
      by: ['role'],
      where: {
        isActive: true,
        isVerified: true
      },
      _count: {
        pushSubscriptions: true
      }
    });

    const userSubscriptions = await db.pushSubscription.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSubscriptions,
        roleStats,
        userSubscriptions
      }
    });

  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
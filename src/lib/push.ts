// Загрузка переменных окружения
require('dotenv').config();

import webPush from 'web-push';

// Настройка VAPID ключей
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@school.ru'
};

// Инициализация web-push с VAPID ключами
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webPush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Генерация VAPID ключей
 */
export function generateVapidKeys() {
  return webPush.generateVAPIDKeys();
}

/**
 * Валидация push-подписки
 */
export function validatePushSubscription(subscription: PushSubscription): boolean {
  return subscription && 
         subscription.endpoint && 
         subscription.keys && 
         subscription.keys.p256dh && 
         subscription.keys.auth;
}

/**
 * Отправка push-уведомления
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  notification: PushNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!validatePushSubscription(subscription)) {
      throw new Error('Невалидная подписка');
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo.svg',
      badge: notification.badge || '/badge-icon.png',
      data: notification.data || {},
      actions: notification.actions || []
    });

    const result = await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      payload,
      {
        TTL: 3600, // Время жизни уведомления в секундах
        urgency: 'normal'
      }
    );

    console.log('✅ Push-уведомление успешно отправлено:', result);
    return { success: true };

  } catch (error) {
    console.error('❌ Ошибка отправки push-уведомления:', error);
    
    // Проверяем тип ошибки
    if (error.statusCode === 410) {
      return { success: false, error: 'Подписка больше не действительна' };
    } else if (error.statusCode === 404) {
      return { success: false, error: 'Endpoint не найден' };
    } else {
      return { success: false, error: error.message || 'Неизвестная ошибка' };
    }
  }
}

/**
 * Массовая отправка push-уведомлений
 */
export async function sendBulkPushNotifications(
  subscriptions: PushSubscription[],
  notification: PushNotification
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  const promises = subscriptions.map(async (subscription, index) => {
    try {
      const result = await sendPushNotification(subscription, notification);
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`Подписка ${index}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Подписка ${index}: ${error.message}`);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Отправка уведомления о новом сообщении
 */
export async function sendNewMessageNotification(
  subscriptions: PushSubscription[],
  senderName: string,
  messagePreview: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const notification: PushNotification = {
    title: `Новое сообщение от ${senderName}`,
    body: messagePreview.length > 100 
      ? messagePreview.substring(0, 100) + '...' 
      : messagePreview,
    icon: '/message-icon.png',
    data: {
      type: 'new_message',
      sender: senderName,
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'view',
        title: 'Посмотреть',
        icon: '/view-icon.png'
      }
    ]
  };

  return sendBulkPushNotifications(subscriptions, notification);
}

/**
 * Отправка уведомления о событии
 */
export async function sendEventNotification(
  subscriptions: PushSubscription[],
  eventTitle: string,
  eventDate: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const notification: PushNotification = {
    title: 'Новое событие',
    body: `${eventTitle} - ${eventDate}`,
    icon: '/calendar-icon.png',
    data: {
      type: 'new_event',
      eventTitle,
      eventDate
    },
    actions: [
      {
        action: 'view_calendar',
        title: 'Открыть календарь',
        icon: '/calendar-icon.png'
      }
    ]
  };

  return sendBulkPushNotifications(subscriptions, notification);
}

/**
 * Отправка уведомления о входе в систему
 */
export async function sendLoginNotification(
  subscription: PushSubscription,
  userInfo: { fullName: string; loginTime: string; deviceInfo?: string }
): Promise<{ success: boolean; error?: string }> {
  const notification: PushNotification = {
    title: 'Вход в систему',
    body: `Обнаружен вход в аккаунт ${userInfo.fullName}`,
    icon: '/security-icon.png',
    data: {
      type: 'login_alert',
      loginTime: userInfo.loginTime,
      deviceInfo: userInfo.deviceInfo
    }
  };

  return sendPushNotification(subscription, notification);
}

/**
 * Проверка настроек VAPID
 */
export function checkVapidSetup(): { configured: boolean; error?: string } {
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    return {
      configured: false,
      error: 'VAPID ключи не настроены. Добавьте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в .env файл'
    };
  }

  if (!vapidKeys.subject) {
    return {
      configured: false,
      error: 'VAPID subject не настроен. Добавьте VAPID_SUBJECT в .env файл'
    };
  }

  return { configured: true };
}

/**
 * Получение публичного VAPID ключа
 */
export function getVapidPublicKey(): string {
  return vapidKeys.publicKey || '';
}
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotification {
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

export function usePush() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPushSupport();
  }, []);

  useEffect(() => {
    if (isSupported) {
      checkPermission();
    }
  }, [isSupported]);

  useEffect(() => {
    if (user && isSupported && permission === 'granted') {
      checkSubscriptionStatus();
    }
  }, [user, isSupported, permission]);

  const checkPushSupport = () => {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('Push-уведомления не поддерживаются в этом браузере');
    }
    
    return supported;
  };

  const checkPermission = async () => {
    if (!isSupported) return;

    const currentPermission = await Notification.requestPermission();
    setPermission(currentPermission);
    
    return currentPermission;
  };

  const checkSubscriptionStatus = async () => {
    if (!user || !isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Ошибка проверки статуса подписки:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      throw new Error('Push-уведомления не поддерживаются');
    }

    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission !== 'granted') {
      throw new Error('Разрешение на уведомления не получено');
    }

    return permission;
  };

  const subscribe = async () => {
    if (!user || !isSupported) {
      throw new Error('Пользователь не авторизован или push не поддерживается');
    }

    setLoading(true);

    try {
      // Запрашиваем разрешение
      await requestPermission();

      // Регистрируем Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await registration.update();

      // Получаем VAPID публичный ключ
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error('VAPID публичный ключ не найден');
      }

      // Создаем подписку
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Отправляем подписку на сервер
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: user.id
        })
      });

      if (!saveResponse.ok) {
        throw new Error('Ошибка сохранения подписки на сервере');
      }

      setIsSubscribed(true);
      console.log('✅ Подписка на push-уведомления успешно создана');
      
      return subscription;

    } catch (error) {
      console.error('Ошибка подписки на push-уведомления:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user || !isSupported) {
      throw new Error('Пользователь не авторизован или push не поддерживается');
    }

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      // Удаляем подписку с сервера
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.getKey('p256dh'),
              auth: subscription.getKey('auth')
            }
          },
          userId: user.id
        })
      });

      // Отписываемся на клиенте
      await subscription.unsubscribe();
      setIsSubscribed(false);
      
      console.log('✅ Подписка на push-уведомления отменена');
      
    } catch (error) {
      console.error('Ошибка отписки от push-уведомлений:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user || !isSubscribed) {
      throw new Error('Пользователь не подписан на уведомления');
    }

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notification: {
            title: 'Тестовое уведомление',
            body: 'Это тестовое push-уведомление от классного сайта',
            icon: '/logo.svg',
            data: {
              type: 'test',
              timestamp: new Date().toISOString()
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки тестового уведомления');
      }

      const result = await response.json();
      console.log('✅ Тестовое уведомление отправлено:', result);
      
      return result;

    } catch (error) {
      console.error('Ошибка отправки тестового уведомления:', error);
      throw error;
    }
  };

  // Вспомогательная функция для конвертации VAPID ключа
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
  };
}
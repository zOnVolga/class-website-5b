// Service Worker для обработки push-уведомлений

const CACHE_NAME = 'class-website-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Список URL для кеширования при установке
const urlsToCache = [
  '/',
  '/logo.svg',
  '/badge-icon.png',
  '/message-icon.png',
  '/calendar-icon.png',
  '/security-icon.png',
  '/view-icon.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('📱 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Кеширование файлов');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('📱 Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('📨 Получено push-уведомление');
  
  if (!event.data) {
    console.log('❌ Нет данных в уведомлении');
    return;
  }

  try {
    const notification = event.data.json();
    console.log('📋 Данные уведомления:', notification);

    const options = {
      body: notification.body || '',
      icon: notification.icon || '/logo.svg',
      badge: notification.badge || '/badge-icon.png',
      data: notification.data || {},
      actions: notification.actions || [],
      requireInteraction: notification.data?.type === 'login_alert',
      tag: notification.data?.type || 'general',
      renotify: notification.data?.type === 'new_message'
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );

  } catch (error) {
    console.error('❌ Ошибка обработки push-уведомления:', error);
    
    // Показываем базовое уведомление в случае ошибки
    event.waitUntil(
      self.registration.showNotification('Новое уведомление', {
        body: 'У вас новое уведомление от классного сайта',
        icon: '/logo.svg'
      })
    );
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Клик по уведомлению:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Обработка действий
  if (action === 'view' && data.type === 'new_message') {
    // Открыть страницу сообщений
    event.waitUntil(
      clients.openWindow('/?tab=messages')
    );
  } else if (action === 'view_calendar' && data.type === 'new_event') {
    // Открыть календарь
    event.waitUntil(
      clients.openWindow('/?tab=calendar')
    );
  } else {
    // По умолчанию открыть главную страницу
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Уведомление закрыто:', event.notification.data);
});

// Перехват сетевых запросов (offline поддержка)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Кеширование API запросов
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Кешируем только успешные ответы
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Если ошибка сети, пробуем получить из кеша
          return caches.match(event.request);
        })
    );
  } else {
    // Для остальных запросов используем стратегию "cache first"
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((response) => {
            // Кешируем новые статические файлы
            if (event.request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  console.log('📨 Сообщение от клиента:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Обработка ошибок
self.addEventListener('error', (event) => {
  console.error('❌ Ошибка в Service Worker:', event.error);
});

// Синхронизация в фоне (для будущих улучшений)
self.addEventListener('sync', (event) => {
  console.log('🔄 Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации
      Promise.resolve()
    );
  }
});
# 🔔 Инструкция по настройке Push-уведомлений

## 🎯 Обзор

Push-уведомления позволяют отправлять сообщения пользователям даже когда сайт закрыт. Система использует современные веб-технологии и не требует сторонних сервисов.

## 🛠️ Технологии

- **Service Worker** - фоновые скрипты для обработки уведомлений
- **Push API** - для получения push-сообщений
- **Notification API** - для отображения уведомлений
- **VAPID** - для аутентификации (Voluntary Application Server Identification)
- **Web Push Protocol** - стандартный протокол отправки

---

## 🚀 Настройка

### 1. Генерация VAPID ключей

Ключи уже сгенерированы и добавлены в `.env`:

```bash
VAPID_PUBLIC_KEY=BEKdjoRztiko-HTo4thjzknMzSWzwiDRbuVCdZ7BkeLxhEBpkIwsYLeqUgKXJdef0Z4zs-Eq3y1m89UZ9gksJag
VAPID_PRIVATE_KEY=svyU-Qm-cqHSdPsk86esxw4aGQPxJLwFpuWxtKPOZs4
VAPID_SUBJECT=mailto:admin@school.ru
```

### 2. Файлы системы

- **Service Worker:** `/public/sw.js` - обработка уведомлений
- **Push API:** `/src/lib/push.ts` - функции отправки
- **React Hook:** `/src/hooks/use-push.ts` - управление подписками
- **Компонент:** `/src/components/push/push-manager.tsx` - UI для управления
- **API Endpoints:** 
  - `/api/push/subscribe` - управление подписками
  - `/api/push/send` - отправка уведомлений
  - `/api/push/vapid-public-key` - получение публичного ключа

---

## 🧪 Тестирование

### Веб-интерфейс тестирования
Откройте: `http://localhost:3000/test-push.html`

### Порядок тестирования:
1. **Проверка поддержки** - автоматически при загрузке
2. **Разрешение на уведомления** - запросите разрешение браузера
3. **Регистрация Service Worker** - регистрация фонового скрипта
4. **Подписка** - создание push-подписки
5. **Тестовое уведомление** - отправка тестового сообщения
6. **Кастомное уведомление** - отправка своего сообщения

---

## 💻 Интеграция в приложение

### 1. Добавление компонента управления

```tsx
import { PushManager } from '@/components/push/push-manager';

function UserProfile() {
  return (
    <div>
      <h3>Настройки уведомлений</h3>
      <PushManager />
    </div>
  );
}
```

### 2. Использование хука в компонентах

```tsx
import { usePush } from '@/hooks/use-push';

function NotificationComponent() {
  const { isSubscribed, subscribe, unsubscribe } = usePush();

  return (
    <div>
      {isSubscribed ? (
        <button onClick={unsubscribe}>Отписаться</button>
      ) : (
        <button onClick={subscribe}>Подписаться</button>
      )}
    </div>
  );
}
```

### 3. Отправка уведомлений

#### Отправка конкретному пользователю:
```tsx
async function sendUserNotification(userId: string) {
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      notification: {
        title: 'Новое сообщение',
        body: 'Вы получили новое сообщение от учителя',
        icon: '/message-icon.png'
      }
    })
  });
}
```

#### Отправка по роли:
```tsx
async function sendRoleNotification() {
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetRole: 'STUDENT',
      notification: {
        title: 'Новое задание',
        body: 'Добавлено новое домашнее задание',
        icon: '/homework-icon.png'
      }
    })
  });
}
```

#### Отправка всем:
```tsx
async function sendBroadcastNotification() {
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sendToAll: true,
      notification: {
        title: 'Важное объявление',
        body: 'Завтра родительское собрание',
        icon: '/announcement-icon.png'
      }
    })
  });
}
```

---

## 🔧 Service Worker возможности

### Обработка различных типов уведомлений:

```javascript
// В /public/sw.js
self.addEventListener('push', (event) => {
  const notification = event.data.json();
  
  // Разные действия для разных типов
  switch (notification.data.type) {
    case 'new_message':
      // Показать уведомление о сообщении
      break;
    case 'new_event':
      // Показать уведомление о событии
      break;
    case 'login_alert':
      // Показать уведомление о входе
      break;
  }
});
```

### Офлайн поддержка:
Service Worker автоматически кеширует файлы и работает офлайн.

---

## 📱 Типы уведомлений

### 1. Уведомления о сообщениях
```javascript
{
  title: 'Новое сообщение',
  body: 'Иван Иванов: Здравствуйте!',
  icon: '/message-icon.png',
  data: {
    type: 'new_message',
    sender: 'Иван Иванов',
    timestamp: '2024-01-15T10:30:00Z'
  },
  actions: [
    {
      action: 'reply',
      title: 'Ответить',
      icon: '/reply-icon.png'
    }
  ]
}
```

### 2. Уведомления о событиях
```javascript
{
  title: 'Новое событие',
  body: 'Экскурсия в музей - 20 января',
  icon: '/calendar-icon.png',
  data: {
    type: 'new_event',
    eventId: '123',
    eventDate: '2024-01-20'
  },
  actions: [
    {
      action: 'view_calendar',
      title: 'Открыть календарь',
      icon: '/calendar-icon.png'
    }
  ]
}
```

### 3. Уведомления о входе
```javascript
{
  title: 'Вход в систему',
  body: 'Обнаружен вход с нового устройства',
  icon: '/security-icon.png',
  data: {
    type: 'login_alert',
    deviceInfo: 'Chrome, Windows',
    loginTime: '2024-01-15T10:30:00Z'
  }
}
```

---

## 🛡️ Безопасность

### 1. VAPID аутентификация
- Каждый запрос подписывается приватным ключом
- Только ваш сервер может отправлять уведомления

### 2. Валидация подписок
- Сервер проверяет валидность подписок перед отправкой
- Устаревшие подписки автоматически удаляются

### 3. Безопасные данные
- В уведомлениях не передается чувствительная информация
- Все данные валидируются на сервере

---

## 📊 Статистика и мониторинг

### Получение статистики:
```javascript
async function getPushStats() {
  const response = await fetch(`/api/push/send?userId=${userId}`);
  const data = await response.json();
  
  console.log('Всего подписок:', data.stats.totalSubscriptions);
  console.log('По ролям:', data.stats.roleStats);
}
```

### Логирование:
- Все действия логируются в консоль
- Ошибки отправки записываются в логи
- Статистика успехов/неудач доступна

---

## 🚨 Решение проблем

### 1. Уведомления не приходят
- Проверьте разрешение браузера
- Убедитесь, что Service Worker зарегистрирован
- Проверьте консоль на ошибки

### 2. Ошибка подписки
- Убедитесь, что VAPID ключи настроены
- Проверьте поддержку браузера
- Проверьте HTTPS (обязательно для продакшена)

### 3. Service Worker не работает
- Проверьте путь к файлу `/sw.js`
- Убедитесь, что сайт обслуживается по HTTPS
- Проверьте консоль на ошибки регистрации

### 4. Ошибка отправки
- Проверьте VAPID ключи в `.env`
- Убедитесь, что подписки существуют в базе
- Проверьте формат уведомления

---

## 🌐 Поддержка браузеров

✅ **Поддерживается:**
- Chrome 50+
- Firefox 44+
- Edge 17+
- Safari 16.4+

❌ **Не поддерживается:**
- Internet Explorer
- Старые мобильные браузеры

---

## 📝 Чек-лист перед продакшеном

- [ ] Изменить VAPID ключи на уникальные
- [ ] Настроить HTTPS для сайта
- [ ] Протестировать на всех поддерживаемых браузерах
- [ ] Настроить обработку ошибок
- [ ] Добавить аналитику отправки
- [ ] Удалить тестовые файлы (`test-push.html`)
- [ ] Настроить мониторинг сервисов
- [ ] Протестировать офлайн работу

---

## 🎉 Готово!

Push-уведомления полностью настроены и готовы к использованию. Система:
- ✅ Не требует сторонних сервисов
- ✅ Работает офлайн
- ✅ Безопасна и надежна
- ✅ Масштабируема
- ✅ Легко интегрируется

**Тестируйте через `http://localhost:3000/test-push.html`** 🚀
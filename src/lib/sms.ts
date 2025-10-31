// Загрузка переменных окружения
require('dotenv').config();

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Отправка SMS с кодом подтверждения
 * В реальном приложении здесь будет интеграция с SMS-шлюзом
 * Для демонстрации используем симуляцию
 */
export async function sendVerificationSMS(phone: string, code: string): Promise<SMSResult> {
  try {
    // В реальном приложении здесь будет код для отправки SMS через API
    // Например, через сервисы вроде:
    // - SMS.ru
    // - Twilio
    // - SMS Aero
    // - и т.д.
    
    // Симуляция отправки SMS
    console.log(`📱 [SMS SIMULATION] Отправка SMS на номер ${phone}`);
    console.log(`📱 [SMS SIMULATION] Код подтверждения: ${code}`);
    console.log(`📱 [SMS SIMULATION] API Key: ${process.env.SMS_API_KEY || 'demo-key'}`);
    
    // Имитация задержки отправки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Возвращаем успешный результат
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error) {
    console.error('Ошибка отправки SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}

/**
 * Проверка формата телефона
 */
export function isValidPhoneForSMS(phone: string): boolean {
  // Российский формат телефона
  const phoneRegex = /^(\+7|8)?\d{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Форматирование телефона для SMS-шлюза
 */
export function formatPhoneForSMS(phone: string): string {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');
  
  // Приводим к формату +7XXXXXXXXXX
  if (digits.startsWith('8')) {
    return '+7' + digits.substring(1);
  } else if (digits.startsWith('7')) {
    return '+' + digits;
  } else if (digits.length === 10) {
    return '+7' + digits;
  }
  
  return phone;
}

/**
 * Получение баланса SMS (для реальных SMS-шлюзов)
 */
export async function getSMSBalance(): Promise<number> {
  // В реальном приложении здесь будет запрос к API SMS-шлюза
  // Для демонстрации возвращаем случайное число
  return Math.floor(Math.random() * 1000);
}

/**
 * Отправка уведомления (например, о входе в систему)
 */
export async function sendNotificationSMS(phone: string, message: string): Promise<SMSResult> {
  try {
    console.log(`📱 [SMS NOTIFICATION] Отправка уведомления на ${phone}`);
    console.log(`📱 [SMS NOTIFICATION] Сообщение: ${message}`);
    
    // Имитация отправки
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      messageId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}
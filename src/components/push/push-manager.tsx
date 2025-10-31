'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Loader2, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { usePush } from '@/hooks/use-push';

export function PushManager() {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    requestPermission
  } = usePush();

  const [actionLoading, setActionLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubscribe = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      await subscribe();
    } catch (error) {
      console.error('Ошибка подписки:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      await unsubscribe();
    } catch (error) {
      console.error('Ошибка отписки:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setActionLoading(true);
    setTestResult(null);
    
    try {
      const result = await sendTestNotification();
      setTestResult({
        success: true,
        message: 'Тестовое уведомление отправлено успешно!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка отправки уведомления'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setActionLoading(true);
    
    try {
      await requestPermission();
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { color: 'bg-green-500', text: 'Разрешено' };
      case 'denied':
        return { color: 'bg-red-500', text: 'Запрещено' };
      case 'default':
        return { color: 'bg-yellow-500', text: 'Не запрошено' };
      default:
        return { color: 'bg-gray-500', text: 'Неизвестно' };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Push-уведомления
          </CardTitle>
          <CardDescription>
            Управление push-уведомлениями браузера
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Ваш браузер не поддерживает push-уведомления. Пожалуйста, используйте современный браузер 
              (Chrome, Firefox, Safari, Edge) для получения уведомлений.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Push-уведомления
        </CardTitle>
        <CardDescription>
          Управление push-уведомлениями браузера
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Статус поддержки */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Поддержка браузера:</span>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Поддерживается
          </Badge>
        </div>

        {/* Статус разрешения */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Разрешение на уведомления:</span>
          <Badge variant="secondary" className={permissionStatus.color}>
            {permissionStatus.text}
          </Badge>
        </div>

        {/* Статус подписки */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Статус подписки:</span>
          <Badge variant={isSubscribed ? "default" : "outline"}>
            {isSubscribed ? (
              <>
                <Bell className="h-3 w-3 mr-1" />
                Подписан
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3 mr-1" />
                Не подписан
              </>
            )}
          </Badge>
        </div>

        {/* Кнопки действий */}
        <div className="space-y-2">
          {permission === 'default' && (
            <Button
              onClick={handleRequestPermission}
              disabled={loading || actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Запрос разрешения...
                </>
              ) : (
                'Запросить разрешение'
              )}
            </Button>
          )}

          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={handleSubscribe}
              disabled={loading || actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Подписка...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Подписаться на уведомления
                </>
              )}
            </Button>
          )}

          {permission === 'granted' && isSubscribed && (
            <div className="space-y-2">
              <Button
                onClick={handleTestNotification}
                disabled={loading || actionLoading}
                variant="outline"
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить тестовое уведомление'
                )}
              </Button>
              
              <Button
                onClick={handleUnsubscribe}
                disabled={loading || actionLoading}
                variant="destructive"
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Отписаться
                  </>
                )}
              </Button>
            </div>
          )}

          {permission === 'denied' && (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Разрешение на уведомления запрещено. Чтобы включить уведомления, 
                измените настройки браузера для этого сайта.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Результат теста */}
        {testResult && (
          <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Информация */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Push-уведомления работают даже когда сайт закрыт</p>
          <p>• Вы получите уведомления о новых сообщениях и событиях</p>
          <p>• Уведомления безопасны и не содержат личной информации</p>
        </div>
      </CardContent>
    </Card>
  );
}
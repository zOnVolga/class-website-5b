import { NextResponse } from 'next/server';
import { getVapidPublicKey, checkVapidSetup } from '@/lib/push';

export async function GET() {
  try {
    const setup = checkVapidSetup();
    
    if (!setup.configured) {
      return NextResponse.json(
        { error: setup.error },
        { status: 500 }
      );
    }

    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID публичный ключ не найден' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey
    });

  } catch (error) {
    console.error('Ошибка получения VAPID публичного ключа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
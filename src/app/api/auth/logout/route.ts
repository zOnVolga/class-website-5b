import { NextRequest, NextResponse } from 'next/server';
import { db, sessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      // Удаляем refresh token из базы данных
      await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
    }

    // Создаем ответ с очищенными куками
    const response = NextResponse.json({
      message: 'Выход выполнен успешно',
    });

    // Очищаем куки
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
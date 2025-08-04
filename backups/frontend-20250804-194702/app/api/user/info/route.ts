import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth-token')?.value;

    // 기본 사용자 정보 반환 (실제 구현시 DB에서 가져오기)
    const userInfo = {
      success: true,
      coins: 1000,
      gems: 50,
      daily_spins: 3,
      username: 'Player',
      level: 1
    };

    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('사용자 정보 가져오기 실패:', error);
    return NextResponse.json(
      { success: false, message: '사용자 정보를 가져올 수 없습니다.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径
  const publicPaths = ['/login', '/register', '/api/auth', '/api/report'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 验证 token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { code: 1005, message: '登录已过期' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
    );
    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { code: 1005, message: '登录已过期' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};

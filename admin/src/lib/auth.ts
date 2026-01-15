import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface UserPayload {
  userId: number;
}

/**
 * 从请求中获取用户 ID
 */
export function getUserIdFromRequest(request: NextRequest): number | null {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * 验证用户是否登录
 */
export function requireAuth(request: NextRequest): number {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    throw new Error('未登录或登录已过期');
  }
  return userId;
}

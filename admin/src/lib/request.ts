/**
 * API 请求封装
 * 自动处理登录过期跳转
 */

interface RequestOptions extends RequestInit {
  skipAuthCheck?: boolean; // 跳过登录检查（用于登录/注册接口）
}

/**
 * 封装的 fetch 请求，自动处理登录过期
 */
export async function request(url: string, options: RequestOptions = {}) {
  const { skipAuthCheck, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    // 检查是否登录过期
    if (!skipAuthCheck && data.code === 1005) {
      // 登录过期，跳转到登录页
      if (typeof window !== 'undefined') {
        // 保存当前页面路径，登录后可以跳回
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        // 跳转到登录页
        window.location.href = '/login';
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

/**
 * GET 请求
 */
export async function get(url: string, options?: RequestOptions) {
  return request(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * POST 请求
 */
export async function post(url: string, body?: any, options?: RequestOptions) {
  return request(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function put(url: string, body?: any, options?: RequestOptions) {
  return request(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 请求
 */
export async function del(url: string, options?: RequestOptions) {
  return request(url, {
    ...options,
    method: 'DELETE',
  });
}

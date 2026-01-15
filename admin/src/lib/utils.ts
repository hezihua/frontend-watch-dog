export function generateShortUUID(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
}

export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

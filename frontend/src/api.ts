export const API_ROOT = import.meta.env.VITE_API_BASE_URL || '';
const ACCESS = 'edumaster.access';
const REFRESH = 'edumaster.refresh';
export type Role = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type User = { id: number; fullName: string; email: string; role: Role; createdAt?: string };
export type Course = { id: number; title: string; description: string; thumbnail?: string | null; price: string | number; status?: string; instructor?: { id?: number; fullName: string }; _count?: { enrollments?: number }; sections?: Section[] };
export type Section = { id: number; title: string; position: number; lessons: Lesson[] };
export type Lesson = { id: number; title: string; position: number; content?: string | null; videoUrl?: string | null; resources?: Resource[] };
export type Resource = { id: number; name: string; url: string };
export type Quiz = { id: number; title: string; questions: { id: number; text: string; options: { id: number; text: string }[] }[] };
export type Session = { accessToken: string; refreshToken: string; user: User };
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export function rememberSession(data: Session) { sessionStorage.setItem(ACCESS, data.accessToken); sessionStorage.setItem(REFRESH, data.refreshToken); }
export function clearSession() { sessionStorage.removeItem(ACCESS); sessionStorage.removeItem(REFRESH); }
export function getRefreshToken() { return sessionStorage.getItem(REFRESH); }
async function http<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const access = sessionStorage.getItem(ACCESS);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  let response: Response;
  try { response = await fetch(`${API_ROOT}${path}`, { ...init, headers }); }
  catch { throw new ApiError(0, 'Không kết nối được backend. Hãy kiểm tra localhost:5000.'); }
  if (response.status === 401 && retry && getRefreshToken() && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
    try {
      const rotated = await http<Session>('/api/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: getRefreshToken() }) }, false);
      rememberSession(rotated);
      return http<T>(path, init, false);
    } catch { clearSession(); }
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.message || `HTTP ${response.status}`);
  return data as T;
}
export const api = {
  get: <T>(p: string) => http<T>(p),
  post: <T>(p: string, data: unknown) => http<T>(p, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(p: string, data: unknown) => http<T>(p, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(p: string, data: unknown) => http<T>(p, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(p: string) => http<T>(p, { method: 'DELETE' }),
};

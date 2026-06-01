const KEY = "sf_admin_token";
const USER_KEY = "sf_admin_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
export function getUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}
export function setSession(token: string, email: string) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(USER_KEY, email);
}
export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
}
export function isAuthed(): boolean { return !!getToken(); }

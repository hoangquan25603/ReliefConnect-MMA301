// ============================================================
//  Token Storage – localStorage wrapper
//  Quản lý cả accessToken và refreshToken
// ============================================================

const ACCESS_TOKEN_KEY  = 'auth_access_token'
const REFRESH_TOKEN_KEY = 'auth_refresh_token'

export const tokenStorage = {
  // ── Access Token ──────────────────────────────────────────
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  set(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  remove(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },

  exists(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  // ── Refresh Token ─────────────────────────────────────────
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefresh(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  removeRefresh(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  // ── Clear all tokens ──────────────────────────────────────
  clearAll(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

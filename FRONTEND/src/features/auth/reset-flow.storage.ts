// ============================================================
//  Reset Flow Storage – sessionStorage wrapper
//  Lưu tạm email + resetSessionId giữa 3 bước: ForgotPassword →
//  VerifyResetCode → ResetPassword. Dùng sessionStorage (không phải
//  localStorage như tokenStorage) vì đây là state ngắn hạn, chỉ cần
//  sống trong 1 tab tới khi đổi mật khẩu xong hoặc đóng tab — không
//  nên trôi nổi lâu dài như access/refresh token.
// ============================================================

const EMAIL_KEY = 'reset_flow_email'
const SESSION_ID_KEY = 'reset_flow_session_id'

export const resetFlowStorage = {
  getEmail(): string | null {
    return sessionStorage.getItem(EMAIL_KEY)
  },

  setEmail(email: string): void {
    sessionStorage.setItem(EMAIL_KEY, email)
  },

  getResetSessionId(): string | null {
    return sessionStorage.getItem(SESSION_ID_KEY)
  },

  setResetSessionId(resetSessionId: string): void {
    sessionStorage.setItem(SESSION_ID_KEY, resetSessionId)
  },

  clear(): void {
    sessionStorage.removeItem(EMAIL_KEY)
    sessionStorage.removeItem(SESSION_ID_KEY)
  },
}

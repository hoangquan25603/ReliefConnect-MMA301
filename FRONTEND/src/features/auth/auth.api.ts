// ============================================================
//  Auth API — /api/auth
//  Base URL: https://disasterrelief-api.runasp.net
//
//  LƯU Ý: http.ts đã tự bóc ApiResponse envelope trong interceptor.
//  Hàm unwrap() dưới đây viết kiểu "tolerant": nhận cả 2 dạng
//  (đã bóc / chưa bóc) nên không vỡ dù http.ts phiên bản nào.
// ============================================================

import { http } from '@/lib/api/http'
import type {
  ApiResponse,
  LoginPayload,
  RegisterPayload,
  RefreshTokenPayload,
  ChangePasswordPayload,
  LogoutPayload,
  ForgotPasswordPayload,
  VerifyResetCodePayload,
  VerifyResetCodeResult,
  ResetPasswordPayload,
  LoginResult,
  AuthUser,
  RefreshResult,
  MeResult,
} from './auth.types'

// ── Helper: unwrap ApiResponse<T> (tolerant) ─────────────────
/**
 * - Nếu data là envelope (còn nguyên isSuccess/result): kiểm tra rồi bóc.
 * - Nếu http.ts đã bóc sẵn (data chính là result): trả thẳng.
 */
function unwrap<T>(data: ApiResponse<T> | T): T {
  if (
    data !== null &&
    typeof data === 'object' &&
    'isSuccess' in (data as object) &&
    'result' in (data as object)
  ) {
    const r = data as ApiResponse<T>
    if (!r.isSuccess || r.result === null) {
      const msg =
        r.errorMessages && r.errorMessages.length > 0
          ? r.errorMessages.join(' | ')
          : 'Đã có lỗi xảy ra'
      throw new Error(msg)
    }
    return r.result
  }
  return data as T
}

// ── POST /api/auth/login ──────────────────────────────────────
/**
 * Đăng nhập — nhận accessToken + refreshToken.
 * accessToken hết hạn sau 60 phút.
 * Body: { email, password }
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  const payload: LoginPayload = { email, password }
  const { data } = await http.post<ApiResponse<LoginResult> | LoginResult>('/auth/login', payload)
  return unwrap(data)
}

// ── POST /api/auth/register ───────────────────────────────────
/**
 * Đăng ký tài khoản mới — role mặc định là "Requester".
 * Body: { email, password, confirmPassword, fullName, phoneNumber }
 */
export async function registerUser(
  userData: RegisterPayload,
): Promise<LoginResult> {
  const { data } = await http.post<ApiResponse<LoginResult> | LoginResult>('/auth/register', userData)
  return unwrap(data)
}

// ── POST /api/auth/refresh-token ──────────────────────────────
/**
 * Làm mới accessToken bằng refreshToken còn hạn (7 ngày).
 * Gọi khi nhận 401 do accessToken hết hạn (60 phút).
 * Không cần Authorization header.
 * Body: { refreshToken }
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshResult> {
  const payload: RefreshTokenPayload = { refreshToken }
  const { data } = await http.post<ApiResponse<RefreshResult> | RefreshResult>('/auth/refresh-token', payload)
  return unwrap(data)
}

// ── POST /api/auth/logout ─────────────────────────────────────
/**
 * Thu hồi 1 refreshToken phía server.
 * Theo spec BE: gửi refreshToken trong body để blacklist.
 * 🔒 Không cần đăng nhập (theo bảng endpoint trong API-Reference-FE.md).
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  const payload: LogoutPayload = { refreshToken }
  await http.post('/auth/logout', payload)
}

// ── GET /api/auth/me ──────────────────────────────────────────
/**
 * Lấy thông tin user hiện tại từ JWT claim.
 * 🔒 Yêu cầu Authorization: Bearer <accessToken>
 */
export async function getMe(): Promise<MeResult> {
  const { data } = await http.get<ApiResponse<MeResult> | MeResult>('/auth/me')
  return unwrap(data)
}

// ── POST /api/auth/change-password ───────────────────────────
/**
 * Đổi mật khẩu tài khoản hiện tại.
 * 🔒 Yêu cầu Authorization: Bearer <accessToken>
 * Body: { oldPassword, newPassword, confirmPassword }
 *
 * Action không trả data: nếu http.ts đã bóc envelope thì data = null
 * (thành công) hoặc interceptor tự reject (thất bại) — không cần check gì.
 * Nếu data còn là envelope (http.ts cũ) thì check isSuccess như trước.
 */
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  const { data } = await http.post<ApiResponse<null> | null>('/auth/change-password', payload)
  if (
    data !== null &&
    typeof data === 'object' &&
    'isSuccess' in data &&
    !(data as ApiResponse<null>).isSuccess
  ) {
    const r = data as ApiResponse<null>
    const msg =
      r.errorMessages && r.errorMessages.length > 0
        ? r.errorMessages.join(' | ')
        : 'Đổi mật khẩu thất bại'
    throw new Error(msg)
  }
}

// ── POST /api/auth/forgot-password ───────────────────────────
/**
 * Gửi email chứa mã xác minh 6 số (hiệu lực 10 phút).
 * Body: { email }
 */
export async function forgotPassword(email: string): Promise<void> {
  const payload: ForgotPasswordPayload = { email }
  const { data } = await http.post<ApiResponse<null> | null>('/auth/forgot-password', payload)
  if (
    data !== null &&
    typeof data === 'object' &&
    'isSuccess' in data &&
    !(data as ApiResponse<null>).isSuccess
  ) {
    const r = data as ApiResponse<null>
    const msg =
      r.errorMessages && r.errorMessages.length > 0
        ? r.errorMessages.join(' | ')
        : 'Yêu cầu khôi phục thất bại'
    throw new Error(msg)
  }
}

// ── POST /api/auth/verify-reset-code ─────────────────────────
/**
 * Xác minh mã 6 số đã gửi qua email. Đúng mã → trả về resetSessionId
 * dùng ở bước reset-password tiếp theo. Sai mã quá 5 lần thì mã bị
 * vô hiệu — BE trả lỗi 400, số lần thử còn lại nằm ngay trong nội
 * dung message (không phải field riêng), FE chỉ cần hiển thị nguyên văn.
 * Body: { email, code }
 */
export async function verifyResetCode(
  email: string,
  code: string,
): Promise<VerifyResetCodeResult> {
  const payload: VerifyResetCodePayload = { email, code }
  const { data } = await http.post<ApiResponse<VerifyResetCodeResult> | VerifyResetCodeResult>(
    '/auth/verify-reset-code',
    payload,
  )
  return unwrap(data)
}

// ── POST /api/auth/reset-password ────────────────────────────
/**
 * Đặt lại mật khẩu bằng resetSessionId nhận được từ verify-reset-code.
 * Body: { resetSessionId, newPassword }
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  const { data } = await http.post<ApiResponse<null> | null>('/auth/reset-password', payload)
  if (
    data !== null &&
    typeof data === 'object' &&
    'isSuccess' in data &&
    !(data as ApiResponse<null>).isSuccess
  ) {
    const r = data as ApiResponse<null>
    const msg =
      r.errorMessages && r.errorMessages.length > 0
        ? r.errorMessages.join(' | ')
        : 'Đặt lại mật khẩu thất bại'
    throw new Error(msg)
  }
}

// ── Alias: map LoginResult → AuthUser ────────────────────────
/**
 * Chuyển LoginResult (BE response) thành AuthUser (FE store format).
 * Dùng sau login/register/refresh để lưu vào store.
 */
export function toAuthUser(result: LoginResult): AuthUser {
  return {
    userId:    result.userId,
    fullName:  result.fullName,
    email:     result.email,
    role:      result.role,
    expiresAt: result.expiresAt,
  }
}
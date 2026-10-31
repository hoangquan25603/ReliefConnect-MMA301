// ============================================================
//  Auth – TypeScript interfaces & Role definitions
//  Sync với BE thực tế: https://disasterrelief-api.runasp.net
//  Kiểm chứng 2026-07-13 — response THẬT từ POST /api/auth/login
// ============================================================

// ── Roles ─────────────────────────────────────────────────────
// BE trả PascalCase: "Admin" | "Volunteer" | "Requester" | "Coordinator" | "Organization"
// [2026-07-13] BE đổi tên role "WarehouseManager" → "Coordinator" (migration
// 20260713075737_RenameWarehouseManagerToCoordinator). Permission không đổi,
// role này vẫn là quản lý kho vật tư — không liên quan tới trang /coordinator
// (Điều phối viên phân công TNV, chỉ dành cho Admin).
export type UserRole =
  | 'Admin'
  | 'Volunteer'
  | 'Requester'
  | 'Coordinator'
  | 'Organization'

/** Tên hiển thị tiếng Việt */
export const ROLE_LABELS: Record<UserRole, string> = {
  Admin:       'Quản trị viên',
  Volunteer:   'Tình nguyện viên',
  Requester:   'Người yêu cầu hỗ trợ',
  Coordinator: 'Quản lý kho',
  Organization: 'Tổ chức',
}

/** Màu badge cho từng role */
export const ROLE_COLORS: Record<UserRole, string> = {
  Admin:       '#c53030',  // đỏ
  Volunteer:   '#276749',  // xanh lá
  Requester:   '#975a16',  // cam
  Coordinator: '#2b6cb0',  // xanh dương
  Organization: '#6b46c1', // tím
}

/**
 * Thứ tự ưu tiên – role có số cao hơn có quyền hơn.
 */
export const ROLE_PRIORITY: Record<UserRole, number> = {
  Admin:       5,
  Coordinator: 4,
  Organization: 3,
  Volunteer:   2,
  Requester:   1,
}

// ── Wrapper chung mọi API response ───────────────────────────
/**
 * Tất cả response từ BE (trừ file Excel) đều bọc trong ApiResponse<T>.
 * Xem mục 3 trong API-Reference-FE.md.
 */
export interface ApiResponse<T> {
  statusCode: number
  isSuccess: boolean
  errorMessages: string[]  // [] nếu thành công
  result: T | null         // null nếu lỗi
}

// ── Payloads (request body) ───────────────────────────────────

/**
 * POST /api/auth/login
 * BE nhận: { email, password }
 * (Không phải "identifier" — đã kiểm chứng với response thật 2026-07-13)
 */
export interface LoginPayload {
  email: string
  password: string
}

/**
 * POST /api/auth/register
 * Role mặc định sau khi đăng ký là "Requester"
 */
export interface RegisterPayload {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber?: string
}

/** POST /api/auth/refresh-token */
export interface RefreshTokenPayload {
  refreshToken: string
}

/**
 * POST /api/auth/change-password
 * BE nhận { oldPassword, newPassword, confirmPassword } — kiểm chứng trực tiếp
 * ChangePasswordCommand.cs (không phải currentPassword/confirmNewPassword).
 */
export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

/** POST /api/auth/logout (thu hồi refresh token) */
export interface LogoutPayload {
  refreshToken: string
}

/**
 * POST /api/auth/forgot-password
 * BE nhận { email }
 */
export interface ForgotPasswordPayload {
  email: string
}

/**
 * POST /api/auth/verify-reset-code
 * BE nhận { email, code } — code là mã 6 chữ số gửi qua email.
 */
export interface VerifyResetCodePayload {
  email: string
  code: string
}

/**
 * result của POST /api/auth/verify-reset-code khi mã đúng.
 * resetSessionId dùng ở bước reset-password tiếp theo (KHÔNG phải code).
 */
export interface VerifyResetCodeResult {
  resetSessionId: string
}

/**
 * POST /api/auth/reset-password
 * BE nhận { resetSessionId, newPassword } — resetSessionId lấy từ
 * response của verify-reset-code, không còn token từ link email.
 * confirmPassword chỉ dùng để validate phía FE, BE không đọc field này
 * (giữ lại trong payload cho nhất quán với form).
 */
export interface ResetPasswordPayload {
  resetSessionId: string
  newPassword: string
  confirmPassword: string
}

// ── Response Models ───────────────────────────────────────────

/**
 * result bên trong ApiResponse khi login/register thành công.
 * Tên field khớp với JSON thực tế trả về từ BE (kiểm chứng 2026-07-13):
 * { userId, fullName, email, role, accessToken, refreshToken, expiresAt }
 */
export interface LoginResult {
  userId:       string    // GUID: "2e2e12d0-eaf1-44a7-a8cf-08dedfe3aa11"
  fullName:     string
  email:        string
  role:         UserRole  // "Admin" | "Volunteer" | "Requester" | ...
  accessToken:  string    // JWT, hết hạn sau 60 phút
  refreshToken: string    // hết hạn sau 7 ngày
  expiresAt:    string    // ISO 8601 UTC: "2026-07-13T03:10:44.77Z"
}

/**
 * Thông tin user giữ trong store (dùng khắp app).
 * Map từ LoginResult sau khi đăng nhập.
 */
export interface AuthUser {
  userId:      string    // GUID
  fullName:    string
  email:       string
  role:        UserRole
  expiresAt:   string    // giữ lại để tự refresh trước khi hết hạn
  // LoginResult/MeResult thật từ BE không trả phoneNumber (kiểm chứng 2026-07-13).
  // Chỉ có giá trị ngay sau khi đăng ký (FE tự lưu lại từ form) — undefined nếu đăng nhập.
  phoneNumber?: string
}

/**
 * result của POST /api/auth/refresh-token.
 * Trả về cặp token mới (cấu trúc giống LoginResult nhưng FE chỉ cần token).
 */
export interface RefreshResult {
  accessToken:  string
  refreshToken: string
  expiresAt:    string
}

/**
 * result của GET /api/auth/me.
 * Lấy thông tin user từ JWT claim (không cần DB roundtrip).
 */
export interface MeResult {
  userId:   string
  fullName: string
  email:    string
  role:     UserRole
}

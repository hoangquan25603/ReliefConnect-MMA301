// ============================================================
//  Auth Store – Pinia
//  Sync với BE thực tế: LoginResult → AuthUser, role PascalCase
// ============================================================

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { tokenStorage } from '@/lib/api/token-storage'
import { loginUser, logoutUser, getMe, toAuthUser } from '@/features/auth/auth.api'
import type { AuthUser, UserRole } from '@/features/auth/auth.types'
import { ROLE_PRIORITY } from '@/features/auth/auth.types'

const USER_KEY = 'auth_user'

/** Đọc user đã lưu từ localStorage (persist qua F5) */
function readPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────
  const accessToken = ref<string | null>(tokenStorage.get())
  const user        = ref<AuthUser | null>(readPersistedUser())

  // ── Getters ────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!accessToken.value && !!user.value)

  /** Role hiện tại (PascalCase khớp BE): "Admin" | "Volunteer" | ... */
  const role = computed<UserRole | null>(() => user.value?.role ?? null)

  /** Kiểm tra user có role cụ thể không */
  function hasRole(...roles: UserRole[]): boolean {
    return !!user.value && roles.includes(user.value.role)
  }

  /**
   * Kiểm tra user có quyền >= minRole theo hierarchy không.
   * VD: isAtLeast('Volunteer') → true nếu là Volunteer, Coordinator hoặc Admin
   */
  function isAtLeast(minRole: UserRole): boolean {
    if (!user.value) return false
    return ROLE_PRIORITY[user.value.role] >= ROLE_PRIORITY[minRole]
  }

  const isAdmin            = computed(() => hasRole('Admin'))
  const isVolunteer        = computed(() => hasRole('Volunteer'))
  const isRequester        = computed(() => hasRole('Requester'))
  const isCoordinator      = computed(() => hasRole('Coordinator'))
  const isOrganization     = computed(() => hasRole('Organization'))

  // ── Session tracking for single device / single session ─────
  const currentSessionId = ref<string | null>(localStorage.getItem('active_session_id'))

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === USER_KEY || event.key === 'auth_access_token') {
        accessToken.value = tokenStorage.get()
        user.value = readPersistedUser()
        currentSessionId.value = localStorage.getItem('active_session_id')
        // Đồng bộ tab cùng trình duyệt, không xóa phiên mới của tab vừa đăng nhập.
        if (!accessToken.value && window.location.pathname !== '/login') window.location.href = '/login'
      }
    })
  }

  // ── Actions ────────────────────────────────────────────────

  /**
   * Đăng nhập.
   * loginUser() trả LoginResult, toAuthUser() map sang AuthUser để lưu store.
   * Lưu cả accessToken + refreshToken vào localStorage.
   */
  async function login(email: string, password: string): Promise<void> {
    const result = await loginUser(email, password)

    accessToken.value = result.accessToken
    user.value        = toAuthUser(result)

    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
    currentSessionId.value = newSessionId
    localStorage.setItem('active_session_id', newSessionId)

    tokenStorage.set(result.accessToken)
    tokenStorage.setRefresh(result.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  /**
   * Đăng xuất.
   * Gửi refreshToken lên BE để blacklist, sau đó xoá local state.
   */
  async function logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh()
    try {
      if (refreshToken) {
        await logoutUser(refreshToken)
      }
    } catch {
      // Bỏ qua lỗi server — vẫn xoá local state
    }

    accessToken.value = null
    user.value        = null

    tokenStorage.clearAll()
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('active_session_id')
  }

  /**
   * Lấy thông tin user mới nhất từ /api/auth/me.
   * Gọi khi app khởi động (sau F5) để đảm bảo data đồng bộ với BE.
   */
  async function fetchMe(): Promise<void> {
    try {
      const me = await getMe()
      const current = user.value

      // Nếu role trả về từ server KHÁC với role trong store → Admin vừa đổi role!
      if (current && me.role !== current.role) {
        accessToken.value = null
        user.value = null
        tokenStorage.clearAll()
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('active_session_id')
        sessionStorage.setItem(
          'logout_reason',
          `Vai trò tài khoản của bạn đã được thay đổi (từ "${current.role}" sang "${me.role}"). Vui lòng đăng nhập lại để cập nhật quyền truy cập.`,
        )
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=session_expired'
        }
        return
      }

      user.value = {
        userId:    me.userId,
        fullName:  me.fullName,
        email:     me.email,
        role:      me.role,
        expiresAt: current?.expiresAt ?? '',
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } catch {
      // Token hết hạn → http interceptor tự redirect /login
    }
  }

  /** Cập nhật thông tin user cục bộ (sau khi edit profile) */
  function updateUser(partial: Partial<AuthUser>): void {
    if (!user.value) return
    user.value = { ...user.value, ...partial }
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  return {
    // state
    accessToken, user,
    // computed
    isLoggedIn, role,
    isAdmin, isVolunteer, isRequester, isCoordinator, isOrganization,
    // methods
    hasRole, isAtLeast, login, logout, fetchMe, updateUser,
  }
})

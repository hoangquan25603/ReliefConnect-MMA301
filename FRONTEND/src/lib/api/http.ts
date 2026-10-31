// ============================================================
//  Axios instance – single HTTP client cho toàn bộ app
//  Interceptors: gắn Bearer token + BÓC ApiResponse envelope
//
//  BE bọc MỌI response trong envelope (API Reference mục 3):
//  { statusCode, isSuccess, errorMessages, result }
//  → Bóc tại đây 1 lần duy nhất, các file *.api.ts nhận thẳng
//    data thật trong `result`, không phải tự bóc.
// ============================================================

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/config/env'
import { tokenStorage } from './token-storage'

// ── Custom error class ───────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── ApiResponse envelope của BE ─────────────────────────────
interface ApiEnvelope<T = unknown> {
  statusCode: number
  isSuccess: boolean
  errorMessages: string[] | null
  result: T
}

function isEnvelope(x: unknown): x is ApiEnvelope {
  return (
    typeof x === 'object' &&
    x !== null &&
    'isSuccess' in x &&
    'result' in x
  )
}

// ── Auto-refresh accessToken khi 401 ─────────────────────────
// accessToken hết hạn sau 60 phút, refreshToken còn hạn 7 ngày.
// Thay vì văng thẳng về /login, thử refresh 1 lần rồi gọi lại request gốc.
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let pendingQueue: {
  config: RetryableConfig
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}[] = []

function retryPendingRequests(newToken: string): void {
  pendingQueue.forEach(({ config, resolve }) => {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${newToken}`
    resolve(http(config))
  })
  pendingQueue = []
}

function rejectPendingRequests(error: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(error))
  pendingQueue = []
}

export function forceLogoutRedirect(reason?: string): void {
  tokenStorage.clearAll()
  localStorage.removeItem('auth_user')
  localStorage.removeItem('active_session_id')
  sessionStorage.setItem(
    'logout_reason',
    reason || 'Tài khoản của bạn đã được đăng nhập từ thiết bị khác hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
  )
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?reason=session_expired'
  }
}

// ── Axios instance ───────────────────────────────────────────
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // 30s: hosting free có cold start, request đầu tiên có thể rất chậm
  // (API Reference mục 8)
  timeout: 30_000,
})

// ── Request interceptor: gắn Authorization header & LOG payload ───────────
http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor ────────────────────────────────────
// BE có thể trả message qua nhiều field khác nhau
type BeErrorBody = {
  // Envelope chuẩn
  isSuccess?: boolean
  errorMessages?: string[] | null
  // Các format cũ / .NET mặc định (giữ lại phòng hờ)
  message?: string
  error?: string
  title?: string
  errors?: Record<string, string[]>
}

http.interceptors.response.use(
  (response) => {
    // Bóc envelope: response.data = envelope.result
    if (isEnvelope(response.data)) {
      const envelope = response.data

      // HTTP 200 nhưng isSuccess=false → vẫn coi là lỗi
      if (envelope.isSuccess === false) {
        console.error(`[HTTP Response Error 200/isSuccess=false] ${response.config.method?.toUpperCase()} ${response.config.url}:`, envelope)
        const msg = envelope.errorMessages?.[0] ?? 'Yêu cầu thất bại'
        return Promise.reject(
          new ApiError(envelope.statusCode || response.status, msg, envelope),
        )
      }

      response.data = envelope.result
    }
    return response
  },
  async (error: AxiosError<BeErrorBody>) => {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const originalRequest = error.config as RetryableConfig | undefined

    console.error(`[HTTP Response Error ${status}] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}:`, {
      status,
      errorMessages: body?.errorMessages,
      errors: body?.errors,
      body,
    })

    // ── Thử refresh accessToken 1 lần trước khi chấp nhận thua ──
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh-token')

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        forceLogoutRedirect()
        return Promise.reject(
          new ApiError(status, 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập', body),
        )
      }

      originalRequest._retry = true

      // Request khác cũng đang chờ refresh xong → xếp hàng, không gọi refresh trùng
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ config: originalRequest, resolve, reject })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken }, { timeout: 30_000 })
        const result = isEnvelope(data) ? data.result : data

        tokenStorage.set(result.accessToken)
        tokenStorage.setRefresh(result.refreshToken)
        isRefreshing = false
        retryPendingRequests(result.accessToken)

        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${result.accessToken}`
        return http(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        rejectPendingRequests(refreshError)
        forceLogoutRedirect()
        return Promise.reject(
          new ApiError(401, 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', body),
        )
      }
    }

    // Ưu tiên: errorMessages (envelope) > message > error > title
    // > validation errors > network error
    // Lưu ý: 401/403 chặn ở tầng Policy có thể KHÔNG có body (mục 3)
    let message: string
    if (body?.errorMessages && body.errorMessages.length > 0) {
      message = body.errorMessages.join(' | ')
    } else if (body?.message) {
      message = body.message
    } else if (body?.error) {
      message = body.error
    } else if (body?.title) {
      message = body.title
    } else if (body?.errors) {
      // .NET validation errors: { "Email": ["Email is invalid"] }
      const firstField = Object.values(body.errors)[0]
      message = Array.isArray(firstField) ? firstField[0] : 'Dữ liệu không hợp lệ'
    } else if (status === 401) {
      message = 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập'
    } else if (status === 403) {
      message = 'Bạn không có quyền thực hiện thao tác này'
    } else {
      message = error.message ?? 'Không thể kết nối đến máy chủ'
    }

    // 401 sau khi đã thử refresh (hoặc do chính auth endpoint) → về /login
    if (status === 401 && !isAuthEndpoint) {
      forceLogoutRedirect()
    }

    return Promise.reject(new ApiError(status, message, body))
  },
)

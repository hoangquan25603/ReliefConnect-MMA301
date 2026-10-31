// ============================================================
//  Users – TypeScript interfaces
// ============================================================

export interface User {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface PaginatedUsers {
  items: User[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// ── Payloads (Request Body) ────────────────────────────────

/** POST /api/admin/users — tạo tài khoản mới */
export interface CreateUserPayload {
  fullName: string
  email: string
  phoneNumber?: string
  password: string        // mật khẩu tạm
  roleName: string        // tên role ban đầu, vd: "Requester"
}

/** PUT /api/admin/users/{id} — sửa FullName/PhoneNumber */
export interface UpdateUserPayload {
  fullName: string
  phoneNumber?: string
}

/** POST /api/admin/users/{id}/reset-password — admin đặt lại mật khẩu */
export interface AdminResetPasswordPayload {
  newPassword: string
}

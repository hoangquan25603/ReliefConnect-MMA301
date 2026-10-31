// ============================================================
//  Users API – Admin Only
// ============================================================

import { http } from '@/lib/api/http'
import type {
  User,
  PaginatedUsers,
  CreateUserPayload,
  UpdateUserPayload,
  AdminResetPasswordPayload,
} from './users.types'

/** GET /api/admin/users?pageNumber=&pageSize=&role= */
export async function getUsers(
  pageNumber = 1,
  pageSize = 10,
  role?: string,
): Promise<PaginatedUsers> {
  const { data } = await http.get<PaginatedUsers>('/admin/users', {
    params: { pageNumber, pageSize, role },
  })
  return data
}

/** GET /api/admin/users/{id} */
export async function getUserById(id: string): Promise<User> {
  const { data } = await http.get<User>(`/admin/users/${id}`)
  return data
}

/** POST /api/admin/users — tạo tài khoản mới, đặt mật khẩu tạm */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http.post<User>('/admin/users', payload)
  return data
}

/** PUT /api/admin/users/{id} — sửa FullName/PhoneNumber */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const { data } = await http.put<User>(`/admin/users/${id}`, payload)
  return data
}

/** POST /api/admin/users/{id}/reset-password — Admin đặt lại mật khẩu */
export async function adminResetPassword(
  id: string,
  payload: AdminResetPasswordPayload,
): Promise<void> {
  await http.post(`/admin/users/${id}/reset-password`, payload)
}

/** PUT /api/admin/users/{id}/activate */
export async function activateUser(id: string): Promise<void> {
  await http.put(`/admin/users/${id}/activate`)
}

/** PUT /api/admin/users/{id}/deactivate */
export async function deactivateUser(id: string): Promise<void> {
  await http.put(`/admin/users/${id}/deactivate`)
}

/** PUT /api/admin/users/{id}/role */
export async function updateUserRole(id: string, roleName: string): Promise<void> {
  await http.put(`/admin/users/${id}/role`, { roleName })
}

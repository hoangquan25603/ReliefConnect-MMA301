// ============================================================
//  Users Store – Pinia
// ============================================================

import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getUsers,
  createUser,
  updateUser,
  adminResetPassword,
  activateUser,
  deactivateUser,
  updateUserRole,
} from '@/features/users/users.api'
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  AdminResetPasswordPayload,
} from '@/features/users/users.types'

export const useUsersStore = defineStore('users', () => {
  // ── State ──────────────────────────────────────────────────
  const users = ref<User[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const isLoading = ref(false)
  const currentRoleFilter = ref<string | undefined>(undefined)

  // ── Actions ────────────────────────────────────────────────

  async function fetchUsers(): Promise<void> {
    isLoading.value = true
    try {
      const result = await getUsers(page.value, pageSize.value, currentRoleFilter.value)
      users.value = result.items
      total.value = result.totalCount
      page.value = result.pageNumber
    } finally {
      isLoading.value = false
    }
  }

  /** POST /api/admin/users — tạo tài khoản mới */
  async function create(payload: CreateUserPayload): Promise<User> {
    const newUser = await createUser(payload)
    await fetchUsers() // Reload để lấy danh sách mới nhất
    return newUser
  }

  /** PUT /api/admin/users/{id} — sửa FullName/PhoneNumber */
  async function update(id: string, payload: UpdateUserPayload): Promise<void> {
    const updated = await updateUser(id, payload)
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...updated }
    }
  }

  /** POST /api/admin/users/{id}/reset-password */
  async function resetPassword(id: string, payload: AdminResetPasswordPayload): Promise<void> {
    await adminResetPassword(id, payload)
  }

  async function activate(id: string): Promise<void> {
    await activateUser(id)
    const user = users.value.find((u) => u.id === id)
    if (user) user.isActive = true
  }

  async function deactivate(id: string): Promise<void> {
    await deactivateUser(id)
    const user = users.value.find((u) => u.id === id)
    if (user) user.isActive = false
  }

  async function changeRole(id: string, roleName: string): Promise<void> {
    await updateUserRole(id, roleName)
    const user = users.value.find((u) => u.id === id)
    if (user) user.role = roleName
  }

  return {
    users, total, page, pageSize, isLoading, currentRoleFilter,
    fetchUsers, create, update, resetPassword, activate, deactivate, changeRole,
  }
})

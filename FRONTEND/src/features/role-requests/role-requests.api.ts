// ============================================================
//  Role Requests API — /api/role-requests, /api/admin/role-requests
//
//  - POST /role-requests, GET /role-requests/my  : mọi user đã đăng nhập
//  - GET/approve/reject /admin/role-requests      : Admin only
//
//  Chỉ được xin nâng quyền lên Coordinator hoặc Organization. Duyệt = đổi
//  role user ngay lập tức (user phải đăng nhập lại để nhận role mới).
// ============================================================

import { http } from '@/lib/api/http'
import type { PagedResult } from '@/lib/api/paging'

export type RoleRequestStatus = 'Pending' | 'Approved' | 'Rejected'
export type RequestableRole = 'Coordinator' | 'Organization'

export interface RoleUpgradeRequest {
  id: string
  userId: string
  userFullName: string
  userEmail: string
  currentRoleName: string
  requestedRoleName: string
  reason: string
  status: RoleRequestStatus
  reviewedByUserId: string | null
  reviewedByUserName: string | null
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface RoleRequestActionResult {
  id: string
  message: string
}

/** POST /api/role-requests — gửi nguyện vọng nâng quyền (mọi user đã đăng nhập) */
export async function createRoleRequest(
  requestedRoleName: RequestableRole,
  reason: string,
): Promise<RoleRequestActionResult> {
  const { data } = await http.post<RoleRequestActionResult>('/role-requests', {
    requestedRoleName,
    reason,
  })
  return data
}

/** GET /api/role-requests/my — lịch sử nguyện vọng của chính user (mọi trạng thái) */
export async function getMyRoleRequests(): Promise<RoleUpgradeRequest[]> {
  const { data } = await http.get<RoleUpgradeRequest[]>('/role-requests/my')
  return data
}

/** GET /api/admin/role-requests — Admin xem danh sách, mặc định chỉ Pending */
export async function getRoleRequests(
  status?: RoleRequestStatus,
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<RoleUpgradeRequest>> {
  const { data } = await http.get<PagedResult<RoleUpgradeRequest>>('/admin/role-requests', {
    params: { Status: status, PageNumber: pageNumber, PageSize: pageSize },
  })
  return data
}

/** PUT /api/admin/role-requests/{id}/approve — duyệt, đổi role user ngay */
export async function approveRoleRequest(id: string): Promise<RoleRequestActionResult> {
  const { data } = await http.put<RoleRequestActionResult>(`/admin/role-requests/${id}/approve`)
  return data
}

/** PUT /api/admin/role-requests/{id}/reject — từ chối kèm lý do bắt buộc */
export async function rejectRoleRequest(
  id: string,
  reviewNote: string,
): Promise<RoleRequestActionResult> {
  const { data } = await http.put<RoleRequestActionResult>(
    `/admin/role-requests/${id}/reject`,
    { reviewNote },
  )
  return data
}

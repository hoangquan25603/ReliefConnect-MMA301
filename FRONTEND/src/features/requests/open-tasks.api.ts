// ============================================================
//  Open Tasks ("Bảng nhiệm vụ") — Volunteer tự nhận việc
//    GET  /api/relief-requests/open-tasks
//    POST /api/relief-requests/{id}/join
//
//  Chỉ hiện request đang Approved, đã có TargetHeadcount, còn slot trống
//  (ActiveAssignmentCount < TargetHeadcount). Volunteer.SelfClaim permission.
// ============================================================

import { http } from '@/lib/api/http'
import type { PagedResult } from '@/lib/api/paging'

export interface OpenTask {
  id: string
  title: string
  region: string
  emergencyLevel: number
  targetHeadcount: number
  activeAssignmentCount: number
  createdAt: string
}

/** GET /api/relief-requests/open-tasks — bảng nhiệm vụ còn slot trống */
export async function getOpenTasks(
  pageNumber = 1,
  pageSize = 50,
): Promise<PagedResult<OpenTask>> {
  const { data } = await http.get<PagedResult<OpenTask>>('/relief-requests/open-tasks', {
    params: { pageNumber, pageSize },
  })
  return data
}

export interface JoinOpenTaskResult {
  id: string
  isTeamLead: boolean
  message: string
}

/** POST /api/relief-requests/{id}/join — Volunteer tự nhận nhiệm vụ này, Accepted ngay */
export async function joinOpenTask(reliefRequestId: string): Promise<JoinOpenTaskResult> {
  const { data } = await http.post<JoinOpenTaskResult>(`/relief-requests/${reliefRequestId}/join`)
  return data
}

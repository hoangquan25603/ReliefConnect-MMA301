// ============================================================
//  Admin – Relief Requests API extensions
//  Các endpoint chỉ Admin mới gọi được:
//    GET /api/relief-requests/{id}/suggested-volunteers
// ============================================================

import { http } from '@/lib/api/http'

// ── Types ────────────────────────────────────────────────────

export interface SuggestedVolunteer {
  volunteerProfileId: string
  fullName: string
  /** Khoảng cách tính theo km từ điểm yêu cầu đến volunteer */
  distanceKm: number
  /** Số năm kinh nghiệm — tham khảo cho Admin khi chọn/bầu đội trưởng */
  experienceYears: number
  /** [M11] Chưa có mapping request→skill ở BE, luôn 0/rỗng đợt này */
  matchedSkillsCount: number
  matchedSkillNames: string[]
  /** Tham khảo cho Admin chọn tay — không dùng để sắp xếp */
  completedAssignmentsCount: number
}

export interface SuggestedVolunteersResponse {
  candidates: SuggestedVolunteer[]
  totalEligibleCount: number
}

// ── API calls ────────────────────────────────────────────────

/**
 * GET /api/relief-requests/{id}/suggested-volunteers
 * Admin only – chỉ hoạt động khi request đang ở trạng thái `Approved`.
 * Trả về danh sách volunteer đang rảnh (không dính assignment active) trong bán kính
 * `maxDistanceKm` (mặc định BE = 50km), kèm khoảng cách (km).
 *
 * `maxDistanceKm` truyền lớn (vd 100000) = coi như bỏ giới hạn khoảng cách — dùng cho
 * fallback "không ai lân cận rảnh → lấy tất cả người đang rảnh", tái dùng thẳng endpoint
 * này thay vì thêm API mới ở BE.
 */
export async function getSuggestedVolunteers(
  reliefRequestId: string,
  options?: { maxDistanceKm?: number; top?: number },
): Promise<SuggestedVolunteer[]> {
  const { data } = await http.get<SuggestedVolunteersResponse>(
    `/relief-requests/${reliefRequestId}/suggested-volunteers`,
    { params: { maxDistanceKm: options?.maxDistanceKm, top: options?.top } },
  )
  return Array.isArray(data?.candidates) ? data.candidates : []
}

/**
 * POST /api/assignments
 * Admin phân công thủ công một volunteer cho một relief request đang Approved.
 */
export interface CreateAssignmentPayload {
  reliefRequestId: string
  volunteerProfileId: string
  note?: string
}

export interface AssignmentResult {
  id: string
  message: string
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
): Promise<AssignmentResult> {
  const { data } = await http.post<AssignmentResult>('/assignments', payload)
  return data
}

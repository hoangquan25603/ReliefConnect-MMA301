// ============================================================
//  Admin – Volunteers API extensions
//  GET /api/admin/volunteers — Admin only, danh sách toàn bộ
//  hồ sơ Volunteer (không phân trang, BE trả mảng trần).
// ============================================================

import { http } from '@/lib/api/http'

export type VolunteerApprovalStatus = 'Pending' | 'Approved' | 'Rejected'

export interface VolunteerSummary {
  id: string
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  status: VolunteerApprovalStatus
  experienceYears: number
}

/** GET /api/admin/volunteers — Admin only */
export async function getAdminVolunteers(): Promise<VolunteerSummary[]> {
  const { data } = await http.get<VolunteerSummary[]>('/admin/volunteers')
  return Array.isArray(data) ? data : []
}

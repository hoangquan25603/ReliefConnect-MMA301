// ============================================================
//  Public API — /api/public (AllowAnonymous, không cần đăng nhập)
//  - GET  /public/highlights → getPublicHighlights
//  - POST /public/contact    → submitContactMessage
// ============================================================

import { http } from '@/lib/api/http'

export interface PublicUrgentRequest {
  region: string
  emergencyLevel: number
  needLabels: string[]
  relativeTime: string
}

export interface PublicMapPoint {
  type: 'Request' | 'Warehouse'
  latitude: number
  longitude: number
  status: string | null
  emergencyLevel: number | null
}

export interface PublicStats {
  approvedVolunteerCount: number
  completedRequestCount: number
  provincesCoveredCount: number
  completedAssignmentCount: number
}

export interface PublicHighlights {
  urgentRequests: PublicUrgentRequest[]
  mapPoints: PublicMapPoint[]
  stats: PublicStats
}

/** GET /api/public/highlights — dữ liệu công khai cho trang chủ (đã ẩn danh hoá) */
export async function getPublicHighlights(): Promise<PublicHighlights> {
  const { data } = await http.get<PublicHighlights>('/public/highlights')
  return data
}

export interface SubmitContactPayload {
  fullName: string
  email: string
  phoneNumber: string
  content: string
}

export interface SubmitContactResult {
  id: string
  message: string
}

/** POST /api/public/contact — gửi tin nhắn liên hệ, không cần đăng nhập */
export async function submitContactMessage(
  payload: SubmitContactPayload,
): Promise<SubmitContactResult> {
  const { data } = await http.post<SubmitContactResult>('/public/contact', payload)
  return data
}

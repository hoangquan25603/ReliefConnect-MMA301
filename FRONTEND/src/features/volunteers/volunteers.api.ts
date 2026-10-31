// ============================================================
//  Volunteers API — /api/volunteers
//  Tất cả real response đều bọc trong ApiResponse<T> → cần unwrap
// ============================================================

import { http } from '@/lib/api/http'
import type { ApiResponse } from '@/features/auth/auth.types'
import type {
  VolunteerProfile,
  VolunteerSkill,
  VolunteerProfilePayload,
  SkillItem,
  CreateVolunteerProfileResponse,
  UpdateVolunteerProfileResponse,
  AddVolunteerSkillsResponse,
  RemoveVolunteerSkillResponse,
  AddSkillsPayload,
  AdminVolunteerSummary,
  ApproveVolunteerResponse,
  RejectVolunteerResponse,
} from './volunteers.types'

// ── Helper: unwrap ApiResponse<T> (tolerant) ─────────────────
function unwrap<T>(data: ApiResponse<T> | T): T {
  if (
    data !== null &&
    typeof data === 'object' &&
    'isSuccess' in (data as object) &&
    'result' in (data as object)
  ) {
    const r = data as ApiResponse<T>
    if (!r.isSuccess || r.result === null || r.result === undefined) {
      const msg =
        r.errorMessages && r.errorMessages.length > 0
          ? r.errorMessages.join(' | ')
          : 'Đã có lỗi xảy ra'
      throw new Error(msg)
    }
    return r.result
  }
  return data as T
}

// ── Cache skills lấy từ /api/skills (public endpoint, không cần auth) ─────────────────
export let AVAILABLE_SKILLS: SkillItem[] = []


// ── Public: GET /api/skills (không cần auth) ─────────────────

/**
 * Lấy danh sách toàn bộ kỹ năng hệ thống.
 * Endpoint public — không cần token.
 * GET /api/skills
 */
export async function loadAvailableSkills(): Promise<SkillItem[]> {
  try {
    const { data } = await http.get<ApiResponse<SkillItem[]>>('/skills')
    const fetched = unwrap(data)
    if (fetched.length > 0) {
      AVAILABLE_SKILLS = fetched
    }
    return [...AVAILABLE_SKILLS]
  } catch {
    // Fallback về danh sách local nếu endpoint không phản hồi
    return [...AVAILABLE_SKILLS]
  }
}

// ── GET /api/volunteers/me ────────────────────────────────────

export function normalizeVolunteerSkills(rawSkills: any): VolunteerSkill[] {
  if (!Array.isArray(rawSkills)) return []
  return rawSkills.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: s, skillId: s, name: s }
    }
    if (s && typeof s === 'object') {
      return {
        id: String(s.id ?? s.skillId ?? `skill-${idx}`),
        skillId: String(s.skillId ?? s.id ?? `skill-${idx}`),
        name: String(s.name ?? s.id ?? s.skillId ?? ''),
      }
    }
    return { id: String(s), skillId: String(s), name: String(s) }
  })
}

/**
 * Lấy hồ sơ tình nguyện viên của user đang đăng nhập.
 * 🔒 Auth: RequesterOrVolunteer
 * Error 404: hồ sơ chưa được tạo
 */
export async function getVolunteerProfile(): Promise<VolunteerProfile> {
  const { data } = await http.get<ApiResponse<VolunteerProfile>>('/volunteers/me')
  const res = unwrap(data)
  if (res) {
    res.skills = normalizeVolunteerSkills(res.skills)
  }
  return res
}

// ── POST /api/volunteers/profile ─────────────────────────────

/**
 * Tạo hồ sơ tình nguyện viên mới.
 * 🔒 Auth: RequesterOrVolunteer
 * Body: { address, latitude, longitude, experienceYears, bio? }
 * Response: 201 Created — { id, message }
 * Error 400: hồ sơ đã tồn tại
 */
export async function createVolunteerProfile(
  payload: VolunteerProfilePayload,
): Promise<CreateVolunteerProfileResponse> {
  const { data } = await http.post<ApiResponse<CreateVolunteerProfileResponse>>(
    '/volunteers/profile',
    payload,
  )
  return unwrap(data)
}

// ── PUT /api/volunteers/profile ──────────────────────────────

/**
 * Cập nhật hồ sơ tình nguyện viên.
 * 🔒 Auth: RequesterOrVolunteer (chỉ chủ sở hữu)
 * Body: { address, latitude, longitude, experienceYears, bio? }
 * Response: { id, message }
 * Error 404: hồ sơ không tồn tại | 403: không phải chủ sở hữu
 */
export async function updateVolunteerProfile(
  payload: VolunteerProfilePayload,
): Promise<UpdateVolunteerProfileResponse> {
  const { data } = await http.put<ApiResponse<UpdateVolunteerProfileResponse>>(
    '/volunteers/profile',
    payload,
  )
  return unwrap(data)
}

// ── POST /api/volunteers/skills ──────────────────────────────

/**
 * Đăng ký thêm kỹ năng vào hồ sơ.
 * 🔒 Auth: RequesterOrVolunteer
 * Body: { skillIds: Guid[] }
 * Response: { addedCount, message }
 * Error 400: kỹ năng không hợp lệ hoặc đã có hết | 404: hồ sơ không tồn tại
 */
export async function registerSkills(
  skillIds: string[],
): Promise<AddVolunteerSkillsResponse> {
  const payload: AddSkillsPayload = { skillIds }
  const { data } = await http.post<ApiResponse<AddVolunteerSkillsResponse>>(
    '/volunteers/skills',
    payload,
  )
  return unwrap(data)
}

// ── DELETE /api/volunteers/skills/{skillId} ──────────────────

/**
 * Xóa một kỹ năng khỏi hồ sơ.
 * 🔒 Auth: RequesterOrVolunteer
 * {skillId} là GUID của VolunteerSkill (id trong skills[])
 * Response: { message }
 * Error 404: hồ sơ không tồn tại | kỹ năng không tìm thấy
 */
export async function deleteSkill(
  skillId: string,
): Promise<RemoveVolunteerSkillResponse> {
  const { data } = await http.delete<ApiResponse<RemoveVolunteerSkillResponse>>(
    `/volunteers/skills/${skillId}`,
  )
  return unwrap(data)
}

// ── ADMIN: GET /api/admin/volunteers ─────────────────────────
export async function getAdminVolunteers(): Promise<AdminVolunteerSummary[]> {
  const { data } = await http.get<ApiResponse<AdminVolunteerSummary[]>>('/admin/volunteers')
  return unwrap(data)
}

// ── ADMIN: GET /api/admin/volunteers/{id} ─────────────────────
export async function getAdminVolunteerById(id: string): Promise<VolunteerProfile> {
  const { data } = await http.get<ApiResponse<VolunteerProfile>>(`/admin/volunteers/${id}`)
  return unwrap(data)
}

// ── ADMIN: PUT /api/admin/volunteers/{id}/approve ─────────────
export async function approveVolunteer(id: string): Promise<ApproveVolunteerResponse> {
  const { data } = await http.put<ApiResponse<ApproveVolunteerResponse>>(`/admin/volunteers/${id}/approve`)
  return unwrap(data)
}

// ── ADMIN: PUT /api/admin/volunteers/{id}/reject ──────────────
export async function rejectVolunteer(id: string): Promise<RejectVolunteerResponse> {
  const { data } = await http.put<ApiResponse<RejectVolunteerResponse>>(`/admin/volunteers/${id}/reject`)
  return unwrap(data)
}

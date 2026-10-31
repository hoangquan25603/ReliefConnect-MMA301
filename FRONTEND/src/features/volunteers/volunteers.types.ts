// ============================================================
//  Volunteers – TypeScript interfaces
//  Sync với BE spec thực tế (kiểm chứng 2026-07-16)
//  Mọi response đều bọc trong ApiResponse<T>
// ============================================================

import type { ApiResponse } from '@/features/auth/auth.types'
export type { ApiResponse }

// ── Volunteer Status ──────────────────────────────────────────
export type VolunteerStatus = 'Pending' | 'Approved' | 'Rejected'

// ── Skill item trong profile ──────────────────────────────────
/**
 * BE trả Skills[] là array object {id, name}, không phải string[].
 */
export interface VolunteerSkill {
  id:      string   // GUID — join-table record ID, dùng để DELETE /volunteers/skills/{id}
  skillId: string   // GUID — catalog skill ID, dùng để lọc trùng & POST /volunteers/skills
  name:    string
}

// ── Public Skill (từ GET /api/skills) ────────────────────────
export interface SkillItem {
  id:          string   // GUID
  name:        string
  description?: string | null
}

// ── GET /api/volunteers/me → result ──────────────────────────
/**
 * VolunteerProfileResponse — kết quả bên trong ApiResponse.result
 * Field names khớp BE (PascalCase được .NET serialize thành camelCase)
 */
export interface VolunteerProfile {
  id:              string           // GUID — volunteer profile ID
  userId:          string           // GUID — user account ID
  fullName:        string
  email:           string
  phoneNumber:     string
  address:         string
  latitude:        number
  longitude:       number
  experienceYears: number
  bio:             string | null    // nullable
  status:          VolunteerStatus  // "Pending" | "Approved" | "Rejected"
  skills:          VolunteerSkill[] // array {id, name} — không phải string[]
}

// ── POST /api/volunteers/profile → result (201 Created) ──────
export interface CreateVolunteerProfileResponse {
  id:      string   // GUID của profile vừa tạo
  message: string
}

// ── PUT /api/volunteers/profile → result ─────────────────────
export interface UpdateVolunteerProfileResponse {
  id:      string
  message: string
}

// ── POST /api/volunteers/skills → result ─────────────────────
export interface AddVolunteerSkillsResponse {
  addedCount: number
  message:    string
}

// ── DELETE /api/volunteers/skills/{skillId} → result ─────────
export interface RemoveVolunteerSkillResponse {
  message: string
}

// ── Request payloads ──────────────────────────────────────────

/**
 * POST /api/volunteers/profile & PUT /api/volunteers/profile
 * Body: Address, Latitude, Longitude, ExperienceYears, Bio?
 * ⚠️ skillIds KHÔNG có trong body create/update — dùng POST /volunteers/skills riêng
 */
export interface VolunteerProfilePayload {
  address:         string
  latitude:        number
  longitude:       number
  experienceYears: number
  bio?:            string | null
}

/**
 * POST /api/volunteers/skills
 * Body: { skillIds: Guid[] }
 */
export interface AddSkillsPayload {
  skillIds: string[]
}

// ── Admin Volunteer Summary ──────────────────────────────
export interface AdminVolunteerSummary {
  id:              string   // GUID — volunteer profile ID
  userId:          string   // GUID — user account ID
  fullName:        string
  email:           string
  phoneNumber:     string
  status:          VolunteerStatus  // "Pending" | "Approved" | "Rejected"
  experienceYears: number
}

export interface ApproveVolunteerResponse {
  message: string
}

export interface RejectVolunteerResponse {
  message: string
}


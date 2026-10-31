// ============================================================
//  Skills API — /api/skills
//  GET: public (không cần đăng nhập). POST/PUT/DELETE: AdminOnly.
// ============================================================

import { http } from '@/lib/api/http'
import type { Skill, SkillPayload, SkillMutationResult } from './skills.types'

/** GET /api/skills — danh sách toàn bộ kỹ năng (đã lọc kỹ năng xoá mềm) */
export async function getSkills(): Promise<Skill[]> {
  const { data } = await http.get<Skill[]>('/skills')
  return data
}

/** POST /api/skills — tạo kỹ năng mới (Admin) */
export async function createSkill(payload: SkillPayload): Promise<SkillMutationResult> {
  const { data } = await http.post<SkillMutationResult>('/skills', payload)
  return data
}

/** PUT /api/skills/{id} — cập nhật tên/mô tả kỹ năng (Admin) */
export async function updateSkill(id: string, payload: SkillPayload): Promise<SkillMutationResult> {
  const { data } = await http.put<SkillMutationResult>(`/skills/${id}`, payload)
  return data
}

/** DELETE /api/skills/{id} — xoá mềm kỹ năng khỏi danh mục (Admin) */
export async function deleteSkill(id: string): Promise<SkillMutationResult> {
  const { data } = await http.delete<SkillMutationResult>(`/skills/${id}`)
  return data
}

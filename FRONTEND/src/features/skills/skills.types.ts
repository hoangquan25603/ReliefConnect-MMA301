// ============================================================
//  Skills – TypeScript interfaces
//  Sync với BE thực tế: SkillsController (api/skills)
// ============================================================

export interface Skill {
  id: string          // GUID
  name: string
  description: string
}

/** Body cho POST/PUT /api/skills */
export interface SkillPayload {
  name: string
  description: string
}

/** result của POST/PUT/DELETE /api/skills — BE trả { id, message } */
export interface SkillMutationResult {
  id: string
  message: string
}

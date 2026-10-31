// ============================================================
//  Roles API – GET /api/admin/roles
// ============================================================

import { http } from '@/lib/api/http'

export interface RoleResponse {
  id: string
  name: string       // e.g. "Admin", "Volunteer", "Requester", "Coordinator", "Organization"
  description?: string
}

export async function getRoles(): Promise<RoleResponse[]> {
  const { data } = await http.get<RoleResponse[]>('/admin/roles')
  return data
}

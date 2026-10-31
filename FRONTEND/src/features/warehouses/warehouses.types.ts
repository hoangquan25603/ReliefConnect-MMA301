// ============================================================
//  Warehouses – Types
//  Sinh từ docs/swagger.json (schema thật của BE, 2026-07-14)
// ============================================================

/** Schema: WarehouseResponse */
export interface WarehouseResponse {
  id: string                 // GUID
  name: string | null
  address: string | null
  latitude: number
  longitude: number
  contactPhone: string | null
  isActive: boolean
}

/** Schema: CreateWarehouseCommand — body POST /warehouses */
export interface CreateWarehousePayload {
  name: string
  address: string
  latitude: number
  longitude: number
  contactPhone: string
}

/** Schema: UpdateWarehouseRequest — body PUT /warehouses/{id} */
export interface UpdateWarehousePayload extends CreateWarehousePayload {
  isActive: boolean
}

/** Schema: Create/Update/DeleteWarehouseResponse — result các action ghi */
export interface WarehouseActionResult {
  id: string
  message: string | null
}
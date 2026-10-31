// ============================================================
//  Warehouses API — /api/warehouses (sinh từ swagger.json thật)
//
//  Quyền (API Reference mục 4):
//  - GET list / GET by id : mọi role đã đăng nhập
//  - POST / PUT / DELETE  : Admin + Coordinator (đổi tên từ WarehouseManager,
//    migration BE 20260713075737 — chức năng quản lý kho không đổi)
//
//  DELETE = ngưng hoạt động (set IsActive=false), không xoá cứng.
//  Envelope ApiResponse do http.ts tự bóc; lỗi (400/403/404...)
//  interceptor tự ném ApiError với message từ errorMessages.
// ============================================================

import { http } from '@/lib/api/http'
import type { PagedResult } from '@/lib/api/paging'
import type {
  WarehouseResponse,
  CreateWarehousePayload,
  UpdateWarehousePayload,
  WarehouseActionResult,
} from './warehouses.types'

/** GET /api/warehouses — danh sách kho (PHÂN TRANG, trả nguyên khung để UI làm pagination) */
export async function getWarehouses(
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<WarehouseResponse>> {
  const { data } = await http.get<PagedResult<WarehouseResponse>>('/warehouses', {
    params: { PageNumber: pageNumber, PageSize: pageSize },
  })
  return data
}

/** Tiện ích: lấy hết kho cho dropdown chọn kho (không cần pagination UI) */
export async function getAllWarehouses(): Promise<WarehouseResponse[]> {
  const first = await getWarehouses(1, 100)
  const items = [...(first.items ?? [])]
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await getWarehouses(page, 100)
    items.push(...(next.items ?? []))
  }
  return items
}

/** GET /api/warehouses/{id} — chi tiết 1 kho */
export async function getWarehouseById(id: string): Promise<WarehouseResponse> {
  const { data } = await http.get<WarehouseResponse>(`/warehouses/${id}`)
  return data
}

/** POST /api/warehouses — tạo kho mới (Admin + Coordinator) */
export async function createWarehouse(
  payload: CreateWarehousePayload,
): Promise<WarehouseActionResult> {
  const { data } = await http.post<WarehouseActionResult>('/warehouses', payload)
  return data
}

/** PUT /api/warehouses/{id} — cập nhật kho (Admin + Coordinator) */
export async function updateWarehouse(
  id: string,
  payload: UpdateWarehousePayload,
): Promise<WarehouseActionResult> {
  const { data } = await http.put<WarehouseActionResult>(`/warehouses/${id}`, payload)
  return data
}

/** DELETE /api/warehouses/{id} — ngưng hoạt động kho (Admin + Coordinator) */
export async function deactivateWarehouse(id: string): Promise<WarehouseActionResult> {
  const { data } = await http.delete<WarehouseActionResult>(`/warehouses/${id}`)
  return data
}

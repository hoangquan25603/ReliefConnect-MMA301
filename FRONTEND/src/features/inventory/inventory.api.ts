// ============================================================
//  Inventory API — /api/inventory-items (sinh từ swagger.json thật)
//
//  Quyền (API Reference mục 4):
//  - GET list / GET by id / GET transactions : mọi role đã đăng nhập
//  - POST / PUT / stock-in / stock-out       : Admin + Coordinator (đổi tên
//    từ WarehouseManager, migration BE 20260713075737 — chức năng không đổi)
//
//  ⚠️ 409 Conflict: BE dùng RowVersion chống 2 người cùng sửa kho.
//  Khi dính 409, interceptor ném ApiError với message "vừa được người
//  khác cập nhật" → UI nên reload data rồi cho user thao tác lại.
//  Stock-out vượt tồn → 400 kèm message, hiện thẳng lên form.
// ============================================================

import { http } from '@/lib/api/http'
import type { PagedResult } from '@/lib/api/paging'
import type {
  InventoryItemResponse,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
  StockMovePayload,
  StockMoveResult,
  InventoryActionResult,
  InventoryTransaction,
  InventorySummary,
  StockTransferPayload,
  StockTransferResult,
} from './inventory.types'

/** GET /api/inventory-items — danh sách vật tư (PHÂN TRANG, lọc theo kho) */
export async function getInventoryItems(options?: {
  warehouseId?: string
  pageNumber?: number
  pageSize?: number
  search?: string
  lowStockOnly?: boolean
}): Promise<PagedResult<InventoryItemResponse>> {
  const { data } = await http.get<PagedResult<InventoryItemResponse>>('/inventory-items', {
    params: {
      WarehouseId: options?.warehouseId,
      PageNumber: options?.pageNumber ?? 1,
      PageSize: options?.pageSize ?? 20,
      Search: options?.search,
      LowStockOnly: options?.lowStockOnly,
    },
  })
  return data
}

export async function getInventorySummary(warehouseId?: string): Promise<InventorySummary> {
  const { data } = await http.get<InventorySummary>('/inventory-items/summary', {
    params: { WarehouseId: warehouseId },
  })
  return data
}

export async function transferStock(id: string, payload: StockTransferPayload): Promise<StockTransferResult> {
  const { data } = await http.post<StockTransferResult>(`/inventory-items/${id}/transfer`, payload)
  return data
}

/** GET /api/inventory-items/{id} — chi tiết 1 vật tư */
export async function getInventoryItemById(id: string): Promise<InventoryItemResponse> {
  const { data } = await http.get<InventoryItemResponse>(`/inventory-items/${id}`)
  return data
}

/** POST /api/inventory-items — tạo vật tư mới, tồn khởi tạo = 0 */
export async function createInventoryItem(
  payload: CreateInventoryItemPayload,
): Promise<InventoryActionResult> {
  const { data } = await http.post<InventoryActionResult>('/inventory-items', payload)
  return data
}

/** PUT /api/inventory-items/{id} — sửa thông tin mô tả (không đụng tồn) */
export async function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemPayload,
): Promise<InventoryActionResult> {
  const { data } = await http.put<InventoryActionResult>(`/inventory-items/${id}`, payload)
  return data
}

/** POST /api/inventory-items/{id}/stock-in — nhập kho, cộng tồn */
export async function stockIn(
  id: string,
  payload: StockMovePayload,
): Promise<StockMoveResult> {
  const { data } = await http.post<StockMoveResult>(`/inventory-items/${id}/stock-in`, payload)
  return data
}

/** POST /api/inventory-items/{id}/stock-out — xuất kho, trừ tồn (vượt tồn → 400) */
export async function stockOut(
  id: string,
  payload: StockMovePayload,
): Promise<StockMoveResult> {
  const { data } = await http.post<StockMoveResult>(`/inventory-items/${id}/stock-out`, payload)
  return data
}

/** GET /api/inventory-items/{id}/transactions — lịch sử nhập/xuất (PHÂN TRANG) */
export async function getInventoryTransactions(
  id: string,
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<InventoryTransaction>> {
  const { data } = await http.get<PagedResult<InventoryTransaction>>(
    `/inventory-items/${id}/transactions`,
    { params: { PageNumber: pageNumber, PageSize: pageSize } },
  )
  return data
}

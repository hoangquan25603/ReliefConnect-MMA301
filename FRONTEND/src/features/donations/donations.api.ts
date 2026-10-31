// ============================================================
//  Donations API — /api/donations
//
//  Quyền (docs/API-Reference-FE.md BE):
//  - POST /donations, GET /donations/my       : Organization
//  - GET /donations/pending, approve, reject  : Admin + Coordinator
//
//  Approve yêu cầu map ĐỦ từng DonationItem: hoặc trỏ vào 1 InventoryItem có
//  sẵn (createNewItem=false), hoặc tạo InventoryItem mới trong 1 Warehouse
//  (createNewItem=true) — donation duyệt = StockIn vào kho được chọn.
// ============================================================

import { http } from '@/lib/api/http'
import type { PagedResult } from '@/lib/api/paging'

export type DonationStatus = 'Pending' | 'Approved' | 'Rejected'

export interface DonationItemResponse {
  id: string
  itemName: string
  unit: string
  quantity: number
  inventoryItemId: string | null
}

export interface DonationResponse {
  id: string
  donorId: string
  donorName: string
  note: string
  status: DonationStatus
  rejectReason: string | null
  createdAt: string
  items: DonationItemResponse[]
}

export interface CreateDonationItemPayload {
  itemName: string
  unit: string
  quantity: number
}

export interface CreateDonationPayload {
  items: CreateDonationItemPayload[]
  note?: string
}

export interface DonationActionResult {
  id: string
  message: string
}

/** POST /api/donations — Organization tạo donation mới */
export async function createDonation(
  payload: CreateDonationPayload,
): Promise<DonationActionResult> {
  const { data } = await http.post<DonationActionResult>('/donations', payload)
  return data
}

/** GET /api/donations/my — Organization xem donation của chính mình (PHÂN TRANG) */
export async function getMyDonations(
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<DonationResponse>> {
  const { data } = await http.get<PagedResult<DonationResponse>>('/donations/my', {
    params: { PageNumber: pageNumber, PageSize: pageSize },
  })
  return data
}

/** GET /api/donations/pending — Admin/Coordinator xem hàng chờ duyệt (PHÂN TRANG) */
export async function getPendingDonations(
  pageNumber = 1,
  pageSize = 20,
): Promise<PagedResult<DonationResponse>> {
  const { data } = await http.get<PagedResult<DonationResponse>>('/donations/pending', {
    params: { PageNumber: pageNumber, PageSize: pageSize },
  })
  return data
}

export interface DonationItemMapping {
  donationItemId: string
  createNewItem: boolean
  inventoryItemId?: string
  warehouseId?: string
  newItemMinimumQuantity?: number
}

/** PUT /api/donations/{id}/approve — map đủ từng item rồi duyệt (Admin/Coordinator) */
export async function approveDonation(
  id: string,
  itemMappings: DonationItemMapping[],
): Promise<DonationActionResult> {
  const { data } = await http.put<DonationActionResult>(`/donations/${id}/approve`, {
    itemMappings,
  })
  return data
}

/** PUT /api/donations/{id}/reject — từ chối kèm lý do (Admin/Coordinator) */
export async function rejectDonation(
  id: string,
  reason: string,
): Promise<DonationActionResult> {
  const { data } = await http.put<DonationActionResult>(`/donations/${id}/reject`, { reason })
  return data
}

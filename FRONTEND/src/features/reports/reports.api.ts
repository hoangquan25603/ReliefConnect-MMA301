// ============================================================
//  Reports API — GET /api/reports/...
//  Admin / User authenticated exports to Excel (Blob response)
// ============================================================

import { http } from '@/lib/api/http'

/** Helper để kích hoạt tải file từ Blob */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/** 
 * GET /api/reports/relief-requests/excel 
 * Xuất danh sách yêu cầu cứu trợ ra file Excel
 */
export async function exportReliefRequestsExcel(params?: {
  status?: string
  search?: string
}): Promise<Blob> {
  const response = await http.get('/reports/relief-requests/excel', {
    params,
    responseType: 'blob',
  })
  return response.data
}

/** 
 * GET /api/reports/assignments/excel 
 * Xuất danh sách phân công tình nguyện viên ra file Excel
 */
export async function exportAssignmentsExcel(params?: {
  status?: string
  volunteerId?: string
}): Promise<Blob> {
  const response = await http.get('/reports/assignments/excel', {
    params,
    responseType: 'blob',
  })
  return response.data
}

/** 
 * GET /api/reports/inventory/excel 
 * Xuất dữ liệu tồn kho, vật tư ra file Excel
 */
export async function exportInventoryExcel(params?: {
  warehouseId?: string
  search?: string
}): Promise<Blob> {
  const response = await http.get('/reports/inventory/excel', {
    params,
    responseType: 'blob',
  })
  return response.data
}

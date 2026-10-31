// ============================================================
//  Severity Guideline — GET /api/inventory-items/severity-guideline
//  Bảng tĩnh gợi ý định lượng vật tư theo mức độ khẩn cấp, KHÔNG lưu DB,
//  KHÔNG liên kết InventoryItem cụ thể — chỉ tham khảo khi Coordinator xuất kho.
// ============================================================

import { http } from '@/lib/api/http'

export interface SeverityGuidelineItem {
  itemName: string
  unit: string
  /** null = không có định lượng chuẩn ở mức này, để trống/tuỳ nhập */
  suggestedQuantity: number | null
}

export interface SeverityGuideline {
  emergencyLevel: number
  emergencyLevelName: string
  items: SeverityGuidelineItem[]
}

/** GET /api/inventory-items/severity-guideline?severity=1|2|3 */
export async function getSeverityGuideline(severity: 1 | 2 | 3): Promise<SeverityGuideline> {
  const { data } = await http.get<SeverityGuideline>('/inventory-items/severity-guideline', {
    params: { severity },
  })
  return data
}

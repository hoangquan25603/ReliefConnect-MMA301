// ============================================================
//  Relief Request – Types (theo API Contract mục 4 & 7)
// ============================================================

export type ReliefRequestStatus =
  | 'Pending' | 'Approved' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled'

export interface CreateReliefRequestPayload {
  title: string
  description: string
  address: string
  region?: string
  latitude: number
  longitude: number
  emergencyLevel: 1 | 2 | 3 // Nhẹ, Quy mô lớn, Nghiêm trọng (BE: RemapEmergencyLevelTo3Tiers)
  affectedPeople: number
  needFood: boolean
  needWater: boolean
  needMedicine: boolean
  needBlanket: boolean
  needShelter: boolean
  contactPhone: string
  /** [Giới hạn tồn kho] Số lượng cụ thể cho từng nhu cầu — optional, chỉ có ý nghĩa khi need* = true */
  foodQuantity?: number | null
  waterQuantity?: number | null
  medicineQuantity?: number | null
  blanketQuantity?: number | null
  shelterQuantity?: number | null
}

export interface ReliefRequestResponse extends CreateReliefRequestPayload {
  id: string
  status: ReliefRequestStatus
  createdAt: string
  /** Số người mục tiêu Admin nhập tay khi duyệt/phân công — null nếu chưa nhập */
  targetHeadcount: number | null
  /** Khoảng gợi ý tính runtime theo emergencyLevel — KHÔNG lưu DB, chỉ tham khảo */
  suggestedHeadcountMin: number | null
  suggestedHeadcountMax: number | null
  inventoryIssues?: InventoryIssueResult[]
}

/** [Giới hạn tồn kho] Kết quả cấp phát tồn kho thực tế theo từng nhóm — trả về sau khi duyệt (Approved) */
export interface InventoryIssueResult {
  category: string
  requestedQuantity: number
  issuedQuantity: number
  isFullyIssued: boolean
  requiresManualAllocation?: boolean
  reason?: string
}

export interface UpdateReliefRequestStatusResponse {
  id: string
  status: ReliefRequestStatus
  message: string
  inventoryIssues: InventoryIssueResult[]
}

// ── UI helper: nhóm status thành màu riêng rẽ ──
export type StatusGroup = 'pending' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export const STATUS_GROUP_MAP: Record<ReliefRequestStatus, StatusGroup> = {
  Pending:    'pending',
  Approved:   'approved',
  Assigned:   'assigned',
  InProgress: 'in_progress',
  Completed:  'completed',
  Cancelled:  'cancelled',
}

export const STATUS_LABEL_VI: Record<ReliefRequestStatus, string> = {
  Pending:    'Đang xử lý',
  Approved:   'Đang xử lý',
  Assigned:   'Đã tiếp nhận',
  InProgress: 'Đã tiếp nhận',
  Completed:  'Đã hoàn thành',
  Cancelled:  'Đã hủy',
}

// ── Màu theo nhóm status (single source of truth cho MỌI view) ──
export interface StatusColor {
  bg: string     // nền badge/tag (nhạt)
  color: string  // chữ badge/tag (đậm)
  dot: string    // chấm tròn trạng thái
}

export const STATUS_GROUP_COLOR: Record<StatusGroup, StatusColor> = {
  pending:     { bg: '#fef3c7', color: '#b45309', dot: '#f59e0b' }, // vàng
  approved:    { bg: '#dcfce7', color: '#15803d', dot: '#22c55e' }, // xanh ngọc
  assigned:    { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' }, // xanh dương
  in_progress: { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' }, // tím
  completed:   { bg: '#d1fae5', color: '#065f46', dot: '#10b981' }, // xanh lá
  cancelled:   { bg: '#f3f4f6', color: '#4b5563', dot: '#9ca3af' }, // xám
}

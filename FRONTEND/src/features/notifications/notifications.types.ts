// ============================================================
//  Notifications – Types
//  Khớp field thật của BE (API Reference mục 5.5):
//  id, title, content, type, isRead, readAt, createdAt
// ============================================================

export interface NotificationItem {
  id: string
  title: string
  content: string          // BE dùng "content" (không phải "message")
  type: string             // enum của BE — giá trị chính xác xem docs/swagger.json
  isRead: boolean
  readAt: string | null
  createdAt: string        // ISO UTC
}

// ── UI helper: quy type của BE về 3 nhóm icon của FE ────────
export type NotificationUiKind = 'system' | 'success' | 'alert'

/**
 * BE có thể trả nhiều loại type (AssignmentCreated, RequestCancelled...).
 * Map mềm theo từ khóa để icon không vỡ khi BE thêm type mới.
 */
export function notificationUiKind(type: string | null | undefined): NotificationUiKind {
  const t = (type ?? '').toLowerCase()
  if (/(cancel|reject|alert|warn|error|urgent|fail)/.test(t)) return 'alert'
  if (/(success|complete|approve|assign|done|accept)/.test(t)) return 'success'
  return 'system'
}
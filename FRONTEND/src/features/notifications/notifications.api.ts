// ============================================================
//  Notifications API — /api/notifications (ĐÃ LIVE trên Production)
//
//  Endpoints (API Reference mục 4):
//  - GET /notifications               → getNotifications (phân trang)
//  - GET /notifications/unread-count  → getUnreadCount
//  - PUT /notifications/{id}/read     → markNotificationRead
//  - PUT /notifications/read-all      → markAllNotificationsRead
// ============================================================

import { http } from '@/lib/api/http'
import { unwrapItems, type PagedResult } from '@/lib/api/paging'
import type { NotificationItem } from './notifications.types'

// ── List ────────────────────────────────────────────────────
/**
 * GET /api/notifications — Thông báo của user hiện tại (PHÂN TRANG).
 * result thật: { items, pageNumber, pageSize, totalCount, totalPages }.
 */
export async function getNotifications(
  pageNumber = 1,
  pageSize = 50,
): Promise<NotificationItem[]> {
  const { data } = await http.get<PagedResult<NotificationItem> | NotificationItem[]>(
      '/notifications',
      { params: { pageNumber, pageSize } },
    )
  const notifications = unwrapItems(data)
  if (!Array.isArray(data) && pageNumber === 1) {
    for (let page = 2; page <= data.totalPages; page++) {
      const next = await http.get<PagedResult<NotificationItem> | NotificationItem[]>('/notifications', { params: { pageNumber: page, pageSize } })
      notifications.push(...unwrapItems(next.data))
    }
  }
  return notifications
}

// ── Unread count ────────────────────────────────────────────
/** GET /api/notifications/unread-count — Số thông báo chưa đọc (cho badge chuông) */
export async function getUnreadCount(): Promise<number> {
  const { data } = await http.get<number | { count: number }>('/notifications/unread-count')
  return typeof data === 'number' ? data : (data?.count ?? 0)
}

// ── Mark all as read ────────────────────────────────────────
/** PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc */
export async function markAllNotificationsRead(): Promise<void> {
  await http.put('/notifications/read-all')
}

// ── Mark one as read ────────────────────────────────────────
/** PUT /api/notifications/{id}/read — Đánh dấu 1 thông báo đã đọc */
export async function markNotificationRead(id: string): Promise<void> {
  await http.put(`/notifications/${id}/read`)
}

// ============================================================
//  Relief Requests – UI helpers
//  Gom các hàm format/màu sắc ra khỏi view (theo yêu cầu tách
//  logic TS khỏi .vue). Mọi view dùng chung file này để đồng bộ.
// ============================================================

import {
  STATUS_GROUP_MAP,
  STATUS_GROUP_COLOR,
  type ReliefRequestStatus,
  type ReliefRequestResponse,
  type StatusGroup,
} from './requests.types'

/** Lấy nhóm màu từ status gốc của BE */
export function statusGroup(status: ReliefRequestStatus): StatusGroup {
  return STATUS_GROUP_MAP[status]
}

/** Style inline cho badge "Đang xử lý / Đã tiếp nhận / Hoàn thành" */
export function badgeStyle(status: ReliefRequestStatus): Record<string, string> {
  const c = STATUS_GROUP_COLOR[statusGroup(status)]
  return { background: c.bg, color: c.color }
}

/** Style inline cho tag nhỏ (dashboard) */
export function tagStyle(status: ReliefRequestStatus): Record<string, string> {
  const c = STATUS_GROUP_COLOR[statusGroup(status)]
  return { background: c.bg, color: c.color }
}

/** Style inline cho chấm tròn trạng thái (dashboard) */
export function dotStyle(status: ReliefRequestStatus): Record<string, string> {
  return { background: STATUS_GROUP_COLOR[statusGroup(status)].dot }
}

/** "11/07/2026 - 10:25" theo locale VN */
export function formatDateTimeVI(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('vi-VN') +
    ' - ' +
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  )
}

// ── Nhóm hiển thị rút gọn cho Requester (3 tab lọc) ──────────
// StatusGroup (requests.types.ts) giờ 1:1 theo từng status kỹ thuật của
// BE — UI Requester cần nhóm gộp riêng để không dội 6 trạng thái lên
// người dùng cuối, nên định nghĩa nhóm hiển thị này ở đây (dùng chung).
export type RequesterFilterGroup = 'processing' | 'received' | 'completed'

export const REQUESTER_FILTER_GROUPS: Record<RequesterFilterGroup, ReliefRequestStatus[]> = {
  processing: ['Pending', 'Approved'],
  received: ['Assigned', 'InProgress'],
  completed: ['Completed'],
}

export function matchesRequesterFilterGroup(
  status: ReliefRequestStatus,
  group: RequesterFilterGroup,
): boolean {
  return REQUESTER_FILTER_GROUPS[group].includes(status)
}

/** Tóm tắt các nhu cầu đã tick: "Lương thực, Nước sạch" */
export function needsSummary(r: ReliefRequestResponse): string {
  const list: string[] = []
  if (r.needFood) list.push('Lương thực')
  if (r.needWater) list.push('Nước sạch')
  if (r.needMedicine) list.push('Thuốc men')
  if (r.needBlanket) list.push('Chăn màn')
  if (r.needShelter) list.push('Nơi trú ẩn')
  return list.length ? list.join(', ') : 'Không có'
}
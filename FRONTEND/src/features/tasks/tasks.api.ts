// ============================================================
//  Tasks API – các hàm gọi API cho tính năng "Nhiệm vụ của tôi"
//  Endpoint chính: GET /volunteer/tasks
// ============================================================

import { http } from '@/lib/api/http'
import type { RawTask, TaskItem, TaskStatus } from './tasks.types'

// ── Helpers chuẩn hoá dữ liệu ────────────────────────────────

function normalizeStatus(rawStatus?: string): TaskStatus {
  const status = (rawStatus ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')

  if (['done', 'completed', 'complete', 'finished', 'finish', 'success'].includes(status))
    return 'completed'
  if (['inprogress', 'ongoing', 'active', 'in_progress', 'processing', 'working', 'ontheway', 'on_the_way'].includes(status))
    return 'ongoing'
  return 'upcoming'
}

/** Định dạng giờ:phút — nhận cả chuỗi "HH:mm" thuần lẫn ISO datetime (VD: assignedAt) */
function formatTime(value?: string): string {
  if (!value) return 'Chưa cập nhật'
  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }
  return String(value)
}

function statusLabel(status: TaskStatus): string {
  if (status === 'ongoing') return 'Đang thực hiện'
  if (status === 'completed') return 'Đã hoàn thành'
  return 'Sắp diễn ra'
}

export function normalizeTask(raw: RawTask, index: number): TaskItem {
  const title = String(raw.title ?? raw.name ?? raw.taskName ?? raw.reliefRequestTitle ?? `Nhiệm vụ ${index + 1}`)
  const address = String(
    raw.address ?? raw.location ?? raw.locationName ?? 'Địa điểm chưa cập nhật',
  )
  const rawStatusStr = String(raw.status ?? raw.state ?? raw.taskStatus ?? '')
  const resolvedStatus = normalizeStatus(rawStatusStr)
  // assignedAt = thời điểm admin duyệt đơn cứu trợ & phân công nhiệm vụ này —
  // mốc cố định, không đổi theo tiến độ volunteer cập nhật sau đó.
  const dateValue = raw.date ?? raw.startDate ?? raw.scheduleDate ?? raw.start_at ?? raw.assignedAt
  const timeValue =
    raw.time ?? raw.startTime ?? raw.endTime ?? raw.timeRange ?? raw.slot ?? raw.assignedAt
  const progress = Number(raw.progress ?? raw.percentage ?? raw.completedPercent ?? 0)

  const lat = Number(raw.latitude)
  const lng = Number(raw.longitude)
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)

  return {
    id: String(raw.id ?? index + 1),
    assignmentId: String(raw.id ?? ''),
    reliefRequestId: String(raw.reliefRequestId ?? ''),
    title,
    address,
    region: String(raw.region ?? ''),
    latitude: hasCoords ? lat : null,
    longitude: hasCoords ? lng : null,
    date: dateValue
      ? new Date(String(dateValue)).toLocaleDateString('vi-VN')
      : 'Chưa cập nhật',
    time: formatTime(timeValue),
    progress: Number.isFinite(progress) ? progress : 0,
    status: resolvedStatus,
    rawStatus: rawStatusStr,
    statusLabel: statusLabel(resolvedStatus),
    note: String(raw.note ?? raw.description ?? raw.summary ?? 'Chưa có ghi chú'),
    affectedPeople: raw.affectedPeople != null ? Number(raw.affectedPeople) : null,
    emergencyLevel: raw.emergencyLevel != null ? Number(raw.emergencyLevel) : null,
    contactPhone: String(raw.contactPhone ?? ''),
    description: String(raw.description ?? raw.summary ?? raw.note ?? ''),
    isTeamLead: Boolean(raw.isTeamLead),
  }
}


function extractList(payload: unknown): RawTask[] {
  if (Array.isArray(payload)) return payload as RawTask[]
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    for (const key of ['items', 'data', 'tasks', 'result']) {
      if (Array.isArray(data[key])) return data[key] as RawTask[]
    }
  }
  return []
}

// ── API functions ─────────────────────────────────────────────

/**
 * Lấy danh sách nhiệm vụ (assignments) của tình nguyện viên đang đăng nhập.
 * Endpoint: GET /api/assignments
 */
export async function getMyTasks(): Promise<TaskItem[]> {
  const { data } = await http.get<unknown>('/assignments')
  return extractList(data).map((item, i) => normalizeTask(item, i))
}

/**
 * Lấy nhiệm vụ theo trạng thái.
 * Endpoint: GET /api/assignments
 */
export async function getMyTasksByStatus(status: TaskStatus): Promise<TaskItem[]> {
  const { data } = await http.get<unknown>('/assignments', { params: { status } })
  return extractList(data).map((item, i) => normalizeTask(item, i))
}

/**
 * Lấy chi tiết một nhiệm vụ.
 * Endpoint: GET /api/assignments/:id
 */
export async function getTaskById(id: string | number): Promise<TaskItem> {
  const { data } = await http.get<RawTask>(`/assignments/${id}`)
  return normalizeTask(data, 0)
}

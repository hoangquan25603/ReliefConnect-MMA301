// ============================================================
//  Tasks – TypeScript interfaces
// ============================================================

export type TaskStatus = 'ongoing' | 'upcoming' | 'completed'

export interface TaskItem {
  id: number | string
  /** UUID string thật từ BE — dùng cho API /assignments/:assignmentId/status */
  assignmentId: string
  /** UUID của ReliefRequest liên quan */
  reliefRequestId: string
  title: string
  address: string
  region: string
  /** Toạ độ ReliefRequest liên quan — null nếu BE chưa có/không hợp lệ (0,0) */
  latitude: number | null
  longitude: number | null
  date: string
  time: string
  progress: number
  status: TaskStatus
  /** Trạng thái gốc từ BE (Assignment status: Assigned/Accepted/OnTheWay/Completed/Cancelled) */
  rawStatus: string
  statusLabel: string
  note: string
  affectedPeople: number | null
  emergencyLevel: number | null
  contactPhone: string
  description: string
  isTeamLead: boolean
}

/** Raw shape trả về từ API (có thể thay đổi tuỳ backend) */
export interface RawTask {
  id?: number | string
  title?: string
  name?: string
  taskName?: string
  reliefRequestId?: string
  reliefRequestTitle?: string
  /** BE thật (AssignmentResponse) trả field này — giữ location/locationName làm fallback */
  address?: string
  region?: string
  location?: string
  locationName?: string
  latitude?: number
  longitude?: number
  /** BE thật (AssignmentResponse) trả các field này — các mốc thời gian theo vòng đời assignment */
  assignedAt?: string
  acceptedAt?: string
  completedAt?: string
  date?: string
  startDate?: string
  scheduleDate?: string
  startTime?: string
  start_at?: string
  time?: string
  endTime?: string
  timeRange?: string
  slot?: string
  progress?: number
  percentage?: number
  completedPercent?: number
  status?: string
  state?: string
  taskStatus?: string
  note?: string
  description?: string
  summary?: string
  affectedPeople?: number
  emergencyLevel?: number
  contactPhone?: string
  isTeamLead?: boolean
  [key: string]: unknown
}

export interface PaginatedTasks {
  items: RawTask[]
  total: number
  page: number
  pageSize: number
}

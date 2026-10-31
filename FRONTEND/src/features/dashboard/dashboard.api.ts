// ============================================================
//  Dashboard API
// ============================================================

import { http } from '@/lib/api/http'

export interface DashboardSummary {
  totalUsers: number
  totalReliefRequests: number
  totalVolunteers: number
  totalWarehouses: number
  // Thêm các fields khác tuỳ theo BE trả về
  [key: string]: any
}

export interface AuditLog {
  id: string
  action: string
  entityName: string
  entityId: string
  userId: string
  userEmail: string
  timestamp: string
  details: string
}

export interface PaginatedAuditLogs {
  items: AuditLog[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// GET /api/dashboard/requests-over-time?days=30
// Số ReliefRequest tạo theo ngày, N ngày gần nhất — đủ mọi ngày kể cả ngày count=0.
export interface RequestsOverTimeItem {
  date: string   // "2026-07-21" (DateOnly)
  count: number
}

// GET /api/dashboard/map
export interface MapRequestPoint {
  id: string
  title: string
  latitude: number
  longitude: number
  status: string
  emergencyLevel: number
}

export interface MapWarehousePoint {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface DashboardMap {
  requests: MapRequestPoint[]
  warehouses: MapWarehousePoint[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await http.get<DashboardSummary>('/dashboard/summary')
  return data
}

export async function getRequestsOverTime(days = 30): Promise<RequestsOverTimeItem[]> {
  const { data } = await http.get<RequestsOverTimeItem[]>('/dashboard/requests-over-time', {
    params: { days },
  })
  return data
}

export async function getDashboardMap(): Promise<DashboardMap> {
  const { data } = await http.get<DashboardMap>('/dashboard/map')
  return data
}

export async function getAuditLogs(
  pageNumber = 1,
  pageSize = 10,
): Promise<PaginatedAuditLogs> {
  const { data } = await http.get<PaginatedAuditLogs>('/admin/audit-logs', {
    params: { pageNumber, pageSize },
  })
  return data
}

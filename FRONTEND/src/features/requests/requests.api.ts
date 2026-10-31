import { http } from '@/lib/api/http'
import { unwrapItems, type PagedResult } from '@/lib/api/paging'
import type { CreateReliefRequestPayload, InventoryIssueResult, ReliefRequestResponse, ReliefRequestStatus } from './requests.types'

export interface ReliefRequestActionResult {
  id: string
  message: string
  inventoryIssues?: InventoryIssueResult[]
}

/** A request is submitted only after the server confirms it; failed submissions stay in the form. */
export async function createReliefRequest(payload: CreateReliefRequestPayload): Promise<ReliefRequestActionResult> {
  const { data } = await http.post<ReliefRequestActionResult>('/relief-requests', {
    ...payload,
    region: payload.region?.trim() || payload.address?.trim() || '',
  })
  return data
}

/** Existing dashboards expect all rows when called with pageNumber=1. Never substitute another user's local drafts. */
export async function getReliefRequests(pageNumber = 1, pageSize = 50): Promise<ReliefRequestResponse[]> {
  const { data } = await http.get<PagedResult<ReliefRequestResponse> | ReliefRequestResponse[]>('/relief-requests', {
    params: { pageNumber, pageSize },
  })
  const rows = unwrapItems(data)
  if (!Array.isArray(data) && pageNumber === 1) {
    for (let page = 2; page <= data.totalPages; page++) {
      const next = await http.get<PagedResult<ReliefRequestResponse> | ReliefRequestResponse[]>('/relief-requests', {
        params: { pageNumber: page, pageSize },
      })
      rows.push(...unwrapItems(next.data))
    }
  }
  return rows
}

export async function getReliefRequestById(id: string): Promise<ReliefRequestResponse> {
  return (await http.get<ReliefRequestResponse>(`/relief-requests/${id}`)).data
}

export async function updateReliefRequestStatus(
  id: string,
  status: ReliefRequestStatus,
  note?: string,
  targetHeadcount?: number,
): Promise<ReliefRequestActionResult> {
  return (await http.put<ReliefRequestActionResult>(`/relief-requests/${id}/status`, {
    status, note: note || null, targetHeadcount: targetHeadcount ?? null,
  })).data
}

export function cancelReliefRequest(id: string): Promise<ReliefRequestActionResult> {
  return updateReliefRequestStatus(id, 'Cancelled')
}

export async function removeTeamLead(reliefRequestId: string): Promise<ReliefRequestActionResult> {
  return (await http.delete<ReliefRequestActionResult>(`/relief-requests/${reliefRequestId}/team-lead`)).data
}

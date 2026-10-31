// ============================================================
//  Khung phân trang chung của BE (API Reference mục 5.3/5.5)
//  result: { items, pageNumber, pageSize, totalCount, totalPages }
// ============================================================

export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Bóc items dù BE trả mảng trần hay khung phân trang */
export function unwrapItems<T>(data: PagedResult<T> | T[]): T[] {
  return Array.isArray(data) ? data : (data?.items ?? [])
}
// ============================================================
//  usePagination – generic pagination state
// ============================================================

import { ref, computed } from 'vue'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  total?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const page = ref(options.initialPage ?? 1)
  const pageSize = ref(options.initialPageSize ?? 10)
  const total = ref(options.total ?? 0)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  function goTo(n: number): void {
    page.value = Math.max(1, Math.min(n, totalPages.value))
  }
  function prev(): void { if (hasPrev.value) page.value-- }
  function next(): void { if (hasNext.value) page.value++ }
  function reset(): void { page.value = 1 }

  return { page, pageSize, total, totalPages, hasPrev, hasNext, goTo, prev, next, reset }
}

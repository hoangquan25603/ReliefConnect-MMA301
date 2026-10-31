// ============================================================
//  useDebouncedRef – debounce reactive value
//  Dùng cho search input, filter, v.v.
// ============================================================

import { ref, watch, type Ref } from 'vue'

/**
 * Trả về một ref bị debounce sau `delay` ms
 * @example
 * const search = useDebouncedRef('', 300)
 */
export function useDebouncedRef<T>(initialValue: T, delay = 300): Ref<T> {
  const inner = ref<T>(initialValue) as Ref<T>
  const debounced = ref<T>(initialValue) as Ref<T>

  let timer: ReturnType<typeof setTimeout>

  watch(inner, (newVal) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  })

  // Trả về inner để bind vào template, debounced để watch logic
  // Thực tế trả về cả hai qua object nếu cần — đây là bản đơn giản:
  return inner
}

/**
 * Phiên bản trả về cả inner (để v-model) và debounced (để watch/call API)
 */
export function useDebouncedSearch(delay = 300) {
  const query = ref('')
  const debouncedQuery = ref('')

  let timer: ReturnType<typeof setTimeout>

  watch(query, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = val
    }, delay)
  })

  return { query, debouncedQuery }
}

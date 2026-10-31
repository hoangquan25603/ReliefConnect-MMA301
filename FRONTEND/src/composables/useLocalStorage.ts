// ============================================================
//  useLocalStorage – reactive localStorage with type-safety
// ============================================================

import { ref, watch, type Ref } from 'vue'

/**
 * @example
 * const theme = useLocalStorage('theme', 'light')
 * theme.value = 'dark' // auto-persists
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const state = ref<T>(read()) as Ref<T>

  watch(
    state,
    (val) => {
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch {
        // quota exceeded – ignore
      }
    },
    { deep: true },
  )

  return state
}

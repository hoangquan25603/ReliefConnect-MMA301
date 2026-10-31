// ============================================================
//  useApi – composable bọc axios call với loading/error state
//  Dùng trong component thay vì try/catch lặp đi lặp lại
// ============================================================

import { ref, type Ref } from 'vue'
import { ApiError } from '@/lib/api/http'

interface UseApiReturn<T> {
  data: Ref<T | null>
  isLoading: Ref<boolean>
  error: Ref<string>
  execute: (...args: unknown[]) => Promise<T | null>
}

/**
 * @example
 * const { data, isLoading, error, execute } = useApi(getUsers)
 * await execute()
 */
export function useApi<T>(
  fn: (...args: unknown[]) => Promise<T>,
): UseApiReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const isLoading = ref(false)
  const error = ref('')

  async function execute(...args: unknown[]): Promise<T | null> {
    isLoading.value = true
    error.value = ''
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message
      } else {
        error.value = (err as Error).message ?? 'Đã có lỗi xảy ra'
      }
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, error, execute }
}

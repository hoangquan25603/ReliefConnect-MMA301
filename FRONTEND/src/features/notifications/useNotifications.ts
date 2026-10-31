import { computed, onMounted, ref } from 'vue'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.api'
import type { NotificationItem } from './notifications.types'

export function useNotifications() {
  const notifications = ref<NotificationItem[]>([])
  const isLoading = ref(false)
  const isMarking = ref(false)
  const error = ref('')
  const hasUnread = computed(() => notifications.value.some(note => !note.isRead))
  const readingIds = new Set<string>()

  async function loadNotifications() {
    isLoading.value = true
    error.value = ''
    try { notifications.value = await getNotifications() }
    catch (err) { error.value = (err as Error).message || 'Không tải được thông báo.' }
    finally { isLoading.value = false }
  }
  async function handleMarkAllAsRead() {
    if (isMarking.value) return
    isMarking.value = true
    error.value = ''
    try {
      await markAllNotificationsRead()
      notifications.value = notifications.value.map(note => ({ ...note, isRead: true }))
    } catch (err) { error.value = (err as Error).message || 'Chưa đánh dấu được thông báo đã đọc.' }
    finally { isMarking.value = false }
  }
  async function handleRead(note: NotificationItem) {
    if (note.isRead || readingIds.has(note.id) || isMarking.value) return
    readingIds.add(note.id)
    error.value = ''
    try { await markNotificationRead(note.id); note.isRead = true }
    catch (err) { error.value = (err as Error).message || 'Chưa đánh dấu được thông báo đã đọc.' }
    finally { readingIds.delete(note.id) }
  }
  onMounted(loadNotifications)
  return { notifications, isLoading, isMarking, hasUnread, error, loadNotifications, handleMarkAllAsRead, handleRead }
}

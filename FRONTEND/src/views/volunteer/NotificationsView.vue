<template>
  <VolunteerLayout>
    <div class="notifications-page">
      <div class="page-header">
        <h2>{{ $t('volunteer.notifications_title') }}</h2>
        <button class="btn-mark-read" @click="handleMarkAllAsRead" :disabled="isMarking || !hasUnread || isLoading">
          {{ isMarking ? $t('volunteer.updating') : $t('volunteer.mark_all_read') }}
        </button>
      </div>

      <div v-if="error" class="notification-error" role="alert">{{ error }} <button class="btn-mark-read" @click="loadNotifications">Thử lại</button></div>
      <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
      <div v-else-if="notifications.length === 0 && !error" class="empty-state">
        {{ $t('volunteer.no_notifications') }}
      </div>

      <div class="notifications-list" v-else>
        <div
          v-for="note in notifications"
          :key="note.id"
          :class="['notification-item', { unread: !note.isRead }]"
          @click="handleRead(note)"
        >
          <div class="note-icon" :class="`icon--${notificationUiKind(note.type)}`">
            <svg v-if="notificationUiKind(note.type) === 'system'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <svg v-else-if="notificationUiKind(note.type) === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>

          <div class="note-content">
            <h4>{{ note.title }}</h4>
            <p>{{ note.content }}</p>
            <span class="note-time">{{ formatDateTimeVI(note.createdAt) }}</span>
          </div>

          <div class="note-status" v-if="!note.isRead">
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>
  </VolunteerLayout>
</template>

<script setup lang="ts">
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import { notificationUiKind } from '@/features/notifications/notifications.types'
import { useNotifications } from '@/features/notifications/useNotifications'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'
const { notifications, isLoading, isMarking, hasUnread, error, loadNotifications, handleMarkAllAsRead, handleRead } = useNotifications()
</script>

<style scoped>
.notification-error { padding: 12px; border-radius: 8px; background: #fef2f2; color: #b91c1c; margin-bottom: 16px; }
.notifications-page {
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: #1a3b5c;
  letter-spacing: -0.5px;
  margin: 0;
}
.btn-mark-read {
  background: none;
  border: none;
  color: #e27d24;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
}
.btn-mark-read:hover { text-decoration: underline; }
.btn-mark-read:disabled { opacity: 0.6; cursor: not-allowed; text-decoration: none; }

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
  font-size: 14px;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 16px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notification-item {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}
.notification-item.unread {
  background: #fff9f0;
  border-color: #fbd38d;
}

.note-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.note-icon svg { width: 22px; height: 22px; }
.icon--success { background: rgba(39,103,73,0.10); color: #276749; }
.icon--system  { background: rgba(49,130,206,0.10); color: #3182ce; }
.icon--alert   { background: rgba(226,125,36,0.12); color: #e27d24; }

.note-content { flex: 1; min-width: 0; }
.note-content h4 { margin: 0 0 6px 0; font-size: 14.5px; color: #1a3b5c; font-weight: 700; }
.note-content p { margin: 0 0 10px 0; font-size: 13.5px; color: #475569; line-height: 1.55; }
.note-time { font-size: 11.5px; color: #94a3b8; font-weight: 500; }

.note-status { display: flex; align-items: flex-start; padding-top: 4px; }
.dot { width: 9px; height: 9px; background-color: #e27d24; border-radius: 50%; display: inline-block; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .notification-item { flex-direction: column; }
}
</style>

<template>
  <AppLayout>
    <div class="page-container">
      <p v-if="loadError" role="alert" style="padding: 14px; background: #fef2f2; color: #b91c1c; border-radius: 8px">{{ loadError }} — Số liệu có thể chưa đầy đủ. <button @click="loadDashboard">Thử lại</button></p>
      <div class="dashboard-header">
        <div>
          <p class="dashboard-role-badge role--coordinator">🗂️ {{ $t('coordinator.role_badge') }}</p>
          <h1 class="page-title">{{ $t('coordinator.greeting', { name: auth.user?.fullName }) }}</h1>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" v-for="s in stats" :key="s.label">
          <span class="stat-icon">{{ s.icon }}</span>
          <div>
            <p class="stat-value">{{ isLoading ? '…' : s.value }}</p>
            <p class="stat-label">{{ s.label }}</p>
          </div>
        </div>
      </div>

      <div class="two-col">
        <BaseCard>
          <template #header>
            {{ $t('coordinator.dispatch_panel_title') }}
            <span v-if="needDispatch.length > 0" class="header-count">{{ needDispatch.length }}</span>
          </template>
          <p class="panel-hint">{{ $t('coordinator.dispatch_panel_hint') }}</p>
          <p v-if="isLoading" class="text-muted text-center" style="padding: 40px 0;">{{ $t('common.loading') }}</p>
          <p v-else-if="needDispatch.length === 0" class="text-muted text-center" style="padding: 40px 0;">
            {{ $t('coordinator.no_dispatch') }}
          </p>
          <div class="dispatch-list" v-else>
            <div class="dispatch-item" v-for="req in needDispatch" :key="req.id">
              <div class="dispatch-dot" :style="dotStyle(req.status)" />
              <div class="dispatch-content">
                <p class="dispatch-title">{{ req.title }}</p>
                <p class="dispatch-meta">{{ req.address }} · {{ formatDateTimeVI(req.createdAt) }}</p>
              </div>
              <span class="emergency-badge" :class="`elv-${req.emergencyLevel}`">
                {{ emergencyLabel(req.emergencyLevel) }}
              </span>
              <button class="btn-outline" @click="goDispatch(req.id)">{{ $t('coordinator.dispatch_btn') }}</button>
            </div>
          </div>
          <RouterLink to="/admin/relief-requests" class="panel-footer-link">{{ $t('coordinator.view_all_requests_link') }}</RouterLink>
        </BaseCard>

        <BaseCard>
          <template #header>
            {{ $t('coordinator.volunteers_panel_title') }}
            <span v-if="availableVolunteers.length > 0" class="header-count">{{ availableVolunteers.length }}</span>
          </template>
          <p class="panel-hint">{{ $t('coordinator.volunteers_panel_hint') }}</p>
          <p v-if="isLoading" class="text-muted text-center" style="padding: 40px 0;">{{ $t('common.loading') }}</p>
          <p v-else-if="availableVolunteers.length === 0" class="text-muted text-center" style="padding: 40px 0;">
            {{ $t('coordinator.no_volunteers') }}
          </p>
          <div class="volunteer-list" v-else>
            <div class="volunteer-item" v-for="vol in availableVolunteers" :key="vol.id">
              <div class="volunteer-avatar">{{ volunteerInitial(vol.fullName) }}</div>
              <div class="dispatch-content">
                <p class="dispatch-title">{{ vol.fullName }}</p>
                <p class="dispatch-meta">{{ vol.phoneNumber }} · {{ vol.experienceYears }} {{ $t('coordinator.years_exp') }}</p>
              </div>
              <span class="ready-badge">{{ $t('coordinator.ready_badge') }}</span>
            </div>
          </div>
          <RouterLink to="/admin/volunteers" class="panel-footer-link">{{ $t('coordinator.view_all_volunteers_link') }}</RouterLink>
        </BaseCard>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useAuthStore } from '@/stores/auth'
import { getReliefRequests } from '@/features/requests/requests.api'
import type { ReliefRequestResponse } from '@/features/requests/requests.types'
import { dotStyle, formatDateTimeVI } from '@/features/requests/requests.helpers'
import { getAssignments, getPendingCancellations, type Assignment } from '@/features/tasks/assignments.api'
import { getAdminVolunteers, type VolunteerSummary } from '@/features/volunteers/admin-volunteers.api'

const auth = useAuthStore()
const router = useRouter()
const { t } = useI18n()

const EMERGENCY_LABEL_KEY: Record<number, string> = {
  1: 'coordinator.emergency_low',
  2: 'coordinator.emergency_large_scale',
  3: 'coordinator.emergency_severe',
}
const emergencyLabel = (level: number) => t(EMERGENCY_LABEL_KEY[level] ?? 'coordinator.emergency_low')

// ── State ────────────────────────────────────────────────────
const allRequests = ref<ReliefRequestResponse[]>([])
const assignments = ref<Assignment[]>([])
const pendingCancellations = ref<Assignment[]>([])
const volunteers = ref<VolunteerSummary[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadDashboard() {
  isLoading.value = true
  loadError.value = ''
  // Mỗi nguồn dữ liệu tải độc lập — 1 API lỗi không được làm trắng cả trang
  const [requests, asgn, pending, vols] = await Promise.allSettled([
    getReliefRequests(1, 200),
    getAssignments(1, 200),
    getPendingCancellations(),
    getAdminVolunteers(),
  ])
  if (requests.status === 'fulfilled') allRequests.value = requests.value
  else console.error('[CoordinatorDashboard] Không tải được relief-requests:', requests.reason)

  if (asgn.status === 'fulfilled') assignments.value = asgn.value
  else console.error('[CoordinatorDashboard] Không tải được assignments:', asgn.reason)

  if (pending.status === 'fulfilled') pendingCancellations.value = pending.value
  else console.error('[CoordinatorDashboard] Không tải được pending-cancellations:', pending.reason)

  if (vols.status === 'fulfilled') volunteers.value = vols.value
  else console.error('[CoordinatorDashboard] Không tải được admin/volunteers:', vols.reason)

  const failed = [requests, asgn, pending, vols].find(result => result.status === 'rejected')
  if (failed?.status === 'rejected') loadError.value = failed.reason?.message || 'Không tải được một số dữ liệu.'

  isLoading.value = false
}
onMounted(loadDashboard)

// ── Danh sách yêu cầu cần phân công (đã duyệt, chưa giao TNV) ──
const needDispatch = computed(() =>
  [...allRequests.value]
    .filter((r) => r.status === 'Approved')
    .sort((a, b) => b.emergencyLevel - a.emergencyLevel || a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5),
)

// ── TNV đang có phân công đang hoạt động (chưa hoàn thành/huỷ) ──
const activeVolunteerIds = computed(() => {
  const ids = new Set<string>()
  for (const a of assignments.value) {
    if (a.status === 'Accepted' || a.status === 'OnTheWay') ids.add(a.volunteerProfileId)
  }
  return ids
})

// ── TNV đã duyệt và hiện không có phân công đang chạy ──────────
const availableVolunteers = computed(() =>
  volunteers.value
    .filter((v) => v.status === 'Approved' && !activeVolunteerIds.value.has(v.id))
    .slice(0, 5),
)

const completedToday = computed(() => {
  const today = new Date().toDateString()
  return assignments.value.filter((a) => a.completedAt && new Date(a.completedAt).toDateString() === today).length
})

const needsAttention = computed(() => {
  const urgentPending = allRequests.value.filter((r) => r.status === 'Pending' && r.emergencyLevel === 3).length
  return pendingCancellations.value.length + urgentPending
})

const stats = computed(() => [
  { icon: '📋', value: String(needDispatch.value.length), label: t('coordinator.stat_need_dispatch') },
  { icon: '🙋', value: String(activeVolunteerIds.value.size), label: t('coordinator.stat_active_volunteers') },
  { icon: '✅', value: String(completedToday.value), label: t('coordinator.stat_completed_today') },
  { icon: '⚠️', value: String(needsAttention.value), label: t('coordinator.stat_needs_attention') },
])

function goDispatch(requestId: string) {
  router.push({ path: '/admin/relief-requests', query: { id: requestId } })
}

function volunteerInitial(fullName: string): string {
  const parts = fullName.split(' ')
  return parts[parts.length - 1]?.[0] ?? '?'
}
</script>

<style scoped>
.dashboard-header { margin-bottom: var(--space-6); }
.dashboard-role-badge {
  display: inline-block; padding: 3px 12px;
  border-radius: 99px; font-size: 13px; font-weight: 700; margin-bottom: 8px;
}
.role--coordinator { background: rgba(43,108,176,0.12); color: #2b6cb0; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4); margin-bottom: var(--space-6);
}
.stat-card {
  background: #fff; border-radius: 12px; padding: var(--space-5);
  display: flex; align-items: center; gap: var(--space-4); box-shadow: var(--shadow-sm);
}
.stat-icon  { font-size: 32px; }
.stat-value { font-size: 24px; font-weight: 800; color: #1a3b5c; }
.stat-label { font-size: 13px; color: #718096; margin-top: 2px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
@media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

.panel-hint { font-size: 12.5px; color: #94a3b8; margin: -4px 0 10px; }
.panel-footer-link {
  display: block; text-align: center; margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #edf2f7; font-size: 12.5px; font-weight: 600;
  color: #2b6cb0; text-decoration: none;
}
.panel-footer-link:hover { text-decoration: underline; }

.header-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px; margin-left: 6px;
  border-radius: 99px; background: rgba(43,108,176,0.12); color: #2b6cb0;
  font-size: 11px; font-weight: 700;
}

/* ── Dispatch list ── */
.dispatch-list, .volunteer-list { display: flex; flex-direction: column; gap: 4px; }
.dispatch-item, .volunteer-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 6px; border-radius: 10px; transition: background 0.15s ease;
}
.dispatch-item:hover, .volunteer-item:hover { background: #f8fafc; }
.dispatch-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dispatch-content { flex: 1; min-width: 0; }
.dispatch-title { margin: 0; font-size: 13.5px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dispatch-meta { margin: 2px 0 0 0; font-size: 11.5px; color: #a0aec0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.emergency-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.elv-1 { background: #dcfce7; color: #15803d; }
.elv-2 { background: #fef9c3; color: #854d0e; }
.elv-3 { background: #ffedd5; color: #9a3412; }
.elv-4 { background: #fee2e2; color: #991b1b; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 500; cursor: pointer; flex-shrink: 0; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #2b6cb0; color: #2b6cb0; }

.volunteer-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2b6cb0, #4299e1); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
}
.ready-badge { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; flex-shrink: 0; }
</style>

<template>
  <RequesterLayout>
    <div class="req-dashboard">
      <p v-if="loadError" role="alert" style="padding: 14px; background: #fef2f2; color: #b91c1c; border-radius: 8px">{{ loadError }} — Số liệu chưa được cập nhật. <button @click="loadRequests">Thử lại</button></p>
      <!-- Banner khẩn cấp -->
      <section class="banner-section">
        <div class="banner-content">
          <h3 class="highlight-text">{{ $t('requester.banner_highlight') }}</h3>
          <h2 class="main-heading">{{ $t('requester.banner_title') }}</h2>
          <p class="sub-text">{{ $t('requester.banner_desc') }}</p>
        </div>
        <button class="btn-emergency" @click="goToCreate">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          {{ $t('requester.banner_btn') }}
        </button>
      </section>

      <!-- Header dashboard -->
      <div class="dash-header">
        <div>
          <div class="role-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            {{ $t('requester.role_badge') }}
          </div>
          <h1 class="dash-title">{{ $t('requester.dashboard_title') }}</h1>
          <p class="dash-sub">{{ $t('requester.dashboard_sub') }}</p>
        </div>
        <div class="dash-date">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {{ currentDate }}
        </div>
      </div>

      <!-- 4 stat cards -->
      <div class="stat-grid">
        <div
          v-for="(card, i) in statCards"
          :key="card.label"
          class="stat-card"
          :style="{ '--card-color': card.color, '--card-bg': card.bg, '--delay': `${i * 80}ms` }"
        >
          <div class="stat-card__header">
            <div class="stat-card__icon-wrap">
              <span v-html="card.icon" />
            </div>
            <div class="stat-card__trend" :class="card.trendUp ? 'trend--up' : 'trend--neutral'">
              <svg v-if="card.trendUp" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ card.trend }}
            </div>
          </div>
          <div class="stat-card__body">
            <div class="stat-card__value">{{ card.value }}</div>
            <div class="stat-card__unit">{{ card.unit }}</div>
          </div>
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__bar-wrap">
            <div class="stat-card__bar" :style="{ width: card.progress + '%' }" />
          </div>
        </div>
      </div>

      <!-- Grid 2 cột -->
      <div class="dashboard-grid">
        <!-- Cột trái: Yêu cầu gần đây -->
        <section class="dash-panel recent-requests">
          <div class="panel-header">
            <h2 class="panel-title">{{ $t('requester.recent_requests') }}</h2>
            <a href="#" class="panel-link" @click.prevent="router.push('/requester/my-requests')">{{ $t('requester.see_all') }}</a>
          </div>
          <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
          <div v-else-if="recentRequests.length === 0" class="empty-state">{{ $t('requester.no_requests') }}</div>
          <div class="request-list" v-else>
            <div class="request-item" v-for="item in recentRequests" :key="item.id">
              <!-- Màu dot/tag lấy từ STATUS_GROUP_COLOR: vàng / xanh dương / xanh lá -->
              <div class="request-dot" :style="dotStyle(item.status)" />
              <div class="request-content">
                <p class="request-title">{{ item.title }}</p>
                <p class="request-meta">{{ item.time }}</p>
              </div>
              <span class="request-tag" :style="tagStyle(item.status)">{{ item.statusText }}</span>
              <button class="btn-outline" @click="goToDetail(item.id)">{{ $t('requester.detail_btn') }}</button>
            </div>
          </div>
        </section>

        <!-- Cột phải: Hành động nhanh + tiến độ + liên hệ -->
        <section class="right-column">
          <div class="dash-panel">
            <div class="panel-header">
              <h2 class="panel-title">{{ $t('requester.quick_actions') }}</h2>
            </div>
            <div class="quick-actions">
              <button
                v-for="qa in quickActions"
                :key="qa.label"
                class="quick-action-btn"
                :style="{ '--qa-color': qa.color }"
                @click="qa.action"
              >
                <div class="qa-icon" v-html="qa.icon" />
                <span>{{ qa.label }}</span>
              </button>
            </div>

            <!-- Progress ring: tỷ lệ yêu cầu đã hoàn thành -->
            <div class="progress-section">
              <div class="progress-ring-wrap">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e9ecef" stroke-width="10"/>
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#reqRingGrad)"
                    stroke-width="10"
                    stroke-linecap="round"
                    :stroke-dasharray="`${2 * Math.PI * 42}`"
                    :stroke-dashoffset="`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`"
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="reqRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#9f1239"/>
                      <stop offset="100%" stop-color="#ea580c"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="ring-label">
                  <span class="ring-pct">{{ progressPercent }}%</span>
                  <span class="ring-sub">{{ $t('requester.progress_pct_label') }}</span>
                </div>
              </div>
              <div class="progress-info">
                <p class="progress-info-title">{{ $t('requester.progress_title') }}</p>
                <p class="progress-info-desc">{{ $t('requester.progress_desc', { completed: completedRequests, total: totalRequests }) }}</p>
                <div class="progress-legend">
                  <span class="legend-dot" style="background: #ea580c"/> <span>{{ $t('requester.legend_completed') }}: {{ completedRequests }}</span>
                  <span class="legend-dot" style="background: #e9ecef; border: 1px solid #d0d5dd"/> <span>{{ $t('requester.legend_remaining') }}: {{ totalRequests - completedRequests }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dash-panel emergency-contact">
            <p class="contact-title">{{ $t('requester.emergency_contact_title') }}</p>
            <p class="phone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              1900 1234
            </p>
            <p class="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px; vertical-align: middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              hotro@reliefconnect.vn
            </p>
          </div>
        </section>
      </div>
    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import { getReliefRequests } from '@/features/requests/requests.api'
import {
  type ReliefRequestResponse,
  type ReliefRequestStatus,
} from '@/features/requests/requests.types'
import {
  dotStyle,
  tagStyle,
  formatDateTimeVI,
  matchesRequesterFilterGroup,
  type RequesterFilterGroup,
} from '@/features/requests/requests.helpers'

const router = useRouter()
const { t } = useI18n()

// Nhãn trạng thái dịch trên FE, gộp theo cùng nhóm với STATUS_LABEL_VI
const STATUS_LABEL_KEY: Record<ReliefRequestStatus, string> = {
  Pending: 'requester.status_processing',
  Approved: 'requester.status_processing',
  Assigned: 'requester.status_received',
  InProgress: 'requester.status_received',
  Completed: 'requester.status_completed',
  Cancelled: 'requester.status_cancelled',
}
const statusLabel = (status: ReliefRequestStatus) => t(STATUS_LABEL_KEY[status])

const currentDate = computed(() =>
  new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
)

// ── Danh sách yêu cầu (lấy từ API thật) ──────────────────
const allRequests = ref<ReliefRequestResponse[]>([])
const isLoading = ref(false)
const loadError = ref('')

async function loadRequests() {
  isLoading.value = true
  loadError.value = ''
  try { allRequests.value = await getReliefRequests() }
  catch (err) { loadError.value = (err as Error).message || 'Không tải được yêu cầu.' }
  finally { isLoading.value = false }
}
onMounted(loadRequests)

const recentRequests = computed(() =>
  [...allRequests.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((r) => ({
      id: r.id,
      title: r.title,
      time: formatDateTimeVI(r.createdAt),
      status: r.status, // giữ status gốc, màu sắc do helpers quyết định
      statusText: statusLabel(r.status),
    })),
)

const totalRequests = computed(() => allRequests.value.length)
const countByGroup = (group: RequesterFilterGroup) =>
  allRequests.value.filter((r) => matchesRequesterFilterGroup(r.status, group)).length

const processingCount = computed(() => countByGroup('processing'))
const receivedCount = computed(() => countByGroup('received'))
const completedRequests = computed(() => countByGroup('completed'))
const progressPercent = computed(() =>
  totalRequests.value === 0 ? 0 : Math.round((completedRequests.value / totalRequests.value) * 100),
)

const shareOfTotal = (count: number) =>
  totalRequests.value === 0 ? 0 : Math.round((count / totalRequests.value) * 100)

// Màu stat card đồng bộ quy ước: xử lý = vàng, tiếp nhận = xanh dương, hoàn thành = xanh lá
const statCards = computed(() => [
  {
    label: t('requester.stat_processing'),
    value: String(processingCount.value),
    unit: t('requester.stat_unit'),
    trend: t('requester.trend_watch'),
    trendUp: false,
    progress: shareOfTotal(processingCount.value),
    color: '#b45309',
    bg: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  },
  {
    label: t('requester.stat_received'),
    value: String(receivedCount.value),
    unit: t('requester.stat_unit'),
    trend: t('requester.trend_progress'),
    trendUp: false,
    progress: shareOfTotal(receivedCount.value),
    color: '#1d4ed8',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2h-3l-2-2H9L7 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"/><circle cx="17" cy="17" r="4"/><path d="M17 15.5v3"/></svg>`,
  },
  {
    label: t('requester.stat_completed'),
    value: String(completedRequests.value),
    unit: t('requester.stat_unit'),
    trend: t('requester.trend_done'),
    trendUp: false,
    progress: shareOfTotal(completedRequests.value),
    color: '#15803d',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>`,
  },
  {
    label: t('requester.stat_total'),
    value: String(totalRequests.value),
    unit: t('requester.stat_unit'),
    trend: t('requester.trend_alltime'),
    trendUp: false,
    progress: 100,
    color: '#6b46c1',
    bg: 'linear-gradient(135deg, #f3eeff 0%, #e9d8fd 100%)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b46c1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
])

const goToCreate = () => router.push({ path: '/requester/my-requests', query: { create: 'true' } })

const quickActions = computed(() => [
  {
    label: t('requester.qa_create'),
    color: '#e11d48',
    action: goToCreate,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  },
  {
    label: t('requester.qa_my_requests'),
    color: '#3182ce',
    action: () => router.push('/requester/my-requests'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  },
  {
    label: t('requester.qa_tracking'),
    color: '#6b46c1',
    action: () => router.push('/requester/tracking'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  },
  {
    label: t('requester.qa_profile'),
    color: '#276749',
    action: () => router.push('/profile'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  },
  {
    label: t('requester.qa_become_volunteer'),
    color: '#7c3aed',
    action: () => router.push('/requester/become-volunteer'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
])

const goToDetail = (id: string) => {
  router.push({ path: '/requester/my-requests', query: { id } })
}
</script>

<style scoped>
.req-dashboard { max-width: 1200px; margin: 0 auto; }

/* --- BANNER --- */
.banner-section {
  background: linear-gradient(135deg, #ffe4e6 0%, #ffedd5 100%);
  border-radius: 16px;
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.highlight-text { color: #e11d48; font-size: 16px; font-weight: 700; margin: 0 0 8px 0; }
.main-heading { color: #be123c; font-size: 28px; font-weight: 700; margin: 0 0 12px 0; }
.sub-text { color: #881337; font-size: 14px; margin: 0; }
.btn-emergency {
  display: flex; align-items: center; gap: 8px;
  background-color: #e11d48; color: white; border: none; padding: 16px 28px;
  font-size: 15px; font-weight: 600; border-radius: 8px; cursor: pointer;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3); transition: background 0.2s;
}
.btn-emergency .alert-icon { width: 20px; height: 20px; }
.btn-emergency:hover { background-color: #be123c; }

/* --- DASH HEADER --- */
.dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
.role-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(225,29,72,0.10); color: #e11d48; font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-bottom: 10px; letter-spacing: 0.3px; }
.dash-title { font-size: 26px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; line-height: 1.2; }
.dash-sub { font-size: 13.5px; color: #718096; margin-top: 4px; }
.dash-date { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #718096; background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 8px 14px; white-space: nowrap; flex-shrink: 0; }

/* --- STAT GRID --- */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }
.stat-card { background: var(--card-bg); border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 12px rgba(0,0,0,0.05); transition: transform 0.22s ease, box-shadow 0.22s ease; animation: fadeUp 0.4s ease both; animation-delay: var(--delay); cursor: default; }
.stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.stat-card__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.stat-card__icon-wrap { width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-card__trend { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 99px; background: rgba(255,255,255,0.65); }
.trend--up { color: #276749; } .trend--neutral { color: #718096; }
.stat-card__body { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
.stat-card__value { font-size: 34px; font-weight: 900; color: #1a2d3d; line-height: 1; letter-spacing: -1px; }
.stat-card__unit { font-size: 12px; font-weight: 600; color: var(--card-color); }
.stat-card__label { font-size: 12.5px; color: #718096; font-weight: 500; margin-bottom: 12px; }
.stat-card__bar-wrap { height: 4px; background: rgba(255,255,255,0.6); border-radius: 99px; overflow: hidden; }
.stat-card__bar { height: 100%; background: var(--card-color); border-radius: 99px; transition: width 1s cubic-bezier(0.4,0,0.2,1); }

/* --- GRID LAYOUT --- */
.dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }
.dash-panel { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 1px solid #e9ecef; }
.panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.panel-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0; }
.panel-link { font-size: 12.5px; font-weight: 600; color: #ea580c; text-decoration: none; }
.panel-link:hover { text-decoration: underline; }

/* Danh sách yêu cầu — màu dot/tag set inline từ STATUS_GROUP_COLOR */
.empty-state { text-align: center; padding: 32px 0; color: #94a3b8; font-size: 13.5px; }
.request-list { display: flex; flex-direction: column; gap: 4px; }
.request-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; transition: background 0.15s ease; }
.request-item:hover { background: #f8fafc; }
.request-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.request-content { flex: 1; min-width: 0; }
.request-title { margin: 0; font-size: 13.5px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.request-meta { margin: 2px 0 0 0; font-size: 11.5px; color: #a0aec0; }
.request-tag { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 99px; flex-shrink: 0; }
.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 500; cursor: pointer; flex-shrink: 0; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #ea580c; color: #ea580c; }

.right-column { display: flex; flex-direction: column; gap: 18px; }

/* Quick actions */
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
.quick-action-btn { display: flex; align-items: center; gap: 9px; padding: 12px 14px; border-radius: 11px; background: #f8fafc; border: 1px solid #e9ecef; color: #2d3748; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.18s ease; font-family: inherit; }
.quick-action-btn:hover { background: var(--qa-color); color: #fff; border-color: var(--qa-color); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.quick-action-btn:hover .qa-icon { filter: brightness(10); }
.qa-icon { display: flex; align-items: center; justify-content: center; color: var(--qa-color); flex-shrink: 0; }

/* Progress ring */
.progress-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fff1ee, #ffe8e0);
  border-radius: 12px;
  border: 1px solid rgba(159,18,57,0.12);
}
.progress-ring-wrap { position: relative; flex-shrink: 0; }
.ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
.ring-pct { font-size: 20px; font-weight: 900; color: #1a1a2e; line-height: 1; }
.ring-sub { font-size: 9px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.progress-info-title { font-size: 13.5px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.progress-info-desc { font-size: 12px; color: #718096; line-height: 1.5; margin-bottom: 10px; }
.progress-legend { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: #4a5568; font-weight: 500; flex-wrap: wrap; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

.emergency-contact { background: #f8fafc; }
.contact-title { font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 12px 0; }
.phone, .email { font-size: 14px; color: #0f172a; font-weight: 500; margin: 0 0 8px 0; }

/* --- Responsive --- */
@media (max-width: 1200px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } .dash-header { flex-direction: column; gap: 14px; } }
@media (max-width: 500px) { .stat-grid { grid-template-columns: 1fr; } }
</style>

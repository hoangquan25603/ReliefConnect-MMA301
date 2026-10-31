<template>
  <RequesterLayout>
    <div class="tracking-page">
      <div class="page-header">
        <h2>{{ $t('requester.tracking_title') }}</h2>
        <p class="subtitle">{{ $t('requester.tracking_sub') }}</p>
      </div>

      <div v-if="isLoading" class="empty-card">{{ $t('common.loading') }}</div>
      <div v-else-if="loadError" class="empty-card" role="alert">{{ loadError }} <button class="btn-primary" @click="loadRequests">Thử lại</button></div>

      <div v-else-if="activeRequests.length === 0" class="empty-card">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h3>{{ $t('requester.no_active_title') }}</h3>
        <p class="subtitle">{{ $t('requester.no_active_desc') }}</p>
        <router-link to="/requester/my-requests" class="btn-primary">{{ $t('requester.view_all_requests') }}</router-link>
      </div>

      <div v-else class="tracking-list">
        <div class="tracking-card" v-for="item in activeRequests" :key="item.id">
          <div class="tracking-card-header">
            <div>
              <h4>{{ item.title }}</h4>
              <span class="meta">{{ item.address }} · {{ formatDateTimeVI(item.createdAt) }}</span>
            </div>
            <span class="badge" :style="badgeStyle(item.status)">{{ statusLabel(item.status) }}</span>
          </div>

          <div class="progress-track">
            <div
              class="progress-step"
              v-for="(step, i) in TRACKING_STEPS"
              :key="step.status"
              :class="{ done: i <= currentStepIndex(item), current: i === currentStepIndex(item) }"
            >
              <span class="progress-dot" />
              <span class="progress-label">{{ step.label }}</span>
              <span v-if="i < TRACKING_STEPS.length - 1" class="progress-line" :class="{ done: i < currentStepIndex(item) }" />
            </div>
          </div>

          <div class="map-block">
            <div
              v-if="hasValidCoords(item)"
              :ref="(el) => setMapRef(item.id, el as HTMLElement | null)"
              class="tracking-map"
            ></div>
            <p v-else class="map-empty">{{ $t('requester.tracking_no_location') }}</p>
          </div>
        </div>
      </div>
    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import { getReliefRequests } from '@/features/requests/requests.api'
import { type ReliefRequestResponse, type ReliefRequestStatus } from '@/features/requests/requests.types'
import { badgeStyle, dotStyle, formatDateTimeVI } from '@/features/requests/requests.helpers'

const { t } = useI18n()

// Nhãn trạng thái dịch trên FE, gộp theo cùng nhóm với STATUS_LABEL_VI cũ
const STATUS_LABEL_KEY: Record<ReliefRequestStatus, string> = {
  Pending: 'requester.status_processing',
  Approved: 'requester.status_processing',
  Assigned: 'requester.status_received',
  InProgress: 'requester.status_received',
  Completed: 'requester.status_completed',
  Cancelled: 'requester.status_cancelled',
}
const statusLabel = (status: ReliefRequestStatus) => t(STATUS_LABEL_KEY[status])

const isLoading = ref(true)
const allRequests = ref<ReliefRequestResponse[]>([])
const loadError = ref('')

async function loadRequests() {
  isLoading.value = true
  loadError.value = ''
  try { allRequests.value = await getReliefRequests() }
  catch (err) { loadError.value = (err as Error).message || 'Không tải được trạng thái yêu cầu.' }
  finally { isLoading.value = false }
}
onMounted(loadRequests)

// Chỉ theo dõi yêu cầu chưa kết thúc (Completed/Cancelled coi như xong việc theo dõi)
const ACTIVE_STATUSES: ReliefRequestStatus[] = ['Pending', 'Approved', 'Assigned', 'InProgress']

const activeRequests = computed(() =>
  [...allRequests.value]
    .filter((r) => ACTIVE_STATUSES.includes(r.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

// ── Bản đồ mini theo từng card (Leaflet + OpenStreetMap) ───
// Không marker mặc định (tránh phải fix icon vỡ khi build) — dùng circleMarker
// màu theo đúng status, đồng bộ màu badge/timeline đang có (dotStyle).
const mapEls = new Map<string, HTMLElement>()
const mapInstances = new Map<string, L.Map>()

function setMapRef(id: string, el: HTMLElement | null) {
  if (el) mapEls.set(id, el)
  else mapEls.delete(id)
}

function hasValidCoords(item: ReliefRequestResponse): boolean {
  const { latitude: lat, longitude: lng } = item
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  )
}

function destroyMaps() {
  mapInstances.forEach((map) => map.remove())
  mapInstances.clear()
}

function renderMaps() {
  destroyMaps()

  for (const item of activeRequests.value) {
    if (!hasValidCoords(item)) continue
    const el = mapEls.get(item.id)
    if (!el) continue

    // Bản đồ mini chỉ để xem vị trí, không phải để thao tác trong 1 danh
    // sách dài — tắt tương tác để cuộn trang không bị "nuốt" vào map.
    const map = L.map(el, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: false,
    }).setView([item.latitude, item.longitude], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    L.circleMarker([item.latitude, item.longitude], {
      radius: 9,
      fillColor: dotStyle(item.status).background,
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2,
    }).addTo(map)

    mapInstances.set(item.id, map)
  }
}

watch(activeRequests, async () => {
  await nextTick()
  renderMaps()
})

onBeforeUnmount(() => {
  destroyMaps()
})

// Timeline hiển thị theo state machine BE: Pending → Approved → Assigned → InProgress → Completed
const TRACKING_STEPS = computed<{ status: ReliefRequestStatus; label: string }[]>(() => [
  { status: 'Pending', label: t('requester.step_sent') },
  { status: 'Approved', label: t('requester.step_approved') },
  { status: 'Assigned', label: t('requester.step_assigned') },
  { status: 'InProgress', label: t('requester.step_inprogress') },
  { status: 'Completed', label: t('requester.step_completed') },
])

function currentStepIndex(item: ReliefRequestResponse): number {
  const idx = TRACKING_STEPS.value.findIndex((s) => s.status === item.status)
  return idx === -1 ? 0 : idx
}
</script>

<style scoped>
.tracking-page { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

.page-header h2 { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.subtitle { font-size: 13.5px; color: #718096; margin: 0; }

.empty-card {
  background: #ffffff; border-radius: 16px; padding: 56px 32px;
  border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); text-align: center;
}
.empty-icon {
  width: 64px; height: 64px; border-radius: 16px;
  background: linear-gradient(135deg, #fff1eb, #ffe4d5); color: #ea580c;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
}
.empty-card h3 { font-size: 17px; font-weight: 800; color: #1a1a2e; margin: 0 0 8px 0; }
.empty-card .subtitle { max-width: 420px; margin: 0 auto 20px; line-height: 1.6; }
.btn-primary {
  display: inline-block; background: #e11d48; color: #fff; text-decoration: none;
  padding: 10px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600;
}
.btn-primary:hover { background: #be123c; }

.tracking-list { display: flex; flex-direction: column; gap: 16px; }
.tracking-card {
  background: #fff; border-radius: 16px; padding: 20px 24px;
  border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.tracking-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
.tracking-card-header h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1e293b; }
.meta { font-size: 12px; color: #64748b; }
.badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; flex-shrink: 0; white-space: nowrap; }

.progress-track { display: flex; align-items: flex-start; }
.progress-step {
  position: relative; flex: 1; display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 8px;
}
.progress-dot {
  width: 16px; height: 16px; border-radius: 50%; background: #e2e8f0; border: 3px solid #fff;
  box-shadow: 0 0 0 2px #e2e8f0; z-index: 1;
}
.progress-step.done .progress-dot { background: #22c55e; box-shadow: 0 0 0 2px #22c55e; }
.progress-step.current .progress-dot { background: #ea580c; box-shadow: 0 0 0 2px #ea580c; }
.progress-label { font-size: 11.5px; font-weight: 600; color: #94a3b8; }
.progress-step.done .progress-label,
.progress-step.current .progress-label { color: #1e293b; }
.progress-line {
  position: absolute; top: 8px; left: 50%; width: 100%; height: 2px; background: #e2e8f0; z-index: 0;
}
.progress-line.done { background: #22c55e; }

.map-block { margin-top: 18px; }
.tracking-map {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  z-index: 0;
}
.map-empty {
  margin: 0;
  padding: 14px;
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

@media (max-width: 600px) {
  .progress-label { font-size: 10px; }
  .tracking-map { height: 160px; }
}
</style>

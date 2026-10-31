<template>
  <VolunteerLayout>
    <div class="tasks-wrapper">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <div class="role-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {{ $t('volunteer.role_title') }}
          </div>
          <h1 class="page-title">{{ $t('volunteer.tasks_title') }}</h1>
          <p class="page-sub">{{ $t('volunteer.tasks_sub') }}</p>
        </div>
        <div class="page-badge">
          <span class="page-badge__dot" />
          {{ activeFilterLabel }}
        </div>
      </div>

      <!-- ── Summary ── -->
      <div class="summary-grid">
        <div class="summary-card summary-card--active">
          <p class="summary-label">{{ $t('volunteer.tasks_filter_ongoing') }}</p>
          <strong class="summary-value">{{ activeCount }}</strong>
        </div>
        <div class="summary-card summary-card--upcoming">
          <p class="summary-label">{{ $t('volunteer.tasks_filter_upcoming') }}</p>
          <strong class="summary-value">{{ upcomingCount }}</strong>
        </div>
        <div class="summary-card summary-card--done">
          <p class="summary-label">{{ $t('volunteer.tasks_filter_completed') }}</p>
          <strong class="summary-value">{{ completedCount }}</strong>
        </div>
      </div>

      <!-- ── Filter pills ── -->
      <div class="filter-row">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-pill"
          :class="{ active: selectedFilter === filter.value }"
          @click="selectedFilter = filter.value"
        >
          {{ $t(filter.labelKey) }}
        </button>
      </div>

      <!-- ── Task list ── -->
      <div v-if="isLoading" class="loading-state">{{ $t('volunteer.tasks_loading') }}</div>
      <div v-else-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
      <div v-else-if="filteredTasks.length === 0" class="empty-state">
        <p>{{ $t('volunteer.tasks_empty') }}</p>
      </div>

      <div v-else class="task-list">
        <article v-for="task in filteredTasks" :key="task.id" class="task-card">
          <div class="task-card__header">
            <div>
              <h3 class="task-title">{{ task.title }}</h3>
              <p class="task-address">{{ task.address }}</p>
            </div>
            <span class="task-status" :class="`status--${task.status}`">{{ $t(`volunteer.tasks_status_${task.status}`) }}</span>
          </div>

          <div class="task-meta">
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{{ task.date }}</span>
            </div>
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ task.time }}</span>
            </div>
            <div v-if="task.isTeamLead" class="meta-item meta-item--lead">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>Nhóm trưởng</span>
            </div>
          </div>

          <div class="map-block">
            <div
              v-if="hasValidCoords(task)"
              :ref="(el) => setMapRef(String(task.id), el as HTMLElement | null)"
              class="task-map"
            ></div>
            <p v-else class="map-empty">{{ $t('volunteer.tasks_no_location') }}</p>
          </div>

          <div class="task-footer">
            <span class="task-note">{{ task.note }}</span>
            <button class="detail-btn" @click="openDetail(task)">{{ $t('volunteer.tasks_btn_detail') }}</button>
          </div>
        </article>
      </div>

      <!-- ══════════ MODAL: CHI TIẾT NHIỆM VỤ ══════════ -->
      <Teleport to="body">
      <div v-if="showDetail && selectedTask" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-box">

          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header-info">
              <span class="task-status" :class="`status--${selectedTask.status}`">
                {{ $t(`volunteer.tasks_status_${selectedTask.status}`) }}
              </span>
              <h3>{{ selectedTask.title }}</h3>
              <p class="modal-address">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ selectedTask.address }}
                <template v-if="selectedTask.region"> · {{ selectedTask.region }}</template>
              </p>
            </div>
            <button class="modal-close" @click="closeDetail">✕</button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">

            <!-- Info fields -->
            <div class="detail-grid">
              <div class="detail-field">
                <span class="detail-icon">📅</span>
                <div>
                  <span class="detail-label">Ngày duyệt & phân công</span>
                  <span class="detail-value">{{ selectedTask.date }} · {{ selectedTask.time }}</span>
                </div>
              </div>
              <div v-if="selectedTask.affectedPeople" class="detail-field">
                <span class="detail-icon">👥</span>
                <div>
                  <span class="detail-label">Số người ảnh hưởng</span>
                  <span class="detail-value">{{ selectedTask.affectedPeople }} người</span>
                </div>
              </div>
              <div v-if="selectedTask.contactPhone" class="detail-field">
                <span class="detail-icon">📞</span>
                <div>
                  <span class="detail-label">Liên hệ người cần trợ giúp</span>
                  <span class="detail-value">{{ selectedTask.contactPhone }}</span>
                </div>
              </div>
              <div v-if="selectedTask.emergencyLevel" class="detail-field">
                <span class="detail-icon">🚨</span>
                <div>
                  <span class="detail-label">Mức độ khẩn cấp</span>
                  <span class="detail-value">{{ emergencyLevelLabel(selectedTask.emergencyLevel) }}</span>
                </div>
              </div>
              <div v-if="selectedTask.isTeamLead" class="detail-field">
                <span class="detail-icon">⭐</span>
                <div>
                  <span class="detail-label">Vai trò</span>
                  <span class="detail-value" style="color: #b45309; font-weight: 700;">Nhóm trưởng</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedTask.description" class="detail-section">
              <span class="detail-section-label">Mô tả yêu cầu</span>
              <p class="detail-section-text">{{ selectedTask.description }}</p>
            </div>

            <!-- Note -->
            <div class="detail-section">
              <span class="detail-section-label">Ghi chú nhiệm vụ</span>
              <p class="detail-section-text">{{ selectedTask.note }}</p>
            </div>

            <!-- Status flow -->
            <div class="status-flow">
              <span class="detail-section-label">Luồng trạng thái</span>
              <div class="status-steps">
                <div
                  v-for="step in statusFlow"
                  :key="step.value"
                  :class="['status-step', { active: isCurrentOrPast(step.value), current: step.value === selectedTask.rawStatus }]"
                >
                  <div class="status-step-dot"></div>
                  <span class="status-step-label">{{ step.label }}</span>
                </div>
              </div>
            </div>

            <!-- Error -->
            <p v-if="statusError" class="error-text">{{ statusError }}</p>

            <!-- Actions -->
            <div class="modal-actions">
              <button class="btn-outline" @click="closeDetail">Đóng</button>
              <template v-if="nextStatus(selectedTask.rawStatus)">
                <button
                  class="btn-primary btn-status"
                  :disabled="isUpdating"
                  @click="handleStatusUpdate"
                >
                  <svg v-if="isUpdating" class="spinner-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.3"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ isUpdating ? 'Đang cập nhật...' : nextStatusLabel(selectedTask.rawStatus) }}
                </button>
              </template>
            </div>

          </div><!-- /modal-body -->
        </div><!-- /modal-box -->
      </div><!-- /modal-overlay -->
      </Teleport>

    </div><!-- /tasks-wrapper -->
  </VolunteerLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import { getMyTasks } from '@/features/tasks/tasks.api'
import { updateAssignmentStatus, type AssignmentStatus } from '@/features/tasks/assignments.api'
import type { TaskItem, TaskStatus } from '@/features/tasks/tasks.types'

// Màu marker theo trạng thái nhiệm vụ
const TASK_STATUS_MARKER_COLOR: Record<TaskStatus, string> = {
  ongoing: '#e27d24',
  upcoming: '#3182ce',
  completed: '#276749',
}

// Luồng trạng thái assignment theo thứ tự
const STATUS_FLOW: { value: string; label: string }[] = [
  { value: 'Assigned', label: 'Đã phân công' },
  { value: 'Accepted', label: 'Đã chấp nhận' },
  { value: 'OnTheWay', label: 'Đang di chuyển' },
  { value: 'Completed', label: 'Hoàn thành' },
]

const STATUS_ORDER = STATUS_FLOW.map((s) => s.value)

/** Trạng thái kế tiếp trong luồng (null nếu đã xong hoặc bị huỷ) */
function nextStatus(raw: string): AssignmentStatus | null {
  const idx = STATUS_ORDER.indexOf(raw)
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null
  return STATUS_ORDER[idx + 1] as AssignmentStatus
}

function nextStatusLabel(raw: string): string {
  const next = nextStatus(raw)
  if (!next) return ''
  const labels: Record<string, string> = {
    Accepted: 'Xác nhận chấp nhận nhiệm vụ',
    OnTheWay: 'Bắt đầu di chuyển',
    Completed: 'Đánh dấu hoàn thành',
  }
  return labels[next] ?? `Chuyển sang ${next}`
}

function isCurrentOrPast(stepValue: string): boolean {
  if (!selectedTask.value) return false
  const taskIdx = STATUS_ORDER.indexOf(selectedTask.value.rawStatus)
  const stepIdx = STATUS_ORDER.indexOf(stepValue)
  return taskIdx >= stepIdx
}

function emergencyLevelLabel(level: number | null): string {
  if (level === 1) return '🟢 Cần hỗ trợ thường'
  if (level === 2) return '🟠 Quy mô vừa / Cần gấp'
  if (level === 3) return '🔴 Rất nghiêm trọng / Khẩn cấp'
  return '—'
}

const { t } = useI18n()
const selectedFilter = ref('all')
const isLoading = ref(false)
const errorMessage = ref('')

const filters = [
  { value: 'all', labelKey: 'volunteer.tasks_filter_all' },
  { value: 'ongoing', labelKey: 'volunteer.tasks_filter_ongoing' },
  { value: 'upcoming', labelKey: 'volunteer.tasks_filter_upcoming' },
  { value: 'completed', labelKey: 'volunteer.tasks_filter_completed' },
]

const tasks = ref<TaskItem[]>([])

async function loadTasks() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    tasks.value = await getMyTasks()
  } catch (err: any) {
    tasks.value = []
    errorMessage.value = err?.message || 'Không thể tải danh sách nhiệm vụ.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadTasks()
})

const filteredTasks = computed(() => {
  if (selectedFilter.value === 'all') return tasks.value
  return tasks.value.filter((task) => task.status === selectedFilter.value)
})

const activeFilterLabel = computed(() => {
  const item = filters.find((item) => item.value === selectedFilter.value)
  return item ? t(item.labelKey) : t('volunteer.tasks_filter_all')
})

const activeCount = computed(() => tasks.value.filter((task) => task.status === 'ongoing').length)
const upcomingCount = computed(() => tasks.value.filter((task) => task.status === 'upcoming').length)
const completedCount = computed(() => tasks.value.filter((task) => task.status === 'completed').length)

// ── Modal detail + status update ────────────────────────────
const showDetail = ref(false)
const selectedTask = ref<TaskItem | null>(null)
const isUpdating = ref(false)
const statusError = ref('')
const statusFlow = STATUS_FLOW

function openDetail(task: TaskItem) {
  selectedTask.value = task
  statusError.value = ''
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedTask.value = null
  statusError.value = ''
}

async function handleStatusUpdate() {
  if (!selectedTask.value) return
  const next = nextStatus(selectedTask.value.rawStatus)
  if (!next) return

  isUpdating.value = true
  statusError.value = ''
  try {
    await updateAssignmentStatus(selectedTask.value.assignmentId, next)
    await loadTasks()
    const updated = tasks.value.find((t) => t.assignmentId === selectedTask.value?.assignmentId)
    if (updated) {
      selectedTask.value = updated
    } else {
      closeDetail()
    }
  } catch (err: any) {
    statusError.value = err?.response?.data?.message || err?.message || 'Cập nhật trạng thái thất bại.'
  } finally {
    isUpdating.value = false
  }
}

// ── Mini maps (Leaflet) ──────────────────────────────────────
const mapEls = new Map<string, HTMLElement>()
const mapInstances = new Map<string, L.Map>()

function setMapRef(id: string, el: HTMLElement | null) {
  if (el) mapEls.set(id, el)
  else mapEls.delete(id)
}

function hasValidCoords(task: TaskItem): boolean {
  return typeof task.latitude === 'number' && typeof task.longitude === 'number'
}

function destroyMaps() {
  mapInstances.forEach((map) => map.remove())
  mapInstances.clear()
}

function renderMaps() {
  destroyMaps()
  for (const task of filteredTasks.value) {
    if (!hasValidCoords(task)) continue
    const el = mapEls.get(String(task.id))
    if (!el) continue

    const map = L.map(el, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: false,
    }).setView([task.latitude as number, task.longitude as number], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)

    L.circleMarker([task.latitude as number, task.longitude as number], {
      radius: 9,
      fillColor: TASK_STATUS_MARKER_COLOR[task.status],
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2,
    }).addTo(map)

    mapInstances.set(String(task.id), map)
  }
}

// flush: 'post' đảm bảo watch chạy SAU khi Vue cập nhật DOM xong
watch(filteredTasks, () => { renderMaps() }, { flush: 'post' })

onBeforeUnmount(() => { destroyMaps() })
</script>

<style scoped>
.tasks-wrapper {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(39, 103, 73, 0.1);
  color: #276749;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0;
}

.page-sub {
  margin-top: 4px;
  font-size: 13.5px;
  color: #718096;
}

.page-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12.5px;
  color: #4a5568;
  white-space: nowrap;
}

.page-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #276749;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.summary-card {
  background: #fff;
  border: 1px solid #ecf2f7;
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.summary-card--active  { border-left: 4px solid #e27d24; }
.summary-card--upcoming{ border-left: 4px solid #3182ce; }
.summary-card--done    { border-left: 4px solid #276749; }

.summary-label {
  margin: 0 0 6px;
  font-size: 12px;
  color: #718096;
}

.summary-value {
  font-size: 24px;
  font-weight: 800;
  color: #1a3b5c;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.filter-pill {
  border: 1px solid #dce7ef;
  background: #fff;
  color: #4a5568;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill.active {
  background: linear-gradient(135deg, #276749 0%, #48bb78 100%);
  color: #fff;
  border-color: transparent;
}

.task-list {
  display: grid;
  gap: 16px;
}

.loading-state,
.empty-state,
.error-banner {
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 18px;
  color: #4a5568;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.error-banner {
  border-color: #fed7d7;
  color: #c53030;
  background: #fff5f5;
}

.task-card {
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
}

.task-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.task-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 800;
  color: #1a3b5c;
}

.task-address {
  margin: 0;
  color: #718096;
  font-size: 13px;
}

.task-status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.status--ongoing   { background: #fef3e2; color: #b45309; }
.status--upcoming  { background: #ebf8ff; color: #2b6cb0; }
.status--completed { background: #e8f5ee; color: #276749; }

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4a5568;
  font-size: 13px;
}

.meta-item--lead {
  color: #b45309;
  font-weight: 700;
  background: #fef3e2;
  border-radius: 999px;
  padding: 2px 10px;
}

.map-block {
  margin-bottom: 14px;
}

.task-map {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #edf2f7;
  z-index: 0;
}

.map-empty {
  margin: 0;
  padding: 14px;
  text-align: center;
  font-size: 12.5px;
  color: #a0aec0;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-note {
  color: #718096;
  font-size: 13px;
}

.detail-btn {
  border: none;
  background: #276749;
  color: #fff;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease;
}

.detail-btn:hover { background: #1f5337; }

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-box {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.modal-header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.modal-header-info h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
}

.modal-address {
  margin: 0;
  font-size: 12.5px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  flex-shrink: 0;
  line-height: 1;
  padding: 2px;
}
.modal-close:hover { color: #0f172a; }

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.detail-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-label {
  display: block;
  font-size: 11.5px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}

.detail-value {
  display: block;
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

.detail-section {
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
}

.detail-section-label {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.detail-section-text {
  margin: 0;
  font-size: 13.5px;
  color: #334155;
  line-height: 1.6;
}

/* Status flow */
.status-flow {
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
}

.status-steps {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  gap: 6px;
}

.status-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 8px;
  left: calc(50% + 10px);
  right: calc(-50% + 10px);
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.status-step.active:not(:last-child)::after { background: #276749; }

.status-step-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 3px solid #e2e8f0;
  z-index: 1;
  transition: all 0.2s;
}

.status-step.active .status-step-dot { background: #276749; border-color: #276749; }
.status-step.current .status-step-dot {
  background: #fff;
  border-color: #276749;
  box-shadow: 0 0 0 3px rgba(39, 103, 73, 0.25);
}

.status-step-label {
  font-size: 10.5px;
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
}

.status-step.active .status-step-label  { color: #276749; }
.status-step.current .status-step-label { color: #276749; font-weight: 700; }

/* Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.btn-outline {
  background: none;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-outline:hover { border-color: #94a3b8; color: #1e293b; }

.btn-primary {
  background: linear-gradient(135deg, #276749, #48bb78);
  border: none;
  color: #fff;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.18s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { opacity: 0.88; }
.btn-status { white-space: nowrap; }

.error-text {
  color: #e11d48;
  font-size: 13px;
  margin: 0;
  padding: 10px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
}

.spinner-icon {
  width: 15px;
  height: 15px;
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .summary-grid { grid-template-columns: 1fr; }
  .page-header  { flex-direction: column; }
}

@media (max-width: 640px) {
  .task-card__header,
  .task-footer { flex-direction: column; align-items: flex-start; }
  .task-map { height: 160px; }
  .status-step-label { font-size: 9.5px; }
}
</style>

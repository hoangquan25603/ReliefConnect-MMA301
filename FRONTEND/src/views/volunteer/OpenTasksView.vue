<template>
  <VolunteerLayout>
    <div class="open-tasks-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('openTasks.title') }}</h1>
          <p class="page-sub">{{ $t('openTasks.sub') }}</p>
        </div>
      </div>

      <p v-if="joinSuccess" class="banner banner--success">{{ joinSuccess }}</p>

      <div class="card">
        <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="loadError" class="empty-state empty-state--error">{{ loadError }}</div>
        <div v-else-if="tasks.length === 0" class="empty-state">{{ $t('openTasks.no_tasks') }}</div>

        <div class="task-list" v-else>
          <div class="task-card" v-for="task in tasks" :key="task.id">
            <div class="task-card__main">
              <span class="task-card__level" :class="`elv-${task.emergencyLevel}`">{{ emergencyLabel(task.emergencyLevel) }}</span>
              <h3 class="task-card__title">{{ task.title }}</h3>
              <p class="task-card__region">{{ task.region }}</p>
              <p class="task-card__slots">{{ $t('openTasks.slots', { current: task.activeAssignmentCount, total: task.targetHeadcount }) }}</p>
              <p class="task-card__time">{{ formatDateTimeVI(task.createdAt) }}</p>

              <div class="map-block">
                <div
                  v-if="hasRegionArea(task)"
                  :ref="(el) => setMapRef(task.id, el as HTMLElement | null)"
                  class="region-map"
                ></div>
                <p v-else class="map-empty">{{ $t('openTasks.no_location') }}</p>
              </div>
            </div>
            <button
              class="btn-join"
              :disabled="joiningId === task.id"
              @click="handleJoin(task)"
            >
              {{ joiningId === task.id ? $t('openTasks.joining') : $t('openTasks.btn_join') }}
            </button>
          </div>
        </div>
        <p v-if="joinError" class="error-text">{{ joinError }}</p>
      </div>
    </div>
  </VolunteerLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import { getOpenTasks, joinOpenTask, type OpenTask } from '@/features/requests/open-tasks.api'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'
import { resolveProvinceCenter } from '@/features/requests/vn-provinces'
import { getMyTasks } from '@/features/tasks/tasks.api'

const { t } = useI18n()

const tasks = ref<OpenTask[]>([])
const isLoading = ref(true)
const loadError = ref('')
const joiningId = ref<string | null>(null)
const joinError = ref('')
const joinSuccess = ref('')

/**
 * BE /open-tasks chỉ lọc theo slot còn trống, KHÔNG loại trừ nhiệm vụ mà
 * chính volunteer đang gọi đã tham gia (nếu targetHeadcount > 1, request vẫn
 * còn slot cho người khác) → phải tự lọc ở FE dựa trên assignment hiện có.
 */
async function fetchJoinedRequestIds(): Promise<Set<string>> {
  try {
    const myTasks = await getMyTasks()
    return new Set(
      myTasks.filter((task) => task.rawStatus !== 'Cancelled').map((task) => task.reliefRequestId),
    )
  } catch (e) {
    console.error(e)
    return new Set()
  }
}

async function loadTasks() {
  isLoading.value = true
  loadError.value = ''
  try {
    const [result, joinedIds] = await Promise.all([getOpenTasks(1, 100), fetchJoinedRequestIds()])
    tasks.value = result.items.filter((task) => !joinedIds.has(task.id))
  } catch (e) {
    console.error(e)
    tasks.value = []
    loadError.value = e instanceof Error ? e.message : t('openTasks.load_failed')
  } finally {
    isLoading.value = false
  }
}
onMounted(() => {
  void loadTasks()
})

// ── Bản đồ MỨC KHU VỰC (không lộ vị trí chính xác) ─────────
// Khác hẳn TrackingView/MyTasksView: open task chưa có ai nhận, backend chỉ
// trả `region` (text tỉnh/thành, KHÔNG có toạ độ nhà dân) — đúng chủ đích,
// không đổi. Ở đây chỉ tra toạ độ TRUNG TÂM TỈNH/THÀNH theo tên (bảng cứng
// vn-provinces.ts) rồi vẽ 1 vòng tròn mờ bao quanh, không đặt ghim chính xác.
const REGION_CIRCLE_RADIUS_METERS = 15000
const REGION_ZOOM = 9

const mapEls = new Map<string, HTMLElement>()
const mapInstances = new Map<string, L.Map>()

function setMapRef(id: string, el: HTMLElement | null) {
  if (el) mapEls.set(id, el)
  else mapEls.delete(id)
}

function hasRegionArea(task: OpenTask): boolean {
  return resolveProvinceCenter(task.region) !== null
}

function destroyMaps() {
  mapInstances.forEach((map) => map.remove())
  mapInstances.clear()
}

function renderMaps() {
  destroyMaps()

  for (const task of tasks.value) {
    const center = resolveProvinceCenter(task.region)
    if (!center) continue
    const el = mapEls.get(task.id)
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
    }).setView(center, REGION_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    // Vòng tròn mờ thay vì ghim — chỉ truyền tải "việc ở khu vực này",
    // không chỉ đích danh toạ độ cụ thể.
    L.circle(center, {
      radius: REGION_CIRCLE_RADIUS_METERS,
      color: '#e11d48',
      weight: 1.5,
      fillColor: '#e11d48',
      fillOpacity: 0.15,
    }).addTo(map)

    mapInstances.set(task.id, map)
  }
}

watch(tasks, async () => {
  await nextTick()
  renderMaps()
})

onBeforeUnmount(() => {
  destroyMaps()
})

function emergencyLabel(level: number): string {
  if (level >= 3) return t('coordinator.emergency_severe')
  if (level === 2) return t('coordinator.emergency_large_scale')
  return t('coordinator.emergency_low')
}

async function handleJoin(task: OpenTask) {
  joiningId.value = task.id
  joinError.value = ''
  joinSuccess.value = ''
  try {
    await joinOpenTask(task.id)
    joinSuccess.value = t('openTasks.join_success', { title: task.title })
    // Xoá khỏi danh sách ngay — BE không loại trừ nhiệm vụ mình đã tham gia
    // khỏi /open-tasks nếu request còn thiếu người (targetHeadcount > 1).
    tasks.value = tasks.value.filter((item) => item.id !== task.id)
  } catch (e: unknown) {
    joinError.value = e instanceof Error ? e.message : t('openTasks.join_failed')
  } finally {
    joiningId.value = null
  }
}
</script>

<style scoped>
.open-tasks-page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.page-sub { font-size: 13.5px; color: #718096; margin: 0; }

.banner { border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
.banner--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

.card { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }
.empty-state--error { color: #e11d48; }

.task-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.task-card {
  border: 1px solid #eef2f7; border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 8px; background: #f8fafc;
}
.task-card__level { align-self: flex-start; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.task-card__level.elv-1 { background: #dcfce7; color: #15803d; }
.task-card__level.elv-2 { background: #fef9c3; color: #854d0e; }
.task-card__level.elv-3 { background: #fee2e2; color: #991b1b; }
.task-card__title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0; }
.task-card__region { font-size: 13px; color: #475569; margin: 0; }
.task-card__slots { font-size: 12.5px; color: #ea580c; font-weight: 600; margin: 0; }
.task-card__time { font-size: 11.5px; color: #a0aec0; margin: 0; }

.map-block { margin-top: 4px; }
.region-map {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  z-index: 0;
}
.map-empty {
  margin: 0;
  padding: 10px;
  text-align: center;
  font-size: 11.5px;
  color: #a0aec0;
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
}
.btn-join {
  margin-top: 6px; background: #e11d48; color: #fff; border: none; padding: 9px 16px;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-join:hover:not(:disabled) { background: #be123c; }
.btn-join:disabled { opacity: 0.6; cursor: not-allowed; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 12px 0 0 0; }
</style>

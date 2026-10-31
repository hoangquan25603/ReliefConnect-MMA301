<template>
  <div class="dm-panel">
    <div class="dm-header">
      <div>
        <h2 class="dm-title">{{ $t('admin.map_title') }}</h2>
        <p class="dm-sub">{{ $t('admin.map_sub') }}</p>
      </div>
      <button class="dm-list-toggle" @click="showList = !showList">
        {{ showList ? $t('admin.btn_view_map') : $t('admin.btn_view_list') }}
      </button>
    </div>

    <div v-if="isLoading" class="dm-loading">
      <div class="loading-spinner" />
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="totalPoints === 0" class="dm-empty">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ $t('admin.no_map_data') }}
    </div>

    <!-- List view (fallback / accessibility) -->
    <div v-else-if="showList" class="dm-list-wrap">
      <div class="dm-list-group">
        <p class="dm-list-group-title">{{ $t('admin.nav_requests') }} ({{ mapData?.requests.length ?? 0 }})</p>
        <div v-for="r in mapData?.requests" :key="r.id" class="dm-list-item">
          <span class="dm-list-dot" :style="{ background: severityColor(r.emergencyLevel) }" />
          <span class="dm-list-item-title">{{ r.title }}</span>
          <span class="dm-list-item-tag">{{ severityLabel(r.emergencyLevel) }} · {{ r.status }}</span>
        </div>
      </div>
      <div class="dm-list-group">
        <p class="dm-list-group-title">{{ $t('nav.warehouse') }} ({{ mapData?.warehouses.length ?? 0 }})</p>
        <div v-for="w in mapData?.warehouses" :key="w.id" class="dm-list-item">
          <span class="dm-list-dot" style="background: #6b46c1;" />
          <span class="dm-list-item-title">{{ w.name }}</span>
        </div>
      </div>
    </div>

    <!-- Map -->
    <template v-else>
      <div ref="mapElRef" class="dm-map" />
      <div class="dm-legend">
        <span class="dm-legend-item"><span class="dm-legend-dot" style="background:#fecaca; width:8px; height:8px;" />{{ $t('coordinator.emergency_low') }}</span>
        <span class="dm-legend-item"><span class="dm-legend-dot" style="background:#f87171; width:11px; height:11px;" />{{ $t('coordinator.emergency_large_scale') }}</span>
        <span class="dm-legend-item"><span class="dm-legend-dot" style="background:#b91c1c; width:14px; height:14px;" />{{ $t('coordinator.emergency_severe') }}</span>
        <span class="dm-legend-item"><span class="dm-legend-dot dm-legend-dot--sq" style="background:#6b46c1;" />{{ $t('nav.warehouse') }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getDashboardMap, type DashboardMap } from '@/features/dashboard/dashboard.api'

const { locale, t } = useI18n()

const mapData = ref<DashboardMap | null>(null)
const isLoading = ref(true)
const showList = ref(false)
const mapElRef = ref<HTMLElement | null>(null)

let mapInstance: L.Map | null = null

const totalPoints = computed(() => (mapData.value?.requests.length ?? 0) + (mapData.value?.warehouses.length ?? 0))

function severityColor(level: number): string {
  if (level >= 3) return '#b91c1c'
  if (level === 2) return '#f87171'
  return '#fecaca'
}
function severityRadius(level: number): number {
  if (level >= 3) return 9
  if (level === 2) return 7.5
  return 6
}
function severityLabel(level: number): string {
  if (level >= 3) return t('coordinator.emergency_severe')
  if (level === 2) return t('coordinator.emergency_large_scale')
  return t('coordinator.emergency_low')
}

async function load() {
  isLoading.value = true
  try {
    mapData.value = await getDashboardMap()
  } catch (error) {
    console.error('Failed to load dashboard map', error)
    mapData.value = null
  } finally {
    isLoading.value = false
  }
}

function renderMap() {
  if (!mapElRef.value || !mapData.value) return

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  const map = L.map(mapElRef.value, { scrollWheelZoom: false })
  mapInstance = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  const bounds: L.LatLngTuple[] = []

  const levelText = locale.value === 'vi' ? 'Mức độ' : 'Emergency'
  const statusText = locale.value === 'vi' ? 'Trạng thái' : 'Status'
  const warehouseText = locale.value === 'vi' ? 'Kho hàng' : 'Warehouse'

  for (const r of mapData.value.requests) {
    const pos: L.LatLngTuple = [r.latitude, r.longitude]
    bounds.push(pos)
    L.circleMarker(pos, {
      radius: severityRadius(r.emergencyLevel),
      fillColor: severityColor(r.emergencyLevel),
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2,
    })
      .bindPopup(`<strong>${escapeHtml(r.title)}</strong><br>${levelText}: ${severityLabel(r.emergencyLevel)}<br>${statusText}: ${escapeHtml(r.status)}`)
      .addTo(map)
  }

  const warehouseIcon = L.divIcon({
    className: 'dm-warehouse-icon',
    html: '<span></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

  for (const w of mapData.value.warehouses) {
    const pos: L.LatLngTuple = [w.latitude, w.longitude]
    bounds.push(pos)
    L.marker(pos, { icon: warehouseIcon })
      .bindPopup(`<strong>${escapeHtml(w.name)}</strong><br>${warehouseText}`)
      .addTo(map)
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 13 })
  } else {
    map.setView([16.0, 106.0], 5) // fallback: trung tâm Việt Nam
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

onMounted(async () => {
  await load()
  if (!showList.value) {
    await nextTick()
    renderMap()
  }
})

watch(showList, async (hidden) => {
  if (!hidden) {
    await nextTick()
    renderMap()
  }
})

watch(locale, async () => {
  if (!showList.value) {
    await nextTick()
    renderMap()
  }
})

onBeforeUnmount(() => {
  mapInstance?.remove()
  mapInstance = null
})
</script>

<style scoped>
.dm-panel {
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
}

.dm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.dm-title { font-size: 15px; font-weight: 700; color: #1a3b5c; margin: 0; }
.dm-sub { font-size: 12.5px; color: #718096; margin: 4px 0 0; }

.dm-list-toggle {
  border: 1px solid #e9ecef;
  background: #fff;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}
.dm-list-toggle:hover { border-color: #1a4f8d; color: #1a4f8d; }

.dm-loading, .dm-empty {
  padding: 50px 20px;
  text-align: center;
  color: #a0aec0;
  font-size: 13.5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.loading-spinner {
  width: 26px; height: 26px;
  border: 3px solid #e9ecef;
  border-top-color: #6b46c1;
  border-radius: 50%;
  animation: dm-spin 0.7s linear infinite;
}
@keyframes dm-spin { to { transform: rotate(360deg); } }

.dm-map {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  z-index: 0;
}

.dm-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
  font-size: 12px;
  color: #4a5568;
  font-weight: 500;
}
.dm-legend-item { display: flex; align-items: center; gap: 6px; }
.dm-legend-dot { border-radius: 50%; display: inline-block; flex-shrink: 0; }
.dm-legend-dot--sq { width: 10px; height: 10px; border-radius: 3px; }

/* List view */
.dm-list-wrap { max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }
.dm-list-group-title { font-size: 11.5px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 0.3px; margin: 0 0 8px; }
.dm-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
}
.dm-list-item:hover { background: #f8fafc; }
.dm-list-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dm-list-item-title { flex: 1; min-width: 0; color: #2d3748; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dm-list-item-tag { font-size: 11px; color: #a0aec0; flex-shrink: 0; }
</style>

<style>
/* Global (unscoped): Leaflet divIcon nội dung phải là selector toàn cục */
.dm-warehouse-icon span {
  display: block;
  width: 14px;
  height: 14px;
  background: #6b46c1;
  border: 2px solid #fff;
  border-radius: 3px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
</style>

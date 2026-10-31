<template>
  <div class="rot-panel">
    <div class="rot-header">
      <div>
        <h2 class="rot-title">{{ $t('admin.chart_title') }}</h2>
        <p class="rot-sub">
          <template v-if="!isLoading && data.length">
            {{ locale === 'vi' ? 'Tổng' : 'Total' }} <strong>{{ total.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') }}</strong> {{ $t('admin.chart_sub', { days }) }}
          </template>
          <template v-else>&nbsp;</template>
        </p>
      </div>
      <div class="rot-controls">
        <div class="rot-presets">
          <button
            v-for="preset in presets"
            :key="preset"
            class="rot-preset-btn"
            :class="{ active: days === preset }"
            @click="days = preset"
          >
            {{ preset }} {{ $t('admin.days') }}
          </button>
        </div>
        <button class="rot-table-toggle" @click="showTable = !showTable">
          {{ showTable ? $t('admin.btn_view_chart') : $t('admin.btn_view_table') }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="rot-loading">
      <div class="loading-spinner" />
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="data.length === 0" class="rot-empty">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M18 8l-5 5-4-4-4 4"/></svg>
      {{ $t('admin.no_chart_data') }}
    </div>

    <!-- Table view (fallback / accessibility) -->
    <div v-else-if="showTable" class="rot-table-wrap">
      <table class="rot-table">
        <thead>
          <tr><th>{{ $t('admin.col_date') }}</th><th>{{ $t('admin.col_request_count') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in [...data].reverse()" :key="item.date">
            <td>{{ formatDate(item.date) }}</td>
            <td class="rot-table-count">{{ item.count }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Chart -->
    <div v-else class="rot-chart-wrap" ref="chartWrapRef" @pointermove="onPointerMove" @pointerleave="hoverIndex = null">
      <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="rot-svg">
        <!-- Gridlines -->
        <g>
          <line
            v-for="tick in yTicks"
            :key="tick"
            :x1="padLeft" :x2="W"
            :y1="yScale(tick)" :y2="yScale(tick)"
            class="rot-gridline"
          />
        </g>

        <!-- Area fill -->
        <path :d="areaPath" class="rot-area" />
        <!-- Line -->
        <path :d="linePath" class="rot-line" />

        <!-- Crosshair -->
        <line
          v-if="hoverIndex !== null"
          :x1="xScale(hoverIndex)" :x2="xScale(hoverIndex)"
          :y1="0" :y2="H - padBottom"
          class="rot-crosshair"
        />

        <!-- End dot (always visible) -->
        <circle :cx="xScale(data.length - 1)" :cy="yScale(lastCount)" r="5" class="rot-enddot" />
        <!-- Hover dot -->
        <circle
          v-if="hoverIndex !== null"
          :cx="xScale(hoverIndex)" :cy="yScale(data[hoverIndex].count)"
          r="5" class="rot-hoverdot"
        />

        <!-- Y axis labels -->
        <text v-for="tick in yTicks" :key="`lbl-${tick}`" :x="padLeft - 8" :y="yScale(tick) + 4" class="rot-axis-label" text-anchor="end">
          {{ tick }}
        </text>
      </svg>

      <!-- Direct end-label (latest value) -->
      <div class="rot-end-label" :style="{ left: `${(xScale(data.length - 1) / W) * 100}%`, top: `${(yScale(lastCount) / H) * 100}%` }">
        {{ lastCount }}
      </div>

      <!-- Tooltip -->
      <div
        v-if="hoverIndex !== null"
        class="rot-tooltip"
        :style="tooltipStyle"
      >
        <div class="rot-tooltip-date">{{ formatDate(data[hoverIndex].date) }}</div>
        <div class="rot-tooltip-row">
          <span class="rot-tooltip-key" />
          <span class="rot-tooltip-value">{{ data[hoverIndex].count }} {{ $t('admin.requests_unit') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRequestsOverTime, type RequestsOverTimeItem } from '@/features/dashboard/dashboard.api'

const { locale } = useI18n()

const presets = [7, 30, 90] as const
const days = ref<7 | 30 | 90>(30)
const data = ref<RequestsOverTimeItem[]>([])
const isLoading = ref(true)
const showTable = ref(false)
const hoverIndex = ref<number | null>(null)
const chartWrapRef = ref<HTMLElement | null>(null)

async function load() {
  isLoading.value = true
  try {
    data.value = await getRequestsOverTime(days.value)
  } catch (error) {
    console.error('Failed to load requests-over-time', error)
    data.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(days, load)

const total = computed(() => data.value.reduce((sum, d) => sum + d.count, 0))
const lastCount = computed(() => data.value[data.value.length - 1]?.count ?? 0)

// ── Chart geometry ────────────────────────────────────────────
const W = 640
const H = 220
const padLeft = 34
const padBottom = 22

const maxCount = computed(() => Math.max(...data.value.map((d) => d.count), 0))

// Vòng số tròn cho trục Y: bước 1/2/5 × 10^n
function niceCeil(value: number): number {
  if (value <= 0) return 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

const yMax = computed(() => niceCeil(maxCount.value * 1.15 || 4))
const yTicks = computed(() => {
  const max = yMax.value
  return [0, Math.round(max * 0.5), max]
})

function xScale(index: number): number {
  const n = data.value.length
  if (n <= 1) return padLeft
  return padLeft + (index / (n - 1)) * (W - padLeft)
}
function yScale(count: number): number {
  const max = yMax.value || 1
  return (H - padBottom) - (count / max) * (H - padBottom)
}

const linePath = computed(() => {
  if (data.value.length === 0) return ''
  return data.value
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.count)}`)
    .join(' ')
})
const areaPath = computed(() => {
  if (data.value.length === 0) return ''
  const base = H - padBottom
  const first = `M ${xScale(0)} ${base}`
  const line = data.value.map((d, i) => `L ${xScale(i)} ${yScale(d.count)}`).join(' ')
  const last = `L ${xScale(data.value.length - 1)} ${base} Z`
  return `${first} ${line} ${last}`
})

function onPointerMove(e: PointerEvent) {
  const wrap = chartWrapRef.value
  if (!wrap || data.value.length === 0) return
  const rect = wrap.getBoundingClientRect()
  const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  const n = data.value.length
  hoverIndex.value = Math.round(fraction * (n - 1))
}

const tooltipStyle = computed(() => {
  if (hoverIndex.value === null) return {}
  const xPct = (xScale(hoverIndex.value) / W) * 100
  const clamped = Math.min(85, Math.max(5, xPct))
  return { left: `${clamped}%` }
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' })
}
</script>

<style scoped>
.rot-panel {
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
}

.rot-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.rot-title { font-size: 15px; font-weight: 700; color: #1a3b5c; margin: 0; }
.rot-sub { font-size: 12.5px; color: #718096; margin: 4px 0 0; }
.rot-sub strong { color: #1a3b5c; font-weight: 700; }

.rot-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rot-presets { display: flex; gap: 4px; background: #f8fafc; border-radius: 8px; padding: 3px; }
.rot-preset-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.rot-preset-btn.active { background: #fff; color: #e27d24; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.rot-preset-btn:hover:not(.active) { color: #4a5568; }

.rot-table-toggle {
  border: 1px solid #e9ecef;
  background: #fff;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  border-radius: 8px;
  cursor: pointer;
}
.rot-table-toggle:hover { border-color: #1a4f8d; color: #1a4f8d; }

/* Loading / empty */
.rot-loading, .rot-empty {
  padding: 40px 20px;
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
  border-top-color: #e27d24;
  border-radius: 50%;
  animation: rot-spin 0.7s linear infinite;
}
@keyframes rot-spin { to { transform: rotate(360deg); } }

/* Table view */
.rot-table-wrap { max-height: 260px; overflow-y: auto; }
.rot-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rot-table th {
  text-align: left;
  padding: 8px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  background: #fff;
}
.rot-table td { padding: 8px 10px; border-bottom: 1px solid #f1f3f5; color: #2d3748; }
.rot-table-count { font-weight: 700; font-variant-numeric: tabular-nums; color: #1a3b5c; }

/* Chart */
.rot-chart-wrap { position: relative; width: 100%; }
.rot-svg { width: 100%; height: 220px; display: block; touch-action: none; }

.rot-gridline { stroke: #e9ecef; stroke-width: 1; }
.rot-axis-label { font-size: 10px; fill: #a0aec0; font-variant-numeric: tabular-nums; }

.rot-area { fill: #e27d24; opacity: 0.1; }
.rot-line { fill: none; stroke: #e27d24; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.rot-crosshair { stroke: #a0aec0; stroke-width: 1; }

.rot-enddot { fill: #e27d24; stroke: #fff; stroke-width: 2; }
.rot-hoverdot { fill: #e27d24; stroke: #fff; stroke-width: 2; }

.rot-end-label {
  position: absolute;
  transform: translate(8px, -50%);
  font-size: 12px;
  font-weight: 700;
  color: #1a3b5c;
  background: #fff;
  padding: 1px 6px;
  border-radius: 6px;
  pointer-events: none;
  white-space: nowrap;
}

.rot-tooltip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  background: #1a2d3d;
  color: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  white-space: nowrap;
}
.rot-tooltip-date { font-size: 11px; color: #cbd5e0; margin-bottom: 4px; }
.rot-tooltip-row { display: flex; align-items: center; gap: 6px; }
.rot-tooltip-key { width: 10px; height: 2px; background: #e27d24; border-radius: 2px; display: inline-block; }
.rot-tooltip-value { font-weight: 700; }
</style>

<template>
  <AdminLayout>
    <div class="asgn-page">
      <!-- ── Header ──────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="role-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {{ $t('admin.assignments_title') }}
          </div>
          <h1 class="page-title">{{ $t('admin.assignments_title') }}</h1>
          <p class="page-sub">{{ $t('admin.assignments_sub') }}</p>
        </div>
        <div class="header-stats">
          <div class="hstat" v-for="s in headerStats" :key="s.label" :style="{ '--hs-color': s.color }">
            <span class="hstat__val">{{ s.val }}</span>
            <span class="hstat__label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────────────────── -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          {{ $t('admin.tab_all_assignments') }}
          <span class="tab-count">{{ assignments.length }}</span>
        </button>
        <button
          class="tab-btn tab-btn--danger"
          :class="{ active: activeTab === 'pending' }"
          @click="switchToPending"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ $t('admin.tab_pending_cancellations') }}
          <span class="tab-count tab-count--danger" v-if="pendingCancellations.length > 0">{{ pendingCancellations.length }}</span>
        </button>
      </div>

      <!-- ── Đang lọc theo 1 yêu cầu cụ thể (điều hướng từ "Quản lý đội") ── -->
      <div v-if="filterRequestId" class="request-filter-banner">
        <span>{{ $t('admin.filtered_by_request', { title: filterRequestTitle ?? filterRequestId }) }}</span>
        <button class="btn-clear-filter" @click="clearRequestFilter">{{ $t('admin.btn_clear_filter') }}</button>
      </div>

      <!-- ══════ TAB: TẤT CẢ PHÂN CÔNG ══════ -->
      <template v-if="activeTab === 'all'">
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" class="search-input" :placeholder="$t('admin.search_assignments')" />
          </div>
          <div class="status-filters">
            <button
              v-for="f in statusFilters"
              :key="f.key"
              class="status-filter-btn"
              :class="{ active: activeStatusFilter === f.key }"
              :style="activeStatusFilter === f.key ? { '--af-bg': f.bg, '--af-color': f.color } : {}"
              @click="activeStatusFilter = f.key"
            >
              <span class="filter-dot" :style="{ background: f.dot }" />
              {{ f.label }}
              <span class="filter-count">{{ f.count }}</span>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner" /> {{ $t('common.loading') }}
          </div>
          <div v-else-if="displayedRows.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>{{ $t('admin.no_assignments') }}</p>
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>{{ $t('admin.col_request') }}</th>
                <th>{{ $t('admin.col_volunteer') }}</th>
                <th class="th-center">{{ $t('admin.col_status') }}</th>
                <th>{{ $t('admin.col_assigned_date') }}</th>
                <th>{{ $t('admin.col_completed_date') }}</th>
                <th class="th-center">{{ $t('admin.col_cancellation') }}</th>
                <th class="th-center">{{ $t('admin.col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedRows"
                :key="row.id"
                class="data-row"
                @click="openDrawer(row)"
              >
                <td class="td-req">{{ row.reliefRequestTitle }}</td>
                <td class="td-vol">
                  <div class="vol-mini">
                    <div class="vol-mini__avatar">{{ row.volunteerFullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                    <span class="vol-mini__name">{{ row.volunteerFullName }}</span>
                    <svg v-if="row.isTeamLead" class="vol-mini__lead-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" :title="$t('admin.team_lead_badge')"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4l-6.3 4.6 2.3-7.2-6-4.6h7.6z"/></svg>
                  </div>
                </td>
                <td class="th-center">
                  <span class="status-badge" :style="asnBadgeStyle(row.status)">
                    <span class="status-dot" :style="asnDotStyle(row.status)" />
                    {{ ASN_STATUS_LABEL[row.status] }}
                  </span>
                </td>
                <td class="td-date">{{ fmtDate(row.assignedAt) }}</td>
                <td class="td-date">{{ row.completedAt ? fmtDate(row.completedAt) : '—' }}</td>
                <td class="th-center">
                  <span v-if="row.cancellationRequested" class="cancel-req-badge">{{ $t('admin.has_cancel_request') }}</span>
                  <span v-else class="no-badge">—</span>
                </td>
                <td class="th-center" @click.stop>
                  <button class="btn-view" @click="openDrawer(row)">{{ $t('admin.btn_details') }}</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="displayedRows.length > pageSize" class="admin-pagination">
            <button class="page-btn" :disabled="!hasPrevAll" @click="changePageAll(-1)">{{ $t('admin.page_prev') }}</button>
            <span class="page-info">{{ $t('admin.page_info', { page: currentPageAll, total: totalPagesAll }) }}</span>
            <button class="page-btn" :disabled="!hasNextAll" @click="changePageAll(1)">{{ $t('admin.page_next') }}</button>
          </div>
        </div>
      </template>

      <!-- ══════ TAB: ĐƠN XIN HUỶ ══════ -->
      <template v-else>
        <div class="table-card" style="margin-top: 16px;">
          <div v-if="isPendingLoading" class="loading-state">
            <div class="spinner" /> {{ $t('common.loading') }}
          </div>
          <div v-else-if="pendingCancellations.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p>{{ $t('admin.no_assignments') }}</p>
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>{{ $t('admin.col_request') }}</th>
                <th>{{ $t('admin.col_volunteer') }}</th>
                <th>{{ $t('admin.col_cancellation') }}</th>
                <th>{{ $t('admin.col_assigned_date') }}</th>
                <th class="th-center">{{ $t('admin.col_actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedPendingCancellations" :key="row.id" class="data-row">
                <td class="td-req">{{ row.reliefRequestTitle }}</td>
                <td class="td-vol">
                  <div class="vol-mini">
                    <div class="vol-mini__avatar">{{ row.volunteerFullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                    <span class="vol-mini__name">{{ row.volunteerFullName }}</span>
                    <svg v-if="row.isTeamLead" class="vol-mini__lead-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" :title="$t('admin.team_lead_badge')"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4l-6.3 4.6 2.3-7.2-6-4.6h7.6z"/></svg>
                  </div>
                </td>
                <td class="td-reason">{{ row.cancellationReason ?? '—' }}</td>
                <td class="td-date">{{ row.cancellationRequestedAt ? fmtDate(row.cancellationRequestedAt) : '—' }}</td>
                <td class="th-center" style="white-space: nowrap;">
                  <div class="action-btns">
                    <button
                      class="btn-approve"
                      :disabled="processingId === row.id"
                      @click="handleApprove(row)"
                    >
                      <svg v-if="processingId === row.id && processingAction === 'approve'" class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ $t('admin.btn_approve') }}
                    </button>
                    <button
                      class="btn-reject"
                      :disabled="processingId === row.id"
                      @click="handleReject(row)"
                    >
                      <svg v-if="processingId === row.id && processingAction === 'reject'" class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {{ $t('admin.btn_reject') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="sortedPendingCancellations.length > pageSize" class="admin-pagination">
            <button class="page-btn" :disabled="!hasPrevPending" @click="changePagePending(-1)">{{ $t('admin.page_prev') }}</button>
            <span class="page-info">{{ $t('admin.page_info', { page: currentPagePending, total: totalPagesPending }) }}</span>
            <button class="page-btn" :disabled="!hasNextPending" @click="changePagePending(1)">{{ $t('admin.page_next') }}</button>
          </div>
        </div>
        <p v-if="pendingMsg" class="global-msg" :class="pendingMsgType === 'error' ? 'msg--error' : 'msg--ok'">{{ pendingMsg }}</p>
      </template>

      <!-- ── Detail Modal ──────────────────────────────── -->
      <Transition name="modal">
        <div v-if="drawerOpen" class="modal-overlay" @click.self="closeDrawer">
          <div class="modal-box">

            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header__inner">
                <p class="modal-subtitle">{{ $t('admin.btn_details') }}</p>
                <h2 class="modal-title">{{ selected?.reliefRequestTitle }}</h2>
              </div>
              <button class="modal-close" @click="closeDrawer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <template v-if="selected">
              <!-- Volunteer info strip -->
              <div class="vol-strip">
                <div class="vol-strip__avatar">{{ selected.volunteerFullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                <div class="vol-strip__info">
                  <span class="vol-strip__name">{{ selected.volunteerFullName }}</span>
                  <span class="status-badge" :style="asnBadgeStyle(selected.status)">
                    <span class="status-dot" :style="asnDotStyle(selected.status)" />
                    {{ ASN_STATUS_LABEL[selected.status] }}
                  </span>
                  <span v-if="selected.isTeamLead" class="team-lead-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4l-6.3 4.6 2.3-7.2-6-4.6h7.6z"/></svg>
                    {{ $t('admin.team_lead_badge') }}
                  </span>
                </div>
              </div>

              <!-- Timeline -->
              <div class="modal-timeline">
                <div
                  v-for="(step, i) in statusTimeline"
                  :key="step.key"
                  class="mtl-step"
                  :class="{
                    'mtl--done':    isStepDone(step.key),
                    'mtl--current': isStepCurrent(step.key),
                    'mtl--future':  isStepFuture(step.key),
                    'mtl--last':    i === statusTimeline.length - 1,
                  }"
                >
                  <div class="mtl-dot">
                    <svg v-if="isStepDone(step.key)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span v-else-if="isStepCurrent(step.key)" class="mtl-pulse" />
                  </div>
                  <div class="mtl-content">
                    <p class="mtl-label">{{ step.label }}</p>
                    <p class="mtl-time">{{ stepTime(step.key) ?? (isStepFuture(step.key) ? '—' : '') }}</p>
                  </div>
                </div>
              </div>

              <!-- Info cards -->
              <div class="modal-cards">
                <!-- Card: Yêu cầu cứu trợ -->
                <div class="info-card">
                  <div class="info-card__header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {{ $t('admin.col_request') }}
                  </div>
                  <p class="info-card__sublabel">{{ $t('admin.col_request_title') }}</p>
                  <p class="info-card__val">{{ selected.reliefRequestTitle }}</p>
                  <template v-if="selected.note">
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.col_skill_desc') }}</p>
                    <p class="info-card__val info-card__val--note">{{ selected.note }}</p>
                  </template>
                  <template v-if="selected.cancellationRequested">
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.col_cancellation') }}</p>
                    <p class="info-card__val reason-text">{{ selected.cancellationReason }}</p>
                  </template>
                </div>

                <!-- Card: Thời gian -->
                <div class="info-card">
                  <div class="info-card__header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ $t('admin.section_location_time') }}
                  </div>
                  <p class="info-card__sublabel">{{ $t('admin.col_assigned_date') }}</p>
                  <div class="info-card__datebox">{{ fmtDate(selected.assignedAt) }}</div>
                  <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.col_completed_date') }}</p>
                  <div class="info-card__datebox info-card__datebox--muted">{{ selected.completedAt ? fmtDate(selected.completedAt) : '—' }}</div>
                </div>
              </div>

              <!-- Admin actions -->
              <div class="modal-admin">
                <p class="modal-admin__label">{{ $t('admin.col_actions') }}</p>

                <!-- Cancel request banner -->
                <template v-if="selected.cancellationRequested && selected.status !== 'Cancelled'">
                  <div class="cancel-req-banner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ $t('admin.has_cancel_request') }} — <strong>{{ fmtDate(selected.cancellationRequestedAt!) }}</strong></span>
                  </div>
                  <div class="action-btns" style="margin-top:10px">
                    <button class="btn-approve btn-lg" :disabled="isActioning" @click="handleApprove(selected)">
                      <svg v-if="isActioning && actionType === 'approve'" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ $t('admin.btn_approve') }}
                    </button>
                    <button class="btn-reject btn-lg" :disabled="isActioning" @click="handleReject(selected)">
                      <svg v-if="isActioning && actionType === 'reject'" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {{ $t('admin.btn_reject') }}
                    </button>
                  </div>
                </template>

                <!-- Force cancel -->
                <template v-if="selected.status !== 'Completed' && selected.status !== 'Cancelled'">
                  <div class="force-cancel-block">
                    <p class="fc-title">{{ $t('admin.col_cancellation') }}</p>
                    <div class="fc-row">
                      <input
                        v-model="forceCancelReason"
                        class="fc-input"
                        :placeholder="$t('admin.col_cancellation')"
                        :disabled="isActioning"
                      />
                      <button
                        class="btn-force-cancel"
                        :disabled="isActioning || !forceCancelReason.trim()"
                        @click="handleForceCancel"
                      >
                        <svg v-if="isActioning && actionType === 'force'" class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                        {{ $t('admin.btn_lock') }}
                      </button>
                    </div>
                  </div>
                </template>

                <!-- Team lead -->
                <template v-if="selected.status === 'Accepted' || selected.status === 'OnTheWay'">
                  <div class="team-lead-block">
                    <p class="fc-title">{{ $t('admin.team_lead_section_title') }}</p>
                    <button
                      v-if="!selected.isTeamLead"
                      class="btn-team-lead"
                      :disabled="isActioning"
                      @click="handleSetTeamLead"
                    >
                      <svg v-if="isActioning && actionType === 'team-lead'" class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      {{ $t('admin.btn_set_team_lead') }}
                    </button>
                    <button
                      v-else
                      class="btn-remove-team-lead"
                      :disabled="isActioning"
                      @click="handleRemoveTeamLead"
                    >
                      <svg v-if="isActioning && actionType === 'remove-team-lead'" class="spin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      {{ $t('admin.btn_remove_team_lead') }}
                    </button>
                  </div>
                </template>

                <p v-if="drawerMsg" class="status-msg" :class="drawerMsgType === 'error' ? 'msg--error' : 'msg--ok'">{{ drawerMsg }}</p>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  getAssignments,
  getPendingCancellations,
  approveCancellation,
  rejectCancellation,
  adminCancelAssignment,
  setTeamLead,
  type Assignment,
  type AssignmentStatus,
} from '@/features/tasks/assignments.api'
import { removeTeamLead } from '@/features/requests/requests.api'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const fmtDate = (dateStr: string) => {
  void locale.value
  return new Date(dateStr).toLocaleString(locale.value === 'vi' ? 'vi-VN' : 'en-US')
}

// ── Status config ─────────────────────────────────────────────
const ASN_STATUS_LABEL = computed<Record<AssignmentStatus, string>>(() => {
  void locale.value
  return {
    Assigned:  locale.value === 'vi' ? 'Đã giao' : 'Assigned',
    Accepted:  locale.value === 'vi' ? 'Đã nhận' : 'Accepted',
    OnTheWay:  locale.value === 'vi' ? 'Đang đi' : 'On The Way',
    Completed: locale.value === 'vi' ? 'Hoàn thành' : 'Completed',
    Cancelled: locale.value === 'vi' ? 'Đã huỷ' : 'Cancelled',
  }
})

interface StatusStyle { bg: string; color: string; dot: string }
const ASN_STATUS_STYLE: Record<AssignmentStatus, StatusStyle> = {
  Assigned:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  Accepted:  { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  OnTheWay:  { bg: '#ffedd5', color: '#9a3412', dot: '#f97316' },
  Completed: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  Cancelled: { bg: '#f1f5f9', color: '#4b5563', dot: '#94a3b8' },
}

function asnBadgeStyle(s: AssignmentStatus) {
  const c = ASN_STATUS_STYLE[s]
  return { background: c.bg, color: c.color }
}
function asnDotStyle(s: AssignmentStatus) {
  return { background: ASN_STATUS_STYLE[s].dot }
}

// Timeline steps (volunteer flow)
const statusTimeline = computed(() => {
  void locale.value
  return [
    { key: 'Assigned',  label: locale.value === 'vi' ? 'Đã phân công' : 'Assigned' },
    { key: 'Accepted',  label: locale.value === 'vi' ? 'TNV đã nhận' : 'Accepted by Volunteer' },
    { key: 'OnTheWay',  label: locale.value === 'vi' ? 'Đang trên đường' : 'On The Way' },
    { key: 'Completed', label: locale.value === 'vi' ? 'Hoàn thành' : 'Completed' },
  ]
})
const STATUS_ORDER: AssignmentStatus[] = ['Assigned', 'Accepted', 'OnTheWay', 'Completed', 'Cancelled']

// ── State ────────────────────────────────────────────────────
const assignments          = ref<Assignment[]>([])
const pendingCancellations = ref<Assignment[]>([])
const isLoading            = ref(true)
const isPendingLoading     = ref(false)

const activeTab          = ref<'all' | 'pending'>('all')
const searchQuery        = ref('')
const activeStatusFilter = ref<string>('all')

const drawerOpen      = ref(false)
const selected        = ref<Assignment | null>(null)
const drawerMsg       = ref('')
const drawerMsgType   = ref<'ok' | 'error'>('ok')
const forceCancelReason = ref('')

const isActioning  = ref(false)
const actionType   = ref<'approve' | 'reject' | 'force' | 'team-lead' | 'remove-team-lead' | null>(null)

// For pending tab inline actions
const processingId     = ref<string | null>(null)
const processingAction = ref<'approve' | 'reject' | null>(null)
const pendingMsg       = ref('')
const pendingMsgType   = ref<'ok' | 'error'>('ok')

// ── Computed ─────────────────────────────────────────────────
const headerStats = computed(() => {
  void locale.value
  const labels = ASN_STATUS_LABEL.value
  return [
    { label: labels.Assigned,   val: assignments.value.filter(a => a.status === 'Assigned').length,  color: '#3b82f6' },
    { label: labels.OnTheWay,   val: assignments.value.filter(a => a.status === 'OnTheWay').length,  color: '#f97316' },
    { label: labels.Completed,  val: assignments.value.filter(a => a.status === 'Completed').length, color: '#10b981' },
    { label: t('admin.status_pending'), val: pendingCancellations.value.length,                     color: '#ef4444' },
  ]
})

const statusFilters = computed(() => {
  void locale.value
  const all = assignments.value
  const labels = ASN_STATUS_LABEL.value
  const countOf = (s: AssignmentStatus) => all.filter(a => a.status === s).length
  return [
    { key: 'all',       label: locale.value === 'vi' ? 'Tất cả' : 'All', dot: '#94a3b8', bg: '#f1f5f9', color: '#475569', count: all.length },
    { key: 'Assigned',  label: labels.Assigned,  dot: '#3b82f6', bg: '#dbeafe', color: '#1d4ed8', count: countOf('Assigned') },
    { key: 'Accepted',  label: labels.Accepted,  dot: '#8b5cf6', bg: '#ede9fe', color: '#6d28d9', count: countOf('Accepted') },
    { key: 'OnTheWay',  label: labels.OnTheWay,  dot: '#f97316', bg: '#ffedd5', color: '#9a3412', count: countOf('OnTheWay') },
    { key: 'Completed', label: labels.Completed, dot: '#10b981', bg: '#d1fae5', color: '#065f46', count: countOf('Completed') },
    { key: 'Cancelled', label: labels.Cancelled, dot: '#94a3b8', bg: '#f3f4f6', color: '#4b5563', count: countOf('Cancelled') },
  ]
})

const displayedRows = computed(() => {
  let list = assignments.value
  if (activeStatusFilter.value !== 'all') {
    list = list.filter(a => a.status === activeStatusFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      a.volunteerFullName.toLowerCase().includes(q) ||
      a.reliefRequestTitle.toLowerCase().includes(q),
    )
  }
  // Sắp xếp theo yêu cầu cứu trợ trước — các TNV cùng 1 đơn sẽ hiện liền kề nhau,
  // trong cùng 1 nhóm sắp theo tên TNV cho dễ quét.
  return [...list].sort((a, b) =>
    a.reliefRequestTitle.localeCompare(b.reliefRequestTitle) ||
    a.volunteerFullName.localeCompare(b.volunteerFullName),
  )
})

const sortedPendingCancellations = computed(() =>
  [...pendingCancellations.value].sort((a, b) =>
    a.reliefRequestTitle.localeCompare(b.reliefRequestTitle) ||
    a.volunteerFullName.localeCompare(b.volunteerFullName),
  ),
)

// ── Phân trang (giống trang Quản lý người dùng) — mỗi tab giữ trang riêng ──────
const pageSize = 10

const currentPageAll = ref(1)
const totalPagesAll  = computed(() => Math.ceil(displayedRows.value.length / pageSize) || 1)
const hasPrevAll      = computed(() => currentPageAll.value > 1)
const hasNextAll      = computed(() => currentPageAll.value < totalPagesAll.value)
const paginatedRows  = computed(() =>
  displayedRows.value.slice((currentPageAll.value - 1) * pageSize, currentPageAll.value * pageSize),
)
function changePageAll(delta: number) {
  currentPageAll.value = Math.min(Math.max(1, currentPageAll.value + delta), totalPagesAll.value)
}
watch([activeStatusFilter, searchQuery], () => { currentPageAll.value = 1 })
// Danh sách co lại sau khi duyệt/huỷ... — kéo về trang cuối hợp lệ thay vì kẹt ở trang trống
watch(totalPagesAll, (tp) => { if (currentPageAll.value > tp) currentPageAll.value = tp })

const currentPagePending = ref(1)
const totalPagesPending  = computed(() => Math.ceil(sortedPendingCancellations.value.length / pageSize) || 1)
const hasPrevPending      = computed(() => currentPagePending.value > 1)
const hasNextPending      = computed(() => currentPagePending.value < totalPagesPending.value)
const paginatedPendingCancellations = computed(() =>
  sortedPendingCancellations.value.slice((currentPagePending.value - 1) * pageSize, currentPagePending.value * pageSize),
)
function changePagePending(delta: number) {
  currentPagePending.value = Math.min(Math.max(1, currentPagePending.value + delta), totalPagesPending.value)
}
watch(totalPagesPending, (tp) => { if (currentPagePending.value > tp) currentPagePending.value = tp })

// ── Lọc theo ReliefRequestId khi điều hướng từ "Quản lý đội" (?requestId=) ──
const filterRequestId = ref<string | null>(null)
const filterRequestTitle = computed(() => {
  const match = assignments.value.find(a => a.reliefRequestId === filterRequestId.value)
  return match?.reliefRequestTitle ?? null
})

function clearRequestFilter() {
  filterRequestId.value = null
  router.replace({ query: {} })
  void loadAll()
}

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(async () => {
  const requestId = route.query.requestId
  if (typeof requestId === 'string' && requestId) {
    filterRequestId.value = requestId
  }
  await loadAll()
})

async function loadAll() {
  isLoading.value = true
  try {
    assignments.value = await getAssignments(1, 200, filterRequestId.value ?? undefined)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function switchToPending() {
  activeTab.value = 'pending'
  if (pendingCancellations.value.length > 0) return
  isPendingLoading.value = true
  pendingMsg.value = ''
  try {
    pendingCancellations.value = await getPendingCancellations()
  } catch (e) {
    console.error(e)
  } finally {
    isPendingLoading.value = false
  }
}

// ── Drawer ───────────────────────────────────────────────────
function openDrawer(row: Assignment) {
  selected.value = row
  drawerOpen.value = true
  drawerMsg.value = ''
  forceCancelReason.value = ''
}
function closeDrawer() {
  drawerOpen.value = false
  selected.value = null
}

// Timeline helpers
function isStepDone(key: string): boolean {
  if (!selected.value) return false
  const curIdx = STATUS_ORDER.indexOf(selected.value.status as AssignmentStatus)
  const stepIdx = STATUS_ORDER.indexOf(key as AssignmentStatus)
  return stepIdx < curIdx && selected.value.status !== 'Cancelled'
}
function isStepCurrent(key: string): boolean {
  return selected.value?.status === key
}
function isStepFuture(key: string): boolean {
  if (!selected.value) return false
  const curIdx = STATUS_ORDER.indexOf(selected.value.status as AssignmentStatus)
  const stepIdx = STATUS_ORDER.indexOf(key as AssignmentStatus)
  return stepIdx > curIdx
}
function stepTime(key: string): string | null {
  if (!selected.value) return null
  const a = selected.value
  const map: Partial<Record<string, string | null>> = {
    Assigned:  a.assignedAt,
    Accepted:  a.acceptedAt,
    OnTheWay:  null,
    Completed: a.completedAt,
  }
  const t = map[key]
  return t ? fmtDate(t) : null
}

// ── Actions (shared for drawer + pending tab) ─────────────────
async function handleApprove(row: Assignment) {
  const isInDrawer = drawerOpen.value && selected.value?.id === row.id
  if (isInDrawer) { isActioning.value = true; actionType.value = 'approve'; drawerMsg.value = '' }
  else { processingId.value = row.id; processingAction.value = 'approve' }

  try {
    await approveCancellation(row.id)
    // Cập nhật local
    updateLocalStatus(row.id, 'Cancelled')
    removePending(row.id)
    const msg = 'Đã duyệt huỷ phân công thành công.'
    if (isInDrawer) { drawerMsg.value = msg; drawerMsgType.value = 'ok' }
    else { pendingMsg.value = msg; pendingMsgType.value = 'ok' }
    if (isInDrawer) selected.value = { ...selected.value!, status: 'Cancelled', cancellationRequested: false }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Thao tác thất bại.'
    if (isInDrawer) { drawerMsg.value = msg; drawerMsgType.value = 'error' }
    else { pendingMsg.value = msg; pendingMsgType.value = 'error' }
  } finally {
    if (isInDrawer) { isActioning.value = false; actionType.value = null }
    else { processingId.value = null; processingAction.value = null }
  }
}

async function handleReject(row: Assignment) {
  const isInDrawer = drawerOpen.value && selected.value?.id === row.id
  if (isInDrawer) { isActioning.value = true; actionType.value = 'reject'; drawerMsg.value = '' }
  else { processingId.value = row.id; processingAction.value = 'reject' }

  try {
    await rejectCancellation(row.id)
    removePending(row.id)
    // Cập nhật cancellationRequested = false
    updateLocalCancelFlag(row.id, false)
    const msg = 'Đã từ chối đơn xin huỷ.'
    if (isInDrawer) { drawerMsg.value = msg; drawerMsgType.value = 'ok' }
    else { pendingMsg.value = msg; pendingMsgType.value = 'ok' }
    if (isInDrawer) selected.value = { ...selected.value!, cancellationRequested: false }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Thao tác thất bại.'
    if (isInDrawer) { drawerMsg.value = msg; drawerMsgType.value = 'error' }
    else { pendingMsg.value = msg; pendingMsgType.value = 'error' }
  } finally {
    if (isInDrawer) { isActioning.value = false; actionType.value = null }
    else { processingId.value = null; processingAction.value = null }
  }
}

async function handleForceCancel() {
  if (!selected.value || !forceCancelReason.value.trim()) return
  isActioning.value = true
  actionType.value = 'force'
  drawerMsg.value = ''
  try {
    await adminCancelAssignment(selected.value.id, forceCancelReason.value.trim())
    updateLocalStatus(selected.value.id, 'Cancelled')
    selected.value = { ...selected.value, status: 'Cancelled' }
    drawerMsg.value = 'Đã huỷ phân công thành công.'
    drawerMsgType.value = 'ok'
    forceCancelReason.value = ''
  } catch (e: unknown) {
    drawerMsg.value = e instanceof Error ? e.message : 'Huỷ thất bại.'
    drawerMsgType.value = 'error'
  } finally {
    isActioning.value = false
    actionType.value = null
  }
}

async function handleSetTeamLead() {
  if (!selected.value) return
  isActioning.value = true
  actionType.value = 'team-lead'
  drawerMsg.value = ''
  try {
    await setTeamLead(selected.value.id)
    await loadAll()
    const refreshed = assignments.value.find(a => a.id === selected.value!.id)
    if (refreshed) selected.value = refreshed
    drawerMsg.value = t('admin.team_lead_set_success')
    drawerMsgType.value = 'ok'
  } catch (e: unknown) {
    drawerMsg.value = e instanceof Error ? e.message : t('admin.team_lead_action_failed')
    drawerMsgType.value = 'error'
  } finally {
    isActioning.value = false
    actionType.value = null
  }
}

async function handleRemoveTeamLead() {
  if (!selected.value) return
  isActioning.value = true
  actionType.value = 'remove-team-lead'
  drawerMsg.value = ''
  try {
    await removeTeamLead(selected.value.reliefRequestId)
    await loadAll()
    const refreshed = assignments.value.find(a => a.id === selected.value!.id)
    if (refreshed) selected.value = refreshed
    drawerMsg.value = t('admin.team_lead_removed_success')
    drawerMsgType.value = 'ok'
  } catch (e: unknown) {
    drawerMsg.value = e instanceof Error ? e.message : t('admin.team_lead_action_failed')
    drawerMsgType.value = 'error'
  } finally {
    isActioning.value = false
    actionType.value = null
  }
}

// Local state helpers
function updateLocalStatus(id: string, status: AssignmentStatus) {
  const idx = assignments.value.findIndex(a => a.id === id)
  if (idx !== -1) assignments.value[idx] = { ...assignments.value[idx], status }
}
function updateLocalCancelFlag(id: string, flag: boolean) {
  const idx = assignments.value.findIndex(a => a.id === id)
  if (idx !== -1) assignments.value[idx] = { ...assignments.value[idx], cancellationRequested: flag }
}
function removePending(id: string) {
  pendingCancellations.value = pendingCancellations.value.filter(a => a.id !== id)
}

</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────── */
.asgn-page { max-width: 1200px; }

/* ── Header ──────────────────────────────────────────────── */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; gap: 20px; }
.role-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(197,48,48,0.09); color: #c53030; font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-bottom: 10px; }
.page-title { font-size: 26px; font-weight: 800; color: #1a3b5c; letter-spacing: -0.5px; }
.page-sub   { font-size: 13.5px; color: #718096; margin-top: 4px; }
.header-stats { display: flex; gap: 12px; flex-shrink: 0; }
.hstat { background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 12px 18px; text-align: center; box-shadow: 0 1px 6px rgba(0,0,0,0.05); border-top: 3px solid var(--hs-color); min-width: 80px; }
.hstat__val   { display: block; font-size: 24px; font-weight: 900; color: #1a2d3d; }
.hstat__label { display: block; font-size: 10.5px; color: #718096; font-weight: 600; margin-top: 2px; }

/* ── Tabs ─────────────────────────────────────────────────── */
.tab-bar { display: flex; gap: 8px; margin-bottom: 18px; border-bottom: 2px solid #e9ecef; padding-bottom: 0; }
.tab-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border: none; background: none;
  font-size: 13.5px; font-weight: 600; color: #64748b;
  cursor: pointer; border-bottom: 3px solid transparent;
  margin-bottom: -2px; transition: all 0.18s ease; border-radius: 8px 8px 0 0;
}
.tab-btn:hover { color: #1a3b5c; background: #f8fafc; }
.tab-btn.active { color: #c53030; border-bottom-color: #c53030; background: rgba(197,48,48,0.04); }
.tab-btn--danger.active { color: #c53030; }
.tab-count { background: #e9ecef; color: #4b5563; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 99px; }
.tab-count--danger { background: #fee2e2; color: #c53030; }

/* ── Request filter banner ───────────────────────────────── */
.request-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  margin-bottom: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
}
.btn-clear-filter {
  border: 1px solid #93c5fd;
  background: #fff;
  color: #1d4ed8;
  padding: 5px 12px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn-clear-filter:hover { background: #dbeafe; }

/* ── Filter bar ───────────────────────────────────────────── */
.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 8px 14px; min-width: 220px; color: #9ca3af; }
.search-input { border: none; outline: none; font-size: 13px; color: #2d3748; width: 100%; background: transparent; }
.status-filters { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.status-filter-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 99px; border: 1.5px solid #e9ecef; background: #fff; font-size: 12px; font-weight: 600; color: #4a5568; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.status-filter-btn.active { background: var(--af-bg); color: var(--af-color); border-color: transparent; }
.status-filter-btn:hover:not(.active) { background: #f8fafc; }
.filter-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.filter-count { background: rgba(0,0,0,0.08); border-radius: 99px; padding: 0 6px; font-size: 10px; font-weight: 700; }

/* ── Table ─────────────────────────────────────────────────── */
.table-card { background: #fff; border-radius: 16px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden; }
.admin-pagination {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 14px; border-top: 1px solid #e9ecef;
}
.page-btn {
  padding: 7px 16px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; color: #1a4f8d; transition: all 0.15s ease;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: #1a4f8d; background: rgba(26,79,141,0.05); }
.page-info { font-size: 13px; color: #718096; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f8fafc; padding: 13px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #e9ecef; text-align: left; }
.th-center { text-align: center !important; }
.data-row { cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease; }
.data-row:hover { background: #f8fafc; }
.data-row td { padding: 13px 16px; font-size: 13px; color: #2d3748; vertical-align: middle; }

.vol-mini { display: flex; align-items: center; gap: 10px; }
.vol-mini__avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #c53030, #e53e3e); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.vol-mini__name { font-weight: 600; color: #1a3b5c; }
.vol-mini__lead-icon { color: #eab308; flex-shrink: 0; }

.td-req    { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-reason { max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12.5px; color: #718096; }
.td-date   { font-size: 12px; color: #718096; white-space: nowrap; }

.status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
.status-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.cancel-req-badge { background: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 99px; }
.no-badge { color: #d1d5db; font-size: 13px; }

.btn-view { padding: 5px 14px; border-radius: 7px; border: 1.5px solid #c53030; background: transparent; color: #c53030; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.btn-view:hover { background: #c53030; color: #fff; }

.action-btns { display: flex; gap: 8px; align-items: center; }
.btn-approve { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 8px; background: #dcfce7; color: #15803d; border: none; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.btn-approve:hover { background: #22c55e; color: #fff; }
.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reject  { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 8px; background: #fee2e2; color: #991b1b; border: none; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.btn-reject:hover { background: #ef4444; color: #fff; }
.btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-lg { padding: 10px 20px; font-size: 13.5px; }

/* Loading / Empty */
.loading-state, .empty-state { padding: 60px 20px; text-align: center; color: #a0aec0; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 14px; }
.spinner { width: 28px; height: 28px; border: 3px solid #e9ecef; border-top-color: #c53030; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

.global-msg { font-size: 13px; padding: 10px 16px; border-radius: 10px; margin-top: 12px; }
.msg--ok    { background: #dcfce7; color: #15803d; }
.msg--error { background: #fee2e2; color: #991b1b; }

/* ── Modal ───────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(10, 18, 35, 0.6);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-box {
  width: 580px; max-width: 100%;
  max-height: 90vh;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06);
  animation: modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Header */
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 18px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  flex-shrink: 0;
}
.modal-subtitle { font-size: 10.5px; color: rgba(255,255,255,0.45); font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
.modal-title    { font-size: 16px; font-weight: 800; color: #fff; line-height: 1.35; max-width: 420px; }
.modal-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.1); border: none;
  color: rgba(255,255,255,0.65); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-left: 12px;
  transition: all 0.15s ease;
}
.modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

/* Volunteer strip */
.vol-strip {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.vol-strip__avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: linear-gradient(135deg, #c53030, #e53e3e);
  color: #fff; font-size: 16px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0;
}
.vol-strip__info { display: flex; flex-direction: column; gap: 5px; }
.vol-strip__name { font-size: 14px; font-weight: 700; color: #fff; }

/* Scrollable body */
.modal-timeline, .modal-cards, .modal-admin { flex-shrink: 0; }
.modal-box > template, .modal-box > * { overflow-y: auto; }

/* Timeline */
.modal-timeline {
  display: flex; gap: 0;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e9ecef;
}
.mtl-step { display: flex; align-items: flex-start; gap: 8px; flex: 1; position: relative; }
.mtl-step:not(.mtl--last)::after { content: ''; position: absolute; top: 13px; left: 26px; right: 0; height: 2px; background: #e2e8f0; z-index: 0; }
.mtl-step.mtl--done::after { background: #10b981; }
.mtl-dot {
  width: 26px; height: 26px; border-radius: 50%;
  background: #e2e8f0; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; z-index: 1; transition: all 0.2s ease;
}
.mtl--done .mtl-dot    { background: #10b981; color: #fff; }
.mtl--current .mtl-dot { background: #3b82f6; color: #fff; box-shadow: 0 0 0 5px rgba(59,130,246,0.18); }
.mtl-pulse { width: 9px; height: 9px; border-radius: 50%; background: #fff; animation: pulse 1.2s infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.35); } }
.mtl-content { flex: 1; padding-top: 1px; }
.mtl-label { font-size: 11px; font-weight: 700; color: #64748b; line-height: 1.3; }
.mtl--done .mtl-label    { color: #065f46; }
.mtl--current .mtl-label { color: #1d4ed8; }
.mtl-time { font-size: 10px; color: #a0aec0; margin-top: 2px; }

/* Info cards */
.modal-cards {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px; padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  overflow-y: auto;
}
.info-card {
  background: #f8fafc;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px 16px;
}
.info-card__header {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 800; color: #475569;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}
.info-card__sublabel { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
.info-card__val { font-size: 13px; font-weight: 700; color: #1a3b5c; line-height: 1.4; }
.info-card__val--note { font-weight: 500; color: #64748b; font-size: 12.5px; }
.info-card__datebox {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 8px; padding: 7px 11px;
  font-size: 12.5px; font-weight: 600; color: #334155;
}
.info-card__datebox--muted { color: #94a3b8; font-style: italic; }
.reason-text { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 7px 10px; font-size: 12px; color: #92400e; font-style: italic; }

/* Admin section */
.modal-admin {
  padding: 16px 24px 20px;
  background: #fff;
  overflow-y: auto;
}
.modal-admin__label {
  font-size: 11px; font-weight: 800; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 14px;
}

.cancel-req-banner { display: flex; align-items: center; gap: 10px; padding: 11px 13px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 12.5px; color: #92400e; }

.force-cancel-block { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e9ecef; }
.fc-title { font-size: 11.5px; font-weight: 700; color: #c53030; margin-bottom: 9px; }
.fc-row { display: flex; gap: 8px; }
.fc-input { flex: 1; padding: 9px 13px; border: 1.5px solid #e9ecef; border-radius: 9px; font-size: 13px; color: #2d3748; outline: none; transition: border-color 0.15s ease; }
.fc-input:focus { border-color: #c53030; }
.fc-input:disabled { background: #f8fafc; color: #a0aec0; }
.btn-force-cancel { display: inline-flex; align-items: center; gap: 5px; padding: 9px 15px; border-radius: 9px; background: #fee2e2; color: #991b1b; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
.btn-force-cancel:hover:not(:disabled) { background: #c53030; color: #fff; }
.btn-force-cancel:disabled { opacity: 0.45; cursor: not-allowed; }

.team-lead-badge {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
  padding: 3px 10px; border-radius: 20px; background: #fef9c3; color: #854d0e;
  font-size: 11.5px; font-weight: 700; width: fit-content;
}
.team-lead-block { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e9ecef; }
.btn-team-lead, .btn-remove-team-lead {
  display: inline-flex; align-items: center; gap: 5px; padding: 9px 15px; border-radius: 9px;
  border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
}
.btn-team-lead { background: #fef9c3; color: #854d0e; }
.btn-team-lead:hover:not(:disabled) { background: #eab308; color: #fff; }
.btn-team-lead:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-remove-team-lead { background: #f1f5f9; color: #475569; }
.btn-remove-team-lead:hover:not(:disabled) { background: #e2e8f0; }
.btn-remove-team-lead:disabled { opacity: 0.45; cursor: not-allowed; }

.status-msg { font-size: 12.5px; padding: 8px 12px; border-radius: 8px; margin-top: 12px; }
.spin-icon  { animation: spin 0.7s linear infinite; }

/* Info grid (kept for compatibility) */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 20px 28px; border-bottom: 1px solid #f1f5f9; }
.info-item { padding: 10px 0; border-bottom: 1px solid #f8fafc; display: flex; flex-direction: column; gap: 5px; }
.info-item--full { grid-column: 1 / -1; }
.info-label { font-size: 11px; font-weight: 700; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.3px; }
.info-val   { font-size: 13.5px; color: #2d3748; font-weight: 500; }
.info-val--bold { font-weight: 700; color: #1a3b5c; }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-box { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease; }
.modal-enter-from .modal-box { transform: scale(0.9) translateY(20px); opacity: 0; }
.modal-leave-to .modal-box   { transform: scale(0.95) translateY(10px); opacity: 0; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .page-header { flex-direction: column; }
  .header-stats { flex-wrap: wrap; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .status-filters { overflow-x: auto; flex-wrap: nowrap; }
}
</style>

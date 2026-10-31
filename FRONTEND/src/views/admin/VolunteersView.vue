<template>
  <AdminLayout>
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">{{ $t('admin.volunteers_title') }}</h1>
        <div class="stats-badge" v-if="pendingCount > 0">
          {{ $t('admin.pending_volunteers_count', { count: pendingCount }) }}
        </div>
      </div>

      <!-- Toolbar -->
      <div class="volunteers-toolbar">
        <BaseInput
          id="search-volunteers"
          v-model="searchQuery"
          :placeholder="$t('admin.volunteers_search')"
          style="max-width: 340px"
        >
          <template #prefix>
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </template>
        </BaseInput>

        <select v-model="statusFilter" class="status-filter">
          <option value="">{{ $t('admin.all_statuses') }}</option>
          <option value="Pending">{{ $t('admin.status_pending') }}</option>
          <option value="Approved">{{ $t('admin.status_approved') }}</option>
        </select>
      </div>

      <!-- Main Content Card -->
      <BaseCard>
        <div v-if="isLoading" class="volunteers-loading">
          <BaseSpinner size="lg" class="spinner-dark" />
        </div>

        <div v-else-if="filteredVolunteers.length === 0" class="volunteers-empty">
          <p>{{ $t('admin.no_volunteers_found') }}</p>
        </div>

        <table v-else class="volunteers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('admin.col_name') }}</th>
              <th>{{ $t('admin.col_email') }}</th>
              <th>{{ $t('admin.col_phone') }}</th>
              <th>{{ $t('admin.col_exp') }}</th>
              <th>{{ $t('admin.col_status') }}</th>
              <th>{{ $t('admin.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vol, idx) in filteredVolunteers" :key="vol.id">
              <td class="text-muted">{{ idx + 1 }}</td>
              <td class="font-semibold">{{ vol.fullName }}</td>
              <td>{{ vol.email }}</td>
              <td>{{ vol.phoneNumber || '—' }}</td>
              <td>{{ $t('admin.years_unit', { years: vol.experienceYears }) }}</td>
              <td>
                <span class="status-badge" :class="`status--${vol.status.toLowerCase()}`">
                  {{ vol.status === 'Pending' ? $t('admin.status_pending') : $t('admin.status_approved') }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="action-btn action-btn--details" @click="openDetails(vol.id)">{{ $t('admin.btn_details') }}</button>
                <button
                  v-if="vol.status === 'Pending'"
                  class="action-btn action-btn--approve"
                  @click="handleApprove(vol)"
                >
                  {{ $t('admin.btn_approve') }}
                </button>
                <button
                  v-if="vol.status === 'Pending'"
                  class="action-btn action-btn--reject"
                  @click="handleReject(vol)"
                >
                  {{ $t('admin.btn_reject') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>

    <!-- Details Dialog -->
    <el-dialog
      v-model="isDetailsVisible"
      :title="$t('admin.volunteer_detail_dialog_title')"
      width="600px"
      destroy-on-close
    >
      <div v-if="isDetailsLoading" class="details-loading">
        <BaseSpinner size="md" class="spinner-dark" />
        <p>{{ $t('common.loading') }}</p>
      </div>
      <div v-else-if="selectedVolunteer" class="details-container">
        <!-- Section: Profile Header Card -->
        <div class="profile-header-card">
          <div class="user-avatar-wrapper">
            <div class="user-avatar-placeholder">
              {{ selectedVolunteer.fullName.split(" ").slice(-1)[0][0] }}
            </div>
            <div class="status-indicator-dot" :class="`status--${selectedVolunteer.status.toLowerCase()}`"></div>
          </div>
          <div class="user-meta-info">
            <h3 class="detail-name">{{ selectedVolunteer.fullName }}</h3>
            <div class="status-badge-container">
              <span class="status-badge-inline" :class="`status--${selectedVolunteer.status.toLowerCase()}`">
                {{ selectedVolunteer.status === 'Pending' ? `⏳ ${$t('admin.status_pending')}` : `✓ ${$t('admin.status_approved')}` }}
              </span>
            </div>
          </div>
        </div>

        <!-- Section: Profile Details -->
        <div class="profile-details-grid">
          <!-- Card 1: Thông tin cơ bản -->
          <div class="info-card">
            <h4 class="info-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ $t('admin.section_contact_info') }}
            </h4>
            <div class="info-card-body">
              <div class="info-row">
                <span class="info-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </span>
                <span class="info-value font-semibold">{{ selectedVolunteer.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {{ $t('admin.phone_label') }}
                </span>
                <span class="info-value">{{ selectedVolunteer.phoneNumber || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  {{ $t('admin.col_exp') }}
                </span>
                <span class="info-value text-highlight font-semibold">{{ $t('admin.years_unit', { years: selectedVolunteer.experienceYears }) }}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Địa điểm & Tọa độ -->
          <div class="info-card">
            <h4 class="info-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ $t('admin.section_location_time') }}
            </h4>
            <div class="info-card-body">
              <div class="info-row">
                <span class="info-label">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ $t('admin.col_address') }}
                </span>
                <span class="info-value text-wrap">{{ selectedVolunteer.address || '—' }}</span>
              </div>
              <div class="info-row inline-coords">
                <div>
                  <span class="info-label">Lat</span>
                  <code class="coord-tag">{{ selectedVolunteer.latitude }}</code>
                </div>
                <div>
                  <span class="info-label">Lng</span>
                  <code class="coord-tag">{{ selectedVolunteer.longitude }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Bio / Giới thiệu bản thân -->
        <div class="info-card">
          <h4 class="info-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            {{ $t('admin.section_desc') }}
          </h4>
          <div class="bio-content">
            <p v-if="selectedVolunteer.bio" class="bio-text">
              “{{ selectedVolunteer.bio }}”
            </p>
            <p v-else class="bio-text text-muted italic">
              —
            </p>
          </div>
        </div>

        <!-- Section: Kỹ năng đã đăng ký -->
        <div class="info-card">
          <h4 class="info-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            {{ $t('admin.nav_skills') }}
          </h4>
          <div class="skills-wrapper">
            <div v-if="selectedVolunteer.skills && selectedVolunteer.skills.length > 0" class="skills-tags">
              <span
                v-for="(skill, sIdx) in selectedVolunteer.skills"
                :key="sIdx"
                class="skill-tag"
              >
                <span class="skill-dot"></span>
                {{ typeof skill === 'object' ? (skill as any).name : skill }}
              </span>
            </div>
            <p v-else class="text-muted text-sm italic">—</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer" v-if="selectedVolunteer">
          <el-button @click="isDetailsVisible = false">{{ $t('common.cancel') }}</el-button>
          <template v-if="selectedVolunteer.status === 'Pending'">
            <el-button
              type="danger"
              :loading="isActionPending"
              @click="handleReject(selectedVolunteer)"
            >
              {{ $t('admin.btn_reject') }}
            </el-button>
            <el-button
              type="primary"
              :loading="isActionPending"
              @click="handleApprove(selectedVolunteer)"
            >
              {{ $t('admin.btn_approve') }}
            </el-button>
          </template>
        </div>
      </template>
    </el-dialog>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useConfirm } from '@/composables/useConfirm'
import {
  getAdminVolunteers,
  getAdminVolunteerById,
  approveVolunteer,
  rejectVolunteer,
} from '@/features/volunteers/volunteers.api'
import type { AdminVolunteerSummary, VolunteerProfile } from '@/features/volunteers/volunteers.types'


const { confirm } = useConfirm()

// ── State ────────────────────────────────────────────────────
const volunteers = ref<AdminVolunteerSummary[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')

const isDetailsVisible = ref(false)
const isDetailsLoading = ref(false)
const selectedVolunteer = ref<VolunteerProfile | null>(null)
const isActionPending = ref(false)

// ── Load Data ────────────────────────────────────────────────
async function loadVolunteers(): Promise<void> {
  isLoading.value = true
  try {
    volunteers.value = await getAdminVolunteers()
  } catch (err) {
    ElMessage.error((err as Error).message || 'Không thể tải danh sách tình nguyện viên')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadVolunteers()
})

// ── Computed ──────────────────────────────────────────────────
const pendingCount = computed(() => {
  return volunteers.value.filter(v => v.status === 'Pending').length
})

const filteredVolunteers = computed(() => {
  const list = volunteers.value.filter(v => {
    // Filter by search query (name/email)
    const matchQuery =
      v.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.value.toLowerCase())

    // Filter by status
    const matchStatus = statusFilter.value ? v.status === statusFilter.value : true

    return matchQuery && matchStatus
  })
  // Đơn đang chờ duyệt lên đầu danh sách để admin xử lý trước
  return [...list].sort((a, b) => (a.status === 'Pending' ? -1 : 0) - (b.status === 'Pending' ? -1 : 0))
})

// ── Actions ──────────────────────────────────────────────────
async function openDetails(volunteerId: string): Promise<void> {
  isDetailsVisible.value = true
  isDetailsLoading.value = true
  selectedVolunteer.value = null
  try {
    selectedVolunteer.value = await getAdminVolunteerById(volunteerId)
  } catch (err) {
    ElMessage.error((err as Error).message || 'Không thể tải chi tiết hồ sơ')
    isDetailsVisible.value = false
  } finally {
    isDetailsLoading.value = false
  }
}

async function handleApprove(vol: AdminVolunteerSummary | VolunteerProfile): Promise<void> {
  if (await confirm(`Bạn có chắc chắn muốn phê duyệt hồ sơ của ${vol.fullName}?`)) {
    isActionPending.value = true
    try {
      await approveVolunteer(vol.id)
      ElMessage.success(`Đã phê duyệt hồ sơ của ${vol.fullName}`)
      isDetailsVisible.value = false
      await loadVolunteers()
    } catch (err) {
      ElMessage.error((err as Error).message || 'Có lỗi xảy ra khi phê duyệt')
    } finally {
      isActionPending.value = false
    }
  }
}

async function handleReject(vol: AdminVolunteerSummary | VolunteerProfile): Promise<void> {
  if (await confirm(`Bạn có chắc chắn muốn từ chối hồ sơ của ${vol.fullName}?`)) {
    isActionPending.value = true
    try {
      await rejectVolunteer(vol.id)
      ElMessage.success(`Đã từ chối hồ sơ của ${vol.fullName}`)
      isDetailsVisible.value = false
      await loadVolunteers()
    } catch (err) {
      ElMessage.error((err as Error).message || 'Có lỗi xảy ra khi từ chối')
    } finally {
      isActionPending.value = false
    }
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a3b5c;
  margin: 0;
}

.stats-badge {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
  border-radius: 99px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
}

.volunteers-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-2);
}

.status-filter {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}

.search-icon {
  color: var(--color-text-muted);
  margin: 0 8px;
  flex-shrink: 0;
}

/* Table styling */
.volunteers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.volunteers-table th {
  text-align: left;
  padding: 12px 14px;
  background: #f8fafc;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--color-border-soft);
}

.volunteers-table td {
  padding: 14px;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
}

.volunteers-table tbody tr:hover {
  background: #f8fafc;
}

.volunteers-table tbody tr:last-child td {
  border-bottom: none;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
}

.status--pending {
  background-color: #fffbeb;
  color: #d97706;
}

.status--approved {
  background-color: #f0fdf4;
  color: #166534;
}

.status--rejected {
  background-color: #fef2f2;
  color: #991b1b;
}

/* Actions cell */
.actions-cell {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn--details {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: var(--color-blue);
}

.action-btn--details:hover {
  background-color: #e2e8f0;
  color: var(--color-blue-dark);
  border-color: #cbd5e1;
}

.action-btn--approve {
  background-color: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.action-btn--approve:hover {
  background-color: #d1fae5;
  border-color: #6ee7b7;
}

.action-btn--reject {
  background-color: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.action-btn--reject:hover {
  background-color: #fee2e2;
  border-color: #f87171;
}

/* Loading & Empty states */
.volunteers-loading,
.volunteers-empty,
.details-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-muted);
  gap: 12px;
}

/* Dialog details container */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #2d3748;
}

/* Profile header card */
.profile-header-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.user-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a4f8d, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  box-shadow: 0 3px 8px rgba(26, 79, 141, 0.15);
}

.status-indicator-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.status-indicator-dot.status--pending {
  background-color: #d97706;
}
.status-indicator-dot.status--approved {
  background-color: #166534;
}
.status-indicator-dot.status--rejected {
  background-color: #991b1b;
}

.user-meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-name {
  font-size: 17px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0;
}

.status-badge-container {
  display: flex;
}

.status-badge-inline {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
}
.status-badge-inline.status--pending {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fcd34d;
}
.status-badge-inline.status--approved {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.status-badge-inline.status--rejected {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

/* Info cards section */
.profile-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .profile-details-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.04);
}

.info-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #edf2f7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card-title svg {
  color: #3b82f6;
  flex-shrink: 0;
}

.info-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-row.inline-coords {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
}

.info-row.inline-coords > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-label svg {
  color: #a0aec0;
  flex-shrink: 0;
}

.info-value {
  font-size: 13.5px;
  color: #1a202c;
  word-break: break-word;
}

.info-value.text-wrap {
  line-height: 1.4;
}

.info-value.text-highlight {
  color: #2563eb;
}

.coord-tag {
  background-color: #f1f5f9;
  padding: 3px 6px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 11.5px;
  color: #475569;
  border: 1px solid #e2e8f0;
  text-align: center;
  display: inline-block;
}

/* Bio Content styling */
.bio-content {
  background-color: #f8fafc;
  border-left: 3px solid #3b82f6;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
}

.bio-text {
  font-size: 13px;
  line-height: 1.5;
  color: #4a5568;
  margin: 0;
  font-style: italic;
}

.bio-text.italic {
  font-style: italic;
}

/* Skills Wrapper */
.skills-wrapper {
  padding-top: 2px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  transition: all 0.2s ease;
}

.skill-tag:hover {
  background-color: #dbeafe;
  transform: scale(1.03);
}

.skill-dot {
  width: 5px;
  height: 5px;
  background-color: #3b82f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #edf2f7;
}
</style>

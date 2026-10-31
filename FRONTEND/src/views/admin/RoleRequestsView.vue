<template>
  <AdminLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('roleRequests.admin_title') }}</h1>
          <p class="page-sub">{{ $t('roleRequests.admin_sub') }}</p>
        </div>
      </div>

      <!-- Toolbar lọc Trạng thái -->
      <div class="toolbar">
        <select v-model="selectedStatus" class="status-filter" @change="onStatusChange">
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Đang chờ duyệt</option>
          <option value="Approved">Đã duyệt</option>
          <option value="Rejected">Đã từ chối</option>
        </select>
      </div>

      <div class="card">
        <div v-if="isLoading" class="empty-state">
          <BaseSpinner size="lg" class="spinner-dark" />
        </div>
        <div v-else-if="requests.length === 0" class="empty-state">
          {{ selectedStatus === 'Pending' || !selectedStatus ? $t('roleRequests.no_pending') : 'Không tìm thấy yêu cầu nâng quyền nào' }}
        </div>

        <div v-else>
          <table class="rr-table">
            <colgroup>
              <col style="width: 200px" />
              <col style="width: 130px" />
              <col style="width: 150px" />
              <col style="width: 250px" />
              <col style="width: 140px" />
              <col v-if="selectedStatus === 'Pending' || !hasActionColumn" style="width: 220px" />
              <col v-else style="width: 180px" />
            </colgroup>
            <thead>
              <tr>
                <th>{{ $t('roleRequests.col_user') }}</th>
                <th>{{ $t('roleRequests.col_current_role') }}</th>
                <th>{{ $t('roleRequests.col_requested_role') }}</th>
                <th>{{ $t('roleRequests.col_reason') }}</th>
                <th>{{ $t('donations.col_created') }}</th>
                <th v-if="selectedStatus === 'Pending'">{{ $t('common.actions') }}</th>
                <th v-else-if="selectedStatus === 'Approved'">Người duyệt / Thời gian</th>
                <th v-else-if="selectedStatus === 'Rejected'">Lý do từ chối / Người từ chối</th>
                <th v-else>Chi tiết phản hồi / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in requests" :key="r.id">
                <td>
                  <p class="font-semibold text-ellipsis" :title="r.userFullName">{{ r.userFullName }}</p>
                  <p class="text-muted text-ellipsis" :title="r.userEmail">{{ r.userEmail }}</p>
                </td>
                <td>
                  <span class="role-badge current-role">
                    {{ r.currentRoleName ? $t(`roles.${r.currentRoleName}`, r.currentRoleName) : 'User' }}
                  </span>
                </td>
                <td>
                  <span class="role-badge requested-role">
                    {{ r.requestedRoleName ? $t(`roles.${r.requestedRoleName}`, r.requestedRoleName) : '' }}
                  </span>
                </td>
                <td class="reason-cell" :title="r.reason">{{ r.reason }}</td>
                <td class="text-muted">{{ formatDateTimeVI(r.createdAt) }}</td>

                <!-- TH1: Đang ở chế độ chỉ lọc Pending hoặc Request cụ thể đang Pending -->
                <td v-if="r.status === 'Pending'" class="actions-cell">
                  <button
                    class="action-btn action-btn--approve"
                    :disabled="processingId === r.id"
                    @click="handleApprove(r)"
                  >
                    {{ $t('donations.btn_approve') }}
                  </button>
                  <button
                    class="action-btn action-btn--reject"
                    :disabled="processingId === r.id"
                    @click="openRejectModal(r)"
                  >
                    {{ $t('donations.btn_reject') }}
                  </button>
                </td>

                <!-- TH2: Đã duyệt (Approved) -->
                <td v-else-if="r.status === 'Approved'">
                  <div class="review-info text-success">
                    <p class="font-semibold text-ellipsis" :title="r.reviewedByUserName || 'Hệ thống'">
                      ✅ Duyệt bởi: {{ r.reviewedByUserName || 'Hệ thống' }}
                    </p>
                    <p class="text-muted" v-if="r.reviewedAt">{{ formatDateTimeVI(r.reviewedAt) }}</p>
                  </div>
                </td>

                <!-- TH3: Đã từ chối (Rejected) -->
                <td v-else-if="r.status === 'Rejected'">
                  <div class="review-info text-danger">
                    <p class="font-semibold reject-note text-ellipsis" :title="r.reviewNote || ''">
                      ❌ Lý do: {{ r.reviewNote || 'Không có lý do' }}
                    </p>
                    <p class="text-muted text-ellipsis" :title="r.reviewedByUserName || 'Admin'">
                      Bởi: {{ r.reviewedByUserName || 'Admin' }}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Phân trang -->
          <div v-if="totalCount > pageSize" class="pagination">
            <button class="page-btn" :disabled="pageNumber <= 1" @click="changePage(-1)">
              {{ $t('admin.page_prev') }}
            </button>
            <span class="page-info">
              {{ $t('admin.page_info', { page: pageNumber, total: totalPages }) }}
            </span>
            <button class="page-btn" :disabled="pageNumber >= totalPages" @click="changePage(1)">
              {{ $t('admin.page_next') }}
            </button>
          </div>
        </div>

        <p v-if="listError" class="error-text">{{ listError }}</p>
      </div>

      <!-- ══════════ MODAL: TỪ CHỐI ══════════ -->
      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="modal-box modal-box--sm" v-if="rejectTarget">
          <div class="modal-header">
            <h3>{{ $t('roleRequests.reject_modal_title') }}</h3>
            <button class="modal-close" @click="closeRejectModal">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">{{ rejectTarget.userFullName }} → {{ rejectTarget.requestedRoleName }}</p>
            <div class="form-group">
              <label>{{ $t('donations.reject_reason_label') }} <span class="required">*</span></label>
              <textarea v-model="rejectNote" rows="3" :placeholder="$t('donations.reject_reason_placeholder')" />
            </div>
            <p v-if="rejectError" class="error-text">{{ rejectError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeRejectModal">{{ $t('common.cancel') }}</button>
              <button type="button" class="btn-danger" :disabled="isRejecting" @click="handleReject">
                {{ isRejecting ? $t('donations.processing') : $t('donations.btn_confirm_reject') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import {
  getRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  type RoleUpgradeRequest,
  type RoleRequestStatus,
} from '@/features/role-requests/role-requests.api'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'
import { useConfirm } from '@/composables/useConfirm'

const { t } = useI18n()
const { confirm } = useConfirm()

const requests = ref<RoleUpgradeRequest[]>([])
const isLoading = ref(true)
const listError = ref('')
const processingId = ref<string | null>(null)

// Phân trang & bộ lọc
const selectedStatus = ref<RoleRequestStatus | ''>('Pending')
const pageNumber = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

// Xác định có hiển thị cột action chung hay không
const hasActionColumn = computed(() => {
  return selectedStatus.value === 'Pending' || selectedStatus.value === ''
})

async function loadRequests() {
  isLoading.value = true
  listError.value = ''
  try {
    const statusParam = selectedStatus.value === '' ? undefined : selectedStatus.value
    const result = await getRoleRequests(statusParam, pageNumber.value, pageSize.value)
    requests.value = result.items
    totalCount.value = result.totalCount
  } catch (e) {
    console.error(e)
    listError.value = 'Không tải được danh sách yêu cầu nâng quyền'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadRequests)

function onStatusChange() {
  pageNumber.value = 1
  loadRequests()
}

function changePage(delta: number) {
  pageNumber.value += delta
  loadRequests()
}

async function handleApprove(r: RoleUpgradeRequest) {
  if (!(await confirm(`Bạn có chắc chắn muốn duyệt yêu cầu nâng lên vai trò "${r.requestedRoleName}" cho người dùng "${r.userFullName}"?`))) {
    return
  }

  processingId.value = r.id
  listError.value = ''
  try {
    await approveRoleRequest(r.id)
    ElMessage.success(`Duyệt thành công! Đã cấp vai trò "${r.requestedRoleName}" cho ${r.userFullName}.`)
    await loadRequests()
  } catch (e: unknown) {
    listError.value = e instanceof Error ? e.message : t('donations.approve_failed')
    ElMessage.error(listError.value)
  } finally {
    processingId.value = null
  }
}

// ── Reject modal ─────────────────────────────────────────────
const showRejectModal = ref(false)
const rejectTarget = ref<RoleUpgradeRequest | null>(null)
const rejectNote = ref('')
const isRejecting = ref(false)
const rejectError = ref('')

function openRejectModal(r: RoleUpgradeRequest) {
  rejectTarget.value = r
  rejectNote.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}

function closeRejectModal() {
  showRejectModal.value = false
  rejectTarget.value = null
}

async function handleReject() {
  if (!rejectTarget.value) return
  if (!rejectNote.value.trim()) {
    rejectError.value = t('donations.reject_reason_required')
    return
  }
  isRejecting.value = true
  rejectError.value = ''
  try {
    await rejectRoleRequest(rejectTarget.value.id, rejectNote.value.trim())
    ElMessage.success(`Đã từ chối nguyện vọng của ${rejectTarget.value.userFullName}`)
    showRejectModal.value = false
    await loadRequests()
  } catch (e: unknown) {
    rejectError.value = e instanceof Error ? e.message : t('donations.reject_failed')
    ElMessage.error(rejectError.value)
  } finally {
    isRejecting.value = false
  }
}
</script>

<style scoped>
.page-container { max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.page-sub { font-size: 13.5px; color: #718096; margin: 0; }

.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
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

.card { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 60px 0; color: #94a3b8; font-size: 14px; display: flex; justify-content: center; align-items: center; min-height: 160px;}

.rr-table { width: 100%; border-collapse: collapse; font-size: 13.5px; table-layout: fixed; }
.rr-table th { text-align: left; font-size: 11.5px; text-transform: uppercase; color: #94a3b8; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
.rr-table td { padding: 12px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }

.font-semibold { font-weight: 600; color: #1e293b; }
.text-muted { color: #94a3b8; font-size: 12px; }
.reason-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #475569;
}

/* Badges & Text styles */
.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
}
.current-role {
  background: rgba(100, 116, 139, 0.08);
  color: #475569;
}
.requested-role {
  background: rgba(26, 79, 141, 0.08);
  color: var(--color-blue);
}

.review-info {
  font-size: 12.5px;
}
.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }
.reject-note {
  font-weight: 500;
  margin: 0 0 2px 0;
}

.actions-cell { display: flex; gap: 8px; }
.action-btn { padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all var(--transition-fast); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn--approve { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.action-btn--approve:hover:not(:disabled) { background: #d1fae5; }
.action-btn--reject { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.action-btn--reject:hover:not(:disabled) { background: #fee2e2; }

/* Truncation utility */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Phân trang */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
  margin-top: 16px;
  border-top: 1px solid var(--color-border-soft);
}
.page-btn {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-blue);
  transition: all var(--transition-fast);
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: var(--color-blue); background: rgba(26,79,141,0.05); }
.page-info { font-size: 13px; color: var(--color-text-secondary); }

/* ── Modal ─────────────────────────────────────────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.modal-box { background: #fff; border-radius: 14px; width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
.modal-box--sm { max-width: 460px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fff; z-index: 1; }
.modal-header h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-desc { font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 16px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }

.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box; resize: vertical;
}
textarea:focus { outline: none; border-color: #3b82f6; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-outline:hover { background: #f8fafc; }
.btn-danger { background: #991b1b; color: #fff; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background: #7f1d1d; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 700px) {
  .rr-table { display: block; overflow-x: auto; }
}
</style>

<template>
  <AdminLayout>
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('admin.nav_reports') }}</h1>
          <p class="page-sub">Xuất các báo cáo dữ liệu hệ thống ra định dạng Excel (XLSX)</p>
        </div>
      </div>

      <!-- Grid Cards -->
      <div class="reports-grid">
        <!-- Card 1: Relief Requests -->
        <div class="report-card">
          <div class="card-header-icon color-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h3 class="card-title">Yêu cầu cứu trợ</h3>
          <p class="card-desc">Xuất dữ liệu các yêu cầu hỗ trợ nhu yếu phẩm của người dân và tổ chức trên hệ thống.</p>
          
          <div class="card-filters">
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="filterRequests.status" class="filter-select">
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Đang chờ duyệt (Pending)</option>
                <option value="Approved">Đã duyệt (Approved)</option>
                <option value="Assigned">Đã phân công (Assigned)</option>
                <option value="InProgress">Đang xử lý (InProgress)</option>
                <option value="Completed">Hoàn thành (Completed)</option>
                <option value="Cancelled">Hủy bỏ (Cancelled)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Từ khóa tìm kiếm</label>
              <input v-model="filterRequests.search" type="text" placeholder="Tìm theo tên người yêu cầu, địa chỉ..." class="filter-input" />
            </div>
          </div>

          <button class="btn-export" :disabled="loadingRequests" @click="handleExportRequests">
            <template v-if="loadingRequests">
              <span class="spinner-mini"></span>
              Đang xuất...
            </template>
            <template v-else>
              <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Xuất Excel
            </template>
          </button>
        </div>

        <!-- Card 2: Assignments -->
        <div class="report-card">
          <div class="card-header-icon color-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 11V3l-7 4-7-4V11l7 4z"/>
            </svg>
          </div>
          <h3 class="card-title">Phân công nhiệm vụ</h3>
          <p class="card-desc">Xuất dữ liệu phân công nhiệm vụ vận chuyển, cứu trợ của các tình nguyện viên.</p>

          <div class="card-filters">
            <div class="form-group">
              <label>Trạng thái phân công</label>
              <select v-model="filterAssignments.status" class="filter-select">
                <option value="">Tất cả trạng thái</option>
                <option value="Assigned">Đã phân công (Assigned)</option>
                <option value="Accepted">Đã nhận (Accepted)</option>
                <option value="OnTheWay">Đang di chuyển (OnTheWay)</option>
                <option value="Completed">Hoàn thành (Completed)</option>
                <option value="Cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Tình nguyện viên</label>
              <select v-model="filterAssignments.volunteerId" class="filter-select" :disabled="loadingVolunteers">
                <option value="">Tất cả tình nguyện viên</option>
                <option v-for="v in volunteers" :key="v.id" :value="v.id">
                  {{ v.fullName }} ({{ v.email }})
                </option>
              </select>
            </div>
          </div>

          <button class="btn-export" :disabled="loadingAssignments" @click="handleExportAssignments">
            <template v-if="loadingAssignments">
              <span class="spinner-mini"></span>
              Đang xuất...
            </template>
            <template v-else>
              <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Xuất Excel
            </template>
          </button>
        </div>

        <!-- Card 3: Inventory -->
        <div class="report-card">
          <div class="card-header-icon color-orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h3 class="card-title">Vật tư & Tồn kho</h3>
          <p class="card-desc">Xuất dữ liệu danh mục hàng cứu trợ, số lượng tồn kho của từng kho vật tư.</p>

          <div class="card-filters">
            <div class="form-group">
              <label>Kho vật tư</label>
              <select v-model="filterInventory.warehouseId" class="filter-select" :disabled="loadingWarehouses">
                <option value="">Tất cả kho hàng</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">
                  {{ w.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Từ khóa vật tư</label>
              <input v-model="filterInventory.search" type="text" placeholder="Tìm theo tên vật tư..." class="filter-input" />
            </div>
          </div>

          <button class="btn-export" :disabled="loadingInventory" @click="handleExportInventory">
            <template v-if="loadingInventory">
              <span class="spinner-mini"></span>
              Đang xuất...
            </template>
            <template v-else>
              <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Xuất Excel
            </template>
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  exportReliefRequestsExcel,
  exportAssignmentsExcel,
  exportInventoryExcel,
  downloadBlob,
} from '@/features/reports/reports.api'
import { getAllWarehouses } from '@/features/warehouses/warehouses.api'
import { getAdminVolunteers } from '@/features/volunteers/admin-volunteers.api'
import type { WarehouseResponse } from '@/features/warehouses/warehouses.types'
import type { VolunteerSummary } from '@/features/volunteers/admin-volunteers.api'

// Loading states
const loadingRequests = ref(false)
const loadingAssignments = ref(false)
const loadingInventory = ref(false)

const loadingWarehouses = ref(false)
const loadingVolunteers = ref(false)

// Data list for dropdowns
const warehouses = ref<WarehouseResponse[]>([])
const volunteers = ref<VolunteerSummary[]>([])

// Filter models
const filterRequests = reactive({
  status: '',
  search: '',
})

const filterAssignments = reactive({
  status: '',
  volunteerId: '',
})

const filterInventory = reactive({
  warehouseId: '',
  search: '',
})

// Load metadata
async function loadMetadata() {
  // Load warehouses
  loadingWarehouses.value = true
  try {
    warehouses.value = await getAllWarehouses()
  } catch (err) {
    console.error(err)
    ElMessage.error('Không tải được danh sách kho hàng')
  } finally {
    loadingWarehouses.value = false
  }

  // Load volunteers
  loadingVolunteers.value = true
  try {
    volunteers.value = await getAdminVolunteers()
  } catch (err) {
    console.error(err)
    ElMessage.error('Không tải được danh sách tình nguyện viên')
  } finally {
    loadingVolunteers.value = false
  }
}

onMounted(loadMetadata)

// Event Handlers
async function handleExportRequests() {
  loadingRequests.value = true
  try {
    const params = {
      status: filterRequests.status || undefined,
      search: filterRequests.search.trim() || undefined,
    }
    const blob = await exportReliefRequestsExcel(params)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `YeuCauCuuTro_${timestamp}.xlsx`)
    ElMessage.success('Xuất dữ liệu yêu cầu cứu trợ thành công!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Xuất dữ liệu yêu cầu cứu trợ thất bại.')
  } finally {
    loadingRequests.value = false
  }
}

async function handleExportAssignments() {
  loadingAssignments.value = true
  try {
    const params = {
      status: filterAssignments.status || undefined,
      volunteerId: filterAssignments.volunteerId || undefined,
    }
    const blob = await exportAssignmentsExcel(params)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `PhanCongNhiemVu_${timestamp}.xlsx`)
    ElMessage.success('Xuất dữ liệu phân công thành công!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Xuất dữ liệu phân công thất bại.')
  } finally {
    loadingAssignments.value = false
  }
}

async function handleExportInventory() {
  loadingInventory.value = true
  try {
    const params = {
      warehouseId: filterInventory.warehouseId || undefined,
      search: filterInventory.search.trim() || undefined,
    }
    const blob = await exportInventoryExcel(params)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `TonKho_VatTu_${timestamp}.xlsx`)
    ElMessage.success('Xuất dữ liệu tồn kho thành công!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Xuất dữ liệu tồn kho thất bại.')
  } finally {
    loadingInventory.value = false
  }
}
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--space-6);
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.5px;
  margin: 0 0 6px 0;
}

.page-sub {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

/* Grid layout */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: var(--space-6);
}

/* Premium Card */
.report-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 28px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal);
}

.report-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
}

.card-header-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.color-blue { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
.color-green { background: rgba(16, 185, 129, 0.08); color: #10b981; }
.color-orange { background: rgba(245, 158, 11, 0.08); color: #f59e0b; }

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
}

.card-desc {
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 24px 0;
  flex-grow: 1;
}

/* Filters inside Card */
.card-filters {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
  padding: 16px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid #edf2f7;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1.5px solid #cbd5e1;
  background: #fff;
  font-size: 13.5px;
  color: #0f172a;
  outline: none;
  transition: all var(--transition-fast);
}

.filter-select:focus,
.filter-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.filter-select:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

/* Export Button */
.btn-export {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: #1e293b;
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-export:hover:not(:disabled) {
  background: #0f172a;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  flex-shrink: 0;
}

/* Spinner mini */
.spinner-mini {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

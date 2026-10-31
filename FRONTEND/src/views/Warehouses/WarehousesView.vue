<template>
  <WarehouseLayout>
    <div class="wh-page">
      <div class="page-header">
        <div>
          <h2>{{ $t('warehouse.page_title') }}</h2>
          <p class="subtitle">{{ $t('warehouse.page_sub') }}</p>
        </div>
        <button v-if="canManage" class="btn-primary" @click="openCreateModal">{{ $t('warehouse.create_new') }}</button>
      </div>

      <div class="card">
        <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="loadError" class="empty-state error-state">{{ loadError }}</div>
        <div v-else-if="warehouses.length === 0" class="empty-state">{{ $t('warehouse.no_warehouses') }}</div>

        <table v-else class="wh-table">
          <thead>
            <tr>
              <th>{{ $t('warehouse.col_name') }}</th>
              <th>{{ $t('warehouse.col_address') }}</th>
              <th>{{ $t('warehouse.col_phone') }}</th>
              <th>{{ $t('warehouse.col_status') }}</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in warehouses" :key="w.id">
              <td class="cell-name">{{ w.name }}</td>
              <td class="cell-muted">{{ w.address }}</td>
              <td class="cell-muted">{{ w.contactPhone }}</td>
              <td>
                <span class="badge" :class="w.isActive ? 'badge--active' : 'badge--inactive'">
                  {{ w.isActive ? $t('warehouse.status_active') : $t('warehouse.status_inactive') }}
                </span>
              </td>
              <td class="col-actions">
                <router-link class="btn-outline" :to="{ path: '/inventory', query: { warehouseId: w.id } }">Tồn kho</router-link>
                <button v-if="canManage" class="btn-outline" @click="openEditModal(w)">{{ $t('warehouse.edit_btn') }}</button>
                <button
                  v-if="canManage && w.isActive"
                  class="btn-outline btn-outline--danger"
                  @click="handleDeactivate(w)"
                >{{ $t('warehouse.deactivate_btn') }}</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button class="btn-outline" :disabled="pageNumber <= 1" @click="changePage(pageNumber - 1)">{{ $t('warehouse.prev_page') }}</button>
          <span class="page-info">{{ $t('warehouse.page_info', { current: pageNumber, total: totalPages }) }}</span>
          <button class="btn-outline" :disabled="pageNumber >= totalPages" @click="changePage(pageNumber + 1)">{{ $t('warehouse.next_page') }}</button>
        </div>
      </div>

      <!-- ══════════ MODAL: TẠO / SỬA KHO ══════════ -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingId ? $t('warehouse.modal_edit_title') : $t('warehouse.modal_create_title') }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>{{ $t('warehouse.form_name') }} <span class="required">*</span></label>
              <input v-model="form.name" type="text" :placeholder="$t('warehouse.form_name_placeholder')" required />
            </div>

            <div class="form-group">
              <label>{{ $t('warehouse.form_address') }} <span class="required">*</span></label>
              <input v-model="form.address" type="text" :placeholder="$t('warehouse.form_address_placeholder')" required />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>{{ $t('warehouse.form_lat') }} <span class="required">*</span></label>
                <input v-model.number="form.latitude" type="number" step="any" required />
              </div>
              <div class="form-group half">
                <label>{{ $t('warehouse.form_lng') }} <span class="required">*</span></label>
                <input v-model.number="form.longitude" type="number" step="any" required />
              </div>
            </div>
            <button type="button" class="btn-geo" @click="useCurrentLocation">{{ $t('requester.use_current_location') }}</button>

            <div class="form-group">
              <label>{{ $t('warehouse.form_phone') }} <span class="required">*</span></label>
              <input v-model="form.contactPhone" type="tel" required />
            </div>

            <div class="form-group" v-if="editingId">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.isActive" />
                {{ $t('warehouse.form_active_checkbox') }}
              </label>
            </div>

            <p v-if="formError" class="error-text">{{ formError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeModal">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? $t('warehouse.saving') : (editingId ? $t('common.save') : $t('warehouse.create_btn')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </WarehouseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import WarehouseLayout from '@/components/layout/WarehouseLayout.vue'
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse,
} from '@/features/warehouses/warehouses.api'
import type {
  WarehouseResponse,
  UpdateWarehousePayload,
} from '@/features/warehouses/warehouses.types'

const { t } = useI18n()
const auth = useAuthStore()
const canManage = computed(() => auth.hasRole('Admin', 'Coordinator'))

// ── Danh sách + phân trang ────────────────────────────────
const warehouses = ref<WarehouseResponse[]>([])
const pageNumber = ref(1)
const totalPages = ref(1)
const isLoading = ref(false)
const loadError = ref('')

const loadWarehouses = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const paged = await getWarehouses(pageNumber.value, 20)
    warehouses.value = paged.items ?? []
    totalPages.value = paged.totalPages || 1
  } catch (err) {
    loadError.value = (err as Error).message || t('warehouse.load_failed')
  } finally {
    isLoading.value = false
  }
}

const changePage = (p: number) => {
  pageNumber.value = p
  loadWarehouses()
}

onMounted(loadWarehouses)

// ── Modal tạo / sửa ───────────────────────────────────────
const showModal = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const formError = ref('')

const emptyForm = (): UpdateWarehousePayload => ({
  name: '',
  address: '',
  latitude: 0,
  longitude: 0,
  contactPhone: '',
  isActive: true,
})

const form = ref<UpdateWarehousePayload>(emptyForm())

const openCreateModal = () => {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showModal.value = true
}

const openEditModal = (w: WarehouseResponse) => {
  editingId.value = w.id
  form.value = {
    name: w.name ?? '',
    address: w.address ?? '',
    latitude: w.latitude,
    longitude: w.longitude,
    contactPhone: w.contactPhone ?? '',
    isActive: w.isActive,
  }
  formError.value = ''
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert(t('requester.geolocation_unsupported'))
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.latitude = pos.coords.latitude
      form.value.longitude = pos.coords.longitude
    },
    () => alert(t('requester.geolocation_failed')),
  )
}

const handleSubmit = async () => {
  formError.value = ''
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await updateWarehouse(editingId.value, form.value)
    } else {
      await createWarehouse({ name: form.value.name, address: form.value.address, latitude: form.value.latitude, longitude: form.value.longitude, contactPhone: form.value.contactPhone })
    }
    closeModal()
    await loadWarehouses()
  } catch (err) {
    formError.value = (err as Error).message || t('warehouse.save_failed')
  } finally {
    isSubmitting.value = false
  }
}

// ── Ngưng hoạt động ───────────────────────────────────────
const handleDeactivate = async (w: WarehouseResponse) => {
  if (!confirm(t('warehouse.deactivate_confirm', { name: w.name }))) return
  try {
    await deactivateWarehouse(w.id)
    await loadWarehouses()
  } catch (err) {
    alert((err as Error).message || t('warehouse.deactivate_failed'))
  }
}
</script>

<style scoped>
.wh-page { max-width: 1100px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h2 { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.subtitle { font-size: 13.5px; color: #718096; margin: 0; }

.btn-primary { background-color: #1a4f8d; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
.btn-primary:hover { background-color: #123766; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.card { background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }
.error-state { color: #e53e3e; }

/* ── Table ── */
.wh-table { width: 100%; border-collapse: collapse; }
.wh-table th {
  text-align: left; font-size: 12px; font-weight: 700; color: #718096;
  text-transform: uppercase; letter-spacing: 0.4px;
  padding: 10px 12px; border-bottom: 1px solid #e9ecef;
}
.wh-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; vertical-align: middle; }
.wh-table tbody tr:last-child td { border-bottom: none; }
.wh-table tbody tr:hover { background: #f8fafc; }
.cell-name { font-weight: 700; color: #1e293b; }
.cell-muted { color: #475569; }
.col-actions { text-align: right; white-space: nowrap; }
.col-actions .btn-outline { margin-left: 8px; }

.badge { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.badge--active   { background: #dcfce7; color: #15803d; }
.badge--inactive { background: #f1f5f9; color: #64748b; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #1a4f8d; color: #1a4f8d; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline--danger:hover { border-color: #e11d48; color: #e11d48; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; }
.page-info { font-size: 13px; color: #718096; font-weight: 600; }

/* ── Modal (đồng bộ style MyRequests) ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; z-index: 1000;
}
.modal-box {
  background: #fff; border-radius: 14px; width: 100%; max-width: 520px;
  max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fff; z-index: 1;
}
.modal-header h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-row .half { margin-bottom: 0; flex: 1; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
input[type="text"], input[type="number"], input[type="tel"] {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;
}
input:focus { outline: none; border-color: #1a4f8d; }
.btn-geo { background: none; border: none; color: #2563eb; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; margin: -8px 0 16px 0; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; margin: 0; }
.checkbox-label input { width: 15px; height: 15px; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

@media (max-width: 700px) {
  .page-header { flex-direction: column; gap: 14px; }
  .wh-table th:nth-child(2), .wh-table td:nth-child(2) { display: none; }
  .form-row { flex-direction: column; gap: 16px; }
}
</style>

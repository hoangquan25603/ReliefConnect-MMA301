<template>
  <WarehouseLayout>
    <div class="inv-page">
      <div class="page-header">
        <div>
          <h2>{{ $t('inventory.page_title') }}</h2>
          <p class="subtitle">{{ $t('inventory.page_sub') }}</p>
        </div>
        <button v-if="canManage" class="btn-primary" :disabled="!selectedWarehouse?.isActive" @click="openCreateModal">
          {{ $t('inventory.add_item') }}
        </button>
      </div>

      <div v-if="summary" class="summary-grid" aria-label="Tổng quan tồn kho">
        <div class="summary-card"><span>Loại vật tư</span><strong>{{ formatNumber(summary.totalItems) }}</strong></div>
        <div class="summary-card summary-card--warning"><span>Dưới mức tối thiểu</span><strong>{{ formatNumber(summary.lowStockItems) }}</strong></div>
        <div class="summary-card"><span>Trạng thái kho</span><strong class="summary-status">{{ selectedWarehouse?.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động' }}</strong></div>
      </div>
      <p v-if="!canManage" class="hint-text">Bạn có quyền xem tồn kho. Quản trị viên và quản lý kho có thể nhập, xuất và chuyển vật tư.</p>
      <p v-if="selectedWarehouse && !selectedWarehouse.isActive" class="hint-text">Kho đã ngưng hoạt động. Mở lại kho trước khi thực hiện giao dịch.</p>
      <p v-if="successMessage" class="success-message" role="status">{{ successMessage }}</p>

      <!-- Chọn kho -->
      <div class="filter-bar">
        <label class="wh-select-label">{{ $t('inventory.select_warehouse_label') }}</label>
        <select v-model="selectedWarehouseId" class="wh-select">
          <option value="" disabled>{{ $t('inventory.select_warehouse_placeholder') }}</option>
          <option v-for="w in warehouseOptions" :key="w.id" :value="w.id">
            {{ w.name }}{{ w.isActive ? '' : $t('inventory.inactive_suffix') }}
          </option>
        </select>
        <button class="btn-outline" :disabled="isLoading || !selectedWarehouseId" @click="refreshInventory">Làm mới</button>
      </div>
      <form class="search-bar" @submit.prevent="applyFilters">
        <input v-model="searchText" type="search" placeholder="Tìm theo tên vật tư…" aria-label="Tìm vật tư" />
        <label class="checkbox-filter"><input v-model="lowStockOnly" type="checkbox" @change="applyFilters" /> Chỉ vật tư sắp hết</label>
        <button class="btn-outline" :disabled="!selectedWarehouseId">Tìm kiếm</button>
      </form>

      <div class="card">
        <div v-if="loadError" class="empty-state error-state" role="alert">{{ loadError }} <button class="btn-outline" @click="initializeWarehouses">Thử lại</button></div>
        <div v-else-if="!selectedWarehouseId" class="empty-state">{{ $t('inventory.select_warehouse_prompt') }} <router-link v-if="canManage" to="/warehouses">Tạo kho</router-link></div>
        <div v-else-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="items.length === 0" class="empty-state">
          {{ $t('inventory.no_items') }}
        </div>

        <table v-else class="inv-table">
          <thead>
            <tr>
              <th>{{ $t('inventory.col_item') }}</th>
              <th>{{ $t('inventory.col_category') }}</th>
              <th>{{ $t('inventory.col_unit') }}</th>
              <th class="col-num">{{ $t('inventory.col_stock') }}</th>
              <th class="col-num">{{ $t('inventory.col_threshold') }}</th>
              <th></th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" :class="{ 'row-low': item.isLowStock }">
              <td class="cell-name">{{ item.itemName }}</td>
              <td class="cell-muted"><span class="category-tag">{{ categoryLabel(item.category) }}</span></td>
              <td class="cell-muted">{{ item.unit }}</td>
              <td class="col-num cell-qty">{{ formatNumber(item.quantity) }}</td>
              <td class="col-num cell-muted">{{ formatNumber(item.minimumQuantity) }}</td>
              <td>
                <span v-if="item.isLowStock" class="badge badge--low">{{ $t('inventory.low_stock_badge') }}</span>
              </td>
              <td class="col-actions">
                <button v-if="canManage" class="btn-outline btn-in" :disabled="!selectedWarehouse?.isActive" @click="openStockModal(item, 'in')">{{ $t('inventory.btn_stock_in') }}</button>
                <button v-if="canManage" class="btn-outline btn-out" :disabled="!selectedWarehouse?.isActive || item.quantity <= 0" @click="openStockModal(item, 'out')">{{ $t('inventory.btn_stock_out') }}</button>
                <button v-if="canManage" class="btn-outline" :disabled="!selectedWarehouse?.isActive || item.quantity <= 0 || transferWarehouses.length === 0" @click="openStockModal(item, 'transfer')">Chuyển kho</button>
                <button v-if="canManage" class="btn-outline" :disabled="!selectedWarehouse?.isActive" @click="openEditModal(item)">{{ $t('warehouse.edit_btn') }}</button>
                <button class="btn-outline" @click="openHistoryModal(item)">{{ $t('inventory.btn_history') }}</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" v-if="totalPages > 1">
          <button class="btn-outline" :disabled="pageNumber <= 1" @click="changePage(pageNumber - 1)">{{ $t('warehouse.prev_page') }}</button>
          <span class="page-info">{{ $t('warehouse.page_info', { current: pageNumber, total: totalPages }) }}</span>
          <button class="btn-outline" :disabled="pageNumber >= totalPages" @click="changePage(pageNumber + 1)">{{ $t('warehouse.next_page') }}</button>
        </div>
      </div>

      <!-- ══════════ MODAL: TẠO / SỬA VẬT TƯ ══════════ -->
      <div v-if="showItemModal" class="modal-overlay" @click.self="closeItemModal">
        <div class="modal-box" role="dialog" aria-modal="true" aria-label="Thông tin vật tư">
          <div class="modal-header">
            <h3>{{ editingId ? $t('inventory.modal_edit_item_title') : $t('inventory.modal_create_item_title') }}</h3>
            <button class="modal-close" @click="closeItemModal">✕</button>
          </div>
          <form class="modal-body" @submit.prevent="handleItemSubmit">
            <div class="form-group">
              <label>{{ $t('inventory.form_item_name') }} <span class="required">*</span></label>
              <input v-model.trim="itemForm.itemName" type="text" maxlength="100" :placeholder="$t('inventory.form_item_name_placeholder')" required />
            </div>
            <div class="form-group">
              <label>{{ $t('inventory.form_category') }} <span class="required">*</span></label>
              <select v-model="itemForm.category" required>
                <option v-for="c in INVENTORY_CATEGORIES" :key="c" :value="c">{{ categoryLabel(c) }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>{{ $t('inventory.form_unit') }} <span class="required">*</span></label>
                <input v-model.trim="itemForm.unit" type="text" maxlength="30" :placeholder="$t('inventory.form_unit_placeholder')" required />
              </div>
              <div class="form-group half">
                <label>{{ $t('inventory.form_threshold') }} <span class="required">*</span></label>
                <input v-model.number="itemForm.minimumQuantity" type="number" min="0" max="1000000000" step="1" required />
              </div>
            </div>

            <p v-if="!editingId" class="hint-text">
              {{ $t('inventory.create_hint') }}
            </p>

            <p v-if="itemFormError" class="error-text">{{ itemFormError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeItemModal">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? $t('warehouse.saving') : (editingId ? $t('common.save') : $t('inventory.add_item_btn')) }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ══════════ MODAL: NHẬP / XUẤT KHO ══════════ -->
      <div v-if="showStockModal" class="modal-overlay" @click.self="closeStockModal">
        <div class="modal-box" v-if="stockTarget" role="dialog" aria-modal="true" aria-label="Giao dịch kho">
          <div class="modal-header">
            <h3>{{ stockMode === 'transfer' ? 'Chuyển kho' : stockMode === 'in' ? $t('inventory.stock_in_title') : $t('inventory.stock_out_title') }}: {{ stockTarget.itemName }}</h3>
            <button class="modal-close" @click="closeStockModal">✕</button>
          </div>
          <form class="modal-body" @submit.prevent="handleStockSubmit">
            <p class="stock-current">
              {{ $t('inventory.current_stock') }} <strong>{{ formatNumber(stockTarget.quantity) }} {{ stockTarget.unit }}</strong>
            </p>

            <div v-if="stockMode === 'transfer'" class="form-group">
              <label for="destination-warehouse">Kho nhận <span class="required">*</span></label>
              <select id="destination-warehouse" v-model="destinationWarehouseId" required>
                <option value="" disabled>Chọn kho nhận</option>
                <option v-for="warehouse in transferWarehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }}</option>
              </select>
              <p class="hint-text">Hệ thống trừ kho gửi, cộng kho nhận và lưu hai bút toán trong cùng một giao dịch.</p>
            </div>
            <div class="form-group">
              <label>{{ stockMode === 'transfer' ? 'Số lượng chuyển' : stockMode === 'in' ? $t('inventory.quantity_in_label') : $t('inventory.quantity_out_label') }} <span class="required">*</span></label>
              <input v-model.number="stockForm.quantity" type="number" min="1" :max="stockMode === 'in' ? 1000000000 : Math.min(stockTarget.quantity, 1000000000)" step="1" required autofocus />
            </div>

            <div v-if="stockMode === 'out'" class="guideline-box">
              <p class="guideline-box__title">{{ $t('inventory.guideline_title') }}</p>
              <div class="guideline-box__levels">
                <button
                  type="button"
                  v-for="lv in [1, 2, 3] as const"
                  :key="lv"
                  class="guideline-level-btn"
                  :class="{ active: guidelineLevel === lv }"
                  @click="loadGuideline(lv)"
                >
                  {{ lv === 1 ? $t('coordinator.emergency_low') : lv === 2 ? $t('coordinator.emergency_large_scale') : $t('coordinator.emergency_severe') }}
                </button>
              </div>

              <div v-if="isGuidelineLoading" class="guideline-box__loading">{{ $t('common.loading') }}</div>
              <p v-else-if="guidelineError" class="error-text">{{ guidelineError }}</p>
              <template v-else-if="guidelineLevel">
                <p v-if="guidelineMatch && guidelineMatch.suggestedQuantity != null" class="guideline-box__suggestion">
                  {{ $t('inventory.guideline_suggested_for_item', { qty: formatNumber(guidelineMatch.suggestedQuantity), unit: guidelineMatch.unit }) }}
                  <button type="button" class="guideline-apply-btn" @click="stockForm.quantity = guidelineMatch!.suggestedQuantity!">
                    {{ $t('inventory.guideline_apply') }}
                  </button>
                </p>
                <p v-else class="guideline-box__no-match">{{ $t('inventory.guideline_no_match') }}</p>

                <details class="guideline-box__all">
                  <summary>{{ $t('inventory.guideline_see_all') }}</summary>
                  <ul>
                    <li v-for="g in guidelineItems" :key="g.itemName">
                      {{ g.itemName }}: {{ g.suggestedQuantity != null ? `${formatNumber(g.suggestedQuantity)} ${g.unit}` : $t('inventory.guideline_no_standard') }}
                    </li>
                  </ul>
                </details>
              </template>
            </div>

            <div class="form-group">
              <label>{{ $t('inventory.form_reference') }}</label>
              <input v-model="stockForm.referenceNo" type="text" :placeholder="$t('inventory.form_reference_placeholder')" />
            </div>
            <div class="form-group">
              <label>{{ $t('inventory.form_note') }}</label>
              <textarea v-model="stockForm.note" rows="2" :placeholder="$t('inventory.form_note_placeholder')"></textarea>
            </div>

            <p v-if="stockError" class="error-text">{{ stockError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeStockModal">{{ $t('common.cancel') }}</button>
              <button
                type="submit"
                class="btn-primary"
                :class="{ 'btn-danger': stockMode === 'out' }"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? $t('inventory.processing') : stockMode === 'transfer' ? 'Xác nhận chuyển kho' : (stockMode === 'in' ? $t('inventory.confirm_stock_in') : $t('inventory.confirm_stock_out')) }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ══════════ MODAL: LỊCH SỬ GIAO DỊCH ══════════ -->
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
        <div class="modal-box" v-if="historyTarget" role="dialog" aria-modal="true" aria-label="Lịch sử giao dịch">
          <div class="modal-header">
            <h3>{{ $t('inventory.history_title', { name: historyTarget.itemName }) }}</h3>
            <button class="modal-close" @click="closeHistoryModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="historyLoading" class="empty-state">{{ $t('common.loading') }}</div>
            <div v-else-if="historyError" class="error-text" role="alert">{{ historyError }} <button class="btn-outline" @click="loadHistory">Thử lại</button></div>
            <div v-else-if="transactions.length === 0" class="empty-state">{{ $t('inventory.no_transactions') }}</div>
            <div v-else class="tx-list">
              <div class="tx-item" v-for="tx in transactions" :key="tx.id">
                <div class="tx-icon" :class="isStockIn(tx) ? 'tx-icon--in' : 'tx-icon--out'">
                  {{ isStockIn(tx) ? '↓' : '↑' }}
                </div>
                <div class="tx-info">
                  <p class="tx-title">
                    {{ transactionLabel(tx) }}
                    <strong :class="isStockIn(tx) ? 't-green' : 't-red'">
                      {{ isStockIn(tx) ? '+' : '−' }}{{ formatNumber(tx.quantity) }} {{ historyTarget.unit }}
                    </strong>
                  </p>
                  <p class="tx-meta">
                    {{ formatDateTimeVI(tx.createdAt) }}
                    <template v-if="tx.referenceNo"> · {{ $t('inventory.tx_reference_prefix') }} {{ tx.referenceNo }}</template>
                  </p>
                  <p class="tx-note" v-if="tx.note">{{ tx.note }}</p>
                </div>
              </div>
            </div>
            <div v-if="historyTotalPages > 1" class="pagination">
              <button class="btn-outline" :disabled="historyPage <= 1 || historyLoading" @click="changeHistoryPage(-1)">Trước</button>
              <span>{{ historyPage }} / {{ historyTotalPages }}</span>
              <button class="btn-outline" :disabled="historyPage >= historyTotalPages || historyLoading" @click="changeHistoryPage(1)">Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </WarehouseLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import WarehouseLayout from '@/components/layout/WarehouseLayout.vue'
import { ApiError } from '@/lib/api/http'
import { getAllWarehouses } from '@/features/warehouses/warehouses.api'
import type { WarehouseResponse } from '@/features/warehouses/warehouses.types'
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  stockIn,
  stockOut,
  getInventoryTransactions,
  getInventorySummary,
  transferStock,
} from '@/features/inventory/inventory.api'
import { getSeverityGuideline, type SeverityGuidelineItem } from '@/features/inventory/severity-guideline.api'
import {
  INVENTORY_CATEGORIES,
  type InventoryItemResponse,
  type InventoryCategory,
  type UpdateInventoryItemPayload,
  type StockMovePayload,
  type InventoryTransaction,
  type InventorySummary,
} from '@/features/inventory/inventory.types'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const canManage = computed(() => auth.hasRole('Admin', 'Coordinator'))
const successMessage = ref('')

const formatNumber = (n: number) => n.toLocaleString('vi-VN')

// [Giới hạn tồn kho] Nhãn hiển thị tiếng Việt cho từng nhóm — khớp enum InventoryCategory BE.
const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  Food: 'Lương thực',
  Water: 'Nước sạch',
  Medicine: 'Thuốc men',
  Blanket: 'Chăn màn',
  Shelter: 'Nơi trú ẩn',
  Other: 'Khác',
}
const categoryLabel = (c: InventoryCategory) => CATEGORY_LABELS[c] ?? c

// ── Chọn kho ──────────────────────────────────────────────
const warehouseOptions = ref<WarehouseResponse[]>([])
const selectedWarehouseId = ref('')
const selectedWarehouse = computed(() => warehouseOptions.value.find(w => w.id === selectedWarehouseId.value))
const transferWarehouses = computed(() => warehouseOptions.value.filter(w => w.isActive && w.id !== selectedWarehouseId.value))

const initializeWarehouses = async () => {
  loadError.value = ''
  try {
    warehouseOptions.value = await getAllWarehouses()
    if (warehouseOptions.value.length > 0) {
      const requested = String(route.query.warehouseId ?? '')
      if (!selectedWarehouseId.value) {
        selectedWarehouseId.value = warehouseOptions.value.find(w => w.id === requested)?.id
          ?? warehouseOptions.value.find(w => w.isActive)?.id ?? warehouseOptions.value[0]!.id
      } else {
        await refreshInventory()
      }
    }
  } catch (err) {
    loadError.value = (err as Error).message || t('inventory.load_warehouses_failed')
  }
}
onMounted(initializeWarehouses)

// ── Danh sách vật tư ──────────────────────────────────────
const items = ref<InventoryItemResponse[]>([])
const pageNumber = ref(1)
const totalPages = ref(1)
const isLoading = ref(false)
const loadError = ref('')
const summary = ref<InventorySummary | null>(null)
const searchText = ref('')
const appliedSearch = ref('')
const lowStockOnly = ref(false)
let loadGeneration = 0

const loadItems = async () => {
  if (!selectedWarehouseId.value) return
  const generation = ++loadGeneration
  isLoading.value = true
  loadError.value = ''
  try {
    const paged = await getInventoryItems({
      warehouseId: selectedWarehouseId.value,
      pageNumber: pageNumber.value,
      pageSize: 20,
      search: appliedSearch.value,
      lowStockOnly: lowStockOnly.value,
    })
    if (generation !== loadGeneration) return
    items.value = paged.items ?? []
    totalPages.value = paged.totalPages || 1
  } catch (err) {
    if (generation !== loadGeneration) return
    loadError.value = (err as Error).message || t('inventory.load_items_failed')
  } finally {
    if (generation === loadGeneration) isLoading.value = false
  }
}

const loadSummary = async () => {
  const warehouseId = selectedWarehouseId.value
  try {
    const data = await getInventorySummary(warehouseId)
    if (warehouseId === selectedWarehouseId.value) summary.value = data
  } catch { summary.value = null }
}
const refreshInventory = () => Promise.all([loadItems(), loadSummary()])
const applyFilters = () => {
  appliedSearch.value = searchText.value.trim()
  pageNumber.value = 1
  void loadItems()
}

watch(selectedWarehouseId, () => {
  pageNumber.value = 1
  summary.value = null
  successMessage.value = ''
  void refreshInventory()
})

const changePage = (p: number) => {
  pageNumber.value = p
  loadItems()
}

// ── Modal tạo / sửa vật tư ────────────────────────────────
const showItemModal = ref(false)
const editingId = ref<string | null>(null)
const isSubmitting = ref(false)
const itemFormError = ref('')

const itemForm = ref<UpdateInventoryItemPayload>({
  itemName: '',
  unit: '',
  minimumQuantity: 0,
  category: 'Other',
})

const openCreateModal = () => {
  editingId.value = null
  itemForm.value = { itemName: '', unit: '', minimumQuantity: 0, category: 'Other' }
  itemFormError.value = ''
  showItemModal.value = true
}

const openEditModal = (item: InventoryItemResponse) => {
  editingId.value = item.id
  itemForm.value = {
    itemName: item.itemName ?? '',
    unit: item.unit ?? '',
    minimumQuantity: item.minimumQuantity,
    category: item.category ?? 'Other',
  }
  itemFormError.value = ''
  showItemModal.value = true
}

const closeItemModal = () => { if (!isSubmitting.value) showItemModal.value = false }

const handleItemSubmit = async () => {
  itemFormError.value = ''
  if (isSubmitting.value || !canManage.value) return
  if (!itemForm.value.itemName.trim() || !itemForm.value.unit.trim() || !Number.isInteger(itemForm.value.minimumQuantity) || itemForm.value.minimumQuantity < 0 || itemForm.value.minimumQuantity > 1000000000) {
    itemFormError.value = 'Nhập tên, đơn vị và mức tồn tối thiểu hợp lệ.'
    return
  }
  isSubmitting.value = true
  try {
    if (editingId.value) {
      await updateInventoryItem(editingId.value, itemForm.value)
    } else {
      await createInventoryItem({
        warehouseId: selectedWarehouseId.value,
        ...itemForm.value,
      })
    }
    showItemModal.value = false
    successMessage.value = editingId.value ? 'Đã cập nhật vật tư.' : 'Đã tạo vật tư. Bạn có thể nhập kho ngay.'
    await refreshInventory()
  } catch (err) {
    itemFormError.value = (err as Error).message || t('inventory.save_failed')
    // 409: người khác vừa sửa cùng lúc → reload cho dữ liệu mới nhất
    if (err instanceof ApiError && err.status === 409) await loadItems()
  } finally {
    isSubmitting.value = false
  }
}

// ── Modal nhập / xuất kho ─────────────────────────────────
const showStockModal = ref(false)
const stockMode = ref<'in' | 'out' | 'transfer'>('in')
const stockTarget = ref<InventoryItemResponse | null>(null)
const stockError = ref('')
const destinationWarehouseId = ref('')

const stockForm = ref<StockMovePayload>({ quantity: 0, referenceNo: '', note: '' })

const openStockModal = (item: InventoryItemResponse, mode: 'in' | 'out' | 'transfer') => {
  stockTarget.value = item
  stockMode.value = mode
  stockForm.value = { quantity: 0, referenceNo: '', note: '' }
  stockError.value = ''
  destinationWarehouseId.value = ''
  guidelineLevel.value = null
  guidelineItems.value = []
  guidelineError.value = ''
  showStockModal.value = true
}

const closeStockModal = () => { if (!isSubmitting.value) showStockModal.value = false }

// ── Gợi ý định lượng theo mức độ khẩn cấp (chỉ khi xuất kho) ──
const guidelineLevel = ref<1 | 2 | 3 | null>(null)
const guidelineItems = ref<SeverityGuidelineItem[]>([])
const isGuidelineLoading = ref(false)
const guidelineError = ref('')

const guidelineMatch = computed<SeverityGuidelineItem | null>(() => {
  if (!stockTarget.value) return null
  const name = stockTarget.value.itemName?.trim().toLowerCase()
  return guidelineItems.value.find((g) => g.itemName.trim().toLowerCase() === name) ?? null
})

async function loadGuideline(level: 1 | 2 | 3) {
  guidelineLevel.value = level
  isGuidelineLoading.value = true
  guidelineError.value = ''
  try {
    const result = await getSeverityGuideline(level)
    guidelineItems.value = result.items
  } catch (err) {
    guidelineError.value = (err as Error).message || t('inventory.guideline_load_failed')
  } finally {
    isGuidelineLoading.value = false
  }
}

const handleStockSubmit = async () => {
  if (!stockTarget.value || isSubmitting.value || !canManage.value) return
  stockError.value = ''
  if (!Number.isInteger(stockForm.value.quantity) || stockForm.value.quantity <= 0 || stockForm.value.quantity > 1000000000) {
    stockError.value = 'Số lượng phải là số nguyên từ 1 đến 1.000.000.000.'
    return
  }
  if (stockMode.value !== 'in' && stockForm.value.quantity > stockTarget.value.quantity) {
    stockError.value = 'Số lượng vượt quá tồn kho hiện tại.'
    return
  }
  if (stockMode.value === 'transfer' && !destinationWarehouseId.value) {
    stockError.value = 'Vui lòng chọn kho nhận.'
    return
  }
  isSubmitting.value = true
  try {
    if (stockMode.value === 'transfer') {
      await transferStock(stockTarget.value.id, { ...stockForm.value, destinationWarehouseId: destinationWarehouseId.value })
    } else {
      const fn = stockMode.value === 'in' ? stockIn : stockOut
      await fn(stockTarget.value.id, stockForm.value)
    }
    showStockModal.value = false
    successMessage.value = stockMode.value === 'transfer' ? 'Chuyển kho thành công. Cả hai kho đã được cập nhật.' : stockMode.value === 'in' ? 'Nhập kho thành công.' : 'Xuất kho thành công.'
    await refreshInventory()
  } catch (err) {
    // Xuất vượt tồn → 400; 2 người cùng thao tác → 409 (RowVersion)
    stockError.value = (err as Error).message || t('inventory.stock_action_failed')
    if (err instanceof ApiError && err.status === 409) await loadItems()
  } finally {
    isSubmitting.value = false
  }
}

// ── Modal lịch sử giao dịch ───────────────────────────────
const showHistoryModal = ref(false)
const historyTarget = ref<InventoryItemResponse | null>(null)
const transactions = ref<InventoryTransaction[]>([])
const historyLoading = ref(false)
const historyError = ref('')
const historyPage = ref(1)
const historyTotalPages = ref(1)
let historyGeneration = 0

const isStockIn = (tx: InventoryTransaction) =>
  (tx.transactionType ?? '').toLowerCase().includes('in')
const transactionLabel = (tx: InventoryTransaction) => {
  const kind = (tx.transactionType ?? '').toLowerCase()
  if (kind.includes('transfer')) return isStockIn(tx) ? 'Nhận chuyển kho' : 'Chuyển sang kho khác'
  return isStockIn(tx) ? t('inventory.tx_in') : t('inventory.tx_out')
}

const openHistoryModal = async (item: InventoryItemResponse) => {
  historyTarget.value = item
  showHistoryModal.value = true
  historyPage.value = 1
  transactions.value = []
  await loadHistory()
}
const loadHistory = async () => {
  if (!historyTarget.value) return
  const generation = ++historyGeneration
  historyLoading.value = true
  historyError.value = ''
  try {
    const paged = await getInventoryTransactions(historyTarget.value.id, historyPage.value, 20)
    if (generation !== historyGeneration) return
    transactions.value = paged.items ?? []
    historyTotalPages.value = paged.totalPages || 1
  } catch (err) {
    if (generation !== historyGeneration) return
    transactions.value = []
    historyError.value = (err as Error).message || 'Không tải được lịch sử.'
  } finally {
    if (generation === historyGeneration) historyLoading.value = false
  }
}
const changeHistoryPage = (delta: number) => {
  historyPage.value += delta
  void loadHistory()
}

const closeHistoryModal = () => { showHistoryModal.value = false }
</script>

<style scoped>
.inv-page { max-width: 1100px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-header h2 { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.subtitle { font-size: 13.5px; color: #718096; margin: 0; }

.btn-primary { background-color: #1a4f8d; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
.btn-primary:hover { background-color: #123766; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background-color: #e11d48; }
.btn-danger:hover { background-color: #be123c; }

/* ── Filter bar ── */
.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
.wh-select-label { font-size: 13.5px; font-weight: 700; color: #334155; margin: 0; }
.wh-select {
  padding: 9px 14px; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 13.5px; background: #fff; min-width: 240px;
}
.wh-select:focus { outline: none; border-color: #1a4f8d; }
.low-stock-summary { font-size: 13px; font-weight: 700; color: #b45309; background: #fef3c7; padding: 7px 14px; border-radius: 20px; }

.card { background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow-x: auto; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
.summary-card { background: white; border: 1px solid #dce5ee; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 7px; }
.summary-card span { color: #64748b; font-size: 13px; }
.summary-card strong { color: #1a4f8d; font-size: 28px; }
.summary-card--warning { background: #fffbeb; border-color: #fde68a; }
.summary-card--warning strong { color: #b45309; }
.summary-card .summary-status { font-size: 16px; margin-top: 5px; }
.success-message { background: #dcfce7; color: #166534; border-radius: 8px; padding: 12px; }
.search-bar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
.search-bar input[type="search"] { flex: 1; min-width: 180px; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
.checkbox-filter { display: flex; align-items: center; gap: 8px; margin: 0; }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }
.error-state { color: #e53e3e; }

/* ── Table ── */
.inv-table { width: 100%; border-collapse: collapse; }
.inv-table th {
  text-align: left; font-size: 12px; font-weight: 700; color: #718096;
  text-transform: uppercase; letter-spacing: 0.4px;
  padding: 10px 12px; border-bottom: 1px solid #e9ecef;
}
.inv-table td { padding: 13px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; vertical-align: middle; }
.inv-table tbody tr:last-child td { border-bottom: none; }
.inv-table tbody tr:hover { background: #f8fafc; }
.row-low { background: #fffbeb; }
.row-low:hover { background: #fef3c7 !important; }
.cell-name { font-weight: 700; color: #1e293b; }
.cell-muted { color: #475569; }
.cell-qty { font-weight: 800; color: #1a4f8d; }
.col-num { text-align: right; }
.col-actions { text-align: right; white-space: nowrap; }
.col-actions .btn-outline { margin-left: 6px; }

.badge { padding: 4px 11px; border-radius: 20px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
.badge--low { background: #fee2e2; color: #b91c1c; }

.category-tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; background: #eef2f7; color: #475569; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #1a4f8d; color: #1a4f8d; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-in:hover  { border-color: #15803d; color: #15803d; }
.btn-out:hover { border-color: #e11d48; color: #e11d48; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; }
.page-info { font-size: 13px; color: #718096; font-weight: 600; }

/* ── Modal ── */
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
.modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-row .half { margin-bottom: 0; flex: 1; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
input[type="text"], input[type="number"], select, textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: #1a4f8d; }
textarea { resize: vertical; }

.hint-text { font-size: 12.5px; color: #64748b; background: #f8fafc; border-radius: 8px; padding: 10px 12px; margin: 0 0 14px; line-height: 1.5; }
.stock-current { font-size: 13.5px; color: #334155; background: #f0f7ff; border-radius: 8px; padding: 10px 12px; margin: 0 0 16px; }
.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

.guideline-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; }
.guideline-box__title { font-size: 12.5px; font-weight: 700; color: #92400e; margin: 0 0 8px; }
.guideline-box__levels { display: flex; gap: 6px; margin-bottom: 10px; }
.guideline-level-btn { background: #fff; border: 1px solid #fde68a; color: #92400e; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; }
.guideline-level-btn.active { background: #f59e0b; border-color: #f59e0b; color: #fff; }
.guideline-box__loading { font-size: 12.5px; color: #92400e; }
.guideline-box__suggestion { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; color: #1e293b; margin: 0; }
.guideline-apply-btn { background: #f59e0b; color: #fff; border: none; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
.guideline-apply-btn:hover { background: #d97706; }
.guideline-box__no-match { font-size: 12.5px; color: #92400e; margin: 0; font-style: italic; }
.guideline-box__all { margin-top: 8px; font-size: 12px; color: #78350f; }
.guideline-box__all summary { cursor: pointer; font-weight: 600; }
.guideline-box__all ul { margin: 6px 0 0; padding-left: 18px; }

/* ── Transaction list ── */
.tx-list { display: flex; flex-direction: column; gap: 4px; }
.tx-item { display: flex; gap: 12px; padding: 12px 8px; border-bottom: 1px solid #f1f5f9; }
.tx-item:last-child { border-bottom: none; }
.tx-icon {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 900;
}
.tx-icon--in  { background: #dcfce7; color: #15803d; }
.tx-icon--out { background: #fee2e2; color: #b91c1c; }
.tx-info { flex: 1; min-width: 0; }
.tx-title { margin: 0; font-size: 13.5px; font-weight: 600; color: #1e293b; }
.t-green { color: #15803d; } .t-red { color: #b91c1c; }
.tx-meta { margin: 3px 0 0; font-size: 11.5px; color: #94a3b8; }
.tx-note { margin: 4px 0 0; font-size: 12.5px; color: #475569; font-style: italic; }

@media (max-width: 800px) {
  .page-header { flex-direction: column; gap: 14px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .summary-card:last-child { grid-column: 1 / -1; }
  .card { padding: 10px; }
  .inv-table { min-width: 780px; }
  .modal-overlay { padding: 12px; }
  .modal-header, .modal-body { padding: 16px; }
  .wh-select { min-width: 0; width: 100%; }
  .guideline-box__levels { flex-wrap: wrap; }
  .col-actions .btn-outline { margin: 2px; }
}
</style>

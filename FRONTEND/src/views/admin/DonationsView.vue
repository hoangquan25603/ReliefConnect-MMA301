<template>
  <AdminLayout>
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('donations.admin_title') }}</h1>
          <p class="page-sub">{{ $t('donations.admin_sub') }}</p>
        </div>
      </div>

      <div class="card">
        <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="pendingDonations.length === 0" class="empty-state">{{ $t('donations.no_pending') }}</div>

        <table v-else class="donations-table">
          <thead>
            <tr>
              <th>{{ $t('donations.col_donor') }}</th>
              <th>{{ $t('donations.col_items') }}</th>
              <th>{{ $t('donations.col_created') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in pendingDonations" :key="d.id">
              <td class="font-semibold">{{ d.donorName }}</td>
              <td>
                <span v-for="(it, idx) in d.items" :key="it.id" class="item-chip">
                  {{ it.itemName }} ({{ it.quantity }} {{ it.unit }})<span v-if="idx < d.items.length - 1">, </span>
                </span>
              </td>
              <td class="text-muted">{{ formatDateTimeVI(d.createdAt) }}</td>
              <td class="actions-cell">
                <button class="action-btn action-btn--approve" @click="openApproveModal(d)">{{ $t('donations.btn_approve') }}</button>
                <button class="action-btn action-btn--reject" @click="openRejectModal(d)">{{ $t('donations.btn_reject') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══════════ MODAL: DUYỆT ══════════ -->
      <div v-if="showApproveModal" class="modal-overlay" @click.self="closeApproveModal">
        <div class="modal-box" v-if="approveTarget">
          <div class="modal-header">
            <h3>{{ $t('donations.approve_modal_title') }}</h3>
            <button class="modal-close" @click="closeApproveModal">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">{{ $t('donations.approve_modal_desc') }}</p>

            <div class="map-row" v-for="row in approveRows" :key="row.donationItemId">
              <div class="map-row__item">
                <strong>{{ row.itemName }}</strong>
                <span class="text-muted">{{ row.quantity }} {{ row.unit }}</span>
              </div>

              <div class="map-row__mode">
                <label>
                  <input type="radio" :name="`mode-${row.donationItemId}`" value="existing" v-model="row.mode" />
                  {{ $t('donations.map_existing') }}
                </label>
                <label>
                  <input type="radio" :name="`mode-${row.donationItemId}`" value="new" v-model="row.mode" />
                  {{ $t('donations.map_new') }}
                </label>
              </div>

              <div v-if="row.mode === 'existing'" class="map-row__fields">
                <select v-model="row.inventoryItemId">
                  <option value="" disabled>{{ $t('donations.select_inventory_item') }}</option>
                  <option v-for="inv in inventoryItems" :key="inv.id" :value="inv.id">
                    {{ inv.itemName }} — {{ warehouseName(inv.warehouseId) }} ({{ inv.quantity }} {{ inv.unit }})
                  </option>
                </select>
              </div>

              <div v-else class="map-row__fields">
                <select v-model="row.warehouseId">
                  <option value="" disabled>{{ $t('donations.select_warehouse') }}</option>
                  <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
                </select>
                <input
                  v-model.number="row.newItemMinimumQuantity"
                  type="number"
                  min="0"
                  :placeholder="$t('donations.new_item_min_quantity')"
                />
              </div>
            </div>

            <p v-if="approveError" class="error-text">{{ approveError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeApproveModal">{{ $t('common.cancel') }}</button>
              <button type="button" class="btn-primary" :disabled="isApproving" @click="handleApprove">
                {{ isApproving ? $t('donations.processing') : $t('donations.btn_confirm_approve') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ MODAL: TỪ CHỐI ══════════ -->
      <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
        <div class="modal-box modal-box--sm" v-if="rejectTarget">
          <div class="modal-header">
            <h3>{{ $t('donations.reject_modal_title') }}</h3>
            <button class="modal-close" @click="closeRejectModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>{{ $t('donations.reject_reason_label') }} <span class="required">*</span></label>
              <textarea v-model="rejectReason" rows="3" :placeholder="$t('donations.reject_reason_placeholder')" />
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  getPendingDonations,
  approveDonation,
  rejectDonation,
  type DonationResponse,
  type DonationItemMapping,
} from '@/features/donations/donations.api'
import { getAllWarehouses } from '@/features/warehouses/warehouses.api'
import { getInventoryItems } from '@/features/inventory/inventory.api'
import type { WarehouseResponse } from '@/features/warehouses/warehouses.types'
import type { InventoryItemResponse } from '@/features/inventory/inventory.types'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'

const { t } = useI18n()

const pendingDonations = ref<DonationResponse[]>([])
const isLoading = ref(true)
const warehouses = ref<WarehouseResponse[]>([])
const inventoryItems = ref<InventoryItemResponse[]>([])

async function loadPending() {
  isLoading.value = true
  try {
    const result = await getPendingDonations(1, 100)
    pendingDonations.value = result.items
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function loadReferenceData() {
  try {
    const [wh, inv] = await Promise.all([
      getAllWarehouses(),
      getInventoryItems({ pageSize: 100 }),
    ])
    warehouses.value = wh
    inventoryItems.value = inv.items
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadPending()
  loadReferenceData()
})

function warehouseName(id: string): string {
  return warehouses.value.find((w) => w.id === id)?.name ?? '—'
}

// ── Approve modal ────────────────────────────────────────────
interface ApproveRow {
  donationItemId: string
  itemName: string
  unit: string
  quantity: number
  mode: 'existing' | 'new'
  inventoryItemId: string
  warehouseId: string
  newItemMinimumQuantity: number | null
}

const showApproveModal = ref(false)
const approveTarget = ref<DonationResponse | null>(null)
const approveRows = ref<ApproveRow[]>([])
const isApproving = ref(false)
const approveError = ref('')

function openApproveModal(d: DonationResponse) {
  approveTarget.value = d
  approveRows.value = d.items.map((it) => ({
    donationItemId: it.id,
    itemName: it.itemName,
    unit: it.unit,
    quantity: it.quantity,
    mode: 'existing',
    inventoryItemId: '',
    warehouseId: '',
    newItemMinimumQuantity: null,
  }))
  approveError.value = ''
  showApproveModal.value = true
}
function closeApproveModal() {
  showApproveModal.value = false
  approveTarget.value = null
}

async function handleApprove() {
  if (!approveTarget.value) return
  approveError.value = ''

  const itemMappings: DonationItemMapping[] = []
  for (const row of approveRows.value) {
    if (row.mode === 'existing') {
      if (!row.inventoryItemId) {
        approveError.value = t('donations.select_inventory_item') + ': ' + row.itemName
        return
      }
      itemMappings.push({
        donationItemId: row.donationItemId,
        createNewItem: false,
        inventoryItemId: row.inventoryItemId,
      })
    } else {
      if (!row.warehouseId) {
        approveError.value = t('donations.select_warehouse') + ': ' + row.itemName
        return
      }
      itemMappings.push({
        donationItemId: row.donationItemId,
        createNewItem: true,
        warehouseId: row.warehouseId,
        newItemMinimumQuantity: row.newItemMinimumQuantity ?? undefined,
      })
    }
  }

  isApproving.value = true
  try {
    await approveDonation(approveTarget.value.id, itemMappings)
    showApproveModal.value = false
    await Promise.all([loadPending(), loadReferenceData()])
  } catch (e: unknown) {
    approveError.value = e instanceof Error ? e.message : t('donations.approve_failed')
  } finally {
    isApproving.value = false
  }
}

// ── Reject modal ─────────────────────────────────────────────
const showRejectModal = ref(false)
const rejectTarget = ref<DonationResponse | null>(null)
const rejectReason = ref('')
const isRejecting = ref(false)
const rejectError = ref('')

function openRejectModal(d: DonationResponse) {
  rejectTarget.value = d
  rejectReason.value = ''
  rejectError.value = ''
  showRejectModal.value = true
}
function closeRejectModal() {
  showRejectModal.value = false
  rejectTarget.value = null
}

async function handleReject() {
  if (!rejectTarget.value) return
  if (!rejectReason.value.trim()) {
    rejectError.value = t('donations.reject_reason_required')
    return
  }
  isRejecting.value = true
  rejectError.value = ''
  try {
    await rejectDonation(rejectTarget.value.id, rejectReason.value.trim())
    showRejectModal.value = false
    await loadPending()
  } catch (e: unknown) {
    rejectError.value = e instanceof Error ? e.message : t('donations.reject_failed')
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

.card { background: #fff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }

.donations-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.donations-table th { text-align: left; font-size: 11.5px; text-transform: uppercase; color: #94a3b8; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
.donations-table td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; }
.font-semibold { font-weight: 600; color: #1e293b; }
.text-muted { color: #94a3b8; }
.item-chip { color: #475569; }

.actions-cell { display: flex; gap: 8px; }
.action-btn { padding: 6px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.action-btn--approve { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.action-btn--approve:hover { background: #d1fae5; }
.action-btn--reject { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.action-btn--reject:hover { background: #fee2e2; }

/* ── Modal ─────────────────────────────────────────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.modal-box { background: #fff; border-radius: 14px; width: 100%; max-width: 640px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
.modal-box--sm { max-width: 460px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fff; z-index: 1; }
.modal-header h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-desc { font-size: 12.5px; color: #718096; margin: 0 0 16px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }

.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
select, input[type="number"], textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;
}
select:focus, input:focus, textarea:focus { outline: none; border-color: #3b82f6; }
textarea { resize: vertical; }

.map-row { border: 1px solid #eef2f7; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #f8fafc; }
.map-row__item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13.5px; }
.map-row__mode { display: flex; gap: 16px; margin-bottom: 10px; font-size: 13px; font-weight: 500; color: #475569; }
.map-row__mode label { display: flex; align-items: center; gap: 6px; font-weight: 500; margin: 0; cursor: pointer; }
.map-row__mode input { width: auto; }
.map-row__fields { display: flex; gap: 10px; }
.map-row__fields select { flex: 2; }
.map-row__fields input { flex: 1; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
.btn-outline:hover { background: #f8fafc; }
.btn-primary { background: #e11d48; color: #fff; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #be123c; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: #991b1b; color: #fff; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background: #7f1d1d; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 700px) {
  .donations-table { display: block; overflow-x: auto; }
  .map-row__fields { flex-direction: column; }
}
</style>

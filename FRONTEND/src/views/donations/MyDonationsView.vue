<template>
  <RequesterLayout>
    <div class="donations-page">

      <div class="page-header">
        <div>
          <h2>{{ $t('donations.my_title') }}</h2>
          <p class="subtitle">{{ $t('donations.my_sub') }}</p>
        </div>
        <button class="btn-primary" @click="openCreateModal">{{ $t('donations.create_new') }}</button>
      </div>

      <div class="filter-bar">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="['filter-tab', { active: activeFilter === tab.value }]"
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="card">
        <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="filteredDonations.length === 0" class="empty-state">{{ $t('donations.no_matching') }}</div>

        <div class="donation-list" v-else>
          <div class="donation-item" v-for="item in filteredDonations" :key="item.id">
            <div class="don-info">
              <div class="don-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 7.65l.77.76L12 21l7.65-7.99.77-.76a5.4 5.4 0 0 0 0-7.67z"/></svg>
              </div>
              <div>
                <h4>{{ itemsSummary(item) }}</h4>
                <span class="time">{{ formatDateTimeVI(item.createdAt) }}</span>
              </div>
            </div>
            <div class="don-actions">
              <span class="badge" :style="badgeStyle(item.status)">{{ statusLabel(item.status) }}</span>
              <button class="btn-outline" @click="openDetailModal(item)">{{ $t('requester.view_detail') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ MODAL: TẠO QUYÊN GÓP MỚI ══════════ -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ $t('donations.create_new') }}</h3>
            <button class="modal-close" @click="closeCreateModal">✕</button>
          </div>

          <form class="modal-body" @submit.prevent="handleCreateSubmit">
            <div class="form-group">
              <label>{{ $t('donations.items_label') }} <span class="required">*</span></label>
              <div class="item-row" v-for="(row, idx) in form.items" :key="idx">
                <input v-model="row.itemName" type="text" :placeholder="$t('donations.item_name_placeholder')" required />
                <input v-model="row.unit" type="text" :placeholder="$t('donations.item_unit_placeholder')" class="item-row__unit" required />
                <input v-model.number="row.quantity" type="number" min="0.01" step="any" class="item-row__qty" required />
                <button type="button" class="btn-remove-row" :disabled="form.items.length <= 1" @click="removeItemRow(idx)">✕</button>
              </div>
              <button type="button" class="btn-add-row" @click="addItemRow">+ {{ $t('donations.add_item') }}</button>
            </div>

            <div class="form-group">
              <label>{{ $t('donations.note_label') }}</label>
              <textarea v-model="form.note" rows="3" :placeholder="$t('donations.note_placeholder')" />
            </div>

            <p v-if="createError" class="error-text">{{ createError }}</p>

            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closeCreateModal">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="isSubmitting">
                {{ isSubmitting ? $t('requester.submitting') : $t('donations.btn_submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ══════════ MODAL: XEM CHI TIẾT ══════════ -->
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-box" v-if="selectedDonation">
          <div class="modal-header detail-header">
            <div class="detail-header-info">
              <span class="badge" :style="badgeStyle(selectedDonation.status)">{{ statusLabel(selectedDonation.status) }}</span>
              <h3>{{ itemsSummary(selectedDonation) }}</h3>
            </div>
            <button class="modal-close" @click="closeDetailModal">✕</button>
          </div>

          <div class="modal-body detail-body">
            <div class="detail-section">
              <span class="detail-section__label">{{ $t('donations.items_label') }}</span>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>{{ $t('donations.item_name_placeholder') }}</th>
                    <th>{{ $t('donations.item_unit_placeholder') }}</th>
                    <th>{{ $t('donations.col_quantity') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="it in selectedDonation.items" :key="it.id">
                    <td>{{ it.itemName }}</td>
                    <td>{{ it.unit }}</td>
                    <td>{{ it.quantity }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="detail-section" v-if="selectedDonation.note">
              <span class="detail-section__label">{{ $t('donations.note_label') }}</span>
              <p class="detail-section__text">{{ selectedDonation.note }}</p>
            </div>

            <div class="detail-section" v-if="selectedDonation.status === 'Rejected' && selectedDonation.rejectReason">
              <span class="detail-section__label">{{ $t('donations.reject_reason_label') }}</span>
              <p class="detail-section__text detail-section__text--error">{{ selectedDonation.rejectReason }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import {
  createDonation,
  getMyDonations,
  type DonationResponse,
  type DonationStatus,
  type CreateDonationPayload,
} from '@/features/donations/donations.api'
import { formatDateTimeVI } from '@/features/requests/requests.helpers'

const { t } = useI18n()

// ── State ────────────────────────────────────────────────────
const allDonations = ref<DonationResponse[]>([])
const isLoading = ref(true)
const activeFilter = ref<'all' | DonationStatus>('all')

const showCreateModal = ref(false)
const isSubmitting = ref(false)
const createError = ref('')

const showDetailModal = ref(false)
const selectedDonation = ref<DonationResponse | null>(null)

const emptyForm = (): CreateDonationPayload => ({
  items: [{ itemName: '', unit: '', quantity: 1 }],
  note: '',
})
const form = ref<CreateDonationPayload>(emptyForm())

// ── Computed ─────────────────────────────────────────────────
const filterTabs = computed(() => [
  { value: 'all' as const, label: t('common.all') },
  { value: 'Pending' as const, label: t('donations.status_pending') },
  { value: 'Approved' as const, label: t('donations.status_approved') },
  { value: 'Rejected' as const, label: t('donations.status_rejected') },
])

const filteredDonations = computed(() => {
  if (activeFilter.value === 'all') return allDonations.value
  return allDonations.value.filter((d) => d.status === activeFilter.value)
})

// ── Helpers ──────────────────────────────────────────────────
function itemsSummary(d: DonationResponse): string {
  if (d.items.length === 0) return t('donations.no_items')
  const first = d.items[0]
  return d.items.length > 1
    ? `${first.itemName} +${d.items.length - 1}`
    : first.itemName
}

function statusLabel(status: DonationStatus): string {
  return t(`donations.status_${status.toLowerCase()}`)
}

function badgeStyle(status: DonationStatus): Record<string, string> {
  const map: Record<DonationStatus, { bg: string; color: string }> = {
    Pending: { bg: '#fef3c7', color: '#b45309' },
    Approved: { bg: '#dcfce7', color: '#15803d' },
    Rejected: { bg: '#fee2e2', color: '#991b1b' },
  }
  const c = map[status]
  return { background: c.bg, color: c.color }
}

// ── Load ─────────────────────────────────────────────────────
async function loadDonations() {
  isLoading.value = true
  try {
    const result = await getMyDonations(1, 100)
    allDonations.value = result.items
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}
onMounted(loadDonations)

// ── Create modal ─────────────────────────────────────────────
function openCreateModal() {
  form.value = emptyForm()
  createError.value = ''
  showCreateModal.value = true
}
function closeCreateModal() {
  showCreateModal.value = false
}
function addItemRow() {
  form.value.items.push({ itemName: '', unit: '', quantity: 1 })
}
function removeItemRow(idx: number) {
  if (form.value.items.length <= 1) return
  form.value.items.splice(idx, 1)
}

async function handleCreateSubmit() {
  isSubmitting.value = true
  createError.value = ''
  try {
    await createDonation(form.value)
    showCreateModal.value = false
    await loadDonations()
  } catch (e: unknown) {
    createError.value = e instanceof Error ? e.message : t('donations.create_failed')
  } finally {
    isSubmitting.value = false
  }
}

// ── Detail modal ─────────────────────────────────────────────
function openDetailModal(d: DonationResponse) {
  selectedDonation.value = d
  showDetailModal.value = true
}
function closeDetailModal() {
  showDetailModal.value = false
  selectedDonation.value = null
}
</script>

<style scoped>
.donations-page { max-width: 1000px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h2 { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.subtitle { font-size: 13.5px; color: #718096; margin: 0; }

.btn-primary { background-color: #e11d48; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
.btn-primary:hover { background-color: #be123c; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-tab { background: #fff; border: 1px solid #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.filter-tab:hover { background: #f8fafc; }
.filter-tab.active { background: #fff1eb; border-color: #ea580c; color: #ea580c; font-weight: 600; }

.card { background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }

.donation-list { display: flex; flex-direction: column; gap: 16px; }
.donation-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.donation-item:last-child { border-bottom: none; padding-bottom: 0; }

.don-info { display: flex; align-items: center; gap: 16px; }
.don-icon { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
.don-icon svg { width: 20px; height: 20px; color: #64748b; }
.don-info h4 { margin: 0 0 4px 0; font-size: 14px; color: #1e293b; font-weight: 600; }
.don-info .time { font-size: 12px; color: #64748b; }

.don-actions { display: flex; align-items: center; gap: 16px; }
.badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #ea580c; color: #ea580c; }

/* ── Modal ─────────────────────────────────────────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 1000; }
.modal-box { background: #fff; border-radius: 14px; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fff; z-index: 1; }
.modal-header h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
input[type="text"], input[type="number"], textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;
}
input:focus, textarea:focus { outline: none; border-color: #3b82f6; }
textarea { resize: vertical; }

.item-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.item-row input[type="text"]:first-child { flex: 2; }
.item-row__unit { flex: 1; }
.item-row__qty { flex: 1; }
.btn-remove-row { background: none; border: 1px solid #e2e8f0; color: #94a3b8; border-radius: 6px; width: 34px; height: 34px; flex-shrink: 0; cursor: pointer; }
.btn-remove-row:hover:not(:disabled) { border-color: #e11d48; color: #e11d48; }
.btn-remove-row:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-add-row { background: none; border: none; color: #2563eb; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 4px 0; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

.detail-header { align-items: flex-start; gap: 16px; }
.detail-header-info { display: flex; flex-direction: column; gap: 8px; }
.detail-header-info .badge { align-self: flex-start; }
.detail-header-info h3 { font-size: 18px; }

.detail-body { display: flex; flex-direction: column; gap: 20px; }
.detail-section { display: flex; flex-direction: column; gap: 8px; }
.detail-section__label { font-size: 11.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.detail-section__text { margin: 0; font-size: 13.5px; color: #334155; line-height: 1.6; }
.detail-section__text--error { color: #991b1b; }

.items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.items-table th { text-align: left; font-size: 11.5px; text-transform: uppercase; color: #94a3b8; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.items-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; gap: 14px; }
  .donation-item { flex-direction: column; align-items: flex-start; gap: 12px; }
  .don-actions { width: 100%; justify-content: space-between; }
  .item-row { flex-wrap: wrap; }
}
</style>

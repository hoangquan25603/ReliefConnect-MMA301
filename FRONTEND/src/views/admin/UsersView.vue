<template>
  <AdminLayout>
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">{{ $t('admin.users_title') }}</h1>
        <button class="btn-create" @click="showCreateDialog = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {{ $t('admin.action_create_user') }}
        </button>
      </div>

      <!-- Toolbar -->
      <div class="users-toolbar">
        <BaseInput
          id="search-users"
          v-model="query"
          :placeholder="$t('admin.users_search')"
          style="max-width: 340px"
        >
          <template #prefix>
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </template>
        </BaseInput>

        <select v-model="selectedRole" class="role-filter" @change="onRoleChange">
          <option value="">{{ $t('admin.all_roles') }}</option>
          <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>

      <!-- Table -->
      <BaseCard>
        <div v-if="store.isLoading" class="users-loading">
          <BaseSpinner size="lg" class="spinner-dark" />
        </div>

        <div v-else-if="filteredUsers.length === 0" class="users-empty">
          <p>{{ query.trim() ? $t('admin.no_users_found') : $t('admin.no_users_empty') }}</p>
        </div>

        <table v-else class="users-table">
          <colgroup>
            <col style="width: 60px" />
            <col style="width: 220px" />
            <col style="width: 280px" />
            <col style="width: 130px" />
            <col style="width: 150px" />
            <col style="width: 220px" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('admin.col_name') }}</th>
              <th>{{ $t('admin.col_email') }}</th>
              <th>{{ $t('admin.col_status') }}</th>
              <th>{{ $t('admin.col_role') }}</th>
              <th>{{ $t('admin.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in filteredUsers" :key="user.id">
              <td class="text-muted">{{ query.trim() ? idx + 1 : (store.page - 1) * store.pageSize + idx + 1 }}</td>
              <td class="font-semibold text-ellipsis" :title="user.fullName">{{ user.fullName }}</td>
              <td class="email-cell" :title="user.email">{{ user.email }}</td>
              <td>
                <span class="status-badge" :class="user.isActive ? 'status--active' : 'status--inactive'">
                  {{ user.isActive ? $t('admin.status_active') : $t('admin.status_locked') }}
                </span>
              </td>
              <td><span class="role-badge">{{ user.role ? $t(`roles.${user.role}`, user.role) : 'User' }}</span></td>
              <td class="actions-cell">
                <button class="action-btn action-btn--edit" @click="openEdit(user)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Chỉnh sửa
                </button>
                <template v-if="user.role !== 'Admin'">
                  <button v-if="user.isActive" class="action-btn action-btn--delete" @click="toggleStatus(user)">{{ $t('admin.btn_lock') }}</button>
                  <button v-else class="action-btn action-btn--activate" @click="toggleStatus(user)">{{ $t('admin.btn_unlock') }}</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="!query.trim() && store.total > store.pageSize" class="users-pagination">
          <button class="page-btn" :disabled="!hasPrev" @click="changePage(-1)">{{ $t('admin.page_prev') }}</button>
          <span class="page-info">{{ $t('admin.page_info', { page: store.page, total: totalPages }) }}</span>
          <button class="page-btn" :disabled="!hasNext" @click="changePage(1)">{{ $t('admin.page_next') }}</button>
        </div>
      </BaseCard>
    </div>

    <!-- Dialogs -->
    <CreateUserDialog v-model="showCreateDialog" @saved="onSaved" />
    <UserFormDialog v-model="showEditDialog" :edit-data="editTarget" @saved="onSaved" />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import UserFormDialog from '@/features/users/UserFormDialog.vue'
import CreateUserDialog from '@/features/users/CreateUserDialog.vue'
import { useUsersStore } from '@/stores/users'
import { getRoles } from '@/features/users/roles.api'
import { useDebouncedSearch } from '@/composables/useDebouncedRef'
import { useConfirm } from '@/composables/useConfirm'
import type { User } from '@/features/users/users.types'

const route = useRoute()
const router = useRouter()
const store = useUsersStore()
const { t } = useI18n()
const { query, debouncedQuery } = useDebouncedSearch(300)
const { confirm } = useConfirm()

const totalPages = computed(() => Math.ceil(store.total / store.pageSize) || 1)
const hasPrev = computed(() => store.page > 1)
const hasNext = computed(() => store.page < totalPages.value)

// ── Dialogs ───────────────────────────────────────────────────
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editTarget = ref<User | null>(null)

const selectedRole = ref('')

// ── Dynamic role options ──────────────────────────────────────
const roleOptions = ref<{ value: string; label: string }[]>([])

async function loadRoleOptions(): Promise<void> {
  try {
    const data = await getRoles()
    roleOptions.value = data.map((r) => ({
      value: r.name,
      label: t(`roles.${r.name}`, r.name),
    }))
  } catch {
    roleOptions.value = [
      { value: 'Admin',        label: t('roles.Admin') },
      { value: 'Volunteer',    label: t('roles.Volunteer') },
      { value: 'Requester',    label: t('roles.Requester') },
      { value: 'Coordinator',  label: t('roles.Coordinator') },
      { value: 'Organization', label: t('roles.Organization') },
    ]
  }
}

// ── Helpers ───────────────────────────────────────────────────
function removeTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
}

const filteredUsers = computed(() => {
  const q = removeTones(query.value.trim().toLowerCase())
  if (!q) return store.users
  return store.users.filter(user => {
    const fullName = removeTones(user.fullName.toLowerCase())
    const email = removeTones(user.email.toLowerCase())
    const phone = user.phoneNumber ? removeTones(user.phoneNumber.toLowerCase()) : ''
    return fullName.includes(q) || email.includes(q) || phone.includes(q)
  })
})

function updateQueryParams(): void {
  router.replace({
    query: {
      ...route.query,
      role: selectedRole.value || undefined,
      page: store.page > 1 ? store.page.toString() : undefined,
      q: query.value || undefined,
    }
  })
}

// ── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  loadRoleOptions()
  if (route.query.role) {
    selectedRole.value = route.query.role as string
    store.currentRoleFilter = selectedRole.value || undefined
  }
  if (route.query.page) {
    store.page = parseInt(route.query.page as string, 10) || 1
  }
  if (route.query.q) {
    query.value = route.query.q as string
    store.pageSize = 100
  } else {
    store.pageSize = 10
  }
  store.fetchUsers()
})

watch(debouncedQuery, () => {
  store.page = 1
  store.pageSize = query.value.trim() ? 100 : 10
  updateQueryParams()
  store.fetchUsers()
})

// ── Actions ───────────────────────────────────────────────────
function onRoleChange(): void {
  store.currentRoleFilter = selectedRole.value || undefined
  store.page = 1
  updateQueryParams()
  store.fetchUsers()
}

function changePage(delta: number): void {
  store.page += delta
  updateQueryParams()
  store.fetchUsers()
}

function openEdit(user: User): void {
  editTarget.value = user
  showEditDialog.value = true
}

async function toggleStatus(user: User): Promise<void> {
  const action = user.isActive ? 'khoá' : 'mở khoá'
  if (await confirm(`Bạn có chắc chắn muốn ${action} người dùng này?`)) {
    try {
      if (user.isActive) {
        await store.deactivate(user.id)
      } else {
        await store.activate(user.id)
      }
      ElMessage.success(`${action === 'khoá' ? 'Khoá' : 'Mở khoá'} thành công`)
    } catch (err) {
      ElMessage.error((err as Error).message || `Không thể ${action}`)
    }
  }
}

function onSaved(): void {
  store.fetchUsers()
}
</script>

<style scoped>
/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: #1a4f8d;
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}
.btn-create:hover { background: #123766; }

.users-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.role-filter {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  cursor: pointer;
}

/* Table */
.users-table { width: 100%; border-collapse: collapse; font-size: 14px; table-layout: fixed; }
.users-table th {
  text-align: left;
  padding: 10px 14px;
  background: #f8fafc;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--color-border-soft);
}
.users-table td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--color-border-soft);
  color: var(--color-text-primary);
}
.users-table tbody tr:hover { background: #f8fafc; }
.users-table tbody tr:last-child td { border-bottom: none; }

/* Email truncation & ellipsis utilities */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.email-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}
.status--active { background: rgba(39, 103, 73, 0.1); color: #276749; }
.status--inactive { background: rgba(197, 48, 48, 0.1); color: #c53030; }

/* Role badge */
.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: rgba(26,79,141,0.08);
  color: var(--color-blue);
  font-size: 12px;
  font-weight: 600;
}

/* Actions */
.actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  white-space: nowrap;
}
.action-btn--edit    { background: rgba(26,79,141,0.1); color: var(--color-blue); }
.action-btn--edit:hover { background: rgba(26,79,141,0.2); }
.action-btn--delete  { background: rgba(197,48,48,0.1); color: var(--color-danger); }
.action-btn--delete:hover { background: rgba(197,48,48,0.2); }
.action-btn--activate { background: rgba(39,103,73,0.1); color: #276749; }
.action-btn--activate:hover { background: rgba(39,103,73,0.2); }

/* States */
.users-loading,
.users-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  color: var(--color-text-muted);
}

/* Pagination */
.users-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}
.page-btn {
  padding: 7px 16px;
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

/* Search icon */
.search-icon { color: var(--color-text-muted); margin: 0 8px; flex-shrink: 0; }
</style>

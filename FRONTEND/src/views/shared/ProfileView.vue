<template>
  <AppLayout>
    <div class="page-container" style="max-width: 560px;">
      <h1 class="page-title" style="margin-bottom: var(--space-6);">Hồ sơ cá nhân</h1>

      <BaseCard>
        <div class="profile-top">
          <div class="profile-initials">
            {{ initials }}
          </div>
          <div>
            <h2 class="profile-name">{{ auth.user?.fullName }}</h2>
            <span class="profile-role-badge" :style="{ background: roleBg, color: roleColor }">
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <div class="profile-info">
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ auth.user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Điện thoại</span>
            <span class="info-value">{{ auth.user?.phoneNumber ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vai trò</span>
            <span class="info-value">{{ roleLabel }}</span>
          </div>
        </div>
      </BaseCard>

      <BaseCard style="margin-top: var(--space-5);">
        <h2 class="section-title">Đổi mật khẩu</h2>

        <div v-if="changePasswordSuccess" class="banner banner--success">
          {{ changePasswordSuccess }}
        </div>
        <div v-if="changePasswordError" class="banner banner--error">
          {{ changePasswordError }}
        </div>

        <form @submit.prevent="handleChangePassword" class="password-form">
          <div class="form-group">
            <label for="old-password">Mật khẩu hiện tại</label>
            <BaseInput id="old-password" v-model="passwordForm.oldPassword" type="password" required />
          </div>
          <div class="form-group">
            <label for="new-password">Mật khẩu mới</label>
            <BaseInput id="new-password" v-model="passwordForm.newPassword" type="password" required />
            <p class="hint">Từ 10 đến 128 ký tự, có chữ và số.</p>
          </div>
          <div class="form-group">
            <label for="confirm-password">Nhập lại mật khẩu mới</label>
            <BaseInput id="confirm-password" v-model="passwordForm.confirmPassword" type="password" required />
          </div>

          <BaseButton type="submit" variant="primary" :loading="isChangingPassword">
            Đổi mật khẩu
          </BaseButton>
        </form>
      </BaseCard>

      <BaseCard v-if="auth.role !== 'Admin'" style="margin-top: var(--space-5);">
        <h2 class="section-title">Xin nâng quyền</h2>
        <p class="section-desc">Gửi nguyện vọng nâng quyền lên Quản lý kho hoặc Tổ chức, Admin sẽ xem xét và phản hồi.</p>

        <div v-if="roleRequestSuccess" class="banner banner--success">{{ roleRequestSuccess }}</div>
        <div v-if="roleRequestError" class="banner banner--error">{{ roleRequestError }}</div>

        <form @submit.prevent="handleCreateRoleRequest" class="password-form">
          <div class="form-group">
            <label for="requested-role">Quyền muốn xin</label>
            <select id="requested-role" v-model="roleRequestForm.requestedRoleName" class="role-select" required>
              <option value="Coordinator">Quản lý kho (Coordinator)</option>
              <option value="Organization">Tổ chức (Organization)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="role-reason">Lý do</label>
            <textarea id="role-reason" v-model="roleRequestForm.reason" rows="3" required placeholder="Nêu lý do bạn muốn nâng quyền..." />
          </div>
          <BaseButton type="submit" variant="primary" :loading="isSubmittingRoleRequest">
            Gửi nguyện vọng
          </BaseButton>
        </form>

        <div v-if="roleRequests.length > 0" class="role-request-history">
          <h3 class="history-title">Lịch sử nguyện vọng</h3>
          <div class="role-request-item" v-for="r in roleRequests" :key="r.id">
            <div>
              <p class="rr-role">{{ r.requestedRoleName }}</p>
              <p class="rr-reason">{{ r.reason }}</p>
              <p v-if="r.status === 'Rejected' && r.reviewNote" class="rr-note">Lý do từ chối: {{ r.reviewNote }}</p>
            </div>
            <span class="rr-badge" :style="roleRequestBadgeStyle(r.status)">{{ roleRequestStatusLabel(r.status) }}</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS, ROLE_COLORS } from '@/features/auth/auth.types'
import { changePassword } from '@/features/auth/auth.api'
import {
  createRoleRequest,
  getMyRoleRequests,
  type RoleUpgradeRequest,
  type RoleRequestStatus,
  type RequestableRole,
} from '@/features/role-requests/role-requests.api'

const auth = useAuthStore()

const roleLabel = computed(() =>
  auth.role ? ROLE_LABELS[auth.role] : '—',
)
const roleColor = computed(() =>
  auth.role ? ROLE_COLORS[auth.role] : '#4a5568',
)
const roleBg = computed(() =>
  auth.role ? `${ROLE_COLORS[auth.role]}1a` : '#f0f2f5',
)
const initials = computed(() =>
  auth.user?.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?',
)

// ── Đổi mật khẩu ──────────────────────────────────────────────
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isChangingPassword = ref(false)
const changePasswordError = ref('')
const changePasswordSuccess = ref('')

const handleChangePassword = async () => {
  changePasswordError.value = ''
  changePasswordSuccess.value = ''

  if (passwordForm.newPassword.length < 10 || passwordForm.newPassword.length > 128 || !/\p{L}/u.test(passwordForm.newPassword) || !/\p{Nd}/u.test(passwordForm.newPassword)) {
    changePasswordError.value = 'Mật khẩu mới phải có từ 10 đến 128 ký tự, gồm chữ và số.'
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    changePasswordError.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  isChangingPassword.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    })
    changePasswordSuccess.value = 'Đổi mật khẩu thành công!'
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err) {
    changePasswordError.value = (err as Error).message || 'Đổi mật khẩu thất bại. Vui lòng thử lại!'
  } finally {
    isChangingPassword.value = false
  }
}

// ── Xin nâng quyền ───────────────────────────────────────────
const roleRequestForm = reactive<{ requestedRoleName: RequestableRole; reason: string }>({
  requestedRoleName: 'Coordinator',
  reason: '',
})
const isSubmittingRoleRequest = ref(false)
const roleRequestError = ref('')
const roleRequestSuccess = ref('')
const roleRequests = ref<RoleUpgradeRequest[]>([])

async function loadRoleRequests() {
  try {
    roleRequests.value = await getMyRoleRequests()
  } catch (err) {
    console.error(err)
  }
}
onMounted(loadRoleRequests)

async function handleCreateRoleRequest() {
  roleRequestError.value = ''
  roleRequestSuccess.value = ''
  isSubmittingRoleRequest.value = true
  try {
    await createRoleRequest(roleRequestForm.requestedRoleName, roleRequestForm.reason)
    roleRequestSuccess.value = 'Đã gửi nguyện vọng, chờ Admin xem xét.'
    roleRequestForm.reason = ''
    await loadRoleRequests()
  } catch (err) {
    roleRequestError.value = (err as Error).message || 'Gửi nguyện vọng thất bại. Vui lòng thử lại!'
  } finally {
    isSubmittingRoleRequest.value = false
  }
}

const ROLE_REQUEST_STATUS_LABEL: Record<RoleRequestStatus, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Đã từ chối',
}
const ROLE_REQUEST_STATUS_COLOR: Record<RoleRequestStatus, { bg: string; color: string }> = {
  Pending: { bg: '#fef3c7', color: '#b45309' },
  Approved: { bg: '#dcfce7', color: '#15803d' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
}
function roleRequestStatusLabel(status: RoleRequestStatus): string {
  return ROLE_REQUEST_STATUS_LABEL[status]
}
function roleRequestBadgeStyle(status: RoleRequestStatus): Record<string, string> {
  const c = ROLE_REQUEST_STATUS_COLOR[status]
  return { background: c.bg, color: c.color }
}
</script>

<style scoped>
.profile-top {
  display: flex; align-items: center; gap: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border-soft);
  margin-bottom: var(--space-5);
}
.profile-avatar {
  width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
  border: 2px solid var(--color-border-soft);
}
.profile-initials {
  width: 72px; height: 72px; border-radius: 50%;
  background: #1a4f8d; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800;
}
.profile-name { font-size: 20px; font-weight: 700; color: #1a3b5c; margin-bottom: 6px; }
.profile-role-badge {
  display: inline-block; padding: 3px 12px;
  border-radius: 99px; font-size: 12px; font-weight: 700;
}
.profile-info { display: flex; flex-direction: column; gap: var(--space-3); }
.info-row {
  display: flex; justify-content: space-between;
  padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-soft);
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: var(--color-text-secondary); font-weight: 500; }
.info-value  { font-size: 14px; color: var(--color-text-primary); font-weight: 600; }

.section-title {
  font-size: 16px; font-weight: 700; color: #1a3b5c;
  margin: 0 0 var(--space-4);
}
.password-form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 360px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #2d3748; }
.hint { font-size: 12px; color: #a0aec0; margin: 0; }

.banner {
  border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600;
  margin-bottom: var(--space-4);
}
.banner--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.banner--error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }

.section-desc { font-size: 13px; color: var(--color-text-secondary); margin: -8px 0 var(--space-4); }
.role-select, .password-form textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 13.5px; font-family: inherit; box-sizing: border-box; resize: vertical;
}
.role-select:focus, .password-form textarea:focus { outline: none; border-color: #3b82f6; }

.role-request-history { margin-top: var(--space-5); padding-top: var(--space-5); border-top: 1px solid var(--color-border-soft); }
.history-title { font-size: 14px; font-weight: 700; color: #1a3b5c; margin: 0 0 var(--space-3); }
.role-request-item {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--color-border-soft);
}
.role-request-item:last-child { border-bottom: none; }
.rr-role { font-size: 13.5px; font-weight: 700; color: #1e293b; margin: 0; }
.rr-reason { font-size: 12.5px; color: #718096; margin: 4px 0 0; }
.rr-note { font-size: 12px; color: #991b1b; margin: 4px 0 0; }
.rr-badge { flex-shrink: 0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
</style>

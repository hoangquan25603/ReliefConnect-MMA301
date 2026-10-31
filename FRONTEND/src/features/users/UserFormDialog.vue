<template>
  <el-dialog
    v-model="visible"
    title="Chỉnh sửa người dùng"
    width="500px"
    @open="onOpen"
    @close="resetForm"
  >
    <!-- User info header -->
    <div class="user-header" v-if="editData">
      <div class="user-avatar">{{ initials }}</div>
      <div>
        <div class="user-name">{{ editData.fullName }}</div>
        <div class="user-email">{{ editData.email }}</div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="edit-tabs">
      <!-- ── Tab 1: Thông tin cơ bản ─────────────────────────── -->
      <el-tab-pane label="Thông tin" name="info">
        <el-form label-position="top" style="margin-top: 12px;">
          <el-form-item label="Họ và tên" required>
            <el-input v-model="form.fullName" placeholder="Nguyễn Văn A" />
          </el-form-item>
          <el-form-item label="Số điện thoại">
            <el-input v-model="form.phoneNumber" placeholder="0xxxxxxxxx (tuỳ chọn)" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ── Tab 2: Vai trò ──────────────────────────────────── -->
      <el-tab-pane label="Vai trò" name="role">
        <el-form label-position="top" style="margin-top: 12px;">
          <el-form-item label="Vai trò hiện tại">
            <el-input :value="editData?.role ? $t(`roles.${editData.role}`, editData.role) : '—'" disabled />
          </el-form-item>
          <el-form-item label="Vai trò mới">
            <el-select
              v-model="form.roleName"
              :loading="rolesLoading"
              :placeholder="rolesLoading ? 'Đang tải...' : 'Chọn vai trò mới'"
              style="width: 100%"
            >
              <el-option
                v-for="r in availableRoles"
                :key="r.value"
                :label="r.label"
                :value="r.value"
              />
            </el-select>
          </el-form-item>
          <p class="hint-text">
            {{ $t('admin.role_change_note') }}
          </p>
        </el-form>
      </el-tab-pane>

      <!-- ── Tab 3: Mật khẩu ────────────────────────────────── -->
      <el-tab-pane label="Mật khẩu" name="password">
        <el-form label-position="top" style="margin-top: 12px;">
          <p class="warn-text">
            ⚠️ Đặt lại mật khẩu sẽ thu hồi toàn bộ phiên đăng nhập hiện tại của người dùng.
          </p>
          <el-form-item label="Mật khẩu mới">
            <el-input
              v-model="form.newPassword"
              type="password"
              placeholder="Tối thiểu 8 ký tự (để trống nếu không đổi)"
              show-password
            />
          </el-form-item>
          <el-form-item label="Xác nhận mật khẩu mới">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              show-password
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="isLoading" @click="handleSubmit">
        Lưu thay đổi
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUsersStore } from '@/stores/users'
import { getRoles } from './roles.api'
import { isValidName } from '@/utils/validation'
import type { User } from './users.types'

// ── Props & Emits ────────────────────────────────────────────
interface Props {
  modelValue: boolean
  editData?: User | null
}
const props = withDefaults(defineProps<Props>(), { editData: null })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// ── State ────────────────────────────────────────────────────
const { t } = useI18n()
const store = useUsersStore()
const isLoading = ref(false)
const activeTab = ref('info')

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ── Form ─────────────────────────────────────────────────────
const form = reactive({
  fullName: '',
  phoneNumber: '',
  roleName: '',
  newPassword: '',
  confirmPassword: '',
})

// ── User avatar initials ──────────────────────────────────────
const initials = computed(() =>
  props.editData?.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?'
)

// ── Dynamic roles from GET /api/admin/roles ──────────────────
const rolesLoading = ref(false)
const fetchedRoles = ref<{ value: string; label: string }[]>([])

async function loadRoles(): Promise<void> {
  if (fetchedRoles.value.length > 0) return
  rolesLoading.value = true
  try {
    const data = await getRoles()
    fetchedRoles.value = data.map((r) => ({
      value: r.name,
      label: `${t(`roles.${r.name}`, r.name)} (${r.name})`,
    }))
  } catch {
    fetchedRoles.value = [
      { value: 'Admin',        label: `${t('roles.Admin')} (Admin)` },
      { value: 'Volunteer',    label: `${t('roles.Volunteer')} (Volunteer)` },
      { value: 'Requester',    label: `${t('roles.Requester')} (Requester)` },
      { value: 'Coordinator',  label: `${t('roles.Coordinator')} (Coordinator)` },
      { value: 'Organization', label: `${t('roles.Organization')} (Organization)` },
    ]
  } finally {
    rolesLoading.value = false
  }
}

// Hệ thống không cho gán role Admin qua UI — chỉ được đổi sang các role khác.
const availableRoles = computed(() => fetchedRoles.value.filter((r) => r.value !== 'Admin'))

function onOpen(): void {
  activeTab.value = 'info'
  loadRoles()
}

// ── Sync form khi editData thay đổi ─────────────────────────
watch(
  () => props.editData,
  (user) => {
    if (user) {
      form.fullName       = user.fullName    ?? ''
      form.phoneNumber    = user.phoneNumber ?? ''
      form.roleName       = user.role        ?? ''
      form.newPassword    = ''
      form.confirmPassword = ''
    }
  },
  { immediate: true },
)

// ── Reset ─────────────────────────────────────────────────────
function resetForm(): void {
  const u = props.editData
  form.fullName        = u?.fullName    ?? ''
  form.phoneNumber     = u?.phoneNumber ?? ''
  form.roleName        = u?.role        ?? ''
  form.newPassword     = ''
  form.confirmPassword = ''
  activeTab.value      = 'info'
}

// ── Submit — gọi từng API chỉ khi có thay đổi ───────────────
async function handleSubmit(): Promise<void> {
  if (!props.editData) return

  const u = props.editData
  const errors: string[] = []

  // Validate
  if (!form.fullName.trim()) {
    errors.push('Họ và tên không được để trống.')
  } else if (!isValidName(form.fullName)) {
    errors.push('Họ và tên không được chứa số hoặc ký tự đặc biệt.')
  }
  if (form.newPassword && form.newPassword.length < 8) {
    errors.push('Mật khẩu mới phải có ít nhất 8 ký tự.')
  }
  if (form.newPassword && form.newPassword !== form.confirmPassword) {
    errors.push('Mật khẩu xác nhận không trùng khớp.')
  }
  if (errors.length > 0) {
    ElMessage.warning(errors[0])
    return
  }

  isLoading.value = true
  const tasks: Promise<void>[] = []
  const messages: string[] = []

  // 1. Sửa thông tin nếu thay đổi
  const infoChanged =
    form.fullName.trim() !== u.fullName ||
    (form.phoneNumber.trim() || undefined) !== (u.phoneNumber || undefined)

  if (infoChanged) {
    tasks.push(
      store.update(u.id, {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
      }).then(() => { messages.push('Đã cập nhật thông tin') })
    )
  }

  // 2. Đổi role nếu thay đổi
  if (form.roleName && form.roleName !== u.role) {
    tasks.push(
      store.changeRole(u.id, form.roleName)
        .then(() => { messages.push('Đã đổi vai trò') })
    )
  }

  // 3. Đặt lại mật khẩu nếu có nhập
  if (form.newPassword) {
    tasks.push(
      store.resetPassword(u.id, { newPassword: form.newPassword })
        .then(() => { messages.push('Đã đặt lại mật khẩu') })
    )
  }

  try {
    if (tasks.length === 0) {
      ElMessage.info('Không có thay đổi nào.')
      visible.value = false
      return
    }
    await Promise.all(tasks)
    ElMessage.success(messages.join(' · ') + ' thành công!')
    emit('saved')
    visible.value = false
  } catch (err) {
    ElMessage.error((err as Error).message || 'Có lỗi xảy ra, vui lòng thử lại.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.user-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
}
.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #1a4f8d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  flex-shrink: 0;
}
.user-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a3b5c;
}
.user-email {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}
.hint-text {
  font-size: 12px;
  color: #718096;
  line-height: 1.5;
  margin: -6px 0 0;
}
.warn-text {
  font-size: 12px;
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 8px 12px;
  line-height: 1.5;
  margin-bottom: 16px;
}
</style>

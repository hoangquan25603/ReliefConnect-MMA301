<template>
  <el-dialog
    v-model="visible"
    title="Đặt lại mật khẩu người dùng"
    width="420px"
    @close="resetForm"
  >
    <el-form label-position="top">
      <el-form-item label="Người dùng">
        <el-input :value="user?.fullName || ''" disabled />
      </el-form-item>

      <el-form-item label="Mật khẩu mới" required>
        <el-input
          v-model="newPassword"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          show-password
        />
      </el-form-item>

      <el-form-item label="Xác nhận mật khẩu mới" required>
        <el-input
          v-model="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          show-password
        />
      </el-form-item>

      <p style="font-size:12px;color:#c53030;line-height:1.5;margin:0;">
        ⚠️ Thao tác này sẽ thu hồi toàn bộ refresh token cũ của người dùng. Họ sẽ cần đăng nhập lại.
      </p>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Hủy bỏ</el-button>
      <el-button type="danger" :loading="isLoading" @click="handleSubmit">
        Đặt lại mật khẩu
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUsersStore } from '@/stores/users'
import type { User } from './users.types'

// ── Props & Emits ────────────────────────────────────────────
interface Props {
  modelValue: boolean
  user?: User | null
}
const props = withDefaults(defineProps<Props>(), { user: null })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// ── State ────────────────────────────────────────────────────
const store = useUsersStore()
const isLoading = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function resetForm(): void {
  newPassword.value = ''
  confirmPassword.value = ''
}

async function handleSubmit(): Promise<void> {
  if (!props.user) return

  if (!newPassword.value || newPassword.value.length < 8) {
    ElMessage.warning('Mật khẩu mới phải có ít nhất 8 ký tự.')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning('Mật khẩu xác nhận không trùng khớp.')
    return
  }

  isLoading.value = true
  try {
    await store.resetPassword(props.user.id, { newPassword: newPassword.value })
    ElMessage.success(`Đã đặt lại mật khẩu cho "${props.user.fullName}" thành công!`)
    emit('saved')
    visible.value = false
  } catch (err) {
    ElMessage.error((err as Error).message || 'Đặt lại mật khẩu thất bại.')
  } finally {
    isLoading.value = false
  }
}
</script>

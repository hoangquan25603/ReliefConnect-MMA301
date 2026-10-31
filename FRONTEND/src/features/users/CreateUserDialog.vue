<template>
  <el-dialog
    v-model="visible"
    title="Tạo tài khoản mới"
    width="440px"
    @close="resetForm"
    @open="loadRoles"
  >
    <el-form label-position="top">
      <el-form-item label="Họ và tên" required>
        <el-input v-model="form.fullName" placeholder="Nguyễn Văn A" />
      </el-form-item>
      <el-form-item label="Email" required>
        <el-input v-model="form.email" type="email" placeholder="email@example.com" />
      </el-form-item>
      <el-form-item label="Số điện thoại">
        <el-input v-model="form.phoneNumber" placeholder="0xxxxxxxxx (tuỳ chọn)" />
      </el-form-item>
      <el-form-item label="Mật khẩu tạm" required>
        <el-input v-model="form.password" type="password" placeholder="Tối thiểu 8 ký tự" show-password />
      </el-form-item>
      <el-form-item label="Vai trò ban đầu" required>
        <el-select
          v-model="form.roleName"
          :loading="rolesLoading"
          :placeholder="rolesLoading ? 'Đang tải...' : 'Chọn vai trò'"
          style="width: 100%"
        >
          <el-option v-for="r in availableRoles" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">Hủy bỏ</el-button>
      <el-button type="primary" :loading="isLoading" @click="handleSubmit">
        Tạo tài khoản
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useUsersStore } from '@/stores/users'
import { getRoles } from './roles.api'
import { isValidName } from '@/utils/validation'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { t } = useI18n()
const store = useUsersStore()
const isLoading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = reactive({
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  roleName: '',
})

// Roles
const rolesLoading = ref(false)
const fetchedRoles = ref<{ value: string; label: string }[]>([])
// Hệ thống không cho tạo tài khoản Admin qua UI — chỉ được chọn các role khác.
const availableRoles = computed(() => fetchedRoles.value.filter((r) => r.value !== 'Admin'))

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
      { value: 'Requester',    label: `${t('roles.Requester')} (Requester)` },
      { value: 'Volunteer',    label: `${t('roles.Volunteer')} (Volunteer)` },
      { value: 'Coordinator',  label: `${t('roles.Coordinator')} (Coordinator)` },
      { value: 'Admin',        label: `${t('roles.Admin')} (Admin)` },
      { value: 'Organization', label: `${t('roles.Organization')} (Organization)` },
    ]
  } finally {
    rolesLoading.value = false
  }
}

function resetForm(): void {
  form.fullName = ''
  form.email = ''
  form.phoneNumber = ''
  form.password = ''
  form.roleName = ''
}

async function handleSubmit(): Promise<void> {
  if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.roleName) {
    ElMessage.warning('Vui lòng điền đầy đủ các trường bắt buộc.')
    return
  }
  if (!isValidName(form.fullName)) {
    ElMessage.warning('Họ và tên không được chứa số hoặc ký tự đặc biệt.')
    return
  }
  if (form.password.length < 8) {
    ElMessage.warning('Mật khẩu phải có ít nhất 8 ký tự.')
    return
  }
  isLoading.value = true
  try {
    await store.create({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || undefined,
      password: form.password,
      roleName: form.roleName,
    })
    ElMessage.success('Tạo tài khoản thành công!')
    emit('saved')
    visible.value = false
  } catch (err) {
    ElMessage.error((err as Error).message || 'Có lỗi xảy ra.')
  } finally {
    isLoading.value = false
  }
}
</script>

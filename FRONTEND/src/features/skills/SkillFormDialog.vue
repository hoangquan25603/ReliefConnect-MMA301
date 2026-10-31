<template>
  <el-dialog
    v-model="visible"
    :title="editData ? $t('admin.dialog_edit_skill') : $t('admin.dialog_add_skill')"
    width="440px"
    @close="resetForm"
  >
    <el-form label-position="top">
      <el-form-item :label="$t('admin.skill_name_label')" required>
        <el-input v-model="form.name" :placeholder="$t('admin.skill_name_placeholder')" />
      </el-form-item>

      <el-form-item :label="$t('admin.skill_desc_label')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          :placeholder="$t('admin.skill_desc_placeholder')"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="isLoading" @click="handleSubmit">
        {{ editData ? $t('common.save') : $t('admin.btn_create_skill') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createSkill, updateSkill } from './skills.api'
import type { Skill } from './skills.types'


interface Props {
  modelValue: boolean
  editData?: Skill | null
}
const props = withDefaults(defineProps<Props>(), { editData: null })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const isLoading = ref(false)
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = reactive({ name: '', description: '' })

watch(
  () => props.editData,
  (skill) => {
    form.name = skill?.name ?? ''
    form.description = skill?.description ?? ''
  },
  { immediate: true },
)

function resetForm(): void {
  form.name = props.editData?.name ?? ''
  form.description = props.editData?.description ?? ''
}

async function handleSubmit(): Promise<void> {
  const name = form.name.trim()
  if (!name) {
    ElMessage.warning('Vui lòng nhập tên kỹ năng')
    return
  }

  isLoading.value = true
  try {
    const payload = { name, description: form.description.trim() }
    if (props.editData) {
      await updateSkill(props.editData.id, payload)
      ElMessage.success('Cập nhật kỹ năng thành công!')
    } else {
      await createSkill(payload)
      ElMessage.success('Tạo kỹ năng thành công!')
    }
    emit('saved')
    visible.value = false
  } catch (err) {
    ElMessage.error((err as Error).message || 'Có lỗi xảy ra')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('admin.skills_title') }}</h1>
          <p class="page-sub">{{ $t('admin.skills_sub') }}</p>
        </div>
        <button class="btn-add" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ $t('admin.btn_add_skill') }}
        </button>
      </div>

      <BaseCard>
        <div v-if="isLoading" class="skills-loading">
          <BaseSpinner size="lg" class="spinner-dark" />
        </div>

        <div v-else-if="skills.length === 0" class="skills-empty">
          <p>{{ $t('admin.no_skills') }}</p>
        </div>

        <table v-else class="skills-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('admin.col_skill_name') }}</th>
              <th>{{ $t('admin.col_skill_desc') }}</th>
              <th>{{ $t('admin.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(skill, idx) in skills" :key="skill.id">
              <td class="text-muted">{{ idx + 1 }}</td>
              <td class="font-semibold">{{ skill.name }}</td>
              <td class="skills-desc-cell">{{ skill.description || '—' }}</td>
              <td class="actions-cell">
                <button class="action-btn action-btn--edit" @click="openEdit(skill)">{{ $t('common.edit') }}</button>
                <button class="action-btn action-btn--delete" @click="handleDelete(skill)">{{ $t('common.delete') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>

    <SkillFormDialog v-model="showDialog" :edit-data="editTarget" @saved="loadSkills" />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import SkillFormDialog from '@/features/skills/SkillFormDialog.vue'
import { getSkills, deleteSkill } from '@/features/skills/skills.api'
import { useConfirm } from '@/composables/useConfirm'
import type { Skill } from '@/features/skills/skills.types'

const { confirm } = useConfirm()

const skills = ref<Skill[]>([])
const isLoading = ref(true)
const showDialog = ref(false)
const editTarget = ref<Skill | null>(null)

async function loadSkills(): Promise<void> {
  isLoading.value = true
  try {
    skills.value = await getSkills()
  } catch (err) {
    ElMessage.error((err as Error).message || 'Không thể tải danh sách kỹ năng')
  } finally {
    isLoading.value = false
  }
}

function openCreate(): void {
  editTarget.value = null
  showDialog.value = true
}

function openEdit(skill: Skill): void {
  editTarget.value = skill
  showDialog.value = true
}

async function handleDelete(skill: Skill): Promise<void> {
  if (!(await confirm(`Bạn có chắc chắn muốn xoá kỹ năng "${skill.name}"?`))) return

  try {
    await deleteSkill(skill.id)
    ElMessage.success('Đã xoá kỹ năng')
    await loadSkills()
  } catch (err) {
    ElMessage.error((err as Error).message || 'Không thể xoá kỹ năng')
  }
}

onMounted(loadSkills)
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--space-4);
}
.page-sub {
  margin-top: 4px;
  font-size: 13.5px;
  color: var(--color-text-secondary, #718096);
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1a4f8d;
  color: #fff;
  border: none;
  padding: 10px 16px;
  font-size: 13.5px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.btn-add:hover { background: #123766; }

.skills-loading, .skills-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #718096;
}

.skills-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.skills-table th {
  text-align: left;
  padding: 12px 14px;
  font-size: 11.5px;
  font-weight: 700;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #e9ecef;
}
.skills-table td { padding: 12px 14px; border-bottom: 1px solid #f1f3f5; vertical-align: top; }
.text-muted { color: #a0aec0; }
.font-semibold { font-weight: 700; color: #1a3b5c; }
.skills-desc-cell { color: #4a5568; max-width: 420px; }

.actions-cell { display: flex; gap: 8px; white-space: nowrap; }
.action-btn {
  border: 1px solid #e9ecef;
  background: #fff;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn--edit { color: #1a4f8d; }
.action-btn--edit:hover { border-color: #1a4f8d; background: #f0f6ff; }
.action-btn--delete { color: #c53030; }
.action-btn--delete:hover { border-color: #c53030; background: #fff5f5; }
</style>

<template>
  <VolunteerLayout>
    <div class="skills-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="role-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {{ $t('volunteer.skills_badge') }}
          </div>
          <h1 class="page-title">{{ $t('volunteer.skills_title') }}</h1>
          <p class="page-sub">{{ $t('volunteer.skills_sub') }}</p>
        </div>
      </div>

      <!-- Error & Success Banners -->
      <Transition name="slide">
        <div v-if="successMessage" class="banner success-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </Transition>
      <Transition name="slide">
        <div v-if="errorMessage" class="banner error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <div v-if="isLoading" class="loading-container">
        <BaseSpinner />
        <p>{{ $t('volunteer.skills_loading') }}</p>
      </div>

      <div v-else-if="!hasProfile" class="no-profile-container">
        <div class="empty-state-card">
          <div class="lock-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3>{{ $t('volunteer.skills_no_profile_title') }}</h3>
          <p>{{ $t('volunteer.skills_no_profile_desc') }}</p>
          <router-link to="/volunteer/profile" class="create-profile-btn">
            {{ $t('volunteer.skills_create_profile_btn') }}
          </router-link>
        </div>
      </div>

      <div v-else class="skills-layout">
        <!-- Section: Registered Skills -->
        <div class="skills-section">
          <h3 class="section-title">{{ $t('volunteer.skills_my_skills', { count: registeredSkills.length }) }}</h3>
          <div v-if="registeredSkills.length === 0" class="empty-registered-state">
            {{ $t('volunteer.skills_no_skills') }}
          </div>
          <div v-else class="skills-grid">
            <div
              v-for="skill in registeredSkills"
              :key="skill.id"
              class="skill-card registered"
            >
              <div class="skill-card__header">
                <div class="skill-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h4 class="skill-title">{{ skill.name }}</h4>
              </div>
              <p class="skill-description">
                {{ skill.description || $t('volunteer.skills_no_description') }}
              </p>
              <div class="skill-card__actions">
                <span class="status-badge approved">{{ $t('volunteer.skills_active_badge') }}</span>
                <button
                  class="btn-delete-skill"
                  @click="handleRemoveSkill(getVolunteerSkillId(skill.id), skill.name)"
                  :disabled="isSubmitting"
                >
                  {{ $t('volunteer.skills_btn_delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Available Skills for registration -->
        <div class="skills-section add-section">
          <h3 class="section-title">{{ $t('volunteer.skills_suggested', { count: availableSkillsToRegister.length }) }}</h3>
          <div v-if="availableSkillsToRegister.length === 0" class="empty-registered-state">
            {{ $t('volunteer.skills_all_registered') }}
          </div>
          <div v-else class="skills-grid">
            <div
              v-for="skill in availableSkillsToRegister"
              :key="skill.id"
              class="skill-card suggest"
            >
              <div class="skill-card__header">
                <div class="skill-icon-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <h4 class="skill-title">{{ skill.name }}</h4>
              </div>
              <p class="skill-description">{{ skill.description || $t('volunteer.skills_no_description') }}</p>
              <div class="skill-card__actions">
                <span class="status-badge info">{{ $t('volunteer.skills_registerable_badge') }}</span>
                <button
                  class="btn-register-skill"
                  @click="handleAddSkill(skill.id)"
                  :disabled="isSubmitting"
                >
                  {{ $t('volunteer.skills_btn_register') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </VolunteerLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import {
  getVolunteerProfile,
  registerSkills,
  deleteSkill,
} from '@/features/volunteers/volunteers.api'
import { getSkills } from '@/features/skills/skills.api'
import type { VolunteerProfile } from '@/features/volunteers/volunteers.types'
import type { Skill } from '@/features/skills/skills.types'

const { t } = useI18n()

const profile = ref<VolunteerProfile | null>(null)
const availableSkills = ref<Skill[]>([])
const hasProfile = ref(true)
const isLoading = ref(true)
const isSubmitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')


const triggerNotification = (type: 'success' | 'error', msg: string) => {
  if (type === 'success') {
    successMessage.value = msg
    setTimeout(() => { successMessage.value = '' }, 4000)
  } else {
    errorMessage.value = msg
    setTimeout(() => { errorMessage.value = '' }, 4000)
  }
}

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [data] = await Promise.all([
      getVolunteerProfile(),
      loadAvailableSkills(),
    ])
    profile.value = data
    hasProfile.value = true
  } catch (err: unknown) {
    const error = err as Error
    if (error.message && error.message.includes('chưa được tạo')) {
      hasProfile.value = false
    } else {
      triggerNotification('error', error.message || t('volunteer.profile_msg_load_failed'))
    }
  } finally {
    isLoading.value = false
  }
}

const loadAvailableSkills = async () => {
  try {
    availableSkills.value = await getSkills()
  } catch (err: unknown) {
    console.error('Failed to load skills catalog', err)
  }
}

// Helper: check if a string looks like a GUID
function isGuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

// Compute registered skills as Skill list
const registeredSkills = computed<Skill[]>(() => {
  if (!profile.value) return []
  const vs = profile.value.skills
  // Nếu BE trả string[] (name), skillId = name → match theo name
  const useNameMatch = vs.length > 0 && !isGuid(vs[0].skillId)
  if (useNameMatch) {
    const registeredNames = new Set(vs.map((s) => s.name.toLowerCase()))
    return availableSkills.value.filter((s) => registeredNames.has(s.name.toLowerCase()))
  }
  const registeredSkillIds = new Set(vs.map((s) => s.skillId))
  return availableSkills.value.filter((s) => registeredSkillIds.has(s.id))
})

// Compute remaining skills that can be registered
const availableSkillsToRegister = computed<Skill[]>(() => {
  if (!profile.value) return availableSkills.value
  const vs = profile.value.skills
  const useNameMatch = vs.length > 0 && !isGuid(vs[0].skillId)
  if (useNameMatch) {
    const registeredNames = new Set(vs.map((s) => s.name.toLowerCase()))
    return availableSkills.value.filter((s) => !registeredNames.has(s.name.toLowerCase()))
  }
  const registeredSkillIds = new Set(vs.map((s) => s.skillId))
  return availableSkills.value.filter((s) => !registeredSkillIds.has(s.id))
})

/**
 * Lấy VolunteerSkill.id (join-table record) để gọi DELETE /volunteers/skills/{id}
 * bằng cách tìm ngược từ Skill catalog id → VolunteerSkill.skillId hoặc name
 */
function getVolunteerSkillId(catalogSkillId: string): string {
  if (!profile.value) return catalogSkillId
  // Tìm theo skillId (GUID) trước, rồi fallback tìm theo catalog skill name
  const catalogSkill = availableSkills.value.find((s) => s.id === catalogSkillId)
  const vs = profile.value.skills.find(
    (s) => s.skillId === catalogSkillId ||
           (catalogSkill && s.name.toLowerCase() === catalogSkill.name.toLowerCase()),
  )
  return vs?.id ?? catalogSkillId
}

const handleAddSkill = async (skillId: string) => {
  isSubmitting.value = true
  try {
    await registerSkills([skillId])
    triggerNotification('success', t('volunteer.skills_msg_register_success'))
    await loadProfile()
  } catch (err: unknown) {
    const error = err as Error
    triggerNotification('error', error.message || t('volunteer.skills_msg_register_failed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveSkill = async (skillId: string, skillName: string) => {
  if (!confirm(t('volunteer.skills_confirm_unregister', { name: skillName }))) {
    return
  }

  isSubmitting.value = true
  try {
    // skillId ở đây là VolunteerSkill.id (join-table record ID) để DELETE /volunteers/skills/{id}
    await deleteSkill(skillId)
    triggerNotification('success', t('volunteer.skills_msg_unregister_success', { name: skillName }))
    await loadProfile()
  } catch (err: unknown) {
    const error = err as Error
    triggerNotification('error', error.message || t('volunteer.skills_msg_unregister_failed'))
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<style scoped>
.skills-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 28px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(107, 70, 193, 0.1);
  color: #6b46c1;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 99px;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0;
}

.page-sub {
  margin-top: 4px;
  font-size: 14px;
  color: #718096;
}

/* Notification Banners */
.banner {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.success-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

/* Loading container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  gap: 12px;
  color: #718096;
  font-weight: 500;
}

/* Locked / No profile state */
.no-profile-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-state-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.lock-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff5f5;
  color: #e53e3e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-card h3 {
  font-size: 18px;
  font-weight: 800;
  color: #2d3748;
  margin: 0;
}

.empty-state-card p {
  font-size: 14px;
  color: #718096;
  line-height: 1.6;
  margin: 0;
}

.create-profile-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 24px;
  background: #276749;
  color: white;
  text-decoration: none;
  font-weight: 700;
  border-radius: 8px;
  transition: background 0.15s;
}

.create-profile-btn:hover {
  background: #1f5337;
}

/* Skills Layout & Section */
.skills-layout {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0 0 16px;
}

.empty-registered-state {
  background: #f7fafc;
  border: 1.5px dashed #e2e8f0;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: #718096;
  font-size: 14px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.skill-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #edf2f7;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  transition: all 0.2s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.skill-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.registered .skill-icon-wrap {
  background: #ecfdf5;
  color: #059669;
}

.suggest .skill-icon-wrap {
  background: #f5f3ff;
  color: #7c3aed;
}

.skill-title {
  font-size: 15px;
  font-weight: 800;
  color: #2d3748;
  margin: 0;
}

.skill-description {
  margin: 0;
  font-size: 13px;
  color: #718096;
  line-height: 1.5;
  flex-grow: 1;
}

.skill-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #edf2f7;
  padding-top: 12px;
}

.status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 99px;
}

.status-badge.approved {
  background: #ecfdf5;
  color: #059669;
}

.status-badge.info {
  background: #eff6ff;
  color: #2563eb;
}

.btn-delete-skill {
  background: transparent;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  font-size: 12.5px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-delete-skill:hover {
  background: #fff5f5;
}

.btn-delete-skill:disabled,
.btn-register-skill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-register-skill {
  background: #6b46c1;
  color: white;
  border: none;
  font-size: 12.5px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-register-skill:hover {
  background: #553c9a;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<template>
  <VolunteerLayout>
    <div class="profile-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="role-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {{ $t('volunteer.role_title') }}
          </div>
          <h1 class="page-title">{{ $t('volunteer.profile_title') }}</h1>
          <p class="page-sub">{{ $t('volunteer.profile_sub') }}</p>
        </div>

        <div v-if="profile" class="approval-status" :class="statusClass">
          <span class="status-dot" />
          {{ statusLabel }}
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
        <p>{{ $t('volunteer.profile_loading') }}</p>
      </div>

      <div v-else class="profile-grid">
        <!-- Left Column: Personal info & Profile details -->
        <div class="grid-left">
          <BaseCard>
            <template #header>
              <div class="card-header-flex">
                <span>{{ isEditMode ? $t('volunteer.profile_card_edit') : $t('volunteer.profile_card_details') }}</span>
                <button
                  v-if="profile && !isEditMode"
                  class="action-btn"
                  @click="enterEditMode"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  {{ $t('volunteer.profile_btn_edit') }}
                </button>
              </div>
            </template>

            <!-- Profile Form / View -->
            <form @submit.prevent="saveProfile">
              <!-- Account (Readonly from profile / user store) -->
              <div class="user-summary">
                <div class="avatar-large">{{ initials }}</div>
                <div class="user-meta">
                  <h3>{{ profile?.fullName || authStore.user?.fullName }}</h3>
                  <p class="user-email">{{ profile?.email || authStore.user?.email }}</p>
                  <p class="user-phone">{{ $t('volunteer.profile_phone', { phone: profile?.phoneNumber || authStore.user?.phoneNumber || $t('volunteer.profile_not_updated') }) }}</p>
                </div>
              </div>

              <div class="form-grid">
                <!-- Address -->
                <div class="form-group span-full">
                  <label for="address">{{ $t('volunteer.profile_form_address') }}</label>
                  <BaseInput
                    id="address"
                    v-model="form.address"
                    :disabled="!isEditMode && !!profile"
                    :placeholder="$t('volunteer.profile_form_address_placeholder')"
                    required
                  />
                </div>
 
                <!-- Coordinates -->
                <div class="form-group">
                  <label for="latitude">{{ $t('volunteer.profile_form_lat') }}</label>
                  <BaseInput
                    id="latitude"
                    type="number"
                    step="any"
                    v-model.number="form.latitude"
                    :disabled="!isEditMode && !!profile"
                    placeholder="21.0285"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="longitude">{{ $t('volunteer.profile_form_lng') }}</label>
                  <BaseInput
                    id="longitude"
                    type="number"
                    step="any"
                    v-model.number="form.longitude"
                    :disabled="!isEditMode && !!profile"
                    placeholder="105.8542"
                    required
                  />
                </div>
 
                <!-- Experience Years -->
                <div class="form-group span-full">
                  <label for="experienceYears">{{ $t('volunteer.profile_form_experience') }}</label>
                  <BaseInput
                    id="experienceYears"
                    type="number"
                    min="0"
                    v-model.number="form.experienceYears"
                    :disabled="!isEditMode && !!profile"
                    :placeholder="$t('volunteer.profile_form_experience_placeholder')"
                    required
                  />
                </div>
 
                <!-- Bio -->
                <div class="form-group span-full">
                  <label for="bio">{{ $t('volunteer.profile_form_bio') }}</label>
                  <textarea
                    id="bio"
                    v-model="form.bio"
                    :disabled="!isEditMode && !!profile"
                    :placeholder="$t('volunteer.profile_form_bio_placeholder')"
                    rows="4"
                    class="custom-textarea"
                  />
                </div>
              </div>

              <!-- Action buttons inside form -->
              <div v-if="isEditMode || !profile" class="form-actions">
                <BaseButton
                  v-if="profile"
                  type="button"
                  variant="secondary"
                  @click="cancelEdit"
                  :disabled="isSaving"
                >
                  {{ $t('volunteer.profile_btn_cancel') }}
                </BaseButton>
                <BaseButton
                  type="submit"
                  variant="primary"
                  :loading="isSaving"
                >
                  {{ profile ? $t('volunteer.profile_btn_save') : $t('volunteer.profile_btn_create') }}
                </BaseButton>
              </div>
            </form>
          </BaseCard>
        </div>

        <!-- Right Column: Skills Management -->
        <div class="grid-right">
          <!-- Active skills -->
          <BaseCard>
            <template #header>
              <div class="card-header-flex">
                <span>{{ $t('volunteer.profile_skills_title') }}</span>
                <span class="skills-count" v-if="profile && profile.skills">{{ $t('volunteer.profile_skills_count', { count: profile.skills.length }) }}</span>
              </div>
            </template>
 
            <div v-if="!profile" class="skills-locked">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p>{{ $t('volunteer.profile_skills_locked') }}</p>
            </div>
 
            <div v-else class="skills-manager">
              <div v-if="!profile.skills || profile.skills.length === 0" class="no-skills-state">
                {{ $t('volunteer.profile_no_skills') }}
              </div>

              <div v-else class="skills-list">
                <div
                  v-for="skill in profile.skills"
                  :key="skill.id"
                  class="skill-badge-item"
                >
                  <span class="skill-name">{{ skill.name }}</span>
                  <button
                    class="remove-skill-btn"
                    :title="$t('volunteer.profile_remove_title')"
                    @click="handleRemoveSkill(skill.id, skill.name)"
                    :disabled="isModifyingSkills"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Add Skills Section -->
              <div class="add-skills-section">
                <h4>{{ $t('volunteer.profile_skills_add_title') }}</h4>
                <div class="skill-picker-row">
                  <select v-model="selectedSkillToAdd" class="custom-select" :disabled="isModifyingSkills">
                    <option value="" disabled>{{ $t('volunteer.profile_skills_select_placeholder') }}</option>
                    <option
                      v-for="skill in registerableSkills"
                      :key="skill.id"
                      :value="skill.id"
                    >
                      {{ skill.name }}
                    </option>
                  </select>
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    :disabled="!selectedSkillToAdd || isModifyingSkills"
                    @click="handleAddSkill"
                    :loading="isModifyingSkills"
                  >
                    {{ $t('volunteer.profile_skills_btn_register') }}
                  </BaseButton>
                </div>
                <p class="skill-desc" v-if="selectedSkillDescription">
                  <em>* {{ selectedSkillDescription }}</em>
                </p>
              </div>
            </div>
          </BaseCard>

          <!-- Guide Card -->
          <BaseCard class="guide-card">
            <h4 class="guide-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {{ $t('volunteer.profile_guide_title') }}
            </h4>
            <ul class="guide-list">
              <li>{{ $t('volunteer.profile_guide_1') }}</li>
              <li>{{ $t('volunteer.profile_guide_2') }}</li>
              <li>{{ $t('volunteer.profile_guide_3') }}</li>
            </ul>
          </BaseCard>
        </div>
      </div>
    </div>
  </VolunteerLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getVolunteerProfile,
  createVolunteerProfile,
  updateVolunteerProfile,
  registerSkills,
  deleteSkill,
} from '@/features/volunteers/volunteers.api'
import { getSkills } from '@/features/skills/skills.api'
import type { VolunteerProfile, VolunteerProfilePayload } from '@/features/volunteers/volunteers.types'
import type { Skill } from '@/features/skills/skills.types'

const authStore = useAuthStore()
const { t } = useI18n()

// State
const profile = ref<VolunteerProfile | null>(null)
const availableSkills = ref<Skill[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const isEditMode = ref(false)
const isModifyingSkills = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const selectedSkillToAdd = ref('')

const form = reactive({
  address: '',
  latitude: 21.0285,
  longitude: 105.8542,
  experienceYears: 0,
  bio: '',
})

// Computed
const initials = computed(() => {
  const name = profile.value?.fullName || authStore.user?.fullName || ''
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'
})

// Status badge theo VolunteerStatus
const statusLabel = computed(() => {
  switch (profile.value?.status) {
    case 'Approved': return t('volunteer.profile_status_approved')
    case 'Rejected': return t('volunteer.profile_status_rejected')
    default:         return t('volunteer.profile_status_pending')
  }
})

const statusClass = computed(() => ({
  approved: profile.value?.status === 'Approved',
  rejected: profile.value?.status === 'Rejected',
}))

// Filter available skills that the user hasn't registered yet
const registerableSkills = computed(() => {
  if (!profile.value) return availableSkills.value
  const registeredIds = new Set(profile.value.skills.map((s) => s.skillId))
  return availableSkills.value.filter((skill) => !registeredIds.has(skill.id))
})

const selectedSkillDescription = computed(() => {
  if (!selectedSkillToAdd.value) return ''
  return availableSkills.value.find((s) => s.id === selectedSkillToAdd.value)?.description || ''
})

// Methods
const triggerNotification = (type: 'success' | 'error', msg: string) => {
  if (type === 'success') {
    successMessage.value = msg
    setTimeout(() => { successMessage.value = '' }, 4000)
  } else {
    errorMessage.value = msg
    setTimeout(() => { errorMessage.value = '' }, 4000)
  }
}

const loadAvailableSkills = async () => {
  try {
    availableSkills.value = await getSkills()
  } catch (err: unknown) {
    console.error('Failed to load skills catalog', err)
  }
}

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [data] = await Promise.all([getVolunteerProfile(), loadAvailableSkills()])
    // Guard: BE có thể trả về skills: null thay vì [] khi chưa có kỹ năng nào
    profile.value = {
      ...data,
      skills: Array.isArray(data.skills) ? data.skills : [],
    }
    // Map data to form
    form.address = data.address
    form.latitude = data.latitude
    form.longitude = data.longitude
    form.experienceYears = data.experienceYears
    form.bio = data.bio || ''
  } catch (err: unknown) {
    const error = err as Error
    // Nếu hồ sơ chưa được tạo, ta không báo lỗi mà chuyển sang chế độ tạo mới
    if (error.message && error.message.includes('chưa được tạo')) {
      profile.value = null
    } else {
      triggerNotification('error', error.message || t('volunteer.profile_msg_load_failed'))
    }
  } finally {
    isLoading.value = false
  }
}

const enterEditMode = () => {
  isEditMode.value = true
}

const cancelEdit = () => {
  isEditMode.value = false
  if (profile.value) {
    form.address = profile.value.address
    form.latitude = profile.value.latitude
    form.longitude = profile.value.longitude
    form.experienceYears = profile.value.experienceYears
    form.bio = profile.value.bio || ''
  }
}

const saveProfile = async () => {
  isSaving.value = true
  errorMessage.value = ''
  try {
    // Payload không có skillIds — kỹ năng quản lý qua endpoint riêng
    const payload: VolunteerProfilePayload = {
      address:         form.address,
      latitude:        form.latitude,
      longitude:       form.longitude,
      experienceYears: form.experienceYears,
      bio:             form.bio || null,
    }

    if (profile.value) {
      await updateVolunteerProfile(payload)
      triggerNotification('success', t('volunteer.profile_msg_update_success'))
    } else {
      await createVolunteerProfile(payload)
      triggerNotification('success', t('volunteer.profile_msg_create_success'))
    }
    // Reload để lấy dữ liệu mới nhất từ BE
    await loadProfile()
    isEditMode.value = false
  } catch (err: unknown) {
    const error = err as Error
    triggerNotification('error', error.message || t('volunteer.profile_msg_save_failed'))
  } finally {
    isSaving.value = false
  }
}

const handleAddSkill = async () => {
  if (!selectedSkillToAdd.value) return
  isModifyingSkills.value = true
  try {
    await registerSkills([selectedSkillToAdd.value])
    triggerNotification('success', t('volunteer.profile_msg_add_skill_success'))
    selectedSkillToAdd.value = ''
    await loadProfile() // reload để lấy danh sách kỹ năng mới nhất
  } catch (err: unknown) {
    const error = err as Error
    const detail = error.message.includes('ApiError') ? error.message : error.message
    triggerNotification('error', detail || t('volunteer.profile_msg_add_skill_failed'))
  } finally {
    isModifyingSkills.value = false
  }
}

const handleRemoveSkill = async (skillId: string, skillName: string) => {
  if (!confirm(t('volunteer.profile_msg_remove_confirm', { name: skillName }))) {
    return
  }

  isModifyingSkills.value = true
  try {
    await deleteSkill(skillId)
    triggerNotification('success', t('volunteer.profile_msg_remove_success', { name: skillName }))
    await loadProfile()
  } catch (err: unknown) {
    const error = err as Error
    triggerNotification('error', error.message || t('volunteer.profile_msg_remove_failed'))
  } finally {
    isModifyingSkills.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(39, 103, 73, 0.1);
  color: #276749;
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

.approval-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #d97706;
}

.approval-status.approved {
  background: #ecfdf5;
  border-color: #d1fae5;
  color: #059669;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d97706;
}

.approval-status.approved .status-dot {
  background: #059669;
}

.approval-status.rejected {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}

.approval-status.rejected .status-dot {
  background: #e11d48;
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

/* Layout Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 24px;
  align-items: start;
}

/* Card Header Flex */
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1.5px solid #276749;
  color: #276749;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(39, 103, 73, 0.05);
}

/* User Summary Section */
.user-summary {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1.5px solid #f0f2f5;
  margin-bottom: 24px;
}

.avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #276749 0%, #48bb78 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(72, 187, 120, 0.2);
}

.user-meta h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1a3b5c;
}

.user-meta p {
  margin: 0;
  font-size: 13.5px;
  color: #718096;
}

/* Form Details */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.span-full {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #2d3748;
}

.custom-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  background: #fafafa;
  color: #2d3748;
  outline: none;
  resize: vertical;
  transition: all 0.2s;
  box-sizing: border-box;
}

.custom-textarea:focus {
  border-color: #276749;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(39, 103, 73, 0.1);
}

.custom-textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1.5px solid #f0f2f5;
}

/* Skills Manager */
.skills-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px 10px;
  color: #a0aec0;
  gap: 12px;
}

.skills-locked p {
  font-size: 13.5px;
  margin: 0;
  color: #718096;
  line-height: 1.5;
}

.no-skills-state {
  text-align: center;
  padding: 24px 10px;
  color: #718096;
  font-size: 13.5px;
  background: #fafafa;
  border: 1.5px dashed #e2e8f0;
  border-radius: 10px;
}

.skills-count {
  background: #e8f5ee;
  color: #276749;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.skill-badge-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0fdf4;
  border: 1.5px solid #d1fae5;
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

.skill-badge-item:hover {
  border-color: #86efac;
}

.skill-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #166534;
}

.remove-skill-btn {
  background: transparent;
  border: none;
  color: #15803d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}

.remove-skill-btn:hover {
  background: #d1fae5;
  color: #b91c1c;
}

/* Add Skills Section */
.add-skills-section {
  border-top: 1.5px solid #f0f2f5;
  padding-top: 20px;
  margin-top: 20px;
}

.add-skills-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #2d3748;
}

.skill-picker-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.custom-select {
  flex: 1;
  padding: 10px 12px;
  border: 1.5px solid #d0d5dd;
  border-radius: 8px;
  background: #fafafa;
  font-size: 13.5px;
  color: #2d3748;
  outline: none;
  cursor: pointer;
}

.custom-select:focus {
  border-color: #276749;
}

.skill-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #718096;
}

/* Guide Card */
.guide-card {
  margin-top: 20px;
  background: #f7fafc;
  border: 1px solid #edf2f7;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #2b6cb0;
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #4a5568;
  font-size: 12.5px;
  line-height: 1.6;
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

@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <RequesterLayout>
    <div class="become-vol-page">

      <!-- ── Trạng thái: đang tải ───────────────────────────── -->
      <div v-if="isLoading" class="status-screen loading-screen">
        <div class="spinner-ring" />
        <p>{{ $t('requester.vol_checking') }}</p>
      </div>

      <!-- ── Trạng thái: Pending (đang chờ duyệt) ────────────── -->
      <div v-else-if="profileStatus === 'Pending'" class="status-screen pending-screen">
        <div class="status-icon-wrap pending-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 class="status-title">{{ $t('requester.vol_pending_title') }}</h1>
        <p class="status-desc">
          {{ $t('requester.vol_pending_desc') }}
        </p>

        <div class="info-card pending-card">
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_full_name') }}</span>
            <span class="info-value">{{ profile?.fullName }}</span>
          </div>
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_email') }}</span>
            <span class="info-value">{{ profile?.email }}</span>
          </div>
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_address') }}</span>
            <span class="info-value">{{ profile?.address }}</span>
          </div>
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_experience') }}</span>
            <span class="info-value">{{ profile?.experienceYears }} {{ $t('requester.vol_years') }}</span>
          </div>
          <div class="info-card__row" v-if="profile?.bio">
            <span class="info-label">{{ $t('requester.vol_bio') }}</span>
            <span class="info-value">{{ profile?.bio }}</span>
          </div>
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_status') }}</span>
            <span class="status-badge status-badge--pending">{{ $t('requester.vol_status_pending_badge') }}</span>
          </div>
        </div>

        <p class="hint-text">
          {{ $t('requester.vol_hint', { days: $t('requester.vol_hint_days') }) }}
        </p>

        <button class="btn-secondary" @click="router.push('/requester')">
          {{ $t('requester.vol_back_home') }}
        </button>
      </div>

      <!-- ── Trạng thái: Rejected (bị từ chối) ───────────────── -->
      <div v-else-if="profileStatus === 'Rejected'" class="status-screen rejected-screen">
        <div class="status-icon-wrap rejected-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 class="status-title">{{ $t('requester.vol_rejected_title') }}</h1>
        <p class="status-desc">
          {{ $t('requester.vol_rejected_desc') }}
        </p>

        <div class="info-card rejected-card">
          <div class="info-card__row">
            <span class="info-label">{{ $t('requester.vol_status') }}</span>
            <span class="status-badge status-badge--rejected">{{ $t('requester.vol_status_rejected_badge') }}</span>
          </div>
        </div>

        <div class="action-group">
          <button class="btn-primary" @click="showReapplyForm = true" v-if="!showReapplyForm">
            {{ $t('requester.vol_reapply_btn') }}
          </button>
          <button class="btn-secondary" @click="router.push('/requester')">
            {{ $t('requester.vol_back_home') }}
          </button>
        </div>

        <!-- Form nộp lại -->
        <div v-if="showReapplyForm" class="register-form-wrap">
          <h2 class="form-title">{{ $t('requester.vol_reapply_form_title') }}</h2>
          <VolunteerRegisterForm
            :initial-data="profile"
            :submit-label="$t('requester.vol_reapply_btn')"
            @submit="handleUpdate"
            @cancel="showReapplyForm = false"
            :is-saving="isSaving"
            :error-message="errorMessage"
          />
        </div>
      </div>

      <!-- ── Trạng thái: Approved ──────────────────────────────── -->
      <div v-else-if="profileStatus === 'Approved'" class="status-screen approved-screen">
        <div class="status-icon-wrap approved-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h1 class="status-title">{{ $t('requester.vol_approved_title') }}</h1>
        <p class="status-desc">
          {{ $t('requester.vol_approved_desc') }}
        </p>

        <div class="action-group">
          <button class="btn-primary" @click="router.push('/volunteer')">
            {{ $t('requester.vol_go_dashboard') }}
          </button>
          <button class="btn-secondary" @click="router.push('/requester')">
            {{ $t('requester.vol_back_home') }}
          </button>
        </div>
      </div>

      <!-- ── Trạng thái: Chưa có hồ sơ → form đăng ký ──────── -->
      <div v-else class="register-wrapper">
        <!-- Header -->
        <div class="register-header">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h1 class="register-title">{{ $t('requester.vol_register_title') }}</h1>
            <p class="register-sub">{{ $t('requester.vol_register_sub') }}</p>
          </div>
        </div>

        <!-- Banner thông tin -->
        <div class="info-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>{{ $t('requester.vol_info_banner', { status: $t('requester.vol_info_banner_status') }) }}</p>
        </div>

        <!-- Error banner -->
        <Transition name="slide">
          <div v-if="errorMessage" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>
        </Transition>

        <!-- Form đăng ký -->
        <VolunteerRegisterForm
          :is-saving="isSaving"
          :error-message="errorMessage"
          :submit-label="$t('requester.vol_submit_register')"
          @submit="handleCreate"
        />
      </div>

    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import VolunteerRegisterForm from '@/components/volunteer/VolunteerRegisterForm.vue'
import {
  getVolunteerProfile,
  createVolunteerProfile,
  updateVolunteerProfile,
} from '@/features/volunteers/volunteers.api'
import type { VolunteerProfile, VolunteerProfilePayload } from '@/features/volunteers/volunteers.types'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

// ── State ──────────────────────────────────────────────────────
const profile       = ref<VolunteerProfile | null>(null)
const isLoading     = ref(true)
const isSaving      = ref(false)
const errorMessage  = ref('')
const showReapplyForm = ref(false)

// ── Computed ───────────────────────────────────────────────────
const profileStatus = computed(() => profile.value?.status ?? null)

// ── Load trạng thái hồ sơ khi mount ──────────────────────────
onMounted(async () => {
  try {
    profile.value = await getVolunteerProfile()
    if (profile.value?.status === 'Approved') {
      await authStore.fetchMe() // Đồng bộ thông tin user mới nhất để đổi role thành Volunteer ở local
      await router.replace('/volunteer')
    }
  } catch {
    // 404 → chưa có hồ sơ → hiển thị form đăng ký
    profile.value = null
  } finally {
    isLoading.value = false
  }
})

// ── Tạo hồ sơ mới ─────────────────────────────────────────────
async function handleCreate(payload: VolunteerProfilePayload): Promise<void> {
  isSaving.value   = true
  errorMessage.value = ''
  try {
    const result = await createVolunteerProfile(payload)
    // Cập nhật state local ngay lập tức tránh việc gọi API quá nhanh bị lag/trễ DB
    profile.value = {
      id:              result.id,
      userId:          authStore.user?.userId || '',
      fullName:        authStore.user?.fullName || '',
      email:           authStore.user?.email || '',
      phoneNumber:     '',
      address:         payload.address,
      latitude:        payload.latitude,
      longitude:       payload.longitude,
      experienceYears: payload.experienceYears,
      bio:             payload.bio || '',
      status:          'Pending',
      skills:          []
    }
  } catch (err) {
    errorMessage.value = (err as Error).message || t('requester.vol_create_failed')
  } finally {
    isSaving.value = false
  }
}

// ── Cập nhật hồ sơ (khi bị Rejected và nộp lại) ──────────────
async function handleUpdate(payload: VolunteerProfilePayload): Promise<void> {
  isSaving.value   = true
  errorMessage.value = ''
  try {
    await updateVolunteerProfile(payload)
    // Cập nhật state local ngay lập tức
    if (profile.value) {
      profile.value = {
        ...profile.value,
        ...payload,
        status: 'Pending'
      }
    }
    showReapplyForm.value = false
  } catch (err) {
    errorMessage.value = (err as Error).message || t('requester.vol_update_failed')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.become-vol-page {
  max-width: 780px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

/* ── Status screens ─────────────────────────────────────── */
.status-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  gap: 20px;
}

.status-icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.pending-icon  { background: #fffbeb; color: #d97706; border: 2px solid #fde68a; }
.rejected-icon { background: #fff1f2; color: #e11d48; border: 2px solid #fecdd3; }
.approved-icon { background: #f0fdf4; color: #059669; border: 2px solid #a7f3d0; }

.status-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0;
}

.status-desc {
  font-size: 15px;
  color: #4a5568;
  line-height: 1.7;
  max-width: 520px;
  margin: 0;
}

.hint-text {
  font-size: 13.5px;
  color: #718096;
  line-height: 1.7;
  margin: 0;
}

/* ── Info card ─────────────────────────────────────────────── */
.info-card {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.pending-card  { border: 1.5px solid #fde68a; }
.rejected-card { border: 1.5px solid #fecdd3; }

.info-card__row {
  display: flex;
  gap: 12px;
  align-items: baseline;
  font-size: 14px;
}

.info-label {
  color: #718096;
  font-weight: 600;
  min-width: 100px;
  flex-shrink: 0;
}

.info-value {
  color: #2d3748;
  font-weight: 500;
}

/* ── Status badges ─────────────────────────────────────────── */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
}

.status-badge--pending  { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-badge--rejected { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }

/* ── Action buttons ────────────────────────────────────────── */
.action-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #276749, #48bb78);
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

.btn-secondary {
  background: #fff;
  color: #4a5568;
  border: 1.5px solid #e2e8f0;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.btn-secondary:hover { background: #f7fafc; border-color: #cbd5e0; }

/* ── Loading ───────────────────────────────────────────────── */
.loading-screen { justify-content: center; min-height: 400px; color: #718096; }
.spinner-ring {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #276749;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Register form wrapper ─────────────────────────────────── */
.register-wrapper { padding: 8px 0 40px; }

.register-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.header-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1.5px solid #a7f3d0;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.register-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a3b5c;
  margin: 0 0 4px;
}

.register-sub {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 13.5px;
  color: #1e40af;
  line-height: 1.6;
  margin-bottom: 20px;
}
.info-banner svg { flex-shrink: 0; margin-top: 2px; }

.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13.5px;
  color: #e11d48;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Form nộp lại */
.register-form-wrap {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1.5px solid #f0f4f8;
  width: 100%;
  max-width: 600px;
}
.form-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a3b5c;
  margin: 0 0 20px;
}

/* ── Transition ────────────────────────────────────────────── */
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

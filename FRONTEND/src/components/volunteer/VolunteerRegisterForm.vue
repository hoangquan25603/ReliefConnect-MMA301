<template>
  <form class="vol-register-form" @submit.prevent="handleSubmit">
    <div class="form-grid">

      <!-- Địa chỉ -->
      <div class="form-group span-full">
        <label for="reg-address" class="form-label">
          {{ $t('requester.vol_form_address') }} <span class="required">*</span>
        </label>
        <input
          id="reg-address"
          v-model="form.address"
          type="text"
          class="form-input"
          :placeholder="$t('requester.vol_form_address_placeholder')"
          required
        />
      </div>

      <!-- Vĩ độ & Kinh độ -->
      <div class="form-group">
        <label for="reg-lat" class="form-label">
          {{ $t('requester.vol_form_lat') }} <span class="required">*</span>
        </label>
        <input
          id="reg-lat"
          v-model.number="form.latitude"
          type="number"
          step="any"
          class="form-input"
          placeholder="VD: 21.0285"
          required
        />
        <p class="form-hint">{{ $t('requester.vol_form_lat_hint_prefix') }} <a href="https://maps.google.com" target="_blank">maps.google.com</a></p>
      </div>

      <div class="form-group">
        <label for="reg-lng" class="form-label">
          {{ $t('requester.vol_form_lng') }} <span class="required">*</span>
        </label>
        <input
          id="reg-lng"
          v-model.number="form.longitude"
          type="number"
          step="any"
          class="form-input"
          placeholder="VD: 105.8542"
          required
        />
      </div>

      <!-- Số năm kinh nghiệm -->
      <div class="form-group span-full">
        <label for="reg-exp" class="form-label">
          {{ $t('requester.vol_form_experience') }} <span class="required">*</span>
        </label>
        <input
          id="reg-exp"
          v-model.number="form.experienceYears"
          type="number"
          min="0"
          max="50"
          class="form-input"
          placeholder="VD: 2"
          required
        />
      </div>

      <!-- Giới thiệu bản thân -->
      <div class="form-group span-full">
        <label for="reg-bio" class="form-label">{{ $t('requester.vol_form_bio') }}</label>
        <textarea
          id="reg-bio"
          v-model="form.bio"
          class="form-textarea"
          rows="4"
          :placeholder="$t('requester.vol_form_bio_placeholder')"
        />
      </div>
    </div>

    <!-- Error -->
    <Transition name="slide">
      <div v-if="errorMessage" class="error-msg">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ errorMessage }}
      </div>
    </Transition>

    <!-- Actions -->
    <div class="form-actions">
      <button
        v-if="showCancel"
        type="button"
        class="btn-cancel"
        @click="emit('cancel')"
        :disabled="isSaving"
      >
        {{ $t('requester.vol_form_cancel') }}
      </button>
      <button
        type="submit"
        class="btn-submit"
        :disabled="isSaving"
      >
        <svg v-if="isSaving" class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        {{ isSaving ? $t('requester.vol_form_processing') : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { VolunteerProfile, VolunteerProfilePayload } from '@/features/volunteers/volunteers.types'

const props = withDefaults(defineProps<{
  initialData?:  VolunteerProfile | null
  submitLabel?:  string
  isSaving?:     boolean
  errorMessage?: string
}>(), {
  initialData:  null,
  submitLabel:  '',
  isSaving:     false,
  errorMessage: '',
})

const emit = defineEmits<{
  (e: 'submit', payload: VolunteerProfilePayload): void
  (e: 'cancel'): void
}>()

const showCancel = computed(() => !!props.initialData)

const form = reactive({
  address:         props.initialData?.address         ?? '',
  latitude:        props.initialData?.latitude        ?? 21.0285,
  longitude:       props.initialData?.longitude       ?? 105.8542,
  experienceYears: props.initialData?.experienceYears ?? 0,
  bio:             props.initialData?.bio             ?? '',
})

// Sync nếu initialData thay đổi (khi nộp lại sau reject)
watch(() => props.initialData, (data) => {
  if (!data) return
  form.address         = data.address
  form.latitude        = data.latitude
  form.longitude       = data.longitude
  form.experienceYears = data.experienceYears
  form.bio             = data.bio ?? ''
})

function handleSubmit(): void {
  const payload: VolunteerProfilePayload = {
    address:         form.address.trim(),
    latitude:        form.latitude,
    longitude:       form.longitude,
    experienceYears: form.experienceYears,
    bio:             form.bio.trim() || null,
  }
  emit('submit', payload)
}
</script>

<style scoped>
.vol-register-form {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 20px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.span-full  { grid-column: 1 / -1; }

.form-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #374151;
}
.required { color: #e11d48; }

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  color: #1f2937;
  background: #fafafa;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-input:focus,
.form-textarea:focus {
  border-color: #276749;
  box-shadow: 0 0 0 3px rgba(39,103,73,0.08);
  background: #fff;
}
.form-textarea { resize: vertical; min-height: 100px; }

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}
.form-hint a { color: #276749; text-decoration: underline; }

/* Actions */
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 4px;
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #276749, #48bb78);
  color: #fff;
  border: none;
  padding: 11px 28px;
  border-radius: 10px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.btn-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  background: #f9fafb;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  padding: 11px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #f3f4f6; }

.spin-icon { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
  color: #e11d48;
  font-weight: 600;
  margin-bottom: 16px;
}

.slide-enter-active, .slide-leave-active { transition: all 0.25s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>

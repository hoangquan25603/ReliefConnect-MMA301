<template>
  <div class="verify-wrapper">
    <!-- Logo Header -->
    <router-link to="/" class="header-logo">
      <h2 class="brand-name">
        <span class="text-navy">Relief</span><span class="text-orange">Connect</span>
      </h2>
      <p class="slogan">Kết nối trái tim - Vẹn tròn cứu trợ</p>
    </router-link>

    <!-- Verify Code Card -->
    <div class="verify-card">
      <!-- Warning: no pending reset flow (direct nav / storage cleared) -->
      <div v-if="!email" class="error-banner">
        {{ $t('auth.no_pending_reset') }}
      </div>

      <div v-else>
        <h2 class="form-title">{{ $t('auth.verify_code_title') }}</h2>
        <p class="form-subtitle">{{ $t('auth.verify_code_subtitle', { email: maskedEmail }) }}</p>

        <!-- Thông báo lỗi -->
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="code" class="form-label">{{ $t('auth.verify_code_label') }}</label>
            <input
              id="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              v-model="code"
              @input="onCodeInput"
              :placeholder="$t('auth.verify_code_placeholder')"
              required
              class="code-input"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span>{{ isLoading ? $t('auth.verifying_code') : $t('auth.btn_verify_code') }}</span>
          </button>
        </form>

        <div class="resend-section">
          <span v-if="countdown > 0" class="countdown-text">
            {{ $t('auth.resend_code_countdown', { seconds: countdown }) }}
          </span>
          <button v-else type="button" class="resend-btn" @click="handleResend" :disabled="isResending">
            <span v-if="isResending" class="loading-spinner loading-spinner-dark"></span>
            <span>{{ $t('auth.resend_code') }}</span>
          </button>
        </div>
      </div>

      <div class="divider-row">
        <router-link to="/forgot-password" class="back-to-login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          {{ $t('auth.back_to_forgot_password') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { forgotPassword, verifyResetCode } from '@/features/auth/auth.api'
import { resetFlowStorage } from '@/features/auth/reset-flow.storage'

const router = useRouter()
const { t } = useI18n()

// email đọc 1 lần lúc mở trang — ForgotPasswordView đã ghi vào sessionStorage
// trước khi điều hướng sang đây. Không có email nghĩa là user vào thẳng URL
// này mà chưa qua bước quên mật khẩu — chặn lại, không hiện form nhập mã.
const email = ref(resetFlowStorage.getEmail() || '')

const maskedEmail = computed(() => {
  const value = email.value
  const atIndex = value.indexOf('@')
  if (atIndex <= 0) return value
  const local = value.slice(0, atIndex)
  const domain = value.slice(atIndex)
  const visiblePrefix = local.slice(0, 1)
  return `${visiblePrefix}${'*'.repeat(Math.max(local.length - 1, 3))}${domain}`
})

const code = ref('')
const isLoading = ref(false)
const isResending = ref(false)
const errorMessage = ref('')
const countdown = ref(60)
let timer: ReturnType<typeof setInterval> | null = null

const startCountdown = () => {
  countdown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else if (timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

startCountdown()

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const onCodeInput = () => {
  code.value = code.value.replace(/\D/g, '').slice(0, 6)
}

const handleSubmit = async () => {
  if (code.value.length !== 6) {
    errorMessage.value = t('auth.code_required_error')
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await verifyResetCode(email.value, code.value)
    resetFlowStorage.setResetSessionId(result.resetSessionId)
    router.push({ name: 'reset-password' })
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Xác minh mã thất bại. Vui lòng thử lại.'
    console.error('Lỗi xác minh mã đặt lại mật khẩu:', error)
  } finally {
    isLoading.value = false
  }
}

const handleResend = async () => {
  errorMessage.value = ''
  isResending.value = true

  try {
    await forgotPassword(email.value)
    code.value = ''
    startCountdown()
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Không thể gửi lại mã. Vui lòng thử lại sau.'
    console.error('Lỗi gửi lại mã:', error)
  } finally {
    isResending.value = false
  }
}
</script>

<style scoped>
/* ===== Wrapper ===== */
.verify-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(rgba(15, 37, 64, 0.65), rgba(15, 37, 64, 0.8)), url('/BG.jpg') center/cover no-repeat fixed;
  padding: 40px 20px;
}

/* ===== Logo / Header ===== */
.header-logo {
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
}

.brand-name {
  font-size: 36px;
  margin: 0 0 6px 0;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
}

.text-navy {
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.text-orange {
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.slogan {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* ===== Card ===== */
.verify-card {
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  width: 100%;
  max-width: 460px;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  padding: 36px 40px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* ===== Title & Subtitle ===== */
.form-title {
  text-align: center;
  font-size: 20px;
  color: #1a3b5c;
  margin: 0 0 12px 0;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.form-subtitle {
  text-align: center;
  font-size: 14px;
  color: #4a5568;
  margin: 0 0 28px 0;
  line-height: 1.5;
}

/* ===== Error Banner ===== */
.error-banner {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
}

/* ===== Form Groups ===== */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.code-input {
  width: 100%;
  padding: 14px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 10px;
  text-align: center;
  background-color: #fafafa;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  color: #2d3748;
}

.code-input::placeholder {
  color: #a0aec0;
  letter-spacing: normal;
  font-size: 14px;
  font-weight: 400;
}

.code-input:focus {
  border-color: #1a4f8d;
  box-shadow: 0 0 0 3px rgba(26, 79, 141, 0.1);
  background-color: #fff;
}

/* ===== Submit Button ===== */
.submit-btn {
  width: 100%;
  padding: 13px;
  background-color: #1a4f8d;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s, transform 0.1s;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #123766;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.submit-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

/* ===== Loading Spinner ===== */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.loading-spinner-dark {
  border: 2px solid rgba(26, 79, 141, 0.2);
  border-top-color: #1a4f8d;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== Resend Section ===== */
.resend-section {
  margin-top: 20px;
  text-align: center;
}

.countdown-text {
  font-size: 13px;
  color: #718096;
}

.resend-btn {
  background: none;
  border: none;
  color: #1a4f8d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.resend-btn:hover {
  color: #e27d24;
}

.resend-btn:disabled {
  color: #a0aec0;
  cursor: not-allowed;
  text-decoration: none;
}

/* ===== Divider / Return Links ===== */
.divider-row {
  border-top: 1px solid #e2e8f0;
  margin-top: 24px;
  padding-top: 20px;
  text-align: center;
}

.back-to-login {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1a4f8d;
  text-decoration: none;
  transition: color 0.2s;
}

.back-to-login:hover {
  color: #e27d24;
}

.back-to-login svg {
  transition: transform 0.2s;
}

.back-to-login:hover svg {
  transform: translateX(-3px);
}
</style>

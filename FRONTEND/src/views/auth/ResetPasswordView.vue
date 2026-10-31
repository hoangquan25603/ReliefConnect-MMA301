<template>
  <div class="reset-wrapper">
    <!-- Logo Header -->
    <router-link to="/" class="header-logo">
      <h2 class="brand-name">
        <span class="text-navy">Relief</span><span class="text-orange">Connect</span>
      </h2>
      <p class="slogan">Kết nối trái tim - Vẹn tròn cứu trợ</p>
    </router-link>

    <!-- Reset Password Card -->
    <div class="reset-card">
      <!-- State 1: Reset Form -->
      <div v-if="!isSuccess">
        <h2 class="form-title">ĐẶT LẠI MẬT KHẨU</h2>
        <p class="form-subtitle">Tạo mật khẩu mới cho tài khoản của bạn.</p>

        <!-- Warning missing reset session -->
        <div v-if="!resetSessionId" class="error-banner">
          Phiên đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng thử lại quy trình quên mật khẩu.
        </div>

        <!-- Thông báo lỗi -->
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form v-if="resetSessionId" @submit.prevent="handleSubmit">
          <div class="form-group" v-if="email">
            <label class="form-label">Email tài khoản</label>
            <input type="text" :value="email" disabled class="email-input disabled-input" />
          </div>

          <div class="form-group">
            <label for="newPassword" class="form-label">Mật khẩu mới</label>
            <div class="input-with-icon">
              <input
                id="newPassword"
                type="password"
                v-model="newPassword"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                required
                class="email-input"
              />
              <span class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Xác nhận mật khẩu mới</label>
            <div class="input-with-icon">
              <input
                id="confirmPassword"
                type="password"
                v-model="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                required
                class="email-input"
              />
              <span class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                </svg>
              </span>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            <span>{{ isLoading ? 'Đang đặt lại mật khẩu...' : 'Cập nhật mật khẩu' }}</span>
          </button>
        </form>
      </div>

      <!-- State 2: Success State -->
      <div v-else class="success-state">
        <div class="success-icon-wrapper">
          <svg class="success-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="success-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        <h2 class="form-title">ĐẶT LẠI MẬT KHẨU THÀNH CÔNG!</h2>
        <p class="success-text">
          Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ bằng mật khẩu mới.
        </p>

        <router-link to="/login" class="submit-btn text-center-btn">
          Đăng nhập ngay
        </router-link>
      </div>

      <div class="divider-row">
        <router-link to="/login" class="back-to-login">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Quay lại Đăng nhập
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { resetPassword } from '@/features/auth/auth.api'
import { resetFlowStorage } from '@/features/auth/reset-flow.storage'

// resetSessionId/email đọc 1 lần từ sessionStorage lúc mở trang — do
// VerifyResetCodeView ghi vào sau khi xác minh mã đúng. KHÔNG còn đọc
// token từ query string URL (luồng cũ dựa vào link email đã bỏ).
const resetSessionId = ref(resetFlowStorage.getResetSessionId() || '')
const email = ref(resetFlowStorage.getEmail() || '')

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  if (!resetSessionId.value) {
    errorMessage.value = 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
    return
  }

  if (!newPassword.value) {
    errorMessage.value = 'Mật khẩu là bắt buộc điền.'
    return
  }

  if (/\s/.test(newPassword.value)) {
    errorMessage.value = 'Mật khẩu không được chứa khoảng trắng.'
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(newPassword.value)) {
    errorMessage.value = 'Mật khẩu không được chứa ký tự đặc biệt (chỉ được gồm chữ cái và số).'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Mật khẩu mới phải có tối thiểu 6 ký tự.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không trùng khớp.'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    await resetPassword({
      resetSessionId: resetSessionId.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    })
    isSuccess.value = true
    resetFlowStorage.clear()
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Đặt lại mật khẩu thất bại. Phiên đặt lại mật khẩu có thể đã hết hạn.'
    console.error('Lỗi đặt lại mật khẩu:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ===== Wrapper ===== */
.reset-wrapper {
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
.reset-card {
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

.input-with-icon {
  position: relative;
}

.email-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 14px;
  background-color: #fafafa;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  color: #2d3748;
}

.disabled-input {
  background-color: #edf2f7;
  color: #718096;
  cursor: not-allowed;
  padding-left: 14px;
}

.email-input::placeholder {
  color: #a0aec0;
}

.email-input:focus:not(.disabled-input) {
  border-color: #1a4f8d;
  box-shadow: 0 0 0 3px rgba(26, 79, 141, 0.1);
  background-color: #fff;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  display: flex;
  align-items: center;
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
  text-decoration: none;
  box-sizing: border-box;
}

.text-center-btn {
  text-align: center;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== Success State ===== */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 0;
}

.success-text {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

/* ===== Animated Success Checkmark SVG ===== */
.success-icon-wrapper {
  width: 70px;
  height: 70px;
  margin-bottom: 20px;
}

.success-svg {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #4caf50;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #4caf50;
  animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
}

.success-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #4caf50;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.success-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 4px #4caf50;
  }
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

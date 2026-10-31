<template>
  <div class="register-wrapper">
    <router-link to="/" class="header-logo">
      <h2 class="brand-name">
        <span class="text-navy">Relief</span><span class="text-orange">Connect</span>
      </h2>
      <p class="slogan">Kết nối trái tim - Vẹn tròn cứu trợ</p>
    </router-link>

    <div class="register-card">
      <h2 class="form-title">ĐĂNG KÝ NGƯỜI DÙNG</h2>

      <!-- Thông báo lỗi -->
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="step-section">
          <div class="form-group">
            <label>Họ và tên <span class="required">*</span></label>
            <input type="text" v-model="formData.fullName" placeholder="Nguyễn Văn A" required />
          </div>

          <div class="form-group">
            <label>Email <span class="required">*</span></label>
            <input type="email" v-model="formData.email" placeholder="example@email.com" required />
          </div>

          <div class="form-group">
            <label>Số điện thoại <span class="required">*</span></label>
            <input type="tel" v-model="formData.phoneNumber" placeholder="0912245678" required />
          </div>

          <div class="form-group">
            <label>Mật khẩu <span class="required">*</span></label>
            <div class="input-with-icon">
              <input :type="showPassword ? 'text' : 'password'" v-model="formData.password" placeholder="••••••••••" required />
              <button type="button" class="icon-btn" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-3.22 4.53M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Xác nhận mật khẩu <span class="required">*</span></label>
            <input type="password" v-model="formData.confirmPassword" placeholder="••••••••••" required />
            <span v-if="passwordMismatch" class="error-text">Mật khẩu xác nhận không khớp!</span>
          </div>

          <div class="form-group checkbox-group">
            <input type="checkbox" id="commitment" v-model="formData.isCommitted" required />
            <label for="commitment">
              Tôi đồng ý tạo tài khoản và có thể hoàn thiện hồ sơ sau khi đăng nhập. <span class="required">*</span>
            </label>
          </div>
        </div>

        <button type="submit" class="submit-btn" :disabled="isLoading">
          <span v-if="isLoading">Đang xử lý...</span>
          <span v-else>Đăng ký</span>
        </button>


        <div class="login-redirect">
          Đã có tài khoản?
          <router-link to="/login" class="login-link">Đăng nhập</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser, toAuthUser } from '@/features/auth/auth.api'
import { tokenStorage } from '@/lib/api/token-storage'
import { useAuthStore } from '@/stores/auth'
import type { RegisterPayload } from '@/features/auth/auth.types'
import { isValidName } from '@/utils/validation'

const router    = useRouter()
const authStore = useAuthStore()

const showPassword = ref(false)
const isLoading    = ref(false)
const errorMessage = ref('')

// Field BE register nhận: email, password, confirmPassword, fullName, phoneNumber
// (BE thật validate "The PhoneNumber field is required" — kiểm chứng 2026-07-13)
const formData = reactive({
  fullName:        '',
  email:           '',
  phoneNumber:     '',
  password:        '',
  confirmPassword: '',
  isCommitted:     false,
})

const passwordMismatch = computed(() => {
  return formData.confirmPassword !== '' && formData.password !== formData.confirmPassword
})

const handleRegister = async () => {
  if (!formData.fullName.trim()) {
    errorMessage.value = 'Họ và tên là bắt buộc điền!'
    return
  }
  if (!isValidName(formData.fullName)) {
    errorMessage.value = 'Họ và tên không được chứa số hoặc ký tự đặc biệt!'
    return
  }
  if (!formData.email.trim()) {
    errorMessage.value = 'Email là bắt buộc điền!'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email.trim())) {
    errorMessage.value = 'Địa chỉ email không hợp lệ! (Ví dụ: example@gmail.com)'
    return
  }
  if (!formData.phoneNumber.trim()) {
    errorMessage.value = 'Số điện thoại là bắt buộc điền!'
    return
  }

  const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/
  if (!phoneRegex.test(formData.phoneNumber.trim())) {
    errorMessage.value = 'Số điện thoại không hợp lệ! (Ví dụ: 0912345678)'
    return
  }

  if (!formData.password) {
    errorMessage.value = 'Mật khẩu là bắt buộc điền!'
    return
  }

  if (/\s/.test(formData.password)) {
    errorMessage.value = 'Mật khẩu không được chứa khoảng trắng!'
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(formData.password)) {
    errorMessage.value = 'Mật khẩu không được chứa ký tự đặc biệt (chỉ được gồm chữ cái và số)!'
    return
  }

  if (formData.password.length < 6) {
    errorMessage.value = 'Mật khẩu phải có tối thiểu 6 ký tự!'
    return
  }

  if (!formData.confirmPassword) {
    errorMessage.value = 'Xác nhận mật khẩu là bắt buộc điền!'
    return
  }

  if (passwordMismatch.value) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp!'
    return
  }

  if (!formData.isCommitted) {
    errorMessage.value = 'Vui lòng xác nhận đồng ý điều khoản trước khi đăng ký!'
    return
  }

  errorMessage.value = ''
  isLoading.value    = true

  // Gửi đủ field BE yêu cầu (kèm phoneNumber — bắt buộc)
  // Dùng intersection type để không phải sửa auth.types.ts;
  // khi nào owner phần auth thêm phoneNumber vào RegisterPayload thì bỏ phần `& {...}` đi.
  const payload: RegisterPayload & { phoneNumber: string } = {
    fullName:        formData.fullName,
    email:           formData.email,
    phoneNumber:     formData.phoneNumber,
    password:        formData.password,
    confirmPassword: formData.confirmPassword,
  }

  try {
    const result = await registerUser(payload)
    // BE trả LoginResult sau register → auto-login luôn
    tokenStorage.set(result.accessToken)
    tokenStorage.setRefresh(result.refreshToken)
    authStore.accessToken = result.accessToken
    authStore.user        = toAuthUser(result)
    authStore.user.phoneNumber = formData.phoneNumber
    localStorage.setItem('auth_user', JSON.stringify(authStore.user))
    // Mặc định Requester → redirect về /requester
    await router.push('/requester')
  } catch (error) {
    errorMessage.value = (error as Error).message || 'Đăng ký thất bại. Vui lòng thử lại!'
    console.error('Lỗi đăng ký:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>

.register-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(rgba(15, 37, 64, 0.65), rgba(15, 37, 64, 0.8)), url('/BG.jpg') center/cover no-repeat fixed;
  padding: 40px 20px;
}

.header-logo {
  text-align: center;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
}


.logo-img {
  height: 50px;
  margin-bottom: 5px;
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

.register-card {
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  padding: 36px 40px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.form-title {
  text-align: center;
  font-size: 20px;
  color: #1a3b5c;
  margin-bottom: 25px;
  font-weight: 700;
}

/* ===== Error Banner ===== */
.error-banner {
  background-color: #fff5f5;
  color: #c53030;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}


.step-section {
  margin-bottom: 25px;
}
.step-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #2d3748;
}


.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}
.form-group label {
  font-size: 14px;
  margin-bottom: 5px;
  color: #4a5568;
}
.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="tel"],
.form-group input[type="password"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fcfcfc;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #3182ce;
}


.input-with-icon {
  position: relative;
}
.input-with-icon input {
  padding-right: 40px;
}
.icon-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  line-height: 0;
}
.icon-btn:hover {
  color: #4a5568;
}


.checkbox-group {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
}
.checkbox-group input[type="checkbox"] {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.checkbox-group label {
  font-size: 13px;
  line-height: 1.5;
  color: #4a5568;
  cursor: pointer;
}


.submit-btn {
  width: 100%;
  padding: 12px;
  background-color: #1a4f8d;
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}
.submit-btn:hover {
  background-color: #123766;
}


.required {
  color: #dc2626;
  font-weight: bold;
  margin-left: 2px;
}

.error-text {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 5px;
}

.login-redirect {
  text-align: center;
  margin-top: 15px;
  font-size: 13px;
  color: #4a5568;
}
.login-link {
  color: #1a4f8d;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}
.login-link:hover {
  text-decoration: underline;
}
</style>
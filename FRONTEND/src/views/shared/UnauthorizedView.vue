<template>
  <div class="unauthorized">
    <div class="unauthorized__content">
      <div class="unauthorized__icon">🔒</div>
      <p class="unauthorized__code">403</p>
      <h1 class="unauthorized__title">Không có quyền truy cập</h1>
      <p class="unauthorized__desc">
        Tài khoản của bạn (<strong>{{ roleLabel }}</strong>) không có quyền vào trang này.
      </p>

      <div class="unauthorized__actions">
        <button class="btn-back" @click="router.back()">← Quay lại</button>
        <router-link to="/home" class="btn-home">Về trang chủ</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABELS } from '@/features/auth/auth.types'

const router = useRouter()
const auth = useAuthStore()

const roleLabel = computed(() =>
  auth.role ? ROLE_LABELS[auth.role] : 'Khách',
)
</script>

<style scoped>
.unauthorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
  font-family: var(--font-family, 'Inter', sans-serif);
}
.unauthorized__content { text-align: center; padding: 0 20px; }

.unauthorized__icon { font-size: 64px; line-height: 1; margin-bottom: 8px; }

.unauthorized__code {
  font-size: 96px;
  font-weight: 900;
  color: #c53030;
  line-height: 1;
  margin: 0;
}
.unauthorized__title {
  font-size: 26px;
  font-weight: 700;
  color: #1a3b5c;
  margin: 12px 0 10px;
}
.unauthorized__desc {
  font-size: 15px;
  color: #4a5568;
  margin: 0 0 32px;
  line-height: 1.6;
}
.unauthorized__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-back,
.btn-home {
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-back {
  background: #f0f2f5;
  color: #1a3b5c;
  border: 1.5px solid #d0d5dd;
}
.btn-back:hover { background: #e2e8f0; }
.btn-home {
  background: #1a4f8d;
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
}
.btn-home:hover { background: #123766; }
</style>

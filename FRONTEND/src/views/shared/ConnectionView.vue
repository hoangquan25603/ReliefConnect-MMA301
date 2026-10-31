<template>
  <AppLayout>
    <main class="connection-page">
      <section class="connection-card">
        <h1>Kết nối máy chủ</h1>
        <p>Chọn máy chủ ReliefConnect để đăng nhập và đồng bộ dữ liệu.</p>
        <form @submit.prevent="save">
          <label for="server-url">Địa chỉ máy chủ</label>
          <input id="server-url" v-model.trim="serverUrl" type="url" required placeholder="http://192.168.1.5:5092" :disabled="busy" />
          <p class="hint">Ví dụ: http://localhost:5092 khi chạy trên máy tính, hoặc http://IP-máy-chủ:5092 khi cùng mạng Wi-Fi. Có thể nhập kèm /api.</p>
          <p class="current">Đang dùng: <strong>{{ API_BASE_URL }}</strong></p>
          <p v-if="auth.isLoggedIn" class="hint">Đổi sang máy chủ khác sẽ đăng xuất phiên hiện tại.</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <p v-if="message" class="success" role="status">{{ message }}</p>
          <div class="actions">
            <button type="button" class="secondary" :disabled="busy" @click="check">{{ busy ? 'Đang kiểm tra…' : 'Kiểm tra kết nối' }}</button>
            <button type="submit" :disabled="busy">Lưu máy chủ</button>
          </div>
        </form>
        <router-link to="/login">Đến trang đăng nhập →</router-link>
      </section>
    </main>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { API_BASE_URL, normalizeApiUrl, SERVER_STORAGE_KEY } from '@/config/env'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const serverUrl = ref(API_BASE_URL)
const error = ref('')
const message = ref('')
const busy = ref(false)

async function verify(): Promise<string> {
  let normalized: string
  try { normalized = normalizeApiUrl(serverUrl.value) } catch { throw new Error('Nhập URL hợp lệ, ví dụ http://192.168.1.5:5092 hoặc https://ten-mien.vn/api.') }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`${normalized}/health`, { signal: controller.signal })
    if (!response.ok) throw new Error('Máy chủ chưa sẵn sàng.')
    const raw = await response.json()
    const data = raw && 'result' in raw ? raw.result : raw
    if (data?.application !== 'ReliefConnect' || data?.status !== 'ok') throw new Error('Địa chỉ này không trả về trạng thái ReliefConnect.')
    return normalized
  } catch (err) {
    if ((err as Error).name === 'AbortError' || err instanceof TypeError) throw new Error('Không kết nối được. Kiểm tra địa chỉ, Wi-Fi, máy chủ đang chạy và cấu hình CORS.')
    throw err
  } finally { clearTimeout(timer) }
}
async function check() {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try { await verify(); message.value = 'Kết nối thành công. Máy chủ ReliefConnect đang hoạt động.' }
  catch (err) { error.value = (err as Error).message }
  finally { busy.value = false }
}
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''; message.value = ''
  try {
    const normalized = await verify()
    if (normalized !== API_BASE_URL) {
      await auth.logout()
      localStorage.setItem(SERVER_STORAGE_KEY, normalized)
      window.location.assign('/login')
    } else { localStorage.setItem(SERVER_STORAGE_KEY, normalized); message.value = 'Đã lưu máy chủ. Kết nối thành công.' }
  } catch (err) { error.value = (err as Error).message }
  finally { busy.value = false }
}
</script>

<style scoped>
.connection-page { padding: 40px 20px; background: #f3f6f9; min-height: 65vh; }
.connection-card { max-width: 600px; margin: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; color: #334155; }
h1 { font-size: 26px; color: #1a3b5c; margin: 0 0 12px; }
p { line-height: 1.7; font-size: 14px; }
label { font-weight: 700; display: block; font-size: 13px; margin: 24px 0 8px; }
input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; }
.hint { color: #64748b; font-size: 12px; }.current { overflow-wrap: anywhere; }.error { color: #b91c1c; background: #fef2f2; padding: 10px; border-radius: 8px; }.success { color: #166534; background: #f0fdf4; padding: 10px; border-radius: 8px; }.actions { display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }button { border: 0; padding: 12px 16px; border-radius: 8px; background: #1a4f8d; color: white; cursor: pointer; font-weight: 700; }.secondary { background: #eaf0f8; color: #1a4f8d; }button:disabled { opacity: .5; cursor: not-allowed; }a { color: #1a4f8d; font-size: 14px; font-weight: 600; }
@media (max-width: 600px) { .connection-page { padding: 20px 12px; }.connection-card { padding: 20px; } }
</style>

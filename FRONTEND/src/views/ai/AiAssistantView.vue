<template>
  <component :is="layout">
    <div class="ai-page">
      <header class="ai-heading">
        <div class="ai-symbol" aria-hidden="true">✦</div>
        <div><h1>Trợ lý AI cứu trợ</h1><p>Phân loại nhu cầu từ mô tả và đối chiếu với vật tư đang có trong kho.</p></div>
      </header>

      <div class="ai-grid">
        <section class="panel input-panel" aria-labelledby="input-title">
          <div class="panel-title"><span class="step">01</span><h2 id="input-title">Mô tả nhu cầu</h2></div>
          <p>Nhập tình hình thực tế để AI gợi ý nhóm nhu cầu chính.</p>
          <form @submit.prevent="analyze">
            <label for="relief-description">Nội dung cần phân tích</label>
            <textarea id="relief-description" v-model="description" rows="7" minlength="10" maxlength="4000" required placeholder="Ví dụ: Khu dân cư bị ngập, 50 hộ thiếu nước uống sạch và nước sinh hoạt…" :disabled="analyzing" />
            <div class="input-meta"><span>10–4.000 ký tự</span><span>{{ description.length }}/4.000</span></div>
            <div class="examples" aria-label="Ví dụ mô tả">
              <button v-for="example in examples" :key="example.label" type="button" :disabled="analyzing" @click="selectExample(example.text)">{{ example.label }}</button>
            </div>
            <button type="submit" class="analyze-button" :disabled="analyzing || description.trim().length < 10 || status?.available === false">
              {{ analyzing ? 'Đang phân tích…' : '✦ Phân tích bằng AI' }}
            </button>
          </form>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <div class="model-info">
            <span class="status-dot" :class="{ online: status?.available }" />
            <div v-if="status"><strong>{{ status.available ? 'Mô hình sẵn sàng' : 'Mô hình chưa sẵn sàng' }}</strong><p>{{ status.provider }} · {{ status.trainingExamples }} mẫu huấn luyện</p></div>
            <div v-else><strong>{{ statusLoading ? 'Đang kiểm tra mô hình…' : 'Chưa lấy được trạng thái mô hình' }}</strong><button v-if="!statusLoading" class="text-button" @click="loadStatus">Kiểm tra lại</button></div>
          </div>
        </section>

        <section class="panel result-panel" aria-labelledby="result-title" aria-live="polite" :aria-busy="analyzing">
          <div class="panel-title"><span class="step">02</span><h2 id="result-title">Kết quả phân tích</h2></div>
          <div v-if="analyzing" class="empty-result"><span class="ai-loading" />Đang phân loại nhu cầu và kiểm tra tồn kho…</div>
          <div v-else-if="!result" class="empty-result"><span class="empty-symbol">✦</span><h3>Sẵn sàng hỗ trợ bạn</h3><p>Kết quả sẽ hiện tại đây sau khi phân tích. Bạn có thể thử một ví dụ bên cạnh.</p></div>
          <template v-else>
            <div v-if="description.trim() !== analyzedText" class="notice">Mô tả đã thay đổi. Phân tích lại để cập nhật kết quả.</div>
            <div class="prediction"><div><span>Nhóm nhu cầu chính</span><h3>{{ result.categoryLabel }}</h3></div><div class="confidence"><strong>{{ percent(result.confidence) }}</strong><span>Điểm mô hình</span></div></div>
            <p class="explanation">{{ result.explanation }}</p>
            <div class="probabilities" aria-label="Điểm phân loại các nhóm">
              <div v-for="item in rankedProbabilities" :key="item.category" class="probability-row">
                <div><span>{{ item.label }}</span><strong>{{ percent(item.probability) }}</strong></div>
                <progress :value="item.probability" max="1" :aria-label="item.label" />
              </div>
            </div>
            <div class="notice"><strong>Cần người phụ trách xác nhận.</strong> Điểm mô hình không phải tỷ lệ chính xác đã kiểm định. Nội dung có nhiều nhu cầu có thể chỉ được gợi ý một nhóm chính; hãy kiểm tra lại trước khi điều phối.</div>
            <h3 class="stock-title">Vật tư phù hợp đang có</h3>
            <p class="stock-note">Số liệu tại thời điểm phân tích; các kho có thể tiếp tục phát sinh giao dịch.</p>
            <div v-if="result.suggestedItems.length" class="stock-list">
              <article v-for="(item, index) in result.suggestedItems" :key="`${item.warehouseName}-${item.itemName}-${index}`" class="stock-item"><div><strong>{{ item.itemName }}</strong><span>{{ item.warehouseName }}</span></div><span class="stock-quantity">{{ item.availableQuantity.toLocaleString('vi-VN') }} {{ item.unit }}</span></article>
            </div>
            <p v-else class="no-stock">Chưa tìm thấy vật tư sẵn có thuộc nhóm này. Kiểm tra kho và nhu cầu bổ sung trước khi phân công.</p>
            <router-link to="/inventory" class="inventory-link">Xem vật tư & tồn kho →</router-link>
          </template>
        </section>
      </div>
      <details class="about-model"><summary>AI này hoạt động như thế nào?</summary><p>{{ status?.description || 'Mô hình học máy Naive Bayes được huấn luyện từ các mô tả cứu trợ tiếng Việt có gán nhãn để phân loại nhu cầu.' }} Phân tích chạy trên máy chủ của dự án, không cần gửi nội dung đến dịch vụ AI bên ngoài. Mô hình không tự tạo yêu cầu, xuất kho hay quyết định mức độ khẩn cấp.</p><p v-if="status">Phiên bản: {{ status.modelVersion }}. Đây là mô hình phục vụ dự án học tập; cần mở rộng dữ liệu và đánh giá trên tập thực tế trước khi dùng cho vận hành cứu trợ.</p></details>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import WarehouseLayout from '@/components/layout/WarehouseLayout.vue'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
import { analyzeReliefText, getAiStatus, type AiAnalysis, type AiStatus } from '@/features/ai/ai.api'

const auth = useAuthStore()
const layout = computed(() => auth.isAdmin ? AdminLayout : auth.isCoordinator ? WarehouseLayout : auth.isVolunteer ? VolunteerLayout : RequesterLayout)
const description = ref('')
const analyzedText = ref('')
const result = ref<AiAnalysis | null>(null)
const status = ref<AiStatus | null>(null)
const statusLoading = ref(false)
const analyzing = ref(false)
const error = ref('')
const examples = [
  { label: 'Thiếu nước sạch', text: 'Khu dân cư bị ngập lụt, nguồn nước bị ô nhiễm. Người dân cần nước uống sạch và nước sinh hoạt.' },
  { label: 'Thiếu lương thực', text: 'Các hộ dân bị cô lập do mưa lũ, không còn gạo và thực phẩm. Cần mì ăn liền và lương thực cho 50 hộ.' },
  { label: 'Mất chỗ ở', text: 'Nhà cửa bị sập sau bão, nhiều gia đình không có nơi ở. Cần lều và chỗ trú tạm để tránh mưa.' },
]
const rankedProbabilities = computed(() => [...(result.value?.probabilities ?? [])].sort((a, b) => b.probability - a.probability))
const percent = (value: number) => `${(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%`
const selectExample = (text: string) => { description.value = text }

async function loadStatus() {
  statusLoading.value = true
  try { status.value = await getAiStatus() } catch { status.value = null } finally { statusLoading.value = false }
}
async function analyze() {
  if (analyzing.value) return
  const text = description.value.trim()
  if (text.length < 10 || text.length > 4000) { error.value = 'Nhập mô tả từ 10 đến 4.000 ký tự.'; return }
  analyzing.value = true
  error.value = ''
  result.value = null
  try { result.value = await analyzeReliefText(text); analyzedText.value = text } catch (err) { error.value = (err as Error).message || 'Không thể phân tích. Vui lòng thử lại.' } finally { analyzing.value = false }
}
onMounted(loadStatus)
</script>

<style scoped>
.ai-page { max-width: 1200px; margin: 0 auto; color: #1e293b; }
.ai-heading { display: flex; gap: 16px; align-items: center; margin-bottom: 28px; }
.ai-symbol { background: #e6edf8; color: #1a4f8d; font-size: 32px; border-radius: 16px; width: 60px; height: 60px; display: grid; place-items: center; flex-shrink: 0; }
h1 { margin: 0 0 6px; font-size: 26px; color: #163b68; }
.ai-heading p, .input-panel > p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; }
.ai-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 22px; align-items: start; }
.panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 3px 15px #1a4f8d05; }
.panel-title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.step { color: #1a4f8d; font-size: 12px; font-weight: 800; background: #eff6ff; padding: 6px 8px; border-radius: 6px; }
h2 { margin: 0; font-size: 17px; }
form { margin-top: 20px; }
label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 8px; }
textarea { width: 100%; box-sizing: border-box; resize: vertical; min-height: 160px; padding: 14px; font: inherit; line-height: 1.6; color: #334155; border: 1px solid #cbd5e1; border-radius: 10px; }
textarea:focus { outline: 3px solid #dbeafe; border-color: #3b82f6; }
.input-meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin: 6px 0 16px; }
.examples { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
.examples button { border-radius: 18px; border: 1px solid #dbe5ef; background: #f8fafc; color: #475569; padding: 7px 11px; font-size: 12px; cursor: pointer; }
.analyze-button { width: 100%; border: none; border-radius: 9px; padding: 13px; color: #fff; background: #1a4f8d; font-weight: 700; font-size: 14px; cursor: pointer; }
button:disabled { opacity: .5; cursor: not-allowed; }
.model-info { margin-top: 22px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; align-items: flex-start; font-size: 12px; }
.model-info p { font-size: 11px; color: #64748b; margin: 4px 0 0; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; margin-top: 5px; flex-shrink: 0; }.status-dot.online { background: #16a34a; }
.text-button { border: none; background: transparent; display: block; color: #1a4f8d; padding: 4px 0; cursor: pointer; }
.result-panel { min-height: 400px; }
.empty-result { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; text-align: center; color: #64748b; font-size: 14px; }
.empty-result h3 { color: #334155; margin-bottom: 0; }.empty-result p { line-height: 1.7; }.empty-symbol { font-size: 44px; color: #9bb6d5; }
.prediction { display: flex; justify-content: space-between; gap: 16px; background: #eff6ff; border-radius: 10px; padding: 18px; }
.prediction span { color: #64748b; font-size: 12px; }.prediction h3 { margin: 6px 0 0; font-size: 23px; color: #1a4f8d; }.confidence { text-align: right; display: flex; flex-direction: column; gap: 6px; }.confidence strong { color: #1a4f8d; font-size: 23px; }
.explanation { color: #475569; font-size: 13px; line-height: 1.7; }.probabilities { margin: 20px 0; display: grid; gap: 10px; }.probability-row > div { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }progress { width: 100%; height: 7px; border: 0; border-radius: 5px; overflow: hidden; }progress::-webkit-progress-bar { background: #edf2f7; }progress::-webkit-progress-value { background: #4382be; }
.notice { background: #fffbeb; color: #856015; border: 1px solid #f4e6b9; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.7; margin: 12px 0; }.stock-title { margin: 24px 0 4px; font-size: 16px; }.stock-note { color: #64748b; font-size: 11px; line-height: 1.6; margin: 0 0 12px; }.stock-list { display: grid; gap: 8px; }.stock-item { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; }.stock-item > div { display: flex; flex-direction: column; gap: 4px; }.stock-item > div > span { color: #64748b; font-size: 11px; }.stock-quantity { color: #166534; font-weight: 700; white-space: nowrap; }.no-stock { background: #f8fafc; padding: 14px; border-radius: 8px; color: #64748b; font-size: 13px; line-height: 1.7; }.inventory-link { display: inline-block; margin-top: 16px; color: #1a4f8d; font-weight: 700; font-size: 13px; text-decoration: none; }.about-model { margin-top: 22px; padding: 16px; border: 1px solid #dce5ef; border-radius: 10px; color: #64748b; font-size: 12px; line-height: 1.8; }.about-model summary { cursor: pointer; color: #334155; font-weight: 600; }.error { color: #b91c1c; background: #fef2f2; padding: 12px; border-radius: 8px; font-size: 13px; }.ai-loading { width: 28px; height: 28px; border: 3px solid #dbeafe; border-top-color: #1a4f8d; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .ai-grid { grid-template-columns: 1fr; }.ai-heading { align-items: flex-start; }h1 { font-size: 22px; }.panel { padding: 18px; }.ai-symbol { width: 44px; height: 44px; font-size: 25px; }.result-panel { min-height: 280px; } }
</style>

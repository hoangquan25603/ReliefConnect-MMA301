<template>
  <RequesterLayout>
    <div class="guide-page">
      <h2 class="page-title">{{ $t('requester.guide_title') }}</h2>

      <div class="card" id="create-guide">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div>
          <h3>{{ $t('requester.guide_create_title') }}</h3>
          <p>{{ $t('requester.guide_create_desc') }}</p>
        </div>
      </div>

      <div class="card" id="supply-types">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2h-3l-2-2H9L7 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"/><circle cx="17" cy="17" r="4"/></svg>
        </div>
        <div>
          <h3>{{ $t('requester.guide_supply_title') }}</h3>
          <p>{{ $t('requester.guide_supply_desc') }}</p>
        </div>
      </div>

      <div class="card" id="process">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div>
          <h3>{{ $t('requester.guide_process_title') }}</h3>
          <p>{{ $t('requester.guide_process_desc') }}</p>
        </div>
      </div>

      <div class="card" id="contact">
        <div class="card-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </div>
        <div>
          <h3>{{ $t('requester.guide_contact_title') }}</h3>
          <p>{{ $t('requester.guide_contact_desc', { email: 'hotro@reliefconnect.vn' }) }}</p>
        </div>
      </div>
    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
</script>

<style scoped>
.guide-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.5px;
  margin: 0 0 20px 0;
}

.card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fff1eb, #ffe4d5);
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card h3 {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px 0;
}

.card p {
  font-size: 13.5px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}
</style>
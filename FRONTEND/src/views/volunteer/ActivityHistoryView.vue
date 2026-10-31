<template>
  <VolunteerLayout>
    <div class="empty-page">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3182ce" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h1 class="empty-title">{{ $t('volunteer.history_title') }}</h1>
      <p class="empty-desc">{{ $t('volunteer.under_construction') }}</p>
      <router-link to="/volunteer" class="back-btn back-btn--blue">{{ $t('volunteer.back_to_dashboard') }}</router-link>
    </div>
  </VolunteerLayout>
</template>

<script setup lang="ts">
import VolunteerLayout from '@/components/layout/VolunteerLayout.vue'
</script>

<style scoped>
.empty-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  text-align: center;
}
.empty-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ebf8ff, #bee3f8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-title { font-size: 22px; font-weight: 800; color: #1a3b5c; }
.empty-desc  { font-size: 14px; color: #718096; max-width: 340px; line-height: 1.6; }
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: none;
  margin-top: 8px;
  transition: background 0.18s ease;
  background: #3182ce;
  color: #fff;
}
.back-btn:hover { background: #2563a8; color: #fff; }
</style>

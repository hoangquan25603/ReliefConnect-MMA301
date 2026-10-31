<template>
  <AppLayout>
    <div class="contact-page">
      <!-- ══════════ HERO ══════════ -->
      <section class="contact-hero">
        <div class="hero-container">
          <span class="hero-badge">{{ $t('contact.hero_badge') }}</span>
          <h1 class="hero-title">{{ $t('contact.hero_title') }}</h1>
          <p class="hero-subtitle">
            {{ $t('contact.hero_sub') }}
          </p>
        </div>
      </section>

      <div class="page-container">
        <div class="info-container">
          <div class="info-header">
            <h2 class="info-title">{{ $t('contact.emergency_title') }}</h2>
            <p class="info-desc">{{ $t('contact.emergency_desc') }}</p>
          </div>

          <div class="contact-cards-grid">
            <div class="contact-card bg-rose">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div class="card-info">
                <span class="info-label">{{ $t('contact.hotline_247') }}</span>
                <a href="tel:19001234" class="info-value text-rose">{{ $t('contact.free_call') }}</a>
              </div>
            </div>

            <div class="contact-card bg-blue">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div class="card-info">
                <span class="info-label">{{ $t('contact.email_support') }}</span>
                <a href="mailto:hotro@reliefconnect.vn" class="info-value text-blue">hotro@reliefconnect.vn</a>
              </div>
            </div>

            <div class="contact-card bg-orange">
              <div class="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="card-info">
                <span class="info-label">{{ $t('contact.office_address') }}</span>
                <span class="info-text">{{ $t('contact.office_location') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<style scoped>
.contact-hero {
  background: linear-gradient(135deg, #1a3b5c 0%, #1a4f8d 60%, #e27d24 100%);
  color: #fff;
  padding: 64px 20px;
  text-align: center;
}
.hero-container {
  max-width: 760px;
  margin: 0 auto;
}
.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  border-radius: 99px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}
.hero-title {
  font-size: 36px;
  font-weight: 900;
  margin-bottom: 16px;
}
.hero-subtitle {
  font-size: 15px;
  opacity: 0.9;
  line-height: 1.6;
}

/* Info Container */
.info-container {
  max-width: 860px;
  margin: 40px auto;
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-soft);
}
.info-header {
  text-align: center;
  margin-bottom: 32px;
}
.info-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a3b5c;
  margin-bottom: 8px;
}
.info-desc {
  font-size: 14.5px;
  color: #718096;
}

.contact-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.contact-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  align-items: flex-start;
}
.bg-rose { background: #ffe4e6; }
.bg-blue { background: #ebf8ff; }
.bg-orange { background: #fff7ed; }

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}
.bg-rose .card-icon { color: #e11d48; }
.bg-blue .card-icon { color: #1a4f8d; }
.bg-orange .card-icon { color: #e27d24; }

.card-info {
  display: flex;
  flex-direction: column;
}
.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  text-transform: uppercase;
}
.info-value {
  font-size: 16px;
  font-weight: 800;
  text-decoration: none;
  margin-top: 4px;
}
.text-rose { color: #e11d48; }
.text-blue { color: #1a4f8d; }
.info-text {
  font-size: 13.5px;
  font-weight: 600;
  color: #2d3748;
  line-height: 1.4;
  margin-top: 4px;
}

@media (max-width: 820px) {
  .contact-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <AppLayout>
    <div class="about-page">
      <!-- ══════════ HERO ══════════ -->
      <section class="about-hero">
        <div class="hero-container">
          <span class="hero-badge">{{ $t('about.hero_badge') }}</span>
          <h1 class="hero-title">{{ $t('about.hero_title') }}</h1>
          <p class="hero-subtitle">
            {{ $t('about.hero_sub') }}
          </p>
        </div>
      </section>

      <div class="page-container">
        <!-- ══════════ CON SỐ ẤN TƯỢNG ══════════ -->
        <section class="stats-section">
          <div class="stats-grid">
            <div class="stat-card" v-for="s in stats" :key="s.label">
              <div class="stat-number">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-desc">{{ s.desc }}</div>
            </div>
          </div>
        </section>

        <!-- ══════════ SỨ MỆNH & TẦM NHÌN ══════════ -->
        <section class="mission-section">
          <div class="grid-2">
            <div class="mission-card">
              <div class="card-icon bg-blue">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>{{ $t('about.mission_title') }}</h3>
              <p>
                {{ $t('about.mission_desc') }}
              </p>
            </div>

            <div class="mission-card">
              <div class="card-icon bg-orange">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h3>{{ $t('about.vision_title') }}</h3>
              <p>
                {{ $t('about.vision_desc') }}
              </p>
            </div>
          </div>
        </section>

        <!-- ══════════ GIÁ TRỊ CỐT LÕI ══════════ -->
        <section class="values-section">
          <h2 class="section-title text-center">{{ $t('about.values_title') }}</h2>
          <p class="section-sub text-center">{{ $t('about.values_sub') }}</p>

          <div class="values-grid">
            <div class="value-card" v-for="v in coreValues" :key="v.title">
              <div class="value-icon" v-html="v.icon" />
              <h4>{{ v.title }}</h4>
              <p>{{ v.desc }}</p>
            </div>
          </div>
        </section>

        <!-- ══════════ CÂU CHUYỆN SÁNG LẬP ══════════ -->
        <section class="story-section">
          <div class="story-content">
            <div class="story-text">
              <h2>{{ $t('about.story_title') }}</h2>
              <p>
                {{ $t('about.story_text_1') }}
              </p>
              <p>
                {{ $t('about.story_text_2') }}
              </p>
              <div class="story-cta">
                <router-link to="/register" class="btn-primary">{{ $t('about.join_us') }}</router-link>
                <router-link to="/contact" class="btn-outline">{{ $t('about.contact_partner') }}</router-link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import { getPublicHighlights, type PublicStats } from '@/features/public/public.api'

const { t } = useI18n()

const loadingStats = ref(true)
const realStats = ref<PublicStats | null>(null)

onMounted(async () => {
  try {
    const highlights = await getPublicHighlights()
    realStats.value = highlights.stats
  } catch (e) {
    console.error('Không thể tải dữ liệu thống kê:', e)
  } finally {
    loadingStats.value = false
  }
})

const stats = computed(() => {
  if (!realStats.value) {
    return [
      { value: '...', label: t('about.stat_requests'), desc: 'Yêu cầu hoàn thành' },
      { value: '...', label: t('about.stat_volunteers'), desc: 'Sẵn sàng ứng phó' },
      { value: '...', label: t('home.stat_provinces'), desc: 'Tỉnh/thành phủ sóng' },
      { value: '...', label: t('about.stat_success'), desc: 'Nhiệm vụ cứu trợ' },
    ]
  }

  return [
    {
      value: realStats.value.completedRequestCount.toLocaleString(),
      label: t('about.stat_requests'),
      desc: 'Yêu cầu cứu trợ đã hoàn thành',
    },
    {
      value: realStats.value.approvedVolunteerCount.toLocaleString(),
      label: t('about.stat_volunteers'),
      desc: 'Tình nguyện viên đã xác thực',
    },
    {
      value: realStats.value.provincesCoveredCount.toLocaleString(),
      label: t('home.stat_provinces'),
      desc: 'Tỉnh/thành có điểm kết nối',
    },
    {
      value: realStats.value.completedAssignmentCount.toLocaleString(),
      label: t('about.stat_success'),
      desc: 'Nhiệm vụ phân công hoàn thành',
    },
  ]
})

const coreValues = computed(() => [
  {
    title: t('about.val_transparency'),
    desc: t('about.val_transparency_desc'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a4f8d" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
  {
    title: t('about.val_speed'),
    desc: t('about.val_speed_desc'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e27d24" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    title: t('about.val_network'),
    desc: t('about.val_network_desc'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#276749" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    title: t('about.val_compassion'),
    desc: t('about.val_compassion_desc'),
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  },
])
</script>

<style scoped>
.about-hero {
  background: linear-gradient(135deg, #1a3b5c 0%, #1a4f8d 60%, #e27d24 100%);
  color: #fff;
  padding: 72px 20px;
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
  font-size: 40px;
  font-weight: 900;
  margin-bottom: 16px;
  line-height: 1.2;
}
.hero-subtitle {
  font-size: 16px;
  opacity: 0.9;
  line-height: 1.7;
}

/* Stats */
.stats-section {
  margin-top: -40px;
  margin-bottom: 48px;
  position: relative;
  z-index: 10;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.stat-card {
  background: #fff;
  padding: 24px 20px;
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  text-align: center;
  border: 1px solid var(--color-border-soft);
}
.stat-number {
  font-size: 32px;
  font-weight: 900;
  color: #1a4f8d;
}
.stat-label {
  font-size: 15px;
  font-weight: 700;
  color: #1a3b5c;
  margin: 4px 0;
}
.stat-desc {
  font-size: 12px;
  color: #718096;
}

/* Mission */
.mission-section {
  margin-bottom: 56px;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}
.mission-card {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-soft);
}
.card-icon {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.bg-blue { background: rgba(26, 79, 141, 0.1); color: #1a4f8d; }
.bg-orange { background: rgba(226, 125, 36, 0.1); color: #e27d24; }
.mission-card h3 {
  font-size: 20px;
  font-weight: 800;
  color: #1a3b5c;
  margin-bottom: 12px;
}
.mission-card p {
  font-size: 14.5px;
  color: #4a5568;
  line-height: 1.7;
}

/* Values */
.values-section {
  margin-bottom: 56px;
}
.section-title {
  font-size: 28px;
  font-weight: 800;
  color: #1a3b5c;
}
.section-sub {
  font-size: 14px;
  color: #718096;
  margin-bottom: 32px;
}
.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.value-card {
  background: #fff;
  padding: 24px;
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-soft);
  text-align: center;
  transition: transform 0.2s;
}
.value-card:hover {
  transform: translateY(-4px);
}
.value-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.value-card h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1a3b5c;
  margin-bottom: 8px;
}
.value-card p {
  font-size: 13px;
  color: #718096;
  line-height: 1.6;
}

/* Story */
.story-section {
  background: linear-gradient(135deg, #1a3b5c 0%, #0f2540 100%);
  color: #fff;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
}
.story-text h2 {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 16px;
}
.story-text p {
  font-size: 15px;
  opacity: 0.85;
  line-height: 1.7;
  margin-bottom: 16px;
}
.story-cta {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.btn-primary {
  padding: 12px 24px;
  background: #e27d24;
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
}
.btn-primary:hover { background: #c46a18; }
.btn-outline {
  padding: 12px 24px;
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
}
.btn-outline:hover { background: rgba(255, 255, 255, 0.1); }

@media (max-width: 768px) {
  .hero-title { font-size: 30px; }
  .story-section { padding: 24px; }
}
</style>

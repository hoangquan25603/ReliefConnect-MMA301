<template>
  <div class="vol-shell">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <aside class="vol-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Brand -->
      <router-link to="/" class="sidebar-brand">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="url(#brandGrad)"/>
            <path d="M18 8 L26 14 L26 22 L18 28 L10 22 L10 14 Z" fill="white" opacity="0.9"/>
            <path d="M18 13 L22 16 L22 21 L18 24 L14 21 L14 16 Z" fill="url(#brandGrad)"/>
            <defs>
              <linearGradient id="brandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#276749"/>
                <stop offset="100%" stop-color="#48bb78"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">ReliefConnect</span>
            <span class="brand-sub">Volunteer Portal</span>
          </div>
        </Transition>
      </router-link>

      <!-- Nav items -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="sidebar-item"
          :class="{ active: $route.name === item.routeName }"
          :title="sidebarCollapsed ? item.label : ''"
          @click="closeMobileNavigation"
        >
          <span class="sidebar-item__icon" v-html="item.icon" />
          <Transition name="fade-label">
            <span v-if="!sidebarCollapsed" class="sidebar-item__label">{{ item.label }}</span>
          </Transition>
          <Transition name="fade-label">
            <span v-if="!sidebarCollapsed && item.badge" class="sidebar-badge">{{ item.badge }}</span>
          </Transition>
        </router-link>
      </nav>

      <!-- Collapse toggle -->
      <button class="sidebar-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? $t('common.expand') : $t('common.collapse')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path :d="sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'" />
        </svg>
      </button>

      <!-- User profile mini card -->
      <div class="sidebar-user" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-avatar">{{ initials }}</div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="sidebar-user-info">
            <span class="sidebar-user-name">{{ auth.user?.fullName }}</span>
            <span class="sidebar-user-role">{{ $t('roles.Volunteer') }}</span>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- ── Main area ─────────────────────────────────────────── -->
    <div class="vol-body">
      <!-- Topbar -->
      <header class="vol-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-page-info">
            <span class="topbar-greeting">{{ greeting }}, </span>
            <span class="topbar-name">{{ auth.user?.fullName?.split(' ').at(-1) }}!</span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Language Switcher -->
          <div class="lang-switch">
            <button
              class="lang-btn"
              :class="{ active: currentLang === 'vi' }"
              @click="changeLang('vi')"
              :title="$t('nav.vietnamese')"
            >
              VI
            </button>
            <span class="lang-divider">|</span>
            <button
              class="lang-btn"
              :class="{ active: currentLang === 'en' }"
              @click="changeLang('en')"
              :title="$t('nav.english')"
            >
              EN
            </button>
          </div>

          <button class="topbar-icon-btn" :title="$t('nav.notifications')" @click="router.push('/volunteer/notifications')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="hasUnreadNotifications" class="notif-dot" />
          </button>
          <div class="topbar-user-menu">
            <div class="topbar-user-trigger" @click="showUserMenu = !showUserMenu">
              <div class="topbar-avatar">{{ initials }}</div>
              <span class="topbar-chevron" :class="{ rotated: showUserMenu }">▾</span>
            </div>
            <Transition name="fade">
              <div v-if="showUserMenu" class="topbar-dropdown">
                <router-link to="/volunteer/profile" class="dropdown-item" @click="showUserMenu = false">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  {{ $t('nav.profile') }}
                </router-link>
                <div class="dropdown-divider" />
                <button class="dropdown-item dropdown-item--danger" @click="handleLogout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  {{ $t('nav.logout') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page content slot -->
      <main class="vol-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supportNavigation, isMobileNavigation, type NavigationItem } from './navigation'
import { useAuthStore } from '@/stores/auth'
import { getUnreadCount } from '@/features/notifications/notifications.api'

const router = useRouter()
const auth = useAuthStore()
const { locale, t } = useI18n()
const currentLang = computed(() => locale.value)

const sidebarCollapsed = ref(isMobileNavigation())
const closeMobileNavigation = () => { if (isMobileNavigation()) sidebarCollapsed.value = true }
const showUserMenu = ref(false)
const unreadCount = ref(0)
const hasUnreadNotifications = computed(() => unreadCount.value > 0)

onMounted(async () => {
  try {
    unreadCount.value = await getUnreadCount()
  } catch {
    unreadCount.value = 0
  }
})

function changeLang(lang: 'vi' | 'en') {
  locale.value = lang
  localStorage.setItem('app_lang', lang)
}

const initials = computed(() =>
  auth.user?.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? '?',
)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('common.greeting_morning')
  if (h < 18) return t('common.greeting_afternoon')
  return t('common.greeting_evening')
})

const navItems = computed<NavigationItem[]>(() => [
  ...supportNavigation.slice(0, 1),
  {
    name: 'dashboard',
    routeName: 'volunteer-dashboard',
    to: '/volunteer',
    label: t('volunteer.dash_overview'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  },
  {
    name: 'my-tasks',
    routeName: 'volunteer-my-tasks',
    to: '/volunteer/my-tasks',
    label: t('volunteer.tasks_title'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  },
  {
    name: 'open-tasks',
    routeName: 'volunteer-open-tasks',
    to: '/volunteer/open-tasks',
    label: t('openTasks.nav_label'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>`,
  },
  {
    name: 'history',
    routeName: 'volunteer-history',
    to: '/volunteer/history',
    label: t('volunteer.history_title'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    name: 'skills',
    routeName: 'volunteer-skills',
    to: '/volunteer/skills',
    label: t('volunteer.dash_action_skills'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    name: 'notifications',
    routeName: 'volunteer-notifications',
    to: '/volunteer/notifications',
    label: t('nav.notifications'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  },
  {
    name: 'profile',
    routeName: 'volunteer-profile',
    to: '/volunteer/profile',
    label: t('nav.profile'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  },
  ...supportNavigation.slice(1),
])

async function handleLogout(): Promise<void> {
  showUserMenu.value = false
  await auth.logout()
  router.push('/home')
}

</script>

<style scoped>
/* ── Shell layout ─────────────────────────────────────────── */
.vol-shell {
  display: flex;
  min-height: 100vh;
  background: #f0f4f8;
}

/* ── Sidebar ──────────────────────────────────────────────── */
.vol-sidebar {
  width: 260px;
  min-height: 100vh;
  background: linear-gradient(175deg, #1a3b5c 0%, #0f2540 60%, #0a1a2e 100%);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.vol-sidebar.collapsed { width: 72px; }

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.brand-logo {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-text { overflow: hidden; }
.brand-name {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
  letter-spacing: -0.3px;
}
.brand-sub {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-top: 2px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(255,255,255,0.62);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.18s ease;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar-item:hover {
  background: rgba(255,255,255,0.10);
  color: #fff;
}
.sidebar-item.active {
  background: rgba(72,187,120,0.20);
  color: #68d391;
}
.sidebar-item.active .sidebar-item__icon {
  color: #68d391;
}
.sidebar-item__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.sidebar-item__label { overflow: hidden; text-overflow: ellipsis; }

.sidebar-badge {
  margin-left: auto;
  background: #e27d24;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  flex-shrink: 0;
}

/* Collapse button */
.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  margin: 8px auto;
  transition: all 0.18s ease;
  flex-shrink: 0;
}
.sidebar-collapse-btn:hover {
  background: rgba(255,255,255,0.16);
  color: #fff;
}

/* User mini card */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  overflow: hidden;
}
.sidebar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #276749, #48bb78);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}
.sidebar-user-info { overflow: hidden; }
.sidebar-user-name {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-user-role {
  display: block;
  font-size: 10.5px;
  color: #68d391;
  font-weight: 500;
  white-space: nowrap;
}

/* ── Body ─────────────────────────────────────────────────── */
.vol-body {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.vol-sidebar.collapsed ~ .vol-body { margin-left: 72px; }

/* ── Topbar ───────────────────────────────────────────────── */
.vol-topbar {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e9ecef;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.15s ease;
}
.mobile-menu-btn:hover { background: #f0f4f8; }
.topbar-page-info { font-size: 15px; }
.topbar-greeting { color: #718096; font-weight: 400; }
.topbar-name { color: #1a3b5c; font-weight: 700; }

.topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e9ecef;
  cursor: pointer;
  color: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.topbar-icon-btn:hover { background: #f0f4f8; color: #1a3b5c; }
.notif-dot {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e27d24;
  border: 2px solid #fff;
}

.topbar-user-menu { position: relative; }
.topbar-user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  background: #f8fafc;
  user-select: none;
  transition: all 0.15s ease;
}
.topbar-user-trigger:hover { background: #f0f4f8; }
.topbar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #276749, #48bb78);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}
.topbar-chevron { font-size: 12px; color: #a0aec0; transition: transform 0.15s ease; }
.topbar-chevron.rotated { transform: rotate(180deg); }

.topbar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.12);
  border: 1px solid #e9ecef;
  min-width: 200px;
  overflow: hidden;
  z-index: 300;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  font-size: 13.5px;
  font-weight: 500;
  color: #2d3748;
  text-decoration: none;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  text-align: left;
}
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item--danger { color: #c53030; }
.dropdown-item--danger:hover { background: rgba(197,48,48,0.06); }
.dropdown-divider { border-top: 1px solid #e9ecef; }

/* ── Content ──────────────────────────────────────────────── */
.vol-content {
  flex: 1;
  padding: 28px 32px;
}

/* ── Transitions ──────────────────────────────────────────── */
.fade-label-enter-active,
.fade-label-leave-active { transition: opacity 0.18s ease; }
.fade-label-enter-from,
.fade-label-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .vol-sidebar {
    position: fixed;
    transform: translateX(0);
    z-index: 300;
  }
  .vol-sidebar.collapsed {
    transform: translateX(-100%);
    width: 260px;
  }
  .vol-body { margin-left: 0 !important; }
  .mobile-menu-btn { display: flex; }
  .vol-content { padding: 20px 16px; }
}

/* ── Language Switcher ── */
.lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e8f5ee;
  padding: 3px 8px;
  border-radius: 99px;
  border: 1px solid #c6f6d5;
  margin-right: 12px;
}
.lang-btn {
  background: none;
  border: none;
  font-size: 11px;
  font-weight: 700;
  color: #276749;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 99px;
  transition: all 0.2s ease;
}
.lang-btn:hover {
  color: #1c4530;
}
.lang-btn.active {
  background: #ffffff;
  color: #276749;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.lang-divider {
  font-size: 11px;
  color: #a3d9c9;
}
</style>

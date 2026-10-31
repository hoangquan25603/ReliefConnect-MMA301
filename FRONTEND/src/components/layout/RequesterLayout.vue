<template>
  <div class="vol-shell">
    <!-- ── Sidebar ─────────────────────────────────────────── -->
    <aside class="vol-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- Brand -->
      <router-link to="/" class="sidebar-brand">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="url(#reqBrandGrad)"/>
            <path d="M18 8 L26 14 L26 22 L18 28 L10 22 L10 14 Z" fill="white" opacity="0.9"/>
            <path d="M18 13 L22 16 L22 21 L18 24 L14 21 L14 16 Z" fill="url(#reqBrandGrad)"/>
            <defs>
              <linearGradient id="reqBrandGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#276749"/>
                <stop offset="100%" stop-color="#48bb78"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">ReliefConnect</span>
            <span class="brand-sub">Requester Portal</span>
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
          :class="{ active: $route.name === item.routeName || (item.to === '/requester' && $route.path === '/requester') }"
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
            <span class="sidebar-user-name">{{ auth.user?.fullName ?? $t('common.user') }}</span>
            <span class="sidebar-user-role">{{ roleLabel }}</span>
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
            <span class="topbar-name">{{ auth.user?.fullName?.split(' ').at(-1) ?? '' }}!</span>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Language Switcher -->
          <div class="lang-switch">
            <button
              class="lang-btn"
              :class="{ active: currentLang === 'vi' }"
              @click="changeLang('vi')"
              title="Tiếng Việt"
            >
              🇻🇳 VI
            </button>
            <span class="lang-divider">|</span>
            <button
              class="lang-btn"
              :class="{ active: currentLang === 'en' }"
              @click="changeLang('en')"
              title="English"
            >
              🇬🇧 EN
            </button>
          </div>

          <!-- Notification Button -->
          <button class="topbar-icon-btn" :title="$t('nav.notifications')" @click="router.push('/requester/notifications')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="hasUnreadNotifications" class="notif-dot" />
          </button>

          <!-- User Menu -->
          <div class="topbar-user-menu" v-click-outside="() => (showUserMenu = false)">
            <div class="topbar-user-trigger" @click="showUserMenu = !showUserMenu">
              <div class="topbar-avatar">{{ initials }}</div>
              <span class="topbar-chevron" :class="{ rotated: showUserMenu }">▾</span>
            </div>
            <Transition name="fade">
              <div v-if="showUserMenu" class="topbar-dropdown">
                <router-link to="/profile" class="dropdown-item" @click="showUserMenu = false">
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
import { supportNavigation, isMobileNavigation } from './navigation'
import { useAuthStore } from '@/stores/auth'
import { getUnreadCount } from '@/features/notifications/notifications.api'

const router = useRouter()
const auth = useAuthStore()
const { locale, t } = useI18n()

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

const currentLang = computed(() => locale.value)
function changeLang(lang: 'vi' | 'en'): void {
  locale.value = lang
  localStorage.setItem('app_lang', lang)
}

const roleLabel = computed(() => (auth.role === 'Requester' ? t('requester.role_badge') : auth.role ?? ''))

const initials = computed(() =>
  auth.user?.fullName
    ?.split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() ?? 'YC',
)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('common.greeting_morning')
  if (h < 18) return t('common.greeting_afternoon')
  return t('common.greeting_evening')
})

interface NavItem {
  name: string
  routeName: string
  to: string
  label: string
  icon: string
  badge?: string
}

const navItems = computed(() => {
  const items: NavItem[] = [
    {
      name: 'dashboard',
      routeName: auth.isOrganization ? 'donations' : 'requester-dashboard',
      to: auth.isOrganization ? '/donations' : '/requester',
      label: t('nav.home'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`,
    },
  ]

  // Requester + Admin: các mục nghiệp vụ yêu cầu cứu trợ
  if (!auth.isOrganization) {
    items.push(
      {
        name: 'my-requests',
        routeName: 'my-requests',
        to: '/requester/my-requests',
        label: t('requester.my_requests_title'),
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
      },
      {
        name: 'tracking',
        routeName: 'requester-tracking',
        to: '/requester/tracking',
        label: t('requester.tracking_title'),
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
      },
    )
  }

  // Admin: quyên góp vật tư (Organization đã có sẵn ở mục "Trang chủ" phía trên)
  if (auth.isAdmin) {
    items.push({
      name: 'donations',
      routeName: 'donations',
      to: '/donations',
      label: t('donations.nav_label'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 7.65l.77.76L12 21l7.65-7.99.77-.76a5.4 5.4 0 0 0 0-7.67z"/></svg>`,
    })
  }

  items.push({
    name: 'notifications',
    routeName: 'requester-notifications',
    to: '/requester/notifications',
    label: t('nav.notifications'),
    badge: unreadCount.value > 0 ? String(unreadCount.value) : undefined,
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
  })

  items.push({
    name: 'guide',
    routeName: 'requester-guide',
    to: '/requester/guide',
    label: t('nav.guide'),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
  })

  if (!auth.isOrganization) {
    items.push({
      name: 'become-volunteer',
      routeName: 'become-volunteer',
      to: '/requester/become-volunteer',
      label: t('requester.qa_become_volunteer'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    })
  }

  return [...items, ...supportNavigation]
})

async function handleLogout(): Promise<void> {
  showUserMenu.value = false
  await auth.logout()
  router.push('/home')
}

// ── Directive: click outside ────────────────────────────────
const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    el._clickOutside = (e: Event) => {
      if (!el.contains(e.target as Node)) binding.value()
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
  },
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
.topbar-name { color: #1a1a2e; font-weight: 700; }

.topbar-right { display: flex; align-items: center; gap: 10px; }

.lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 99px;
  border: 1px solid #e2e8f0;
}
.lang-btn {
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 99px;
  transition: all 0.15s ease;
}
.lang-btn:hover { color: #276749; }
.lang-btn.active {
  background: #ffffff;
  color: #276749;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.lang-divider { font-size: 11px; color: #cbd5e1; }

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
</style>

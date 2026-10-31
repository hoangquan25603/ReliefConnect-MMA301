<template>
  <div class="admin-shell">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <router-link to="/" class="sidebar-brand">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="url(#adminGrad)"/>
            <path d="M18 8 L26 14 L26 22 L18 28 L10 22 L10 14 Z" fill="white" opacity="0.9"/>
            <path d="M18 13 L22 16 L22 21 L18 24 L14 21 L14 16 Z" fill="url(#adminGrad)"/>
            <defs>
              <linearGradient id="adminGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#c53030"/>
                <stop offset="100%" stop-color="#e53e3e"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">ReliefConnect</span>
            <span class="brand-sub">Admin Portal</span>
          </div>
        </Transition>
      </router-link>

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

      <button class="sidebar-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? $t('common.expand') : $t('common.collapse')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path :d="sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'" />
        </svg>
      </button>

      <div class="sidebar-user" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-avatar">{{ initials }}</div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="sidebar-user-info">
            <span class="sidebar-user-name">{{ auth.user?.fullName }}</span>
            <span class="sidebar-user-role">{{ roleLabel }}</span>
          </div>
        </Transition>
      </div>
    </aside>

    <div class="admin-body">
      <header class="admin-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-page-info">
            <span class="topbar-greeting">{{ greeting }}, </span>
            <span class="topbar-name">{{ auth.user?.fullName?.split(" ").at(-1) }}!</span>
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
              VI
            </button>
            <span class="lang-divider">|</span>
            <button
              class="lang-btn"
              :class="{ active: currentLang === 'en' }"
              @click="changeLang('en')"
              title="English"
            >
              EN
            </button>
          </div>

          <button class="topbar-icon-btn" :title="$t('nav.notifications')" @click="router.push('/admin/notifications')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span v-if="hasUnreadNotifications" class="notif-dot" />
          </button>

          <div class="topbar-user-menu" v-click-outside="() => (showUserMenu = false)">
            <div class="topbar-user-trigger" @click="showUserMenu = !showUserMenu">
              <div class="topbar-avatar">{{ initials }}</div>
              <span class="topbar-chevron" :class="{ rotated: showUserMenu }">&#9662;</span>
            </div>
            <Transition name="fade">
              <div v-if="showUserMenu" class="topbar-dropdown">
                <router-link
                  v-for="item in navItems"
                  :key="item.name"
                  :to="item.to"
                  class="dropdown-item"
                  @click="showUserMenu = false"
                >
                  <span class="dropdown-icon" v-html="item.icon" />
                  {{ item.label }}
                </router-link>
                <div class="dropdown-divider" />
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
      <main class="admin-content">
        <div class="admin-content__inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { supportNavigation, isMobileNavigation, type NavigationItem } from './navigation'
import { useAuthStore } from "@/stores/auth"
import { ROLE_LABELS } from "@/features/auth/auth.types"
import { getUnreadCount } from "@/features/notifications/notifications.api"

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

const initials = computed(() =>
  auth.user?.fullName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() ?? "?"
)

const greeting = computed(() => {
  void locale.value
  const h = new Date().getHours()
  if (h < 12) return t('common.greeting_morning')
  if (h < 18) return t('common.greeting_afternoon')
  return t('common.greeting_evening')
})

const roleLabel = computed(() => {
  void locale.value
  if (!auth.user?.role) return ''
  return t(`roles.${auth.user.role}`, ROLE_LABELS[auth.user.role] ?? auth.user.role)
})

const navItems = computed<NavigationItem[]>(() => {
  void locale.value
  return [
    {
      name: "dashboard", routeName: "admin-dashboard", to: "/admin", label: t('admin.nav_dashboard'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    },
    {
      name: "users", routeName: "users", to: "/users", label: t('admin.nav_users'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    },
    {
      name: "requests", routeName: "admin-relief-requests", to: "/admin/relief-requests", label: t('admin.nav_requests'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    },
    {
      name: "coordinator", routeName: "admin-assignments", to: "/admin/assignments", label: t('admin.nav_coordination'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    },
    {
      name: "volunteers", routeName: "admin-volunteers", to: "/admin/volunteers", label: t('admin.nav_volunteers'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    },
    {
      name: "skills", routeName: "admin-skills", to: "/admin/skills", label: t('admin.nav_skills'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    },
    {
      name: "donations", routeName: "admin-donations", to: "/admin/donations", label: t('donations.nav_label'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 7.65l.77.76L12 21l7.65-7.99.77-.76a5.4 5.4 0 0 0 0-7.67z"/></svg>`,
    },
    {
      name: "role-requests", routeName: "admin-role-requests", to: "/admin/role-requests", label: t('roleRequests.nav_label'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`,
    },
    {
      name: "reports", routeName: "admin-reports", to: "/admin/reports", label: t('admin.nav_reports'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    },
    { name: 'warehouses', routeName: 'warehouses', to: '/warehouses', label: 'Quản lý kho', icon: '<span aria-hidden="true">⌂</span>' },
    { name: 'inventory', routeName: 'inventory', to: '/inventory', label: 'Vật tư & tồn kho', icon: '<span aria-hidden="true">▤</span>' },
    ...supportNavigation,
  ]
})

async function handleLogout() {
  showUserMenu.value = false
  await auth.logout()
  router.push("/home")
}

const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    el._clickOutside = (e: Event) => { if (!el.contains(e.target as Node)) binding.value() }
    document.addEventListener("click", el._clickOutside)
  },
  unmounted(el: HTMLElement) { document.removeEventListener("click", el._clickOutside) },
}
</script>

<style scoped>
.admin-shell { display: flex; min-height: 100vh; background: #f0f4f8; }
.admin-sidebar {
  width: 260px; min-height: 100vh;
  background: linear-gradient(175deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; z-index: 200;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;
}
.admin-sidebar.collapsed { width: 72px; }
.sidebar-brand {
  display: flex; align-items: center; gap: 12px;
  padding: 22px 20px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
}
.brand-logo { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.brand-text { overflow: hidden; }
.brand-name { display: block; font-size: 15px; font-weight: 800; color: #fff; white-space: nowrap; letter-spacing: -0.3px; }
.brand-sub { display: block; font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.45); white-space: nowrap; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px; }
.sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; overflow-x: hidden; }
.sidebar-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px;
  color: rgba(255,255,255,0.62); text-decoration: none; font-size: 13.5px; font-weight: 500;
  transition: all 0.18s ease; position: relative; white-space: nowrap; overflow: hidden;
}
.sidebar-item:hover { background: rgba(255,255,255,0.10); color: #fff; }
.sidebar-item.active { background: rgba(229,62,62,0.22); color: #fc8181; }
.sidebar-item.active .sidebar-item__icon { color: #fc8181; }
.sidebar-item__icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
.sidebar-item__label { overflow: hidden; text-overflow: ellipsis; }
.sidebar-badge { margin-left: auto; background: #c53030; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 99px; flex-shrink: 0; }
.sidebar-collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.08);
  border: none; color: rgba(255,255,255,0.5); cursor: pointer; margin: 8px auto;
  transition: all 0.18s ease; flex-shrink: 0;
}
.sidebar-collapse-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; overflow: hidden; }
.sidebar-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #c53030, #e53e3e); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.sidebar-user-info { overflow: hidden; }
.sidebar-user-name { display: block; font-size: 12.5px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { display: block; font-size: 10.5px; color: #fc8181; font-weight: 500; white-space: nowrap; }
.admin-body { flex: 1; margin-left: 260px; transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; min-height: 100vh; }
.admin-sidebar.collapsed ~ .admin-body { margin-left: 72px; }
.admin-topbar {
  height: 64px; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px);
  border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.mobile-menu-btn { display: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: #f8fafc; border: 1px solid #e9ecef; cursor: pointer; color: #4a5568; transition: all 0.15s ease; }
.mobile-menu-btn:hover { background: #f0f4f8; }
.topbar-page-info { font-size: 15px; }
.topbar-greeting { color: #718096; font-weight: 400; }
.topbar-name { color: #1a3b5c; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-icon-btn {
  position: relative; width: 38px; height: 38px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #e9ecef; cursor: pointer; color: #4a5568;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
}
.topbar-icon-btn:hover { background: #f0f4f8; color: #1a1a2e; }
.notif-dot { position: absolute; top: 7px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #c53030; border: 2px solid #fff; }
.lang-switch { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 8px; border: 1px solid #e9ecef; background: #f8fafc; }
.lang-btn { background: none; border: none; font-size: 12px; font-weight: 600; color: #718096; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: all 0.15s ease; }
.lang-btn:hover { color: #2d3748; }
.lang-btn.active { background: #e2e8f0; color: #1a202c; font-weight: 700; }
.lang-divider { color: #cbd5e0; font-size: 11px; }
.topbar-user-menu { position: relative; }
.topbar-user-trigger { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 5px 10px; border-radius: 10px; border: 1px solid #e9ecef; background: #f8fafc; user-select: none; transition: all 0.15s ease; }
.topbar-user-trigger:hover { background: #f0f4f8; }
.topbar-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #c53030, #e53e3e); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
.topbar-chevron { font-size: 12px; color: #a0aec0; transition: transform 0.15s ease; }
.topbar-chevron.rotated { transform: rotate(180deg); }
.topbar-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); border: 1px solid #e9ecef; min-width: 220px; overflow: hidden; z-index: 300; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; font-size: 13.5px; font-weight: 500; color: #2d3748; text-decoration: none; width: 100%; background: none; border: none; cursor: pointer; transition: background 0.15s ease; text-align: left; }
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item--danger { color: #c53030; }
.dropdown-item--danger:hover { background: rgba(197,48,48,0.06); }
.dropdown-divider { border-top: 1px solid #e9ecef; }
.dropdown-icon { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex-shrink: 0; color: #4a5568; }
.dropdown-icon :deep(svg) { width: 16px; height: 16px; }
.admin-content { flex: 1; padding: 28px 32px; background: linear-gradient(180deg, #f8fafc 0%, #f0f4f8 100%); }
.admin-content__inner { max-width: 1400px; margin: 0 auto; width: 100%; }
.fade-label-enter-active, .fade-label-leave-active { transition: opacity 0.18s ease; }
.fade-label-enter-from, .fade-label-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
@media (max-width: 900px) {
  .admin-sidebar { position: fixed; transform: translateX(0); z-index: 300; }
  .admin-sidebar.collapsed { transform: translateX(-100%); width: 260px; }
  .admin-body { margin-left: 0 !important; }
  .mobile-menu-btn { display: flex; }
  .admin-content { padding: 20px 16px; }
}
</style>

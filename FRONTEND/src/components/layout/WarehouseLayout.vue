<template>
  <div class="wh-shell">
    <aside class="wh-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <router-link to="/home" class="sidebar-brand">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="url(#whGrad)"/>
            <path d="M18 8 L26 14 L26 22 L18 28 L10 22 L10 14 Z" fill="white" opacity="0.9"/>
            <path d="M18 13 L22 16 L22 21 L18 24 L14 21 L14 16 Z" fill="url(#whGrad)"/>
            <defs>
              <linearGradient id="whGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1a4f8d"/>
                <stop offset="100%" stop-color="#2b6cb0"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <Transition name="fade-label">
          <div v-if="!sidebarCollapsed" class="brand-text">
            <span class="brand-name">ReliefConnect</span>
            <span class="brand-sub">{{ $t('warehouse.brand_sub') }}</span>
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

    <div class="wh-body">
      <header class="wh-topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="topbar-page-info">
            <span class="topbar-name">{{ pageTitle }}</span>
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

          <button class="topbar-icon-btn" :title="$t('nav.notifications')" @click="router.push('/warehouse/notifications')">
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
      <main class="wh-content">
        <div class="wh-content__inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { useAuthStore } from "@/stores/auth"
import { ROLE_LABELS } from "@/features/auth/auth.types"
import { getUnreadCount } from "@/features/notifications/notifications.api"
import { supportNavigation, isMobileNavigation, type NavigationItem } from './navigation'

const router = useRouter()
const route = useRoute()
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

const roleLabel = computed(() => {
  void locale.value
  if (!auth.user?.role) return ''
  return t(`roles.${auth.user.role}`, ROLE_LABELS[auth.user.role] ?? auth.user.role)
})

const navItems = computed<NavigationItem[]>(() => {
  void locale.value
  return [
    ...(auth.isAdmin ? [{ name: 'admin', routeName: 'admin-dashboard', to: '/admin', label: 'Quản trị hệ thống', icon: '<span aria-hidden="true">⌂</span>' }] : []),
    {
      name: "warehouses", routeName: "warehouses", to: "/warehouses", label: t('warehouse.nav_warehouses'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
      name: "inventory", routeName: "inventory", to: "/inventory", label: t('warehouse.nav_inventory'),
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    },
    ...supportNavigation,
  ]
})

const pageTitle = computed(() => {
  void locale.value
  if (route.name === 'warehouses') return t('warehouse.nav_warehouses')
  if (route.name === 'inventory') return t('warehouse.nav_inventory')
  return (route.meta.title as string) ?? ''
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
.wh-shell { display: flex; min-height: 100vh; background: #f0f4f8; }
.wh-sidebar {
  width: 260px; min-height: 100vh;
  background: linear-gradient(175deg, #0f2744 0%, #123766 60%, #1a4f8d 100%);
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; z-index: 200;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;
}
.wh-sidebar.collapsed { width: 72px; }
.sidebar-brand {
  display: flex; align-items: center; gap: 12px;
  padding: 22px 20px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
  text-decoration: none;
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
.sidebar-item.active { background: rgba(255,255,255,0.16); color: #fff; }
.sidebar-item.active .sidebar-item__icon { color: #7cc4ff; }
.sidebar-item__icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
.sidebar-item__label { overflow: hidden; text-overflow: ellipsis; }
.sidebar-collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.08);
  border: none; color: rgba(255,255,255,0.5); cursor: pointer; margin: 8px auto;
  transition: all 0.18s ease; flex-shrink: 0;
}
.sidebar-collapse-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
.sidebar-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; overflow: hidden; }
.sidebar-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1a4f8d, #2b6cb0); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.sidebar-user-info { overflow: hidden; }
.sidebar-user-name { display: block; font-size: 12.5px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-user-role { display: block; font-size: 10.5px; color: #7cc4ff; font-weight: 500; white-space: nowrap; }
.wh-body { flex: 1; margin-left: 260px; transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; min-height: 100vh; }
.wh-sidebar.collapsed ~ .wh-body { margin-left: 72px; }
.wh-topbar {
  height: 64px; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px);
  border-bottom: 1px solid #e9ecef; display: flex; align-items: center; justify-content: space-between;
  padding: 0 28px; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.mobile-menu-btn { display: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: #f8fafc; border: 1px solid #e9ecef; cursor: pointer; color: #4a5568; transition: all 0.15s ease; }
.mobile-menu-btn:hover { background: #f0f4f8; }
.topbar-page-info { font-size: 15px; }
.topbar-name { color: #1a3b5c; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.topbar-icon-btn {
  position: relative; width: 38px; height: 38px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #e9ecef; cursor: pointer; color: #4a5568;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s ease;
}
.topbar-icon-btn:hover { background: #f0f4f8; color: #1a3b5c; }
.notif-dot { position: absolute; top: 7px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #1a4f8d; border: 2px solid #fff; }
.lang-switch { display: flex; align-items: center; gap: 4px; background: #f1f5f9; padding: 3px 8px; border-radius: 99px; border: 1px solid #e2e8f0; }
.lang-btn { background: none; border: none; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; padding: 3px 6px; border-radius: 99px; transition: all 0.15s ease; }
.lang-btn:hover { color: #1a4f8d; }
.lang-btn.active { background: #ffffff; color: #1a4f8d; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.lang-divider { font-size: 11px; color: #cbd5e1; }
.topbar-user-menu { position: relative; }
.topbar-user-trigger { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 5px 10px; border-radius: 10px; border: 1px solid #e9ecef; background: #f8fafc; user-select: none; transition: all 0.15s ease; }
.topbar-user-trigger:hover { background: #f0f4f8; }
.topbar-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #1a4f8d, #2b6cb0); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
.topbar-chevron { font-size: 12px; color: #a0aec0; transition: transform 0.15s ease; }
.topbar-chevron.rotated { transform: rotate(180deg); }
.topbar-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(0,0,0,0.12); border: 1px solid #e9ecef; min-width: 200px; overflow: hidden; z-index: 300; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; font-size: 13.5px; font-weight: 500; color: #2d3748; text-decoration: none; width: 100%; background: none; border: none; cursor: pointer; transition: background 0.15s ease; text-align: left; }
.dropdown-item:hover { background: #f8fafc; }
.dropdown-item--danger { color: #c53030; }
.dropdown-item--danger:hover { background: rgba(197,48,48,0.06); }
.dropdown-divider { border-top: 1px solid #e9ecef; }
.wh-content { flex: 1; padding: 28px 32px; background: linear-gradient(180deg, #f8fafc 0%, #f0f4f8 100%); }
.wh-content__inner { max-width: 1400px; margin: 0 auto; width: 100%; }
.fade-label-enter-active, .fade-label-leave-active { transition: opacity 0.18s ease; }
.fade-label-enter-from, .fade-label-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
@media (max-width: 900px) {
  .wh-sidebar { position: fixed; transform: translateX(0); z-index: 300; }
  .wh-sidebar.collapsed { transform: translateX(-100%); width: 260px; }
  .wh-body { margin-left: 0 !important; }
  .mobile-menu-btn { display: flex; }
  .wh-content { padding: 20px 16px; }
}
</style>

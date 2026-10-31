// ============================================================
//  Router – Routes + Role-based Auth Guard
//
//  Cấu trúc views:
//  views/
//  ├── shared/      → HomeView, NotFoundView, UnauthorizedView, ProfileView
//  ├── auth/        → LoginView, RegisterView
//  ├── admin/       → AdminDashboard, UsersView
//  ├── coordinator/ → CoordinatorDashboard
//  ├── volunteer/   → VolunteerDashboard
//  └── requester/   → RequesterDashboard, MyRequestsView, NotificationsView
// ============================================================

import './types'                                        // RouteMeta augmentation
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tokenStorage } from '@/lib/api/token-storage'
import type { UserRole } from '@/features/auth/auth.types'

// ── Route definitions ────────────────────────────────────────
const routes: RouteRecordRaw[] = [
  {
    path: '/connection', name: 'connection',
    component: () => import('@/views/shared/ConnectionView.vue'),
    meta: { title: 'Kết nối máy chủ' },
  },
  {
    path: '/ai', name: 'ai-assistant',
    component: () => import('@/views/ai/AiAssistantView.vue'),
    meta: { requiresAuth: true, title: 'Trợ lý AI cứu trợ' },
  },

  // ── Root redirect ──────────────────────────────────────────
  { path: '/', redirect: '/home' },

  // ────────────────────────────────────────────────────────────
  //  SHARED – public hoặc any logged-in user
  // ────────────────────────────────────────────────────────────
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/shared/HomeView.vue'),
    meta: { title: 'Trang chủ' }, // Không requiresAuth → guest OK
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/shared/AboutView.vue'),
    meta: { title: 'Về chúng tôi' },
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/shared/GuideView.vue'),
    meta: { title: 'Hướng dẫn sử dụng' },
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/shared/ContactView.vue'),
    meta: { title: 'Liên hệ' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/shared/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Hồ sơ cá nhân' },
  },

  // ────────────────────────────────────────────────────────────
  //  AUTH – chỉ cho guest chưa đăng nhập
  // ────────────────────────────────────────────────────────────
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guestOnly: true, title: 'Đăng nhập' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Đăng ký' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true, title: 'Quên mật khẩu' },
  },
  {
    path: '/verify-reset-code',
    name: 'verify-reset-code',
    component: () => import('@/views/auth/VerifyResetCodeView.vue'),
    meta: { guestOnly: true, title: 'Xác minh mã đặt lại mật khẩu' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { guestOnly: true, title: 'Đặt lại mật khẩu' },
  },

  // ────────────────────────────────────────────────────────────
  //  REQUESTER – requester | coordinator | admin
  // ────────────────────────────────────────────────────────────
  {
    path: '/requester',
    name: 'requester-dashboard',
    component: () => import('@/views/requester/RequesterDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Requester', 'Organization', 'Admin'],
      title: 'Dashboard – Yêu cầu hỗ trợ',
    },
  },
  {
    path: '/donations',
    name: 'donations',
    component: () => import('@/views/donations/MyDonationsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Organization', 'Admin'],
      title: 'Quyên góp vật tư',
    },
  },
  {
    path: '/requester/notifications',
    name: 'requester-notifications',
    component: () => import('@/views/requester/NotificationsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Requester', 'Organization', 'Admin'],
      title: 'Thông báo',
    },
  },
  {
    path: '/requester/become-volunteer',
    name: 'become-volunteer',
    component: () => import('@/views/requester/VolunteerRegisterView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Requester', 'Admin'],
      title: 'Đăng ký Tình nguyện viên',
    },
  },
  {
  path: '/requester/my-requests',
  name: 'my-requests',
  component: () => import('@/views/requester/MyRequestsView.vue'),
  meta: {
    requiresAuth: true,
    roles: ['Requester', 'Admin'],
    title: 'Yêu cầu của tôi',
  },
},
{
  path: '/requester/tracking',
  name: 'requester-tracking',
  component: () => import('@/views/requester/TrackingView.vue'),
  meta: {
    requiresAuth: true,
    roles: ['Requester', 'Admin'],
    title: 'Theo dõi hỗ trợ',
  },
},
{
  path: '/requester/guide',
  name: 'requester-guide',
  component: () => import('@/views/requester/GuideView.vue'),
  meta: {
    requiresAuth: true,
    roles: ['Requester', 'Organization', 'Admin'],
    title: 'Hướng dẫn',
  },
},
  // ────────────────────────────────────────────────────────────
  //  VOLUNTEER – volunteer | coordinator | admin
  // ────────────────────────────────────────────────────────────
  {
    path: '/volunteer',
    name: 'volunteer-dashboard',
    component: () => import('@/views/volunteer/VolunteerDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Dashboard – Tình nguyện viên',
    },
  },
  {
    path: '/volunteer/my-tasks',
    name: 'volunteer-my-tasks',
    component: () => import('@/views/volunteer/MyTasksView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Nhiệm vụ của tôi',
    },
  },
  {
    path: '/volunteer/open-tasks',
    name: 'volunteer-open-tasks',
    component: () => import('@/views/volunteer/OpenTasksView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Bảng nhiệm vụ mở',
    },
  },
  {
    path: '/volunteer/history',
    name: 'volunteer-history',
    component: () => import('@/views/volunteer/ActivityHistoryView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Lịch sử hoạt động',
    },
  },
  {
    path: '/volunteer/skills',
    name: 'volunteer-skills',
    component: () => import('@/views/volunteer/SkillsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Đăng ký kỹ năng',
    },
  },
  {
    path: '/volunteer/notifications',
    name: 'volunteer-notifications',
    component: () => import('@/views/volunteer/NotificationsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Thông báo',
    },
  },
  {
    path: '/volunteer/profile',
    name: 'volunteer-profile',
    component: () => import('@/views/volunteer/VolunteerProfileView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Volunteer', 'Admin'],
      title: 'Hồ sơ cá nhân – Tình nguyện viên',
    },
  },

  // ────────────────────────────────────────────────────────────
  //  COORDINATOR – coordinator | admin
  // ────────────────────────────────────────────────────────────
  {
    path: '/coordinator',
    name: 'coordinator-dashboard',
    component: () => import('@/views/coordinator/CoordinatorDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Dashboard – Điều phối viên',
    },
  },

  // ────────────────────────────────────────────────────────────
  //  WAREHOUSE – mọi role đã đăng nhập (GET); ghi bị BE tự chặn
  //  theo role (Admin + Coordinator) qua 403
  // ────────────────────────────────────────────────────────────
  {
    path: '/warehouses',
    name: 'warehouses',
    component: () => import('@/views/Warehouses/WarehousesView.vue'),
    meta: { requiresAuth: true, title: 'Quản lý kho' },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/views/inventory/InventoryView.vue'),
    meta: { requiresAuth: true, title: 'Vật tư & tồn kho' },
  },
  {
    path: '/warehouse/notifications',
    name: 'warehouse-notifications',
    component: () => import('@/views/Warehouses/NotificationsView.vue'),
    meta: { requiresAuth: true, title: 'Thông báo' },
  },

  // ────────────────────────────────────────────────────────────
  //  ADMIN – admin only
  // ────────────────────────────────────────────────────────────
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Dashboard – Quản trị',
    },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/admin/UsersView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Quản lý người dùng',
    },
  },
  {
    path: '/admin/relief-requests',
    name: 'admin-relief-requests',
    component: () => import('@/views/admin/ReliefRequestsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Quản lý yêu cầu cứu trợ',
    },
  },
  {
    path: '/admin/skills',
    name: 'admin-skills',
    component: () => import('@/views/admin/SkillsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Quản lý Kỹ năng',
    },
  },
  {
    path: '/admin/assignments',
    name: 'admin-assignments',
    component: () => import('@/views/admin/AssignmentsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Quản lý phân công tình nguyện viên',
    },
  },
  {
    path: '/admin/volunteers',
    name: 'admin-volunteers',
    component: () => import('@/views/admin/VolunteersView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Quản lý tình nguyện viên',
    },
  },
  {
    path: '/admin/donations',
    name: 'admin-donations',
    component: () => import('@/views/admin/DonationsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Duyệt quyên góp',
    },
  },
  {
    path: '/admin/role-requests',
    name: 'admin-role-requests',
    component: () => import('@/views/admin/RoleRequestsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Duyệt nguyện vọng nâng quyền',
    },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('@/views/admin/ReportsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Báo cáo & Xuất dữ liệu',
    },
  },
  {
    path: '/admin/notifications',
    name: 'admin-notifications',
    component: () => import('@/views/admin/NotificationsView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['Admin'],
      title: 'Thông báo',
    },
  },

  // ────────────────────────────────────────────────────────────
  //  ERROR PAGES
  // ────────────────────────────────────────────────────────────
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/shared/UnauthorizedView.vue'),
    meta: { title: 'Không có quyền truy cập' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/shared/NotFoundView.vue'),
    meta: { title: 'Trang không tồn tại' },
  },
]

// ── Router instance ──────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

import { useAuthStore } from '@/stores/auth'

// ── Global auth + RBAC guard ─────────────────────────────────
router.beforeEach(async (to) => {
  let isLoggedIn = tokenStorage.exists()

  if (isLoggedIn) {
    const authStore = useAuthStore()
    // Kiểm tra đồng bộ thông tin role mới nhất từ BE.
    // Nếu role đã bị Admin thay đổi, fetchMe() sẽ phát hiện và tự động đăng xuất.
    await authStore.fetchMe()
    isLoggedIn = tokenStorage.exists()
  }

  // Đọc role từ user đã persist trong localStorage
  let userRole: UserRole | null = null
  try {
    const raw = localStorage.getItem('auth_user')
    if (raw) userRole = (JSON.parse(raw) as { role: UserRole }).role
  } catch { /* ignore */ }

  // 1. guestOnly → đã login → về /home
  if (to.meta.guestOnly && isLoggedIn) {
    return { name: 'home' }
  }

  // 2. requiresAuth → chưa login → về /login
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 3. roles[] → kiểm tra role
  if (to.meta.roles && to.meta.roles.length > 0 && isLoggedIn) {
    if (!userRole || !to.meta.roles.includes(userRole)) {
      return { name: 'unauthorized' }
    }
  }
})

// ── Update document title ────────────────────────────────────
router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? `${title} | ReliefConnect` : 'ReliefConnect'
})

export default router

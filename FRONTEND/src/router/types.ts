// ============================================================
//  Vue Router – RouteMeta type augmentation
//  Định nghĩa tất cả meta fields được dùng trong routes
// ============================================================

import type { UserRole } from '@/features/auth/auth.types'

declare module 'vue-router' {
  interface RouteMeta {
    /** Trang yêu cầu đăng nhập */
    requiresAuth?: boolean
    /** Chỉ dành cho khách chưa login (login/register pages) */
    guestOnly?: boolean
    /**
     * Danh sách role được phép vào trang.
     * Nếu undefined → bất kỳ user đã login nào cũng vào được.
     * VD: roles: ['admin', 'coordinator']
     */
    roles?: UserRole[]
    /** Tên trang hiển thị trên breadcrumb/navbar */
    title?: string
  }
}

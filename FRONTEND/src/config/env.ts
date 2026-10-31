// ============================================================
//  Single source of truth cho tất cả biến môi trường
//  Production BE: https://disasterrelief-api.runasp.net
// ============================================================

const env = import.meta.env
export const IS_NATIVE_APP = window.location.hostname === 'appassets.androidplatform.net'
export const SERVER_STORAGE_KEY = 'relief_api_url'
export const DEFAULT_API_URL = env.VITE_API_BASE_URL || 'http://localhost:5092/api'

export function normalizeApiUrl(value: string): string {
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Nhập địa chỉ HTTP/HTTPS, không chứa tài khoản, query hoặc dấu #.')
  }
  const path = url.pathname.replace(/\/+$/, '')
  if (path && path !== '/api') throw new Error('Địa chỉ server phải có dạng https://ten-mien.vn hoặc http://IP:5092/api.')
  return `${url.origin}/api`
}

/**
 * URL gốc của backend API.
 * Production: https://disasterrelief-api.runasp.net
 * Local:      http://localhost:5092  (xem launchSettings.json của BE)
 */
export const API_BASE_URL: string =
  localStorage.getItem(SERVER_STORAGE_KEY) || DEFAULT_API_URL

/** Tiêu đề ứng dụng */
export const APP_TITLE: string = env.VITE_APP_TITLE ?? 'ReliefConnect'

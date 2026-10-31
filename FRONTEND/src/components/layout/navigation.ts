export interface NavigationItem {
  name: string
  routeName: string
  to: string
  label: string
  icon: string
  badge?: string
}

export const supportNavigation: NavigationItem[] = [
  {
    name: 'ai-assistant', routeName: 'ai-assistant', to: '/ai', label: 'Trợ lý AI cứu trợ',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></svg>',
  },
  {
    name: 'connection', routeName: 'connection', to: '/connection', label: 'Kết nối máy chủ',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/></svg>',
  },
]

export const isMobileNavigation = () => window.matchMedia('(max-width: 900px)').matches

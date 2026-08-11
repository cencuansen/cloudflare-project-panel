import { ref } from 'vue'

const STORAGE_KEY = 'cf-panel:theme'
export type Theme = 'light' | 'dark' | 'system'

function loadTheme(): Theme {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
}

const theme = ref<Theme>(loadTheme())

function resolveTheme(): 'light' | 'dark' {
  if (theme.value !== 'system') return theme.value
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

/** 把当前主题写到 <html data-theme="...">，CSS 据此切换配色 */
function apply(): void {
  document.documentElement.dataset.theme = resolveTheme()
}

function setTheme(next: Theme): void {
  theme.value = next
  localStorage.setItem(STORAGE_KEY, next)
  apply()
}

/** 浅色 → 深色 → 跟随系统 → 浅色 循环切换 */
function cycle(): void {
  setTheme(theme.value === 'light' ? 'dark' : theme.value === 'dark' ? 'system' : 'light')
}

/** 应用初始主题，并在「跟随系统」模式下监听系统主题变化（应用启动时调用一次） */
export function initTheme(): void {
  apply()
  if (typeof window !== 'undefined' && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply)
  }
}

export function useTheme() {
  return { theme, apply, cycle }
}

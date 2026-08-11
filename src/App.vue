<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const { theme, cycle } = useTheme()

const themeIcon = computed(() =>
  theme.value === 'light' ? '☀️' : theme.value === 'dark' ? '🌙' : '🖥️',
)
const themeLabel = computed(() =>
  theme.value === 'light' ? '浅色模式' : theme.value === 'dark' ? '深色模式' : '跟随系统主题',
)
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-logo" aria-hidden="true"></span>
        <span class="brand-name">Cloudflare Project Panel</span>
      </RouterLink>

      <div class="header-right">
        <nav class="nav">
          <RouterLink to="/workers" class="nav-link">Workers</RouterLink>
          <RouterLink to="/pages" class="nav-link">Pages</RouterLink>
          <RouterLink to="/settings" class="nav-link">设置</RouterLink>
        </nav>

        <button
          class="theme-toggle"
          type="button"
          :title="`主题：${themeLabel}（点击切换）`"
          @click="cycle"
        >
          {{ themeIcon }}
        </button>
      </div>
    </div>
  </header>

  <main class="app-main">
    <RouterView />
  </main>

  <!-- 移动端底部标签栏：窄屏下替换顶部导航 -->
  <nav class="tabbar" aria-label="主导航">
    <RouterLink to="/workers" class="tabbar__link">Workers</RouterLink>
    <RouterLink to="/pages" class="tabbar__link">Pages</RouterLink>
    <RouterLink to="/settings" class="tabbar__link">设置</RouterLink>
  </nav>
</template>

<style scoped>
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  text-decoration: none;
}

.brand-logo {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, #f6821f, #f9a03f);
  flex-shrink: 0;
}

.brand-name {
  font-weight: 600;
  font-size: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  padding: 5px 9px;
  font-size: 14px;
  line-height: 1;
  color: var(--color-text-secondary);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.theme-toggle:hover {
  background: var(--color-surface-2-hover);
  color: var(--color-text);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 14px;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: var(--color-hover);
  color: var(--color-text);
  text-decoration: none;
}

.nav-link.router-link-active {
  color: var(--color-primary-strong);
  background: rgba(246, 130, 31, 0.1);
  font-weight: 600;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}

/* 底部标签栏：默认隐藏（仅移动端显示） */
.tabbar {
  display: none;
  /* 用 sticky 吸附视口底部，比 fixed 更可靠（部分移动端浏览器 fixed 在长页面下失效） */
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar__link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
}

.tabbar__link:hover {
  background: var(--color-hover);
  color: var(--color-text);
  text-decoration: none;
}

.tabbar__link.router-link-active {
  color: var(--color-primary-strong);
  background: rgba(246, 130, 31, 0.1);
  font-weight: 600;
}

/* 移动端：隐藏顶部导航，显示底部标签栏 */
@media (max-width: 720px) {
  .header-right .nav {
    display: none;
  }

  .tabbar {
    display: flex;
  }

  /* 加大主题按钮触摸目标 */
  .theme-toggle {
    min-width: 40px;
    min-height: 40px;
  }
}
</style>

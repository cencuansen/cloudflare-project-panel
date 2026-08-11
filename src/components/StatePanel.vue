<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    type: 'loading' | 'error' | 'empty' | 'unconfigured'
    message?: string
  }>(),
  { message: '' },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="state-panel" :class="`state-panel--${type}`">
    <template v-if="type === 'loading'">
      <span class="spinner" aria-hidden="true"></span>
      <p class="state-panel__text">正在加载数据…</p>
    </template>

    <template v-else-if="type === 'error'">
      <p class="state-panel__icon" aria-hidden="true">⚠️</p>
      <p class="state-panel__title">加载失败</p>
      <p class="state-panel__text">{{ message }}</p>
      <button class="btn" type="button" @click="$emit('retry')">重试</button>
    </template>

    <template v-else-if="type === 'empty'">
      <p class="state-panel__icon" aria-hidden="true">🗂️</p>
      <p class="state-panel__text">{{ message || '暂无数据' }}</p>
    </template>

    <template v-else>
      <p class="state-panel__icon" aria-hidden="true">🔑</p>
      <p class="state-panel__title">尚未配置 Cloudflare 账号</p>
      <p class="state-panel__text">
        请在设置中填写 Account ID 与 API Token，Token 需要具备 Worker 与 Pages 的读取权限。
      </p>
      <RouterLink to="/settings" class="btn btn--primary">前往设置</RouterLink>
    </template>
  </div>
</template>

<style scoped>
.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 64px 24px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  text-align: center;
}

.state-panel__icon {
  font-size: 28px;
  margin: 0;
}

.state-panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.state-panel__text {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  max-width: 420px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(246, 130, 31, 0.25);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

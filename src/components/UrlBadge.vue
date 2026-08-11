<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  url: string
}>()

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 剪贴板权限被拒绝时静默忽略
  }
}
</script>

<template>
  <span class="url-badge">
    <a :href="url" target="_blank" rel="noopener noreferrer" class="url-badge__link">
      {{ url }}
    </a>
    <button class="url-badge__copy" type="button" :class="{ copied }" @click="copy">
      {{ copied ? '✓ 已复制' : '复制' }}
    </button>
  </span>
</template>

<style scoped>
.url-badge {
  display: inline-flex;
  align-items: center;
  gap: 0;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface-3);
}

.url-badge__link {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--color-blue);
  padding: 4px 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}

.url-badge__link:hover {
  text-decoration: underline;
}

.url-badge__copy {
  border: none;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  font-size: 12px;
  padding: 4px 10px;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.url-badge__copy:hover {
  background: var(--color-surface-2-hover);
  color: var(--color-text);
}

.url-badge__copy.copied {
  background: rgba(47, 158, 110, 0.12);
  color: var(--color-green);
}
</style>

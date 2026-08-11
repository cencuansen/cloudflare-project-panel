<script setup lang="ts">
import { computed } from 'vue'
import UrlTags from './UrlTags.vue'

const props = defineProps<{
  name: string
  /** worker 或 pages */
  kind: 'worker' | 'pages'
  /** 默认访问地址（workers.dev / pages.dev） */
  primaryUrl: string | null
  /** 绑定的自定义域名 */
  customDomains: string[]
  modifiedOn: string
}>()

function formatTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', { hour12: false })
}

const kindLabel = props.kind === 'worker' ? 'Worker' : 'Pages'

/** 访问地址与自定义域名合并为一个胶囊列表，不再区分 */
const urls = computed<string[]>(() => {
  const list: string[] = []
  if (props.primaryUrl) list.push(props.primaryUrl)
  for (const d of props.customDomains) list.push(`https://${d}`)
  return list
})
</script>

<template>
  <article class="card" :class="`card--${kind}`">
    <header class="card__head">
      <span class="card__kind" :class="`card__kind--${kind}`">{{ kindLabel }}</span>
      <h3 class="card__name" :title="name">{{ name }}</h3>
      <span class="card__time" :title="`最近修改：${formatTime(modifiedOn)}`">
        {{ formatTime(modifiedOn) }}
      </span>
    </header>

    <div class="card__body">
      <UrlTags v-if="urls.length" :urls="urls" />
      <span v-else class="card__empty">暂无访问地址与域名</span>
    </div>
  </article>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-lg);
}

.card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.card__kind {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
}

.card__kind--worker {
  background: rgba(246, 130, 31, 0.14);
  color: var(--color-primary-strong);
}

.card__kind--pages {
  background: rgba(47, 111, 219, 0.12);
  color: var(--color-blue);
}

.card__name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.card__empty {
  font-size: 13px;
  color: var(--color-text-muted);
}

@media (max-width: 720px) {
  .card {
    padding: 12px 14px;
    gap: 12px;
  }
}
</style>

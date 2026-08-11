<script setup lang="ts">
import DomainTags from './DomainTags.vue'
import UrlBadge from './UrlBadge.vue'

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
      <div class="row">
        <span class="row__label">访问地址</span>
        <UrlBadge v-if="primaryUrl" :url="primaryUrl" />
        <span v-else class="row__value row__value--muted">未启用 workers.dev 子域名</span>
      </div>

      <div class="row">
        <span class="row__label">自定义域名</span>
        <div class="row__value">
          <DomainTags :domains="customDomains" />
        </div>
      </div>
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

.row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.row__label {
  flex-shrink: 0;
  width: 74px;
  font-size: 12.5px;
  color: var(--color-text-muted);
  line-height: 24px;
}

.row__value {
  min-width: 0;
  font-size: 13px;
}

.row__value--muted {
  color: var(--color-text-muted);
}
</style>

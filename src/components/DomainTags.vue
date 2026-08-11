<script setup lang="ts">
defineProps<{
  domains: string[]
}>()
</script>

<template>
  <span v-if="domains.length" class="domain-tags">
    <a
      v-for="d in domains"
      :key="d"
      :href="`https://${d}`"
      target="_blank"
      rel="noopener noreferrer"
      class="domain-tag"
    >
      {{ d }}
    </a>
  </span>
  <span v-else class="domain-empty">未配置自定义域名</span>
</template>

<style scoped>
.domain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.domain-tag {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 2px 10px;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
}

.domain-tag:hover {
  color: var(--color-blue);
  border-color: var(--color-blue);
  text-decoration: none;
}

.domain-empty {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>

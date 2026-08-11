<script setup lang="ts">
defineProps<{
  /** 完整 URL 列表（含协议），逐个渲染为胶囊标签 */
  urls: string[]
}>()
</script>

<template>
  <span class="url-tags">
    <a
      v-for="u in urls"
      :key="u"
      :href="u"
      target="_blank"
      rel="noopener noreferrer"
      class="url-tag"
    >
      {{ u }}
    </a>
  </span>
</template>

<style scoped>
.url-tags {
  /* 纵向排列：每个地址独占一行 */
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.url-tag {
  /* 单行显示：胶囊内容不折行，超出部分省略；宽度贴合内容 */
  align-self: flex-start;
  max-width: 100%;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.url-tag:hover {
  color: var(--color-blue);
  border-color: var(--color-blue);
  text-decoration: none;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalPages: number
  /** 加载中时禁用翻页 */
  disabled?: boolean
}>()

const emit = defineEmits<{ change: [page: number] }>()

function go(n: number | '…'): void {
  if (typeof n !== 'number') return
  if (n < 1 || n > props.totalPages || n === props.page || props.disabled) return
  emit('change', n)
}

/** 页码窗口：首尾固定，当前页前后各 1 页，中间用 … 省略 */
const pageList = computed<Array<number | '…'>>(() => {
  const total = props.totalPages
  const cur = props.page
  const list: Array<number | '…'> = [1]
  const push = (n: number) => {
    if (list[list.length - 1] !== n) list.push(n)
  }
  if (cur > 3) list.push('…')
  for (let n = Math.max(2, cur - 1); n <= Math.min(total - 1, cur + 1); n++) push(n)
  if (cur < total - 2) list.push('…')
  if (total > 1) push(total)
  return list
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="分页">
    <button
      class="pagination__btn"
      type="button"
      :disabled="disabled || page <= 1"
      @click="go(page - 1)"
    >
      ‹ 上一页
    </button>

    <button
      v-for="(p, i) in pageList"
      :key="i"
      class="pagination__btn"
      :class="{
        'pagination__btn--active': p === page,
        'pagination__btn--ellipsis': p === '…',
      }"
      type="button"
      :disabled="disabled || p === '…'"
      @click="go(p)"
    >
      {{ p }}
    </button>

    <button
      class="pagination__btn"
      type="button"
      :disabled="disabled || page >= totalPages"
      @click="go(page + 1)"
    >
      下一页 ›
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 24px;
}

.pagination__btn {
  min-width: 32px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.pagination__btn:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-text);
}

.pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

.pagination__btn--active:hover:not(:disabled) {
  background: var(--color-primary-strong);
  border-color: var(--color-primary-strong);
}

.pagination__btn--ellipsis {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-muted);
}
</style>

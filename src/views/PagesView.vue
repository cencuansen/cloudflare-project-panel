<script setup lang="ts">
import { onMounted } from 'vue'
import Pagination from '@/components/Pagination.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useCloudflare } from '@/composables/useCloudflare'

const {
  pages,
  pagesLoading,
  pagesError,
  pagesPage,
  pagesTotal,
  pagesTotalPages,
  pagesLastUpdated,
  isConfigured,
  loadPages,
  setPagesPage,
} = useCloudflare()

onMounted(() => {
  loadPages().catch(() => {
    // 错误信息已记录在 composable 的状态中
  })
})

function formatLastUpdated(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
}
</script>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Pages</h1>
        <p v-if="pagesLastUpdated" class="page-sub">
          上次更新 {{ formatLastUpdated(pagesLastUpdated) }}
        </p>
      </div>
      <div class="page-head__actions">
        <!-- total_count 缺失时回退显示当前页条数 -->
        <span v-if="pages.length" class="count-badge">{{ pagesTotal || pages.length }} 个项目</span>
        <button class="btn btn--primary" :disabled="pagesLoading || !isConfigured" @click="loadPages()">
          {{ pagesLoading ? '加载中…' : '刷新' }}
        </button>
      </div>
    </header>

    <!-- 首次加载：无数据时显示加载面板 -->
    <StatePanel v-if="pagesLoading && pages.length === 0" type="loading" />
    <StatePanel v-else-if="pagesError" type="error" :message="pagesError" @retry="loadPages()" />
    <StatePanel v-else-if="!isConfigured" type="unconfigured" />
    <!-- 以当前页列表是否为空判断，不依赖可能缺失的 result_info.total_count -->
    <StatePanel v-else-if="pages.length === 0" type="empty" message="当前账户下没有已部署的 Pages 项目" />

    <template v-else>
      <div class="card-grid">
        <ProjectCard
          v-for="p in pages"
          :key="p.id"
          :name="p.name"
          kind="pages"
          :primary-url="p.subdomain"
          :custom-domains="p.customDomains"
          :modified-on="p.modifiedOn"
        />
      </div>

      <Pagination
        :page="pagesPage"
        :total-pages="pagesTotalPages"
        :disabled="pagesLoading"
        @change="setPagesPage"
      />
    </template>
  </section>
</template>

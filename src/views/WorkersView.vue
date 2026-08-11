<script setup lang="ts">
import { onMounted } from 'vue'
import Pagination from '@/components/Pagination.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import StatePanel from '@/components/StatePanel.vue'
import { useCloudflare } from '@/composables/useCloudflare'

const {
  workers,
  workersLoading,
  workersError,
  workersWarning,
  workersPage,
  workersTotal,
  workersTotalPages,
  workersLastUpdated,
  isConfigured,
  loadWorkers,
  setWorkersPage,
} = useCloudflare()

onMounted(() => {
  loadWorkers().catch(() => {
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
        <h1 class="page-title">Workers</h1>
        <p v-if="workersLastUpdated" class="page-sub">
          上次更新 {{ formatLastUpdated(workersLastUpdated) }}
        </p>
      </div>
      <div class="page-head__actions">
        <!-- total_count 缺失时回退显示当前页条数 -->
        <span v-if="workers.length" class="count-badge">{{ workersTotal || workers.length }} 个脚本</span>
        <button class="btn btn--primary" :disabled="workersLoading || !isConfigured" @click="loadWorkers()">
          {{ workersLoading ? '加载中…' : '刷新' }}
        </button>
      </div>
    </header>

    <!-- 部分数据因缺少权限未能获取时的提醒 -->
    <p v-if="workersWarning" class="warning-banner">{{ workersWarning }}</p>

    <!-- 首次加载：无数据时显示加载面板 -->
    <StatePanel v-if="workersLoading && workers.length === 0" type="loading" />
    <StatePanel v-else-if="workersError" type="error" :message="workersError" @retry="loadWorkers()" />
    <StatePanel v-else-if="!isConfigured" type="unconfigured" />
    <!-- 以当前页列表是否为空判断，不依赖可能缺失的 result_info.total_count -->
    <StatePanel v-else-if="workers.length === 0" type="empty" message="当前账户下没有已部署的 Worker 脚本" />

    <template v-else>
      <div class="card-grid">
        <ProjectCard
          v-for="w in workers"
          :key="w.id"
          :name="w.name"
          kind="worker"
          :primary-url="w.workersDevUrl"
          :custom-domains="w.customDomains"
          :modified-on="w.modifiedOn"
        />
      </div>

      <Pagination
        :page="workersPage"
        :total-pages="workersTotalPages"
        :disabled="workersLoading"
        @change="setWorkersPage"
      />
    </template>
  </section>
</template>

import { computed, ref } from 'vue'
import {
  fetchPagesProjectsPage,
  fetchWorkerCustomDomains,
  fetchWorkerSubdomains,
  fetchWorkersPage,
} from '@/api/cloudflare'
import type {
  CFConfig,
  PagesProject,
  PagesProjectItem,
  WorkerCustomDomain,
  WorkerItem,
  WorkerScript,
} from '@/types/cloudflare'

const STORAGE_KEY = 'cf-panel:config'

function loadConfig(): CFConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.accountId === 'string' && typeof parsed?.apiToken === 'string') {
        return { accountId: parsed.accountId, apiToken: parsed.apiToken }
      }
    }
  } catch {
    // 解析失败时忽略，返回空配置
  }
  return { accountId: '', apiToken: '' }
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** 账号配置（持久化到 localStorage） */
const config = ref<CFConfig>(loadConfig())

/** 是否已配置账号 */
const isConfigured = computed(
  () => Boolean(config.value.accountId.trim()) && Boolean(config.value.apiToken.trim()),
)

// ---------------- Workers 分页状态 ----------------
/** 当前页的 Worker 列表 */
const workers = ref<WorkerItem[]>([])
const workersLoading = ref(false)
const workersError = ref<string | null>(null)
const workersWarning = ref<string | null>(null)
/** 当前页码 */
const workersPage = ref(1)
/** 全部 Worker 数量（跨页总数） */
const workersTotal = ref(0)
/** 总页数 */
const workersTotalPages = ref(0)
const workersLastUpdated = ref<number | null>(null)

// ---------------- Pages 分页状态 ----------------
/** 当前页的 Pages 项目列表 */
const pages = ref<PagesProjectItem[]>([])
const pagesLoading = ref(false)
const pagesError = ref<string | null>(null)
const pagesPage = ref(1)
/** 全部 Pages 项目数量（跨页总数） */
const pagesTotal = ref(0)
/** 总页数 */
const pagesTotalPages = ref(0)
const pagesLastUpdated = ref<number | null>(null)

function saveConfig(next: CFConfig): void {
  config.value = { accountId: next.accountId.trim(), apiToken: next.apiToken.trim() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
}

/** 把当前页的 Worker 脚本、自定义域名、workers.dev 地址聚合成展示模型 */
function buildWorkerItems(
  scripts: WorkerScript[],
  customDomains: WorkerCustomDomain[],
  urlByScript: Map<string, string>,
): WorkerItem[] {
  const domainByService = new Map<string, string[]>()
  for (const d of customDomains) {
    const list = domainByService.get(d.service) ?? []
    list.push(d.hostname)
    domainByService.set(d.service, list)
  }

  return scripts.map((s) => ({
    name: s.id,
    id: s.id,
    createdOn: s.created_on,
    modifiedOn: s.modified_on,
    workersDevUrl: urlByScript.get(s.id) ?? null,
    customDomains: domainByService.get(s.id) ?? [],
  }))
}

function buildPagesItems(projects: PagesProject[]): PagesProjectItem[] {
  return projects.map((p) => ({
    name: p.name,
    id: p.id,
    subdomain: p.subdomain,
    customDomains: p.domains ?? [],
    modifiedOn: p.modified_on,
  }))
}

/** 拉取指定页的 Worker（含访问地址、自定义域名），并更新分页元数据 */
async function loadWorkersPage(page: number): Promise<boolean> {
  if (!isConfigured.value) {
    workersError.value = '请先在「设置」中填写 Cloudflare Account ID 与 API Token'
    return false
  }

  workersLoading.value = true
  workersError.value = null
  workersWarning.value = null
  try {
    const { items, totalCount, totalPages } = await fetchWorkersPage(config.value, page)
    const scriptNames = items.map((s) => s.id)
    const [urlsRes, domainsRes] = await Promise.allSettled([
      fetchWorkerSubdomains(config.value, scriptNames),
      fetchWorkerCustomDomains(config.value),
    ])

    const urlsData =
      urlsRes.status === 'fulfilled'
        ? urlsRes.value
        : { urls: new Map<string, string>(), accountSubdomainDenied: false }

    workers.value = buildWorkerItems(
      items,
      domainsRes.status === 'fulfilled' ? domainsRes.value : [],
      urlsData.urls,
    )
    workersPage.value = page
    workersTotal.value = totalCount
    workersTotalPages.value = totalPages
    workersLastUpdated.value = Date.now()

    const missing: string[] = []
    if (urlsData.accountSubdomainDenied && urlsData.urls.size === 0) {
      missing.push('Workers Subdomain 权限（workers.dev 访问地址）')
    }
    if (domainsRes.status === 'rejected') {
      missing.push('Workers Custom Domains 权限（Worker 自定义域名）')
    }
    if (missing.length) {
      workersWarning.value = `以下数据因缺少相应权限未能获取：${missing.join('、')}。不影响 Worker 列表展示。`
    }
    return true
  } catch (e) {
    workersError.value = toMessage(e)
    return false
  } finally {
    workersLoading.value = false
  }
}

/** 拉取指定页的 Pages 项目，并更新分页元数据 */
async function loadPagesPage(page: number): Promise<boolean> {
  if (!isConfigured.value) {
    pagesError.value = '请先在「设置」中填写 Cloudflare Account ID 与 API Token'
    return false
  }

  pagesLoading.value = true
  pagesError.value = null
  try {
    const { items, totalCount, totalPages } = await fetchPagesProjectsPage(config.value, page)
    pages.value = buildPagesItems(items)
    pagesPage.value = page
    pagesTotal.value = totalCount
    pagesTotalPages.value = totalPages
    pagesLastUpdated.value = Date.now()
    return true
  } catch (e) {
    pagesError.value = `${toMessage(e)}。拉取 Pages 需要「Account → Pages Projects」只读权限（注意：不是「Account Custom Pages」，后者是自定义错误页权限）。`
    return false
  } finally {
    pagesLoading.value = false
  }
}

/** 首次加载：重置到第 1 页，Worker 与 Pages 并行拉取（某一项失败不影响另一项） */
async function loadData(): Promise<void> {
  if (!isConfigured.value) {
    workersError.value = '请先在「设置」中填写 Cloudflare Account ID 与 API Token'
    pagesError.value = '请先在「设置」中填写 Cloudflare Account ID 与 API Token'
    return
  }
  await Promise.allSettled([loadWorkersPage(1), loadPagesPage(1)])
}

/** 翻到指定页（Workers） */
function setWorkersPage(page: number): Promise<boolean> {
  return loadWorkersPage(page)
}

/** 翻到指定页（Pages） */
function setPagesPage(page: number): Promise<boolean> {
  return loadPagesPage(page)
}

export function useCloudflare() {
  return {
    config,
    isConfigured,
    saveConfig,
    loadData,
    // Workers
    workers,
    workersLoading,
    workersError,
    workersWarning,
    workersPage,
    workersTotal,
    workersTotalPages,
    workersLastUpdated,
    loadWorkers: (): Promise<boolean> => loadWorkersPage(1),
    setWorkersPage,
    // Pages
    pages,
    pagesLoading,
    pagesError,
    pagesPage,
    pagesTotal,
    pagesTotalPages,
    pagesLastUpdated,
    loadPages: (): Promise<boolean> => loadPagesPage(1),
    setPagesPage,
  }
}

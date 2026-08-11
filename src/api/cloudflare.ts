import type {
  CFConfig,
  PagesProject,
  WorkerCustomDomain,
  WorkerScript,
  WorkersSubdomain,
} from '@/types/cloudflare'

/**
 * Cloudflare API 统一入口，始终走同源代理 /cf-api：
 * - 开发环境：由 Vite dev/preview 服务器代理转发到 api.cloudflare.com；
 * - 生产环境：由 Cloudflare Pages Functions（functions/cf-api/[[path]].ts）转发。
 * 之所以需要代理，是因为 api.cloudflare.com 不返回 CORS 头，浏览器无法直连。
 */
const API_BASE = '/cf-api'

interface CFResponse<T> {
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages?: string[]
  result: T
  result_info?: {
    page: number
    per_page: number
    count: number
    total_count: number
    total_pages: number
  }
}

async function cfGet<T>(config: CFConfig, path: string): Promise<CFResponse<T>> {
  const url = `${API_BASE}/accounts/${encodeURIComponent(config.accountId)}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let detail = body
    try {
      const json = JSON.parse(body) as { errors?: Array<{ message?: string }> }
      const msgs = json.errors?.map((e) => e.message).filter(Boolean).join('；')
      if (msgs) detail = msgs
    } catch {
      // body 不是 JSON 时保留原文
    }
    throw new Error(`Cloudflare API 请求失败（HTTP ${res.status}）：${detail || '未知错误'}`)
  }

  const data = (await res.json()) as CFResponse<T>
  if (!data.success) {
    const msg = data.errors?.map((e) => e.message).join('；') || '未知错误'
    throw new Error(`Cloudflare API 返回错误：${msg}`)
  }
  return data
}

/** 单页拉取结果：当前页条目 + 分页元数据（total_count / total_pages） */
export interface PageResult<T> {
  items: T[]
  totalCount: number
  totalPages: number
}

/**
 * 拉取指定页的 Worker 脚本（按需分页）。
 * 与 Pages 接口一致：`per_page` 上限为 10，这里不传 `per_page`（默认即为 10），
 * 只按 `page` 翻页，总页数在返回的 `result_info.total_pages` 中。
 */
export async function fetchWorkersPage(
  config: CFConfig,
  page: number,
): Promise<PageResult<WorkerScript>> {
  const { result, result_info } = await cfGet<WorkerScript[]>(
    config,
    `/workers/scripts?page=${page}`,
  )
  return {
    items: result ?? [],
    totalCount: result_info?.total_count ?? 0,
    totalPages: result_info?.total_pages ?? 0,
  }
}

/** 获取账户级 workers.dev 子域名（用于拼装每个 Worker 的访问地址） */
export async function fetchWorkersSubdomain(config: CFConfig): Promise<string | null> {
  try {
    const { result } = await cfGet<WorkersSubdomain>(config, '/workers/subdomain')
    return result?.subdomain ?? null
  } catch {
    // 缺少 Workers Subdomain 权限或账户未启用时，返回 null（由上层决定降级方式）
    return null
  }
}

/** 并发控制工具：限制同时进行的异步任务数 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/**
 * 推导每个 Worker 的 workers.dev 访问地址。
 * 优先使用账户级子域名（一次请求推导全部）；账户级接口不可用时（例如缺少
 * Workers Subdomain 权限），降级为逐个查询脚本级子域名——该接口归
 * 「Workers Scripts」权限管辖，因此仅配置 Workers Scripts 权限的账户也能生效。
 * 返回是否发生了降级，供上层提示。
 */
export async function fetchWorkerSubdomains(
  config: CFConfig,
  scriptNames: string[],
): Promise<{ urls: Map<string, string>; accountSubdomainDenied: boolean }> {
  const urls = new Map<string, string>()
  if (scriptNames.length === 0) return { urls, accountSubdomainDenied: false }

  let accountSubdomainDenied = false
  let accountSubdomain: string | null = null
  try {
    const { result } = await cfGet<WorkersSubdomain>(config, '/workers/subdomain')
    accountSubdomain = result?.subdomain ?? null
  } catch {
    accountSubdomainDenied = true
  }

  if (accountSubdomain) {
    for (const name of scriptNames) {
      urls.set(name, `https://${name}.${accountSubdomain}.workers.dev`)
    }
    return { urls, accountSubdomainDenied: false }
  }

  // 降级：并发 6 个逐个查询脚本级子域名
  const results = await mapWithConcurrency(scriptNames, 6, async (name) => {
    try {
      const { result } = await cfGet<{ enabled?: boolean; subdomain?: string }>(
        config,
        `/workers/scripts/${encodeURIComponent(name)}/subdomain`,
      )
      return result?.enabled && result.subdomain ? result.subdomain : null
    } catch {
      return null
    }
  })
  scriptNames.forEach((name, i) => {
    const subdomain = results[i]
    if (subdomain) urls.set(name, subdomain)
  })
  return { urls, accountSubdomainDenied }
}

/** 获取所有绑定到 Worker 的自定义域名 */
export async function fetchWorkerCustomDomains(config: CFConfig): Promise<WorkerCustomDomain[]> {
  try {
    const { result } = await cfGet<WorkerCustomDomain[]>(config, '/workers/domains')
    return result ?? []
  } catch {
    return []
  }
}

/**
 * 拉取指定页的 Pages 项目（按需分页）。
 * 注意：该接口每页最多返回 10 个项目，per_page 超过上限会报 8000024
 * Invalid list options；这里不传 per_page（默认即为 10），只按 page 翻页，
 * 总页数在返回的 result_info.total_pages 中。
 */
export async function fetchPagesProjectsPage(
  config: CFConfig,
  page: number,
): Promise<PageResult<PagesProject>> {
  const { result, result_info } = await cfGet<PagesProject[]>(
    config,
    `/pages/projects?page=${page}`,
  )
  return {
    items: result ?? [],
    totalCount: result_info?.total_count ?? 0,
    totalPages: result_info?.total_pages ?? 0,
  }
}

/**
 * 校验 API Token 是否有效（调用获取用户信息接口）。
 * 用于设置页的“测试连接”。会尽量展示 Cloudflare 返回的具体错误信息。
 */
export async function verifyToken(config: CFConfig): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/user/tokens/verify`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
    })
    const body = await res.text().catch(() => '')
    let detail = ''
    try {
      const json = JSON.parse(body) as {
        errors?: Array<{ message?: string }>
        result?: { status?: string }
      }
      detail = json.errors?.map((e) => e.message).filter(Boolean).join('；') ?? ''
      if (res.ok && json.result?.status === 'active') {
        return { success: true, message: 'Token 有效' }
      }
    } catch {
      // body 不是 JSON 时忽略
    }
    return { success: false, message: `HTTP ${res.status}${detail ? `：${detail}` : ''}` }
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : String(e) }
  }
}

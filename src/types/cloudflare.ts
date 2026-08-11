/** 用户在设置页中填入的 Cloudflare 账号信息 */
export interface CFConfig {
  /** Cloudflare 账户 ID（Account ID） */
  accountId: string
  /** API Token，需要以下权限：Worker Scripts / Pages / Custom Domains 只读 */
  apiToken: string
}

/** GET /accounts/{id}/workers/scripts 返回的单条 Worker 脚本 */
export interface WorkerScript {
  id: string
  created_on: string
  modified_on: string
  etag: string
  usage_model?: string
  /** 通过 Workers for Platforms 创建的脚本才有，普通脚本为空数组 */
  placement?: unknown
}

/** GET /accounts/{id}/workers/subdomain 返回的结果 */
export interface WorkersSubdomain {
  subdomain: string
}

/** GET /accounts/{id}/workers/domains 返回的单条自定义域名 */
export interface WorkerCustomDomain {
  id: string
  zone_id: string
  zone_name: string
  hostname: string
  service: string
  /** 环境名，对应脚本下的某个部署环境（production 或 preview） */
  environment: string
}

/** GET /accounts/{id}/pages/projects 返回的单条 Pages 项目 */
export interface PagesProject {
  id: string
  name: string
  subdomain: string
  domains: string[]
  created_on: string
  modified_on: string
  source?: {
    type: string
    config: {
      owner?: string
      repo_name?: string
      production_branch?: string
    }
  }
  latest_deployment?: {
    id: string
    url: string
    environment: string
    created_on: string
  }
}

/* ---------------- 供视图层使用的聚合模型 ---------------- */

export interface WorkerItem {
  name: string
  id: string
  createdOn: string
  modifiedOn: string
  /** workers.dev 访问地址，例如 https://my-worker.my-subdomain.workers.dev */
  workersDevUrl: string | null
  /** 绑定的自定义域名列表 */
  customDomains: string[]
}

export interface PagesProjectItem {
  name: string
  id: string
  /** pages.dev 访问地址，例如 https://my-project.pages.dev */
  subdomain: string
  /** 绑定的自定义域名列表 */
  customDomains: string[]
  modifiedOn: string
}

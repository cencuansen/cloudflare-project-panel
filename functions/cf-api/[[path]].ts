/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Pages Functions 同源代理。
 *
 * 生产环境（部署到 Pages 后）浏览器无法直接跨域访问 api.cloudflare.com
 * （该 API 不返回 CORS 头），因此把 `/cf-api/**` 的所有请求转发到
 * `https://api.cloudflare.com/client/v4/**`，由同源服务器代发。
 *
 * 两种 Token 提供方式（二选一）：
 * 1. 前端页面请求时携带 `Authorization` 头（默认，Token 保存在浏览器 localStorage）；
 * 2. 设置环境变量 secret `CF_API_TOKEN`，前端无需携带，由本函数注入。
 */
interface Env {
  CF_API_TOKEN?: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context

  // 剩余路径（不含 /cf-api 前缀），[[path]] 会得到字符串数组
  const segments = Array.isArray(params.path) ? params.path : params.path ? [params.path] : []
  const path = segments.map(encodeURIComponent).join('/')
  const search = new URL(request.url).search

  const target = `https://api.cloudflare.com/client/v4/${path}${search}`

  // 透传前端携带的 Authorization 头；若未携带，则回退到环境变量中的 secret
  let auth = request.headers.get('Authorization') ?? ''
  if (!auth && env.CF_API_TOKEN) auth = `Bearer ${env.CF_API_TOKEN}`

  const headers = new Headers()
  if (auth) headers.set('Authorization', auth)
  const contentType = request.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  const resp = await fetch(target, init)

  // 透传响应（同源请求其实不需要 CORS 头，这里一并加上以备扩展）
  const outHeaders = new Headers(resp.headers)
  outHeaders.set('Access-Control-Allow-Origin', '*')
  outHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  outHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: outHeaders,
  })
}

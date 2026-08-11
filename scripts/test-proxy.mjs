// 临时验证脚本：直接调用 Pages Function 的 onRequest，测试 /cf-api 代理转发逻辑。
// 用法：node --experimental-strip-types scripts/test-proxy.mjs
import { fileURLToPath, pathToFileURL } from 'node:url'

const fnUrl = new URL('../functions/cf-api/[[path]].ts', import.meta.url)
const { onRequest } = await import(pathToFileURL(fileURLToPath(fnUrl)).href)

// 场景 1：验证 token（/user/tokens/verify 不在 /accounts/{id} 前缀下）
{
  const req = new Request('http://localhost/cf-api/user/tokens/verify', {
    method: 'GET',
    headers: { Authorization: 'Bearer invalid-token' },
  })
  const ctx = { request: req, env: {}, params: { path: ['user', 'tokens', 'verify'] } }
  const res = await onRequest(ctx)
  console.log('[verify-token] status:', res.status)
  console.log('[verify-token] body:', (await res.text()).slice(0, 300))
}

// 场景 2：账户下 worker 列表（/accounts/{id}/workers/scripts）
{
  const req = new Request(
    'http://localhost/cf-api/accounts/invalid-account/workers/scripts?per_page=100&page=1',
    { method: 'GET', headers: { Authorization: 'Bearer invalid-token' } },
  )
  const ctx = {
    request: req,
    env: {},
    params: { path: ['accounts', 'invalid-account', 'workers', 'scripts'] },
  }
  const res = await onRequest(ctx)
  console.log('[workers-list] status:', res.status)
  console.log('[workers-list] body:', (await res.text()).slice(0, 300))
}

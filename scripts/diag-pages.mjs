// 诊断 Cloudflare Pages / Workers 列表接口的真实分页行为。
// 用法（Git Bash）：
//   CF_ACCOUNT_ID=你的账户ID CF_API_TOKEN=你的Token node scripts/diag-pages.mjs
// 或（PowerShell）：
//   $env:CF_ACCOUNT_ID="你的账户ID"; $env:CF_API_TOKEN="你的Token"; node scripts/diag-pages.mjs
// Token 只在本机发出请求，不会上传到任何地方。
const accountId = process.env.CF_ACCOUNT_ID
const token = process.env.CF_API_TOKEN
if (!accountId || !token) {
  console.error('请先设置 CF_ACCOUNT_ID 和 CF_API_TOKEN 环境变量')
  process.exit(1)
}

const BASE = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`
const headers = { Authorization: `Bearer ${token}` }

async function probe(label, url) {
  const res = await fetch(url, { headers })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // 非 JSON 响应
  }
  console.log(`\n=== ${label} ===`)
  console.log(`HTTP ${res.status}`)
  if (!json) {
    console.log('body(前 300 字):', text.slice(0, 300))
    return
  }
  console.log('success:', json.success, '| errors:', JSON.stringify(json.errors ?? []))
  if (Array.isArray(json.result)) {
    console.log('result 条数:', json.result.length)
    console.log('result_info:', JSON.stringify(json.result_info))
    if (json.result.length) {
      console.log('前 3 条:', json.result.slice(0, 3).map((r) => r.id || r.name).join(', '))
    }
  } else {
    console.log('result:', JSON.stringify(json.result)?.slice(0, 300))
  }
}

// ---- Pages ----
console.log('\n########## PAGES ##########')
await probe('P1 pages 不带参数', `${BASE}/pages/projects`)
await probe('P2 pages?page=2', `${BASE}/pages/projects?page=2`)
await probe('P3 pages?per_page=10&page=1', `${BASE}/pages/projects?per_page=10&page=1`)

// ---- Workers ----
console.log('\n########## WORKERS ##########')
await probe('W1 workers 不带参数', `${BASE}/workers/scripts`)
await probe('W2 workers?per_page=100&page=1', `${BASE}/workers/scripts?per_page=100&page=1`)
await probe('W3 workers?per_page=10&page=1', `${BASE}/workers/scripts?per_page=10&page=1`)
await probe('W4 workers?page=1', `${BASE}/workers/scripts?page=1`)

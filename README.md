# Cloudflare Project Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一个基于 **Vite + Vue 3 + TypeScript** 的 Cloudflare 账户资源管理面板。

主要功能：

- 读取当前 Cloudflare 账户下已部署的 **Workers** 与 **Pages**，分开展示；
- 每个项目展示**访问地址**（`workers.dev` / `pages.dev`）与配置的**自定义域名**；
- 列表**按需分页**：每页 10 条，翻页时才向 API 请求对应页（接口每页上限 10）；
- 支持**浅色 / 深色 / 跟随系统**三种主题，右上角按钮一键切换；
- 设置页填写 Account ID 与 API Token 后即可使用，Token 仅保存在浏览器本地。

## 技术栈

- Vite + Vue 3（组件全部使用**组合式 API**）
- Vue Router 4
- TypeScript
- 路径别名：`@` → `src`

## 本地开发

```bash
npm install
npm run dev
```

开发环境会通过 Vite 代理把 `/cf-api` 转发到 `https://api.cloudflare.com/client/v4`，避免跨域问题。

## 使用说明

1. 打开应用，进入「设置」页面；
2. 填写 **Account ID**（Cloudflare 控制台右侧「API」区域）；
3. 在 [API Tokens](https://dash.cloudflare.com/profile/api-tokens) 页面创建 Token，勾选以下权限：

   **必需（两项即可跑通核心功能）：**

   - **Account → Workers Scripts** → `Read`（读取 Worker 列表，以及脚本级子域名接口）
   - **Account → Cloudflare Pages** → `Read`（读取 Pages 列表及其自定义域名）

   > ⚠️ 注意：Pages 的权限在控制台里叫 **Cloudflare Pages**，**不是** **Account Custom Pages**——后者是"自定义错误页"的权限，与 Pages 托管无关。

   **可选（缺省时仅对应字段显示"未配置"，不影响列表）：**

   - Account → Workers Subdomain → `Read`（用账户级接口一次性推导全部 workers.dev 访问地址）
   - Account → Workers Custom Domains → `Read`（显示 Worker 绑定的自定义域名）

4. 点击「测试连接」验证 Token，再「保存并加载」即可查看 Workers / Pages 列表。

> ⚠️ Token 仅保存在浏览器 `localStorage`，不会上传到任何服务。请为 Token 限定最小权限。

> 💡 workers.dev 访问地址有自动降级：即使没有 Workers Subdomain 权限，代码会改为逐个调用脚本级子域名接口（该接口归 Workers Scripts 权限管辖，并发 6 个查询），所以仅配以上两项必需权限也能显示访问地址。

## 部署到 Cloudflare Pages

```bash
npm run cf
```

该命令会先构建，再通过 wrangler 部署到 **panel** 项目（`main` 分支）。

## 关于 API 代理（重要）

`api.cloudflare.com` **不返回 CORS 头**，浏览器无法直接跨域访问，因此所有 API 请求统一走同源代理 `/cf-api`：

- **开发环境**：由 [vite.config.ts](vite.config.ts) 的 Vite 代理转发；
- **生产环境**：由 [functions/cf-api/[[path]].ts](functions/cf-api/[[path]].ts)（Cloudflare Pages Functions）转发到 `api.cloudflare.com/client/v4/**`。

Pages Functions 支持两种 Token 提供方式：

1. **默认**：前端请求携带 `Authorization` 头（Token 保存在浏览器 `localStorage`）；
2. **更安全（可选）**：把 Token 设为环境变量 secret，前端无需保存 Token：

   ```bash
   npx wrangler pages secret put CF_API_TOKEN
   ```

   设置后，前端即使不填 Token，代理函数也会自动注入。

## 故障排查

| 现象 | 原因 |
| --- | --- |
| 部署后页面报错 / `Failed to fetch` | 旧版本直连 `api.cloudflare.com` 被 CORS 拦截，重新执行 `npm run cf` 部署带 Pages Functions 的新版本即可 |
| 「测试连接」报 HTTP 401 | 多为 **Token 未绑定该账户**（错误码 9109）；无效/缺失 Token 实际返回的是 400，见下方踩坑记录 |
| 只显示前 10 个 Workers / Pages | 列表接口每页最多返回 10 条、`per_page` 上限为 10；现已改为按 `?page=N` 分页拉取 |
| Network 能看到接口返回了数据，页面却显示「暂无数据」 | 空状态误用了 `result_info.total_count` 判断，而部分接口的 `result_info` 不含该字段；现已改为按当前页列表实际长度判断 |
| `wrangler pages dev` 本地启动报 Workers runtime 错误 | 是本地 workerd 模拟器在这台 Windows 机器上的兼容问题，**不影响真实部署** |

## 排查用 curl（绕过面板直接问 Cloudflare）

```bash
# ① 验证 Token 本身是否有效（不依赖任何账户权限）
curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" -H "Authorization: Bearer <TOKEN>"

# ② 用 Account ID 拉一次 Workers 列表（判断账户作用域与权限）
curl -s "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/workers/scripts" -H "Authorization: Bearer <TOKEN>"
```

## 实战踩坑记录

1. **CORS**：`api.cloudflare.com` 不返回任何 CORS 头（预检 OPTIONS 直接 404），部署后浏览器直连必然被拦截，报 `Failed to fetch`。→ 用 Pages Functions 做同源代理解决，见上文「关于 API 代理」。
2. **权限命名混淆**：控制台里的 **Account Custom Pages** 是"自定义错误页"权限，与 Pages 托管无关；Pages 列表需要 **Cloudflare Pages** 权限。两者常常被搞混导致 Token 一直"没权限"。
3. **401 vs 400 的语义**：Cloudflare 对"无效/缺失 Token"返回 **400**（如 `Invalid format for Authorization header`）；对"Token 有效但无权访问该账户/资源"返回 **401**（错误码 9109 `Unauthorized to access requested resource`）。据此可用上面两条 curl 快速定位：①返回成功而②返回 9109，即 Token 的 Account Resources 没绑定该账户或 Account ID 填错。
4. **Workers / Pages 列表接口的分页**：`GET /workers/scripts` 与 `GET /pages/projects` 的 **`per_page` 上限都只有 10**（未写进文档），传更大的值（如 100）会返回 `8000024 Invalid list options provided`。两个接口行为一致：不传 `per_page` 默认即为 10。代码不传 `per_page`，只按 `?page=N` 请求当前页，总页数从返回的 `result_info.total_pages` 读取，翻页时按需请求对应页。

   衍生坑——**`result_info` 不一定含 `total_count`/`total_pages`**：如果页面用 `total_count` 判断"是否为空列表"，会出现在接口成功返回了数据、页面却显示"暂无数据"的怪现象。空状态应基于**当前页数组的实际长度**（`list.length === 0`）判断，计数徽章也要对 `total_count` 缺失做回退（显示当前页条数）。
5. **workers.dev 地址的权限降级**：账户级接口 `GET /workers/subdomain` 需要 Workers Subdomain 权限；但脚本级接口 `GET /workers/scripts/{name}/subdomain` 归 Workers Scripts 权限管辖。代码优先用账户级一次推导，失败后降级为并发查询脚本级（同时 6 个），因此仅配 Workers Scripts + Cloudflare Pages 两项权限也能显示访问地址。

## 许可协议

本项目基于 [MIT License](LICENSE) 开源，欢迎使用、修改与分发。

## 目录结构

```
├── src/
│   ├── api/            # Cloudflare API 请求封装
│   ├── assets/         # 全局样式
│   ├── components/     # 通用组件（卡片、地址徽章、域名标签、状态面板、分页）
│   ├── composables/    # useCloudflare（状态 + 数据聚合）、useTheme（浅色/深色/系统）
│   ├── router/         # 路由配置
│   ├── types/          # TypeScript 类型定义
│   └── views/          # Workers / Pages / Settings 视图
├── functions/
│   └── cf-api/[[path]].ts   # Pages Functions 同源 API 代理（生产环境绕开 CORS）
├── scripts/
│   ├── test-proxy.mjs       # 验证代理转发逻辑的临时脚本
│   └── diag-pages.mjs       # 诊断 Pages / Workers 分页行为的临时脚本（需传入 CF_ACCOUNT_ID / CF_API_TOKEN）
├── vite.config.ts      # 路径别名 + 开发代理
└── wrangler.toml       # Cloudflare Pages 部署配置
```

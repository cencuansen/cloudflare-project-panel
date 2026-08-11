import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 把 /cf-api 代理到 Cloudflare API，避免 CORS 问题。
// dev 与 preview 共用同一份配置；生产环境则由 Pages Functions 承担同样职责。
const cfProxy = {
  '/cf-api': {
    target: 'https://api.cloudflare.com/client/v4',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/cf-api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 路径别名：@ -> src
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: cfProxy,
    port: 8800,
    // 允许内网其他设备通过局域网 IP 访问
    host: true,
    // 启动后自动打开浏览器
    open: true,
  },
  preview: {
    proxy: cfProxy,
  },
})

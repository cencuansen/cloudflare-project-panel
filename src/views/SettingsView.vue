<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { verifyToken } from '@/api/cloudflare'
import { useCloudflare } from '@/composables/useCloudflare'
import type { CFConfig } from '@/types/cloudflare'

const router = useRouter()
const { config, saveConfig, loadData } = useCloudflare()

const accountId = ref(config.value.accountId)
const apiToken = ref(config.value.apiToken)

const statusMsg = ref<string | null>(null)
const statusType = ref<'ok' | 'error' | 'info'>('info')
const testing = ref(false)
const saving = ref(false)

function setStatus(msg: string, type: 'ok' | 'error' | 'info' = 'info') {
  statusMsg.value = msg
  statusType.value = type
}

async function testConnection() {
  const cfg: CFConfig = { accountId: accountId.value.trim(), apiToken: apiToken.value.trim() }
  if (!cfg.accountId || !cfg.apiToken) {
    setStatus('请先填写 Account ID 与 API Token', 'error')
    return
  }
  testing.value = true
  setStatus('正在验证 Token…')
  try {
    const { success, message } = await verifyToken(cfg)
    setStatus(message, success ? 'ok' : 'error')
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e), 'error')
  } finally {
    testing.value = false
  }
}

async function save() {
  const cfg: CFConfig = { accountId: accountId.value.trim(), apiToken: apiToken.value.trim() }
  if (!cfg.accountId || !cfg.apiToken) {
    setStatus('请先填写 Account ID 与 API Token', 'error')
    return
  }
  saving.value = true
  saveConfig(cfg)
  try {
    await loadData()
    setStatus('已保存配置并加载数据', 'ok')
    router.push('/workers')
  } catch {
    setStatus('已保存配置，但拉取数据失败，请检查 Token 权限', 'error')
  } finally {
    saving.value = false
  }
}

function clearConfig() {
  saveConfig({ accountId: '', apiToken: '' })
  accountId.value = ''
  apiToken.value = ''
  setStatus('已清空本地配置', 'info')
}
</script>

<template>
  <section class="settings">
    <header class="page-head">
      <div>
        <h1 class="page-title">设置</h1>
        <p class="page-sub">配置 Cloudflare 账号信息以读取账户下的 Workers 与 Pages</p>
      </div>
    </header>

    <div class="settings-grid">
      <form class="card form-card" @submit.prevent="save">
        <div class="field">
          <label class="field__label" for="accountId">Account ID</label>
          <input
            id="accountId"
            v-model="accountId"
            class="field__input"
            type="text"
            placeholder="例如 abc1234def5678gh90"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="field__hint">位于 Cloudflare 控制台右侧「API」区域的「Account ID」。</p>
        </div>

        <div class="field">
          <label class="field__label" for="apiToken">API Token</label>
          <input
            id="apiToken"
            v-model="apiToken"
            class="field__input"
            type="password"
            placeholder="粘贴 API Token"
            autocomplete="off"
            spellcheck="false"
          />
          <p class="field__hint">仅保存在浏览器 localStorage 中，不会上传到任何服务。</p>
        </div>

        <p v-if="statusMsg" class="status" :class="`status--${statusType}`">{{ statusMsg }}</p>

        <div class="form-actions">
          <button class="btn" type="button" :disabled="testing" @click="testConnection">
            {{ testing ? '验证中…' : '测试连接' }}
          </button>
          <button class="btn btn--danger" type="button" @click="clearConfig">清空配置</button>
          <button class="btn btn--primary" type="submit" :disabled="saving">
            {{ saving ? '保存中…' : '保存并加载' }}
          </button>
        </div>
      </form>

      <aside class="card help-card">
        <h2 class="help-card__title">API Token 权限要求</h2>
        <p class="help-card__text">
          在 <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer">Cloudflare API Tokens</a> 页面创建 Token，推荐使用「账户」级别的模板并勾选以下权限：
        </p>
        <ul class="help-card__list">
          <li><strong>Account → Workers Scripts</strong> → <code>Read</code>（必需：读取 Worker 列表）</li>
          <li>
            <strong>Account → Pages Projects</strong> → <code>Read</code>（必需：读取 Pages 列表）
            <br />
            <span class="help-card__warn">注意：不是「Account Custom Pages」，那是自定义错误页的权限</span>
          </li>
          <li><strong>Account → Workers Subdomain</strong> → <code>Read</code>（推荐：显示 workers.dev 访问地址）</li>
          <li><strong>Account → Workers Custom Domains</strong> → <code>Read</code>（推荐：显示 Worker 自定义域名）</li>
        </ul>
        <p class="help-card__note">
          即使缺少后两项权限，Workers 与 Pages 列表仍能正常展示，仅访问地址/自定义域名不显示（页面会给出提示）。
        </p>
        <p class="help-card__note">
          ⚠️ 出于安全考虑，请为 Token 限定「当前账户」范围并选择尽量小的权限。该面板仅做读取展示，无需写入权限。
        </p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
}

.field__input {
  font: inherit;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-3);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(246, 130, 31, 0.15);
}

.field__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.status {
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.status--info {
  background: var(--color-info-bg);
  color: var(--color-blue);
}

.status--ok {
  background: rgba(47, 158, 110, 0.1);
  color: var(--color-green);
}

.status--error {
  background: rgba(208, 68, 47, 0.1);
  color: var(--color-red);
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-actions .btn--primary {
  margin-left: auto;
}

.help-card__title {
  margin: 0 0 10px;
  font-size: 15px;
}

.help-card__text {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.help-card__list {
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.help-card__list li {
  margin: 4px 0;
}

.help-card__note {
  margin: 0;
  font-size: 12.5px;
  color: var(--color-text-muted);
}

.help-card__warn {
  color: var(--color-red);
  font-size: 12px;
}

@media (max-width: 760px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>

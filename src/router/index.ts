import { createRouter, createWebHistory } from 'vue-router'
import WorkersView from '@/views/WorkersView.vue'
import PagesView from '@/views/PagesView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/workers' },
    { path: '/workers', name: 'workers', component: WorkersView, meta: { title: 'Workers' } },
    { path: '/pages', name: 'pages', component: PagesView, meta: { title: 'Pages' } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } },
    { path: '/:pathMatch(.*)*', redirect: '/workers' },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · Cloudflare Project Panel` : 'Cloudflare Project Panel'
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 路由守卫
const requireAuth = (to: any, from: any, next: any) => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 公共路由
    {
      path: '/',
      redirect: '/market'
    },
    {
      path: '/market',
      name: 'market',
      component: () => import('@/views/MarketView.vue'),
      meta: { title: '大盘行情' }
    },
    // {
    //   path: '/stock/:code/realtime',
    //   name: 'stock-realtime',
    //   component: () => import('@/views/StockRealtimeView.vue'),
    //   props: true,
    //   meta: { title: '实时行情' }
    // },
    {
      path: '/stock/:id/info',
      name: 'stock-info',
      component: () => import('@/views/StockInfoView.vue'),
      props: true,
      meta: { title: '个股信息' }
    },

    // 游客专属路由
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '用户登录' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: '用户注册' }
    },

    // 登录用户专属路由
    // {
    //   path: '/dashboard',
    //   name: 'dashboard',
    //   component: () => import('@/views/DashboardView.vue'),
    //   beforeEnter: requireAuth,
    //   meta: { title: '用户主页' }
    // },
    {
      path: '/trade/:code',
      name: 'trade',
      component: () => import('@/views/TradeView.vue'),
      props: true,
      beforeEnter: requireAuth,
      meta: { title: '股票交易' }
    },
    // {
    //   path: '/portfolio',
    //   name: 'portfolio',
    //   component: () => import('@/views/PortfolioView.vue'),
    //   beforeEnter: requireAuth,
    //   meta: { title: '我的持仓' }
    // },
    // {
    //   path: '/transactions',
    //   name: 'transactions',
    //   component: () => import('@/views/TransactionsView.vue'),
    //   beforeEnter: requireAuth,
    //   meta: { title: '交易记录' }
    // },
    // {
    //   path: '/analysis',
    //   name: 'analysis',
    //   component: () => import('@/views/AnalysisView.vue'),
    //   beforeEnter: requireAuth,
    //   meta: { title: '账户分析' }
    // },
    // {
    //   path: '/stock-analysis/:code',
    //   name: 'stock-analysis',
    //   component: () => import('@/views/StockAnalysisView.vue'),
    //   props: true,
    //   beforeEnter: requireAuth,
    //   meta: { title: '个股盈亏分析' }
    // },

    // // 404 页面
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'not-found',
    //   component: () => import('@/views/NotFoundView.vue'),
    //   meta: { title: '页面未找到' }
    // }
  ],
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 股票交易系统`
  }
  next()
})

export default router

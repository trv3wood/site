<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)

// 计算属性
const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.user)

// 方法
const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  try {
    loading.value = true
    await api.auth.logout()
    userStore.logout()
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    loading.value = false
  }
}

// onMounted(async () => {
//   try {
//     const test = await api.client.apiRequest('/index')
//     console.log(test)
//   } catch (error) {
//     console.error('API测试失败:', error)
//   }
// })
</script>

<template>
  <div id="app">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </div>

    <!-- 主内容 -->
    <div v-show="!loading" class="app-content">
      <!-- 顶部导航 -->
      <header class="app-header">
        <div class="header-content">
          <h1 @click="goHome" class="app-title">股票交易系统</h1>
          <nav class="nav-links">
            <router-link to="/market">股票行情</router-link>

            <!-- 登录用户专属菜单 -->
            <template v-if="isLoggedIn">
              <router-link to="/trade">交易</router-link>
              <router-link to="/portfolio">我的持仓</router-link>
              <router-link to="/transactions">交易记录</router-link>
            </template>

            <!-- 游客菜单 -->
            <template v-else>
              <router-link to="/register">注册</router-link>
              <router-link to="/login">登录</router-link>
            </template>

            <!-- 登录用户信息 -->
            <div v-if="isLoggedIn" class="user-info">
              <span class="welcome-text">欢迎，{{ userInfo?.username || '用户' }}</span>
              <a href="#" @click.prevent="handleLogout" class="logout-link">退出</a>
            </div>
          </nav>
        </div>
      </header>

      <!-- 主内容区域 -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

/* 加载样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 应用内容 */
.app-content {
  min-height: 100vh;
}

/* 头部样式 */
.app-header {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.app-title {
  font-size: 1.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.app-title:hover {
  opacity: 0.8;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.nav-links a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-links a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
}

.welcome-text {
  font-size: 0.9rem;
  opacity: 0.9;
}

.logout-link {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: background-color 0.3s;
  cursor: pointer;
}

.logout-link:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 主内容 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .user-info {
    margin-left: 0;
    justify-content: center;
  }
}
</style>

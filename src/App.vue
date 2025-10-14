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
  router.push('/market')
}

const handleLogout = async () => {
  try {
    loading.value = true
    await api.auth.logout()
    userStore.logout()
    router.push('/market')
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
              <button @click="handleLogout" class="auth-btn logout-btn">退出</button>
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
  background-color: #f8f9fa;
  color: #495057;
}

/* 加载样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
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
  background: #f8f9fa;
}

/* 头部样式 - 淡色系 */
.app-header {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  color: #495057;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #dee2e6;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 70px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.app-title {
  font-size: 1.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #495057;
  margin: 0;
}

.app-title:hover {
  transform: translateY(-2px);
  color: #4dabf7;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  color: #495057;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: rgba(77, 171, 247, 0.1);
  border-color: rgba(77, 171, 247, 0.3);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: rgba(77, 171, 247, 0.15);
  border-color: rgba(77, 171, 247, 0.4);
  color: #4dabf7;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 认证按钮样式 */
.auth-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  text-decoration: none;
  text-align: center;
  display: inline-block;
}

.login-btn {
  background: transparent;
  color: #4dabf7;
  border: 1px solid #4dabf7;
}

.login-btn:hover {
  background: rgba(77, 171, 247, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.2);
}

.register-btn {
  background: #4dabf7;
  color: white;
  border: 1px solid transparent;
}

.register-btn:hover {
  background: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

/* 退出按钮改为协调的颜色 */
.logout-btn {
  background: #6c757d;
  color: white;
  border: 1px solid transparent;
}

.logout-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.welcome-text {
  font-size: 0.95rem;
  color: #495057;
  font-weight: 500;
}

/* 主内容 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  background: #f8f9fa;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-content {
    padding: 0 15px;
  }

  .header-left {
    gap: 20px;
  }

  .nav-links {
    gap: 5px;
  }

  .nav-link {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 15px;
    gap: 15px;
  }

  .header-left {
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }

  .app-title {
    text-align: center;
    font-size: 1.6rem;
  }

  .nav-links {
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .header-right {
    width: 100%;
    justify-content: center;
  }

  .user-info {
    flex-direction: column;
    gap: 10px;
  }

  .auth-btn {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .nav-links {
    flex-direction: column;
    align-items: center;
  }

  .nav-link {
    width: 200px;
    text-align: center;
  }

  .header-right {
    flex-direction: column;
    gap: 10px;
  }

  .auth-btn {
    width: 200px;
  }
}
</style>

<template>
  <div class="login-container">
    <div class="login-card">
      <button @click="goBack" class="back-btn">← 返回大盘行情</button>
      <h2>用户登录</h2>
      <el-form :model="form" :rules="rules" ref="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item class="button-group">
          <el-button type="primary" @click="handleLogin" :loading="loading" class="submit-btn"
            >登录</el-button
          >
          <el-button @click="$router.push('/register')" class="switch-btn">注册</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loginForm = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!loginForm.value) return

  try {
    const valid = await loginForm.value.validate()
    if (!valid) return

    loading.value = true

    const response = await api.auth.login(form.username, form.password)

    if (response.success) {
      ElMessage.success('登录成功')

      // 等待下一个 tick 确保状态更新完成
      await nextTick()

      // 直接跳转，不调用不存在的方法
      router.push('/market')
    } else {
      ElMessage.error(response.message || '登录失败，请检查用户名和密码')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('登录失败，请检查网络连接')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/market')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: #e9ecef;
  transform: translateX(-2px);
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #495057;
  font-weight: 700;
  font-size: 1.8rem;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.submit-btn {
  flex: 1;
  padding: 12px;
  font-size: 1rem;
  background: linear-gradient(135deg, #4dabf7, #339af0);
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #339af0, #228be6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(51, 154, 240, 0.3);
}

.switch-btn {
  flex: 1;
  padding: 12px;
  font-size: 1rem;
  border: 1px solid #4dabf7;
  color: #4dabf7;
  background: transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.switch-btn:hover {
  background: #e7f5ff;
  transform: translateY(-2px);
}

/* 修复Element Plus输入框样式 */
:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  color: #495057;
  font-weight: 600;
  padding-right: 20px;
}

:deep(.el-input) {
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #ced4da;
  background: #fff;
  box-shadow: none;
  transition: all 0.3s ease;
  padding: 8px 12px;
}

:deep(.el-input__wrapper:hover) {
  border-color: #4dabf7;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #4dabf7;
  box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
}

:deep(.el-input__inner) {
  color: #495057;
}

:deep(.el-button) {
  font-weight: 600;
}
</style>

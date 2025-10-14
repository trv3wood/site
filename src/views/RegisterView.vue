<template>
  <div class="register-container">
    <div class="register-card">
      <button @click="goBack" class="back-btn">← 返回大盘行情</button>
      <h2>用户注册</h2>
      <el-form :model="form" :rules="rules" ref="registerForm" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" />
        </el-form-item>
        <el-form-item class="button-group">
          <el-button type="primary" @click="handleRegister" :loading="loading" class="submit-btn"
            >注册</el-button
          >
          <el-button @click="$router.push('/login')" class="switch-btn">返回登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { AxiosError } from 'axios'

const router = useRouter()
const registerForm = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
}

const handleRegister = async () => {
  if (!registerForm.value) return

  const valid = await registerForm.value.validate()
  if (!valid) return

  loading.value = true

  try {
    await api.auth.register(form.username, form.password)
    ElMessage.success({
      message: '注册成功！您的账户已创建，默认账户余额为10000元，请登录您的账户。',
      duration: 5000,
    })
    router.push('/login')
  } catch (e) {
    const err = e as AxiosError
    ElMessage.error(err.response?.data || '注册失败，请检查网络连接')
    console.error('Register error:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/market')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
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

.register-card h2 {
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

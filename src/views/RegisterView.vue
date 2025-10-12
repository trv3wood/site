<template>
  <div class="register-container">
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
      <el-form-item>
        <el-button type="primary" @click="handleRegister" :loading="loading">注册</el-button>
        <el-button @click="$router.push('/login')">返回登录</el-button>
      </el-form-item>
    </el-form>
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
  confirmPassword: ''
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
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerForm.value) return

  const valid = await registerForm.value.validate()
  if (!valid) return

  loading.value = true

  try {
    await api.auth.register(form.username, form.password)
    ElMessage.success('注册成功')
    router.push('/login')
  } catch (e) {
    const err = e as AxiosError
    ElMessage.error(err.response?.data || '注册失败，请检查网络连接')
    console.error('Register error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
}
</style>
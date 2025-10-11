import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

interface User {
  user_id: number
  username: string
  balance: number
}

interface AuthState {
  token: string | null
  user: User | null
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => token.value !== null && user.value !== null)
  const username = computed(() => user.value?.username || '')
  const balance = computed(() => user.value?.balance || 0)
  const userId = computed(() => user.value?.user_id || 0)

  // 操作
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const login = (loginToken: string, loginUser: User) => {
    token.value = loginToken
    user.value = loginUser
  }

  const logout = () => {
    token.value = null
    user.value = null
  }

  const updateBalance = (newBalance: number) => {
    if (user.value) {
      user.value.balance = newBalance
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    username,
    balance,
    userId,
    setToken,
    setUser,
    login,
    logout,
    updateBalance
  }
})

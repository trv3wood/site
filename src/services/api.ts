import type { 
  LoginResponse, 
  RegisterResponse, 
  TradeResponse, 
  MarketOverview, 
  StockBasicInfo, 
  Executive, 
  ExecutiveTransaction, 
  Event, 
  Shareholder, 
  Dividend, 
  Category, 
} from '../types'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const userStore = useUserStore()

// 基础API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证头部
apiClient.interceptors.request.use(
  (config) => {
    if (userStore.isLoggedIn && userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API request failed:', error)
    throw error
  }
)

// 通用请求函数
async function apiRequest(endpoint: string, options: any = {}) {
  const config = {
    url: endpoint,
    method: options.method || 'GET',
    data: options.body ? JSON.parse(options.body) : undefined,
    params: options.params,
    ...options,
  }

  return apiClient.request(config)
}

// 用户认证相关API
export const authAPI = {
  // 用户登录
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.data.success && response.data.token) {
      userStore.login(response.data.token, response.data.user)
    }
    
    return response
  },

  // 用户注册
  async register(username: string, password: string): Promise<RegisterResponse> {
    const response = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.data.success && response.data.token) {
      userStore.login(response.data.token, response.data.user)
    }
    return response
    
  },

  // 用户登出
  async logout() {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    })
    
    userStore.logout()
    return response
  },
}

// 交易相关API
export const tradeAPI = {
  // 执行交易
  async trade(stock_id: number, quantity: number, price: number, type: 'BUY' | 'SELL'): Promise<TradeResponse> {
    return apiRequest('/auth/trade', {
      method: 'POST',
      body: JSON.stringify({
        stock_id,
        quantity,
        price,
        type,
      }),
    })
  },
}

// 市场数据相关API
export const marketAPI = {
  // 获取市场概览
  async getMarketOverview(): Promise<MarketOverview> {
    return apiRequest('/api/market')
  },

  // 获取股票基本信息
  async getStockBasicInfo(stock_id: number): Promise<StockBasicInfo> {
    return apiRequest(`/api/stock/basic?id=${stock_id}`)
  },

  // 获取股票实时行情
  async getStockQuote(stock_id: number) {
    return apiRequest(`/api/stock/quote?id=${stock_id}`)
  },
}
interface PageQueryParam {
  id: number;
  size?: number;
  page?: number;
}
interface DateQueryParam {
  stock_id: number;
  start_date: string;
  end_date: string;
}
// 股票详情相关API
export const stockAPI = {
  // 获取高管信息
  async getExecutives(params: PageQueryParam): Promise<Executive[]> {
    return apiRequest(`/api/stock/executives`, {
      params,
    }).then((res) => res.data)
  },

  // 获取高管交易记录
  async getExecutiveTransactions(params: DateQueryParam): Promise<ExecutiveTransaction[]> {
    return apiRequest(`/api/stock/executive-transactions`, {
      params,
    }).then((res) => res.data)
  },

  // 获取公司事件
  async getEvents(params: PageQueryParam): Promise<Event[]> {
    return apiRequest(`/api/stock/events`, {
      params,
    }).then((res) => res.data)
  },

  // 获取股东信息
  async getShareholders(params: PageQueryParam): Promise<Shareholder[]> {
    return apiRequest(`/api/stock/shareholders`, {
      params,
    }).then((res) => res.data)
  },

  // 获取分红信息
  async getDividends(params: YearQueryParam): Promise<Dividend[]> {
    return apiRequest(`/api/stock/dividends`, {
      params,
    }).then((res) => res.data)
  },
}
interface YearQueryParam {
  stock_id: number;
  year: number;
}
// 分类相关API
export const categoryAPI = {
  // 获取概念和行业分类
  async getCategories(): Promise<Category> {
    return apiRequest('/api/categories')
  },
}

export default {
  auth: authAPI,
  trade: tradeAPI,
  market: marketAPI,
  stock: stockAPI,
  category: categoryAPI,
}
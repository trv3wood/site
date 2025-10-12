import '../types'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import type { AuthedResponse, CategoriesRequest, CategoriesResponse, Dividend, Executive, ExecutiveTransaction, MarketOverviewRequest, MarketOverviewResponse, Shareholder, StockBasicInfoRequest, StockBasicInfoResponse, UserData, Event } from '../types'

// 基础API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

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
    const userStore = useUserStore()
    if (userStore.isLoggedIn && userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
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
// GET请求
async function get(endpoint: string, options: any = {}) {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  }).then(res => res.data)
}
// POST请求
async function post(endpoint: string, options: any = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    ...options,
  }).then(res => res.data)
}

// 用户认证相关API
export const authAPI = {
  // 用户登录
  async login(username: string, password: string): Promise<AuthedResponse<UserData>> {
    const response = await post('/api/login', {
      body: JSON.stringify({ username, password }),
    })
    
    if (response.success && response.token) {
      const userStore = useUserStore()
      userStore.login(response.token, response.user)
    }
    
    return response
  },

  // 用户注册
  async register(username: string, password: string): Promise<AuthedResponse<null>> {
    const response = await post('/api/register', {
      body: JSON.stringify({ username, password }),
    })
    
    if (response.success && response.token) {
      const userStore = useUserStore()
      userStore.login(response.token, response.user)
    }
    return response
    
  },

  // 用户登出
  async logout() {
    const response = await post('/auth/logout')
    
    const userStore = useUserStore()
    userStore.logout()
    return response
  },
}

// 交易相关API
export const tradeAPI = {
  // 执行交易
  async trade(stock_id: number, quantity: number, price: number, type: 'BUY' | 'SELL'): Promise<AuthedResponse<number>> {
    return post('/auth/trade', {
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
  async getMarketOverview(params: MarketOverviewRequest): Promise<MarketOverviewResponse> {
    return get('/api/market', {
      params,
    })
  },

  // 获取股票基本信息
  async getStockBasicInfo(params: StockBasicInfoRequest): Promise<StockBasicInfoResponse> {
    return get(`/api/stock/basic`, {
      params,
    })
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
interface YearQueryParam {
  stock_id: number;
  year: number;
}
// 股票详情相关API
export const stockAPI = {
  // 获取高管信息
  async getExecutives(params: PageQueryParam): Promise<Executive[]> {
    return get(`./api/stock/executives`, {
      params,
    })
  },

  // 获取高管交易记录
  async getExecutiveTransactions(params: DateQueryParam): Promise<ExecutiveTransaction[]> {
    return get(`./api/stock/executive-transactions`, {
      params, 
    })
  },

  // 获取公司事件
  async getEvents(params: PageQueryParam): Promise<Event[]> {
    return get(`./api/stock/events`, {
      params,
    })
  },

  // 获取股东信息
  async getShareholders(params: PageQueryParam): Promise<Shareholder[]> {
    return get(`./api/stock/shareholders`, {
      params,
    })
  },

  // 获取分红信息
  async getDividends(params: YearQueryParam): Promise<Dividend[]> {
    return get(`./api/stock/dividends`, {
      params,
    })
  },
}
// 分类相关API
export const categoryAPI = {
  // 获取概念和行业分类
  async getCategories(params: CategoriesRequest): Promise<CategoriesResponse> {
    return get('/api/categories', {
      params,
    })
  },
}

export default {
  auth: authAPI,
  trade: tradeAPI,
  market: marketAPI,
  stock: stockAPI,
  category: categoryAPI,
  client: {
    apiRequest,
    get,
    post,
  }
}
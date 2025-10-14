import { useUserStore } from '@/stores/user'
import axios from 'axios'
import type {
  AuthedResponse,
  CategoriesRequest,
  CategoriesResponse,
  Dividend,
  Executive,
  ExecutiveTransaction,
  MarketOverviewRequest,
  MarketOverviewResponse,
  Shareholder,
  StockBasicInfoRequest,
  StockBasicInfoResponse,
  UserData,
  Event,
  TradeRequest,
  TradeResponse,
  HoldingsResponse,
  AnalyzeResponse,
  OrdersResponse,
  HistoryResponse,
} from '../types'
import type { YearQueryParam, PageQueryParam, DateQueryParam } from '../types'

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
apiClient.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.isLoggedIn && userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// 响应拦截器 - 统一处理错误
apiClient.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API request failed:', error)
    throw error
  }
)

// 通用请求函数
async function apiRequest(endpoint: string, options: any = {}): Promise<any> {
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
  try {
    const response = await apiRequest(endpoint, {
      method: 'GET',
      ...options,
    })
    console.debug('GET request response:', response)
    return response
  } catch (error) {
    console.error('GET request failed:', error)
    throw error
  }
}
// POST请求
async function post(endpoint: string, options: any = {}) {
  try {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      ...options,
    })
    console.debug('POST request response:', response)
    return response
  } catch (error) {
    console.error('POST request failed:', error)
    throw error
  }
}

// 用户认证相关API
export const authAPI = {
  // 用户登录
  async login(username: string, password: string): Promise<AuthedResponse<UserData>> {
    const response = await post('/api/login', {
      data: { username, password },
    })

    if (response.success && response.data.token) {
      const userStore = useUserStore()
      userStore.login(response.data.token, response.data.user)
      console.log('Login successful', userStore.user)
    }

    return response
  },

  // 用户注册
  async register(username: string, password: string): Promise<AuthedResponse<null>> {
    const response = (await post('/api/register', {
      body: JSON.stringify({ username, password, confirmPassword: password }),
    })) as AuthedResponse<null>

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
  async trade(form: TradeRequest): Promise<TradeResponse> {
    return post('/auth/trade', {
      body: JSON.stringify(form),
    })
  },
  async getOrder(): Promise<OrdersResponse> {
    return get('/auth/user/orders')
  },
}

// 市场数据相关API
export const marketAPI = {
  // 获取市场概览
  async getMarketOverview(params: MarketOverviewRequest): Promise<MarketOverviewResponse[]> {
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
// 股票详情相关API
export const stockAPI = {
  // 获取高管信息
  async getExecutives(params: PageQueryParam): Promise<Executive[]> {
    return get(`/api/stock/executives`, {
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

  // 获取股票价格历史
  async getPriceHistory(params: DateQueryParam): Promise<HistoryResponse[]> {
    return get(`./api/stock/history`, {
      params,
    })
  },
}
// 分类相关API
export const categoryAPI = {
  // 获取概念和行业分类
  async getCategories(params: CategoriesRequest): Promise<CategoriesResponse> {
    return get('/api/stock/categories', {
      params,
    })
  },
}

// 用户持仓相关API
export const holdingsAPI = {
  // 获取用户持仓列表
  async getHoldings(): Promise<HoldingsResponse> {
    return get('/auth/user/holdings')
  },

  // 获取用户持仓分析
  async getAnalyze(): Promise<AnalyzeResponse> {
    return get('/auth/user/analyze')
  },
}

export default {
  auth: authAPI,
  trade: tradeAPI,
  market: marketAPI,
  stock: stockAPI,
  category: categoryAPI,
  holdings: holdingsAPI,
  client: {
    apiRequest,
    get,
    post,
  },
}

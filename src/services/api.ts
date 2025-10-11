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

// 基础API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Token管理
let authToken: string | null = null

export function setAuthToken(token: string) {
  authToken = token
}

export function clearAuthToken() {
  authToken = null
}

// 通用请求函数
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // 添加认证头部
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  const config: RequestInit = {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 用户认证相关API
export const authAPI = {
  // 用户登录
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.success && response.token) {
      setAuthToken(response.token)
    }
    
    return response
  },

  // 用户注册
  async register(username: string, password: string): Promise<RegisterResponse> {
    const response = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    
    if (response.success && response.token) {
      setAuthToken(response.token)
    }
    return response
    
  },

  // 用户登出
  async logout() {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    })
    
    clearAuthToken()
    return response
  },
}

// 交易相关API
export const tradeAPI = {
  // 执行交易
  async trade(stock_id: number, quantity: number, price: number, type: 'buy' | 'sell'): Promise<TradeResponse> {
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

  // 获取股票列表
  async getStocks() {
    return apiRequest('/api/stocks')
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

// 股票详情相关API
export const stockAPI = {
  // 获取高管信息
  async getExecutives(stock_id: number): Promise<Executive[]> {
    return apiRequest(`/api/stock/executives?id=${stock_id}`)
  },

  // 获取高管交易记录
  async getExecutiveTransactions(stock_id: number): Promise<ExecutiveTransaction[]> {
    return apiRequest(`/api/stock/executive-transactions?id=${stock_id}`)
  },

  // 获取公司事件
  async getEvents(stock_id: number): Promise<Event[]> {
    return apiRequest(`/api/stock/events?id=${stock_id}`)
  },

  // 获取股东信息
  async getShareholders(stock_id: number): Promise<Shareholder[]> {
    return apiRequest(`/api/stock/shareholders?id=${stock_id}`)
  },

  // 获取分红信息
  async getDividends(stock_id: number): Promise<Dividend[]> {
    return apiRequest(`/api/stock/dividends?id=${stock_id}`)
  },
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
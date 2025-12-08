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
  HistoryResponse,
  UserData,
  Event,
  TradeRequest,
  TradeResponse,
  HoldingsResponse,
  AnalyzeResponse,
  OrdersResponse,
  Stock,
  Items,
} from '../types'
import type { YearQueryParam, PageQueryParam, DateQueryParam } from '../types'

// 基础API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// WebSocket连接配置
const WS_BASE_URL = API_BASE_URL?.replace('http://', 'ws://').replace('https://', 'wss://') || 'ws://localhost:8080'

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

// WebSocket连接管理
export class MarketWebSocket {
  private socket: WebSocket | null = null
  // private reconnectAttempts = 0
  // private maxReconnectAttempts = 3
  // private reconnectDelay = 3000 // 3秒
  private messageCallbacks: Array<(data: any) => void> = []
  private errorCallbacks: Array<(error: globalThis.Event) => void> = []
  private closeCallbacks: Array<(event: CloseEvent) => void> = []

  constructor(private marketType: string) {}

  // 连接WebSocket
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const encodedMarketType = encodeURIComponent(this.marketType)
      const wsUrl = `${WS_BASE_URL}/api/market/ws?type=${encodedMarketType}`
      this.socket = new WebSocket(wsUrl)

      this.socket.onopen = () => {
        console.log(`WebSocket connected for market type: ${this.marketType}`)
        // this.reconnectAttempts = 0
        resolve()
      }

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.messageCallbacks.forEach(callback => callback(data))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.errorCallbacks.forEach(callback => callback(error))
        reject(error)
      }

      this.socket.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        this.closeCallbacks.forEach(callback => callback(event))
      }
    })
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected')
      this.socket = null
    }
    this.messageCallbacks = []
    this.errorCallbacks = []
    this.closeCallbacks = []
  }

  // 添加消息监听器
  onMessage(callback: (data: any) => void): void {
    this.messageCallbacks.push(callback)
  }

  // 添加错误监听器
  onError(callback: (error: globalThis.Event) => void): void {
    this.errorCallbacks.push(callback)
  }

  // 添加关闭监听器
  onClose(callback: (event: CloseEvent) => void): void {
    this.closeCallbacks.push(callback)
  }

  // 发送消息（如果需要）
  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  // 获取连接状态
  getState(): string {
    if (!this.socket) return 'DISCONNECTED'
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING'
      case WebSocket.OPEN: return 'OPEN'
      case WebSocket.CLOSING: return 'CLOSING'
      case WebSocket.CLOSED: return 'CLOSED'
      default: return 'UNKNOWN'
    }
  }
}

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

  // WebSocket连接市场实时数据
  createMarketWebSocket(marketType: string): MarketWebSocket {
    return new MarketWebSocket(marketType)
  },
}
// 股票详情相关API
export const stockAPI = {
  // 获取高管信息
  async getExecutives(params: PageQueryParam): Promise<Items<Executive>> {
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
  async getEvents(params: PageQueryParam): Promise<Items<Event>> {
    return get(`./api/stock/events`, {
      params,
    })
  },

  // 获取股东信息
  async getShareholders(params: PageQueryParam): Promise<Items<Shareholder>> {
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

  // 获取股票状态
  async getStockStatus(params: { stock_code: string }): Promise<Stock> {
    return get(`./api/stock/status`, {
      params,
    })
  },

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
  holdings: holdingsAPI,
  client: {
    apiRequest,
    get,
    post,
  },
}

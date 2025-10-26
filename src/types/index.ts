export interface LoginRequest {
  username: string
  password: string
  [property: string]: any
}

export interface AuthedResponse<T> {
  data: T
  message: string
  success: boolean
  [property: string]: any
}

export interface UserData {
  token: string
  user: User
  [property: string]: any
}

export interface User {
  balance: number
  user_id: number
  username: string
  [property: string]: any
}
export interface RegisterRequest extends LoginRequest {
  confirmPassword: string
  [property: string]: any
}

export interface CategoriesRequest {
  id: number
  [property: string]: any
}
export interface CategoriesResponse {
  concepts: Concept[]
  industries: Industry[]
  [property: string]: any
}

export interface Concept {
  concept_id: number
  concept_name: string
  [property: string]: any
}

export interface Industry {
  industry_id?: number
  industry_name?: string
  [property: string]: any
}
export interface ExecutiveRequest {
  id: number
  page?: number
  size?: number
  [property: string]: any
}
export interface Executive {
  executive_id: number
  executive_name: string
  position: string
  salary: number
  share_quantity: number
  stock_id: number
  [property: string]: any
}
export interface ShareholdersRequest {
  id: number
  page?: number
  size?: number
  [property: string]: any
}
export interface Shareholder {
  proportion: number
  share_quantity: number
  shareholder_id: number
  shareholder_name: string
  stock_id: number
  update_time: string
  [property: string]: any
}
export interface ExecutiveTransactionRequest {
  end_date?: string
  start_date?: string
  stock_id: number
  [property: string]: any
}
export interface ExecutiveTransaction {
  after_change_quantity: number
  change_date: string
  change_quantity: number
  change_type: string
  executive_name: string
  [property: string]: any
}
export interface DividendsRequest {
  start_year?: number
  stock_id: number
  [property: string]: any
}
export interface Dividend {
  announcement_date: string
  dividend_id: number
  ex_dividend_date: string
  payment_date: string
  plan: string
  stock_id: number
  [property: string]: any
}
export interface MarketOverviewRequest {
  type?: string
  [property: string]: any
}
export interface MarketOverviewResponse {
  change: number
  change_rate: number
  current_price: number
  high_price: number
  low_price: number
  market_cap: number
  open_price: number
  stock_code: string
  stock_id: number
  stock_name: string
  turnover: number | number
  turnover_rate: number
  volume: number
  [property: string]: any
}
export interface EventRequest {
  id: number
  page?: number
  size?: number
  [property: string]: any
}
export interface Event {
  event_content: string
  event_date: string
  event_id: number
  event_type: string
  stock_id: number
  [property: string]: any
}
export interface StockBasicInfoRequest {
  id: number
  [property: string]: any
}
export interface StockBasicInfoResponse {
  eps: number
  info_id: number
  navps: number
  pb_ratio: number
  pe_ratio: number
  shareholder_count: number
  stock_code: string
  stock_id: number
  stock_name: string
  total_shares: number
  [property: string]: any
}

export interface YearQueryParam {
  stock_id: number
  start_year?: number
}

export interface PageQueryParam {
  id: number
  size?: number
  page?: number
}
export interface DateQueryParam {
  stock_id: number
  start_date: string | null
  end_date: string | null
}
export interface TradeRequest {
  order_type: string
  price: number
  quantity: number
  stock_code: null | string
  stock_id: number | null
  [property: string]: any
}
export type TradeResponse = AuthedResponse<{ order_id: number; updated_balance: number }>

// 持仓相关接口
export interface Holding {
  stock_code: string
  stock_name: string
  quantity: number
  avg_cost: number
  profit_rate: number
  profit: number
  current_price: number
  [property: string]: any
}

export interface HoldingsResponse extends Array<Holding> {}

export interface AnalyzeResponse {
  timestamp: string
  profit: number
  profit_rate: number
  [property: string]: any
}

// 订单相关接口
export interface Order {
  stock_name: string
  stock_code: string
  order_type: string
  quantity: number
  price: number
  created_time: string
  status: string
  [property: string]: any
}

export interface OrdersResponse extends Array<Order> {}

export interface HistoryRequest {
  end_date?: string
  start_date?: string
  stock_id: number
  [property: string]: any
}

export interface HistoryResponse {
  change: number
  change_rate: number
  created_time: string
  current_price: number
  market_cap: number
  quote_id: number
  stock_id: number
  turnover: number
  turnover_rate: number
  volume: number
  [property: string]: any
}

export interface Stock {
  stock_id: number
  stock_code: string
  stock_name: string
  current_price: number
  change: number
}

export interface Items<T> {
  total: number
  data: T[]
}

export interface Stock {
  code: string
  name: string
  openPrice: number
  currentPrice: number
  highPrice: number
  lowPrice: number
  changePercent: number
  changeAmount: number
  volume: number
  turnover: number
  marketValue: number
  turnoverRate: number
}

// 用户相关接口
export interface User {
  user_id: number
  username: string
  balance: number
}

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: User
}

export interface RegisterResponse {
  success: boolean
  message: string
  user?: User
}

// 交易相关接口
export interface TradeRequest {
  stock_code: string
  quantity: number
  price: number
  type: 'buy' | 'sell'
}

export interface TradeResponse {
  success: boolean
  message: string
  order_id?: number
  balance?: number
}

// 市场概览接口
export interface MarketOverview {
  total_stocks: number
  total_market_value: number
  average_change_percent: number
  rising_stocks: number
  falling_stocks: number
  flat_stocks: number
}

// 股票基本信息接口
export interface StockBasicInfo {
  code: string
  name: string
  industry: string
  concept: string
  market_cap: number
  pe_ratio: number
  pb_ratio: number
  dividend_yield: number
}

// 高管信息接口
export interface Executive {
  executive_id: number
  name: string
  position: string
  gender: string
  age: number
  education: string
  salary: number
  stock_holdings: number
}

// 高管交易记录接口
export interface ExecutiveTransaction {
  transaction_id: number
  executive_name: string
  position: string
  transaction_type: 'buy' | 'sell'
  quantity: number
  price: number
  transaction_date: string
  total_amount: number
}

// 公司事件接口
export interface Event {
  event_id: number
  event_type: string
  event_date: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
}

// 股东信息接口
export interface Shareholder {
  shareholder_id: number
  name: string
  share_type: string
  shares_held: number
  percentage: number
  change: number
}

// 分红信息接口
export interface Dividend {
  dividend_id: number
  dividend_date: string
  dividend_amount: number
  ex_dividend_date: string
  record_date: string
  payment_date: string
}

// 分类信息接口
export interface Category {
  concepts: Array<{
    concept_id: number
    concept_name: string
  }>
  industries: Array<{
    industry_id: number
    industry_name: string
  }>
}

// 订单信息接口
export interface Order {
  order_id: number
  stock_code: string
  stock_name: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  completed_at?: string
}

// 持仓信息接口
export interface Position {
  stock_code: string
  stock_name: string
  quantity: number
  average_cost: number
  current_price: number
  market_value: number
  profit_loss: number
  profit_loss_percent: number
}


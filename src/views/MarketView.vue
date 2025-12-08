<template>
  <div class="market-view">
    <!-- 页面头部 -->
    <div class="header">
      <div class="header-top">
        <h1 class="page-title">大盘行情</h1>
        <div class="market-tabs">
          <button :class="{ active: activeTab === 'sh' }" @click="switchTab('sh')" class="tab-btn">
            沪市 (6开头)
          </button>
          <button :class="{ active: activeTab === 'sz' }" @click="switchTab('sz')" class="tab-btn">
            深市 (0开头)
          </button>
          <button :class="{ active: activeTab === 'cyb' }" @click="switchTab('cyb')" class="tab-btn">
            创业板 (3开头)
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>数据加载中...</span>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <p>{{ error }}</p>
        <button @click="setupWebSocketConnection" class="action-btn retry-btn">重试</button>
      </div>
    </div>

    <!-- 股票表格 -->
    <div v-else class="stock-table-container">
      <div class="table-header">
        <div class="table-info">
          <span class="stock-count">共 {{ stocks.length }} 只股票</span>
          <div class="refresh-controls">
            <div class="refresh-info">
              <span class="countdown-text">连接状态: {{ connectionStatus }}</span>
              <span v-if="connectionStatus === 'OPEN'" class="countdown-text"> | 下次刷新: {{ countdown }}秒</span>
            </div>
            <div class="refresh-options">
              <label class="refresh-label">刷新间隔:</label>
              <select v-model="selectedInterval" @change="onIntervalChange" class="refresh-select">
                <option value="1">1秒</option>
                <option value="2">2秒</option>
                <option value="3">3秒</option>
                <option value="5">5秒</option>
                <option value="10">10秒</option>
                <option value="30">30秒</option>
                <option value="60">60秒</option>
              </select>
              <button @click="refreshNow" class="action-btn refresh-btn"
                :disabled="connectionStatus !== 'OPEN'">立即刷新</button>
              <button @click="manualRefresh" class="action-btn refresh-btn">重新连接</button>
            </div>
          </div>
        </div>
      </div>
      <div class="stock-table-wrapper">
        <table class="stock-table">
          <thead>
            <tr>
              <th>代码</th>
              <th>名称</th>
              <th>开盘价</th>
              <th>当前价</th>
              <th>最高价</th>
              <th>最低价</th>
              <th>涨跌幅</th>
              <th>涨跌价</th>
              <th>成交量</th>
              <th>成交额</th>
              <th>市值</th>
              <th>换手率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stock in stocks" :key="stock.stock_id" @click="handleStockClick(stock)" class="stock-row">
              <td class="stock-code">{{ stock.stock_code }}</td>
              <td class="stock-name">{{ stock.stock_name }}</td>
              <td>{{ formatNumber(stock.open_price) }}</td>
              <td :class="getPriceColor(stock.change_rate)">
                {{ formatNumber(stock.current_price) }}
              </td>
              <td>{{ formatNumber(stock.high_price) }}</td>
              <td>{{ formatNumber(stock.low_price) }}</td>
              <td :class="getPriceColor(stock.change_rate)">
                {{ formatPercent(stock.change_rate) }}
              </td>
              <td :class="getPriceColor(stock.change_rate)">
                {{ formatNumber(stock.change, true) }}
              </td>
              <td>{{ formatVolume(stock.volume) }}</td>
              <td>{{ formatTurnover(stock.turnover) }}</td>
              <td>{{ formatMarketCap(stock.market_cap) }}</td>
              <td>{{ formatPercent(stock.turnover_rate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 空状态 -->
      <div v-if="stocks.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MarketOverviewResponse as Stock } from '@/types/index'
import { marketAPI, MarketWebSocket } from '@/services/api'
import { useStockStore } from '@/stores/stock'

const router = useRouter()

// 响应式数据
const activeTab = ref<'sh' | 'sz' | 'cyb'>('sh')
const stocks = ref<Stock[]>([])
const loading = ref(false)
const error = ref('')
const countdown = ref(5)
const selectedInterval = ref('5') // 默认5秒
const wsConnection = ref<MarketWebSocket | null>(null)
const connectionStatus = ref('DISCONNECTED')
let countdownTimer: number | null = null

// 计算属性
const refreshIntervalSeconds = computed(() => parseInt(selectedInterval.value))

// 市场类型映射
const marketTypeMap = {
  sh: 'SH',
  sz: 'SZ',
  cyb: 'CYB'
}

// 倒计时相关方法
const startCountdown = (interval_sec: number) => {
  stopCountdown() // 先清除现有定时器
  selectedInterval.value = interval_sec.toString()
  countdown.value = refreshIntervalSeconds.value

  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = refreshIntervalSeconds.value
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const resetCountdown = () => {
  countdown.value = refreshIntervalSeconds.value
}

// 方法
const switchTab = async (tab: 'sh' | 'sz' | 'cyb') => {
  activeTab.value = tab
  countdown.value = 5
  selectedInterval.value = '5'
  setupWebSocketConnection()
  await fetchInitialMarketData()
}

const formatNumber = (value: number, showSign: boolean = false): string => {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  if (showSign) {
    return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2)
  }
  return num.toFixed(2)
}

const formatPercent = (value: number): string => {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`
}

const formatVolume = (volume: number): string => {
  if (volume === null || volume === undefined) return '-'
  const num = Number(volume)
  if (isNaN(num)) return '-'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toString()
}

const formatTurnover = (turnover: number): string => {
  if (turnover === null || turnover === undefined) return '-'
  const num = Number(turnover)
  if (isNaN(num)) return '-'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toFixed(2)
}

const formatMarketCap = (marketCap: number): string => {
  if (marketCap === null || marketCap === undefined) return '-'
  const num = Number(marketCap)
  if (isNaN(num)) return '-'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }
  return num.toFixed(2)
}

const getPriceColor = (changeRate: number): string => {
  const rate = Number(changeRate)
  if (rate > 0) return 'price-rise'
  if (rate < 0) return 'price-fall'
  return ''
}

// 设置WebSocket连接
const setupWebSocketConnection = async () => {
  // 关闭现有连接
  if (wsConnection.value) {
    wsConnection.value.disconnect()
    wsConnection.value = null
  }

  loading.value = true
  error.value = ''
  connectionStatus.value = 'CONNECTING'

  try {
    // 创建新的WebSocket连接
    const marketType = marketTypeMap[activeTab.value]
    wsConnection.value = marketAPI.createMarketWebSocket(marketType)

    // 设置消息处理器
    wsConnection.value.onMessage((message) => {
      // 根据消息类型处理
      if (message.type === 'data') {
        // 数据更新消息
        const data = message.data
        if (!data || data.error) {
          console.error('WebSocket error:', data?.error)
          error.value = '获取市场数据失败，请稍后重试'
        } else {
          stocks.value = data
          console.log(`WebSocket收到 ${data.length} 只股票数据`)
          loading.value = false
          error.value = ''
          // 重置倒计时
          resetCountdown()
        }
      } else if (message.type === 'config_ack') {
        // 配置确认消息
        console.log(`服务器确认: 刷新间隔已更新为 ${message.interval_sec} 秒`)
        // 重启倒计时
        startCountdown(message.interval_sec)
      } else if (message.type === 'error') {
        // 错误消息
        console.error('服务器错误:', message.message)
        error.value = message.message || '服务器错误'
      } else {
        // 兼容旧格式 (直接返回数组)
        if (Array.isArray(message)) {
          stocks.value = message
          console.log(`WebSocket收到 ${message.length} 只股票数据`)
          loading.value = false
          error.value = ''
          // 重置倒计时
          resetCountdown()
        }
      }
    })

    wsConnection.value.onError((err) => {
      console.error('WebSocket连接错误:', err)
      error.value = 'WebSocket连接失败，请稍后重试'
      connectionStatus.value = 'ERROR'
      loading.value = false
      stopCountdown()
    })

    wsConnection.value.onClose((event) => {
      console.log('WebSocket连接关闭:', event.code, event.reason)
      connectionStatus.value = 'CLOSED'
      loading.value = false
      stopCountdown()
    })

    // 连接WebSocket
    await wsConnection.value.connect()
    connectionStatus.value = wsConnection.value.getState()
    console.log(`WebSocket连接已建立，市场类型: ${marketType}`)

    // 启动倒计时
    startCountdown(5)
  } catch (err) {
    console.error('WebSocket连接失败:', err)
    error.value = 'WebSocket连接失败，请稍后重试'
    connectionStatus.value = 'ERROR'
    loading.value = false
  }
}

// 初始数据获取（备用方案）
const fetchInitialMarketData = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await marketAPI.getMarketOverview({ type: activeTab.value })
    stocks.value = data
    console.log(`初始获取 ${data.length} 只股票数据`)
  } catch (err) {
    console.error('获取初始市场数据失败:', err)
    error.value = '获取市场数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const manualRefresh = () => {
  setupWebSocketConnection()
}

// 调整刷新间隔
const onIntervalChange = () => {
  if (wsConnection.value && connectionStatus.value === 'OPEN') {
    const intervalSec = refreshIntervalSeconds.value
    console.log(`Changing refresh interval to ${intervalSec} seconds`)
    wsConnection.value.send({
      type: 'set_interval',
      interval_sec: intervalSec
    })
  }
}

// 立即刷新
const refreshNow = () => {
  if (wsConnection.value && connectionStatus.value === 'OPEN') {
    console.log('Requesting immediate refresh')
    wsConnection.value.send({
      type: 'refresh_now'
    })
    // 重置倒计时
    resetCountdown()
  }
}

// 组件生命周期
onMounted(() => {
  // 初始使用HTTP获取数据，然后建立WebSocket连接
  fetchInitialMarketData()
  setupWebSocketConnection()
})

onUnmounted(() => {
  // 清理WebSocket连接
  if (wsConnection.value) {
    wsConnection.value.disconnect()
    wsConnection.value = null
  }
  // 清理倒计时定时器
  stopCountdown()
})

const stockStore = useStockStore()
// 处理股票点击事件
const handleStockClick = (stock: Stock) => {
  stockStore.setStockId(stock.stock_id)
  stockStore.setStockCode(stock.stock_code)
  // 使用查询参数传递股票ID
  router.push({
    path: '/stock/info',
    query: { id: stock.stock_id },
  })
}
</script>

<style scoped>
.market-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

/* 页面头部样式 */
.header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  /* 调小一点 */
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  /* 调小一点 */
  font-weight: 700;
  color: #495057;
}

.market-tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  padding: 8px 16px;
  /* 调小一点 */
  border: 1px solid #4dabf7;
  background: white;
  color: #4dabf7;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.85rem;
  /* 调小一点 */
}

.tab-btn:hover {
  background: #e7f5ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(77, 171, 247, 0.2);
}

.tab-btn.active {
  background: #4dabf7;
  color: white;
  border-color: #4dabf7;
  box-shadow: 0 2px 8px rgba(77, 171, 247, 0.3);
}

/* 表格头部样式 */
.table-header {
  padding: 16px 24px;
  background: linear-gradient(135deg, #e3f2fd, #d0ebff);
  border-bottom: 1px solid #dee2e6;
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-count {
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

/* 刷新控制样式 */
.refresh-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.refresh-info {
  color: #495057;
  font-weight: 500;
}

.countdown-text {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.refresh-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-label {
  color: #495057;
  font-weight: 500;
  font-size: 0.85rem;
}

.refresh-select {
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  color: #495057;
  font-size: 0.85rem;
  transition: border-color 0.3s ease;
}

.refresh-select:focus {
  outline: none;
  border-color: #4dabf7;
}

.refresh-select option {
  background: white;
  color: #495057;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #4dabf7;
  background: #4dabf7;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.85rem;
}

.action-btn:hover:not(:disabled) {
  background: #339af0;
  border-color: #339af0;
}

.action-btn:disabled {
  background: #adb5bd;
  border-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.6;
}

.retry-btn {
  background: #6c757d;
  border-color: #6c757d;
}

.retry-btn:hover {
  background: #5a6268;
  border-color: #5a6268;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  gap: 20px;
  color: #495057;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 错误状态样式 */
.error-state {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error-content p {
  color: #dc3545;
  font-size: 1.1rem;
  margin-bottom: 20px;
  font-weight: 500;
}

/* 股票表格容器 */
.stock-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.stock-table-wrapper {
  overflow-x: auto;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.stock-table th {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 14px 12px;
  text-align: center;
  font-weight: 700;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  font-size: 0.9rem;
}

.stock-table td {
  padding: 12px 12px;
  text-align: center;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.stock-row:hover {
  background: #f8f9fa;
  cursor: pointer;
}

.stock-code {
  font-weight: 700;
  color: #4dabf7;
}

.stock-name {
  font-weight: 600;
  color: #495057;
}

.price-rise {
  color: #dc3545;
  font-weight: 700;
}

.price-fall {
  color: #28a745;
  font-weight: 700;
}

/* 空状态样式 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #6c757d;
  background: white;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .refresh-controls {
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }
}

@media (max-width: 768px) {
  .market-view {
    padding: 15px;
  }

  .header-top {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .page-title {
    text-align: center;
    font-size: 1.4rem;
  }

  .market-tabs {
    justify-content: center;
    flex-wrap: wrap;
  }

  .table-info {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .refresh-controls {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .refresh-options {
    flex-wrap: wrap;
    gap: 5px;
  }

  .stock-table th,
  .stock-table td {
    padding: 10px 8px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .market-tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-btn {
    width: 100%;
  }

  .refresh-controls {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .refresh-options {
    flex-direction: column;
    gap: 8px;
  }

  .refresh-select,
  .action-btn {
    width: 100%;
  }
}
</style>

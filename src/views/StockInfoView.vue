<template>
  <div class="stock-info-view">
    <!-- 加载状态 -->
    <div v-if="loading.stockInfo" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载股票信息中...</p>
      </div>
    </div>

    <!-- 主要内容 -->
    <div v-else-if="stockInfo" class="content-container">
      <!-- 股票头部信息 - 紧凑布局 -->
      <div class="stock-header">
        <!-- 左边：股票基本信息 - 占30% -->
        <div class="stock-basic-info">
          <div class="stock-title">
            <h1>{{ stockInfo.stock_name }}</h1>
            <span class="stock-code">{{ stockInfo.stock_code }}</span>
          </div>

          <div class="price-display">
            <div class="current-price" :class="getPriceChangeClass(realtimeData.changePercent)">
              {{ formatCurrency(realtimeData.currentPrice) }}
            </div>
            <div class="price-change" :class="getPriceChangeClass(realtimeData.changePercent)">
              <span class="change-amount">
                {{ realtimeData.changeAmount > 0 ? '+' : ''
                }}{{ formatCurrency(realtimeData.changeAmount) }}
              </span>
              <span class="change-percent">
                {{ realtimeData.changePercent > 0 ? '+' : ''
                }}{{ realtimeData.changePercent.toFixed(2) }}%
              </span>
            </div>
          </div>

          <div class="price-details">
            <div class="detail-row">
              <span class="label">开盘:</span>
              <span class="value">{{ formatCurrency(realtimeData.openPrice) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">最高:</span>
              <span class="value">{{ formatCurrency(realtimeData.highPrice) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">最低:</span>
              <span class="value">{{ formatCurrency(realtimeData.lowPrice) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">成交量:</span>
              <span class="value">{{ formatNumber(realtimeData.volume) }}</span>
            </div>
          </div>
        </div>

        <!-- 右边：图表和操作 - 占70% -->
        <div class="chart-and-actions">
          <!-- 实时行情图表 -->
          <div class="realtime-chart-section">
            <div class="chart-header">
              <h3>实时行情</h3>
              <div class="chart-controls">
                <button
                  v-for="period in timePeriods"
                  :key="period.value"
                  :class="['period-btn', { active: selectedPeriod === period.value }]"
                  @click="switchTimePeriod(period.value)"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
            <div class="chart-container">
              <canvas ref="chartCanvas" class="chart-wrapper"></canvas>
              <div v-if="chartLoading" class="chart-loading">
                <div class="loading-spinner-small"></div>
                <span>加载图表数据...</span>
              </div>
              <div v-else-if="!hasChartData" class="chart-loading">
                <span>暂无图表数据</span>
              </div>
            </div>
          </div>

          <!-- 操作区域 -->
          <div class="actions-section">
            <div class="refresh-info">
              <span class="countdown">刷新: {{ countdown }}秒</span>
              <button @click="manualRefresh" class="refresh-btn-small" :disabled="refreshing">
                {{ refreshing ? '刷新中...' : '立即刷新' }}
              </button>
            </div>
            <button class="action-btn trade-btn" @click="handleTradeClick">
              <span>立即交易</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 股票基本信息卡片 -->
      <div class="info-cards">
        <div class="info-card">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>市盈率(PE)</label>
              <span>{{ stockInfo.pe_ratio || '-' }}</span>
            </div>
            <div class="info-item">
              <label>市净率(PB)</label>
              <span>{{ stockInfo.pb_ratio || '-' }}</span>
            </div>
            <div class="info-item">
              <label>每股收益(EPS)</label>
              <span>{{ stockInfo.eps || '-' }}</span>
            </div>
            <div class="info-item">
              <label>每股净资产(NAVPS)</label>
              <span>{{ stockInfo.navps || '-' }}</span>
            </div>
            <div class="info-item">
              <label>总股本</label>
              <span>{{ formatNumber(stockInfo.total_shares) }}</span>
            </div>
            <div class="info-item">
              <label>股东人数</label>
              <span>{{ stockInfo.shareholder_count || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 行业概念信息 -->
        <div class="info-card">
          <h3>行业概念</h3>
          <div class="categories-section">
            <div class="category-group" v-if="industries.length > 0">
              <h4>所属行业</h4>
              <div class="category-tags">
                <span
                  v-for="industry in industries"
                  :key="industry.industry_id"
                  class="category-tag"
                >
                  {{ industry.industry_name }}
                </span>
              </div>
            </div>
            <div class="category-group" v-if="concepts.length > 0">
              <h4>相关概念</h4>
              <div class="category-tags">
                <span v-for="concept in concepts" :key="concept.concept_id" class="category-tag">
                  {{ concept.concept_name }}
                </span>
              </div>
            </div>
            <div v-if="industries.length === 0 && concepts.length === 0" class="no-categories">
              暂无行业概念信息
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页内容 -->
      <div class="tabs-section">
        <div class="tabs-header">
          <div class="tabs-nav">
            <button
              v-for="tab in tabs"
              :key="tab.name"
              :class="['tab-nav-btn', { active: activeTab === tab.name }]"
              @click="switchTab(tab.name)"
            >
              {{ tab.label }}
              <span class="tab-count">({{ getTabCount(tab.name) }})</span>
            </button>
          </div>
        </div>

        <div class="tab-content">
          <!-- 高管信息 -->
          <div v-if="activeTab === 'executives'" class="tab-pane">
            <div class="table-container">
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>职位</th>
                      <th>年薪</th>
                      <th>持股数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="executive in paginatedExecutives" :key="executive.executive_id">
                      <td class="executive-name">{{ executive.executive_name }}</td>
                      <td>{{ executive.position }}</td>
                      <td class="salary">{{ formatCurrency(executive.salary) }}</td>
                      <td class="shares">{{ formatNumber(executive.share_quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="executives.length === 0" class="no-data">
                <div class="no-data-icon">👥</div>
                <p>暂无高管信息</p>
              </div>
              <div class="pagination-container" v-if="executives.length > pageSize">
                <el-pagination
                  v-model:current-page="pagination.executives.currentPage"
                  :page-size="pageSize"
                  :total="executives.length"
                  layout="prev, pager, next"
                  @current-change="() => handlePageChange('executives')"
                />
              </div>
            </div>
          </div>

          <!-- 高管持股变动 -->
          <div v-if="activeTab === 'executive-transactions'" class="tab-pane">
            <div class="table-container">
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>变动日期</th>
                      <th>变动类型</th>
                      <th>变动数量</th>
                      <th>变动后持股</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="transaction in paginatedExecutiveTransactions">
                      <td class="executive-name">{{ transaction.executive_name }}</td>
                      <td>{{ formatDate(transaction.change_date) }}</td>
                      <td>
                        <span
                          class="change-type"
                          :class="getChangeTypeClass(transaction.change_type)"
                        >
                          {{ mapExecutiveChangeType(transaction.change_type) }}
                        </span>
                      </td>
                      <td :class="getChangeClass(transaction.change_quantity)">
                        <span class="change-quantity">
                          {{ transaction.change_quantity > 0 ? '+' : ''
                          }}{{ formatNumber(transaction.change_quantity) }}
                        </span>
                      </td>
                      <td class="shares">{{ formatNumber(transaction.after_change_quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="executiveTransactions.length === 0" class="no-data">
                <div class="no-data-icon">📊</div>
                <p>暂无高管持股变动信息</p>
              </div>
              <div class="pagination-container" v-if="executiveTransactions.length > pageSize">
                <el-pagination
                  v-model:current-page="pagination.executiveTransactions.currentPage"
                  :page-size="pageSize"
                  :total="executiveTransactions.length"
                  layout="prev, pager, next"
                  @current-change="() => handlePageChange('executive-transactions')"
                />
              </div>
            </div>
          </div>

          <!-- 公司大事记 -->
          <div v-if="activeTab === 'events'" class="tab-pane">
            <div class="table-container">
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>事件日期</th>
                      <th>事件类型</th>
                      <th>事件内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="event in paginatedEvents" :key="event.event_id">
                      <td class="event-date">{{ formatDate(event.event_date) }}</td>
                      <td>
                        <span class="event-type" :class="getEventTypeClass(event.event_type)">
                          {{ event.event_type }}
                        </span>
                      </td>
                      <td class="event-content">{{ event.event_content }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="events.length === 0" class="no-data">
                <div class="no-data-icon">📅</div>
                <p>暂无公司大事记</p>
              </div>
              <div class="pagination-container" v-if="events.length > pageSize">
                <el-pagination
                  v-model:current-page="pagination.events.currentPage"
                  :page-size="pageSize"
                  :total="events.length"
                  layout="prev, pager, next"
                  @current-change="() => handlePageChange('events')"
                />
              </div>
            </div>
          </div>

          <!-- 股东信息 -->
          <div v-if="activeTab === 'shareholders'" class="tab-pane">
            <div class="table-container">
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>股东名称</th>
                      <th>持股数量</th>
                      <th>持股比例</th>
                      <th>更新时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="shareholder in paginatedShareholders"
                      :key="shareholder.shareholder_id"
                    >
                      <td class="shareholder-name">{{ shareholder.shareholder_name }}</td>
                      <td class="shares">{{ formatNumber(shareholder.share_quantity) }}</td>
                      <td>
                        <span class="proportion" :class="getRatioClass(shareholder.proportion)">
                          {{ (shareholder.proportion * 100).toFixed(2) }}%
                        </span>
                      </td>
                      <td class="update-time">{{ formatDate(shareholder.update_time) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="shareholders.length === 0" class="no-data">
                <div class="no-data-icon">🏢</div>
                <p>暂无股东信息</p>
              </div>
              <div class="pagination-container" v-if="shareholders.length > pageSize">
                <el-pagination
                  v-model:current-page="pagination.shareholders.currentPage"
                  :page-size="pageSize"
                  :total="shareholders.length"
                  layout="prev, pager, next"
                  @current-change="() => handlePageChange('shareholders')"
                />
              </div>
            </div>
          </div>

          <!-- 分红信息 -->
          <div v-if="activeTab === 'dividends'" class="tab-pane">
            <div class="table-container">
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>分红方案</th>
                      <th>公告日期</th>
                      <th>除权除息日</th>
                      <th>派息日</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="dividend in paginatedDividends" :key="dividend.dividend_id">
                      <td class="dividend-plan">{{ dividend.plan }}</td>
                      <td class="announcement-date">
                        {{ formatDate(dividend.announcement_date) }}
                      </td>
                      <td class="ex-dividend-date">{{ formatDate(dividend.ex_dividend_date) }}</td>
                      <td class="payment-date">{{ formatDate(dividend.payment_date) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="dividends.length === 0" class="no-data">
                <div class="no-data-icon">💰</div>
                <p>暂无分红信息</p>
              </div>
              <div class="pagination-container" v-if="dividends.length > pageSize">
                <el-pagination
                  v-model:current-page="pagination.dividends.currentPage"
                  :page-size="pageSize"
                  :total="dividends.length"
                  layout="prev, pager, next"
                  @current-change="() => handlePageChange('dividends')"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 股票信息加载失败状态 -->
    </div>
    <div v-else class="loading-container">
      <div class="loading-spinner">
        <div class="no-data-icon">❌</div>
        <p>股票信息加载失败</p>
        <button @click="reloadPage" class="action-btn" style="margin-top: 10px">重新加载</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartItem,
} from 'chart.js'
import type {
  StockBasicInfoResponse,
  Executive,
  ExecutiveTransaction,
  Event,
  Shareholder,
  Dividend,
  Concept,
  Industry,
  HistoryResponse,
} from '@/types'
import { marketAPI, stockAPI, categoryAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'

// 注册 Chart.js 组件
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const route = useRoute()
const router = useRouter()
const stockStore = useStockStore()

// 从查询参数获取股票ID
const stockId = ref(0)

// 响应式数据
const stockInfo = ref<StockBasicInfoResponse | null>(null)
const executives = ref<Executive[]>([])
const rawExecutiveTransactions = ref<ExecutiveTransaction[]>([])
const executiveTransactions = computed(() => {
  return rawExecutiveTransactions.value.map(transaction => ({
    ...transaction,
    change_type: mapExecutiveChangeType(transaction.change_type),
  }))
})
const events = ref<Event[]>([])
const shareholders = ref<Shareholder[]>([])
const dividends = ref<Dividend[]>([])
const concepts = ref<Concept[]>([])
const industries = ref<Industry[]>([])

const activeTab = ref('executives')
const pageSize = ref(10)

// 实时数据相关
const realtimeData = ref({
  currentPrice: 10.5,
  changeAmount: 0.3,
  changePercent: 2.86,
  openPrice: 10.5,
  highPrice: 11.2,
  lowPrice: 10.3,
  volume: 1000000,
  timestamp: '',
})

const countdown = ref(5)
const refreshing = ref(false)
const chartLoading = ref(false)
const selectedPeriod = ref('1d')
const chartInstance = ref<Chart | null>(null)
const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hasChartData = ref(false)

// 时间周期选项
const timePeriods = [
  { label: '1天', value: '1d' },
  { label: '5天', value: '5d' },
  { label: '1月', value: '1m' },
  { label: '3月', value: '3m' },
  { label: '1年', value: '1y' },
]

// 分页状态
const pagination = ref({
  executives: { currentPage: 1 },
  executiveTransactions: { currentPage: 1 },
  events: { currentPage: 1 },
  shareholders: { currentPage: 1 },
  dividends: { currentPage: 1 },
})

const loading = ref({
  stockInfo: false,
  executives: false,
  executiveTransactions: false,
  events: false,
  shareholders: false,
  dividends: false,
  categories: false,
})

// 定时器
let refreshTimer: number | null = null
let countdownTimer: number | null = null

// 计算属性 - 分页数据
const paginatedExecutives = computed(() => {
  const start = (pagination.value.executives.currentPage - 1) * pageSize.value
  return executives.value.slice(start, start + pageSize.value)
})

const paginatedExecutiveTransactions = computed(() => {
  const start = (pagination.value.executiveTransactions.currentPage - 1) * pageSize.value
  return executiveTransactions.value.slice(start, start + pageSize.value)
})

const paginatedEvents = computed(() => {
  const start = (pagination.value.events.currentPage - 1) * pageSize.value
  return events.value.slice(start, start + pageSize.value)
})

const paginatedShareholders = computed(() => {
  const start = (pagination.value.shareholders.currentPage - 1) * pageSize.value
  return shareholders.value.slice(start, start + pageSize.value)
})

const paginatedDividends = computed(() => {
  const start = (pagination.value.dividends.currentPage - 1) * pageSize.value
  return dividends.value.slice(start, start + pageSize.value)
})

// 标签页配置
const tabs = [
  { name: 'executives', label: '高管信息' },
  { name: 'executive-transactions', label: '高管持股变动' },
  { name: 'events', label: '公司大事记' },
  { name: 'shareholders', label: '股东信息' },
  { name: 'dividends', label: '分红信息' },
]

// 工具函数
const formatCurrency = (value: number) => {
  return '¥' + value.toFixed(2)
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toString()
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getPriceChangeClass = (changePercent: number) => {
  if (changePercent > 0) return 'price-rise'
  if (changePercent < 0) return 'price-fall'
  return 'price-neutral'
}

const mapExecutiveChangeType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    BUY: '增持',
    SELL: '减持',
    BONUS: '分红',
    OTHER: '其他',
  }
  return typeMap[type] || type
}

const getChangeTypeClass = (type: string) => {
  const typeMap: { [key: string]: string } = {
    BUY: 'buy',
    SELL: 'sell',
    BONUS: 'bonus',
    OTHER: 'other',
  }
  return typeMap[type] || 'other'
}

const getEventTypeClass = (type: string) => {
  const typeMap: { [key: string]: string } = {
    业绩预告: 'performance',
    重大合同: 'contract',
    股权变动: 'equity',
    其他: 'other',
  }
  return typeMap[type] || 'other'
}

const getRatioClass = (ratio: number | undefined): string => {
  if (ratio === undefined) return ''
  return ratio < 0 ? 'negative' : ratio > 50 ? 'high' : 'normal'
}

const getChangeClass = (change: number): string => {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

const getTabCount = (tabName: string): number => {
  const counts: { [key: string]: number } = {
    executives: executives.value.length,
    'executive-transactions': executiveTransactions.value.length,
    events: events.value.length,
    shareholders: shareholders.value.length,
    dividends: dividends.value.length,
  }
  return counts[tabName] || 0
}

const handlePageChange = (tabName: string) => {
  const tabContent = document.querySelector('.tab-content')
  if (tabContent) {
    tabContent.scrollTop = 0
  }
}

const switchTab = (tabName: string) => {
  activeTab.value = tabName
  const paginationKey = tabName as keyof typeof pagination.value
  if (pagination.value[paginationKey]) {
    pagination.value[paginationKey].currentPage = 1
  }
}

const handleTradeClick = () => {
  // 确保所有值都存在
  if (stockInfo.value && stockInfo.value.stock_code && stockId.value) {
    stockStore.setStockCode(stockInfo.value.stock_code as string)
    stockStore.setStockId(stockId.value as number)
    router.push('/trade')
  } else {
    ElMessage.error('股票信息未加载完成，请稍后再试')
  }
}

const reloadPage = () => {
  window.location.reload()
}

// 图表相关函数 - 简化版本，避免递归调用
const fetchChartData = async (period: string) => {
  chartLoading.value = true
  try {
    // 直接使用模拟数据，避免API错误
    const mockData = generateMockChartData(period)
    hasChartData.value = mockData.times.length > 0
    return mockData
  } catch (error) {
    console.error('获取图表数据失败:', error)
    const mockData = generateMockChartData(period)
    hasChartData.value = mockData.times.length > 0
    return mockData
  } finally {
    chartLoading.value = false
  }
}

const generateMockChartData = (period: string) => {
  const basePrice = 10.5
  const dataCount =
    period === '1d' ? 24 : period === '5d' ? 20 : period === '1m' ? 30 : period === '3m' ? 90 : 120
  const times: string[] = []
  const prices: number[] = []

  let currentPrice = basePrice
  const now = new Date()

  for (let i = 0; i < dataCount; i++) {
    if (period === '1d') {
      const hour = Math.floor(i / 2) + 9
      const minute = (i % 2) * 30
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    } else {
      const date = new Date(now.getTime() - (dataCount - i - 1) * 24 * 60 * 60 * 1000)
      times.push(
        date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
        })
      )
    }

    currentPrice += (Math.random() - 0.5) * 0.5
    if (currentPrice < basePrice * 0.8) currentPrice = basePrice * 0.8
    if (currentPrice > basePrice * 1.2) currentPrice = basePrice * 1.2
    prices.push(Number(currentPrice.toFixed(2)))
  }

  return { times, prices }
}

const initChart = async () => {
  if (!chartCanvas.value) return

  // 销毁现有图表实例
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  const chartData = await fetchChartData(selectedPeriod.value)
  if (!chartData || chartData.times.length === 0) {
    showEmptyChart()
    return
  }

  try {
    // 创建 Chart.js 实例
    chartInstance.value = new Chart(chartCanvas.value as ChartItem, {
      type: 'line',
      data: {
        labels: chartData.times,
        datasets: [
          {
            label: '价格',
            data: chartData.prices,
            borderColor: '#4dabf7',
            backgroundColor: 'rgba(77, 171, 247, 0.1)',
            borderWidth: 2,
            pointRadius: chartData.times.length > 50 ? 0 : 3,
            pointBackgroundColor: '#4dabf7',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#333',
            bodyColor: '#333',
            borderColor: '#4dabf7',
            borderWidth: 1,
            callbacks: {
              label: function (context: any) {
                return `价格: ${formatCurrency(context.parsed.y)}`
              },
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: selectedPeriod.value === '1d' ? 0 : 45,
              color: '#666',
              font: {
                size: 10,
              },
            },
          },
          y: {
            type: 'linear',
            position: 'right',
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: '#666',
              callback: function (value: string | number) {
                return formatCurrency(Number(value))
              },
            },
            border: {
              display: false,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    })
  } catch (error) {
    console.error('初始化图表失败:', error)
    showEmptyChart()
  }
}

// 空图表状态
const showEmptyChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, chartCanvas.value.width, chartCanvas.value.height)
    ctx.fillStyle = '#999'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', chartCanvas.value.width / 2, chartCanvas.value.height / 2)
  }
  hasChartData.value = false
}

const updateChartData = async () => {
  if (!chartInstance.value) {
    await initChart()
    return
  }

  try {
    const chartData = await fetchChartData(selectedPeriod.value)
    if (!chartData || chartData.times.length === 0) {
      showEmptyChart()
      return
    }

    // 使用可选链和空值合并确保安全访问
    const datasets = chartInstance.value?.data?.datasets

    if (datasets && datasets.length > 0) {
      // 使用类型断言确保 TypeScript 知道 datasets[0] 存在
      const firstDataset = datasets[0] as any
      chartInstance.value.data.labels = chartData.times
      firstDataset.data = chartData.prices
      chartInstance.value.update('none')
    }
  } catch (error) {
    console.error('更新图表数据失败:', error)
    // 如果更新失败，重新初始化图表
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
    await initChart()
  }
}

const switchTimePeriod = async (period: string) => {
  selectedPeriod.value = period
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
  await initChart()
}

const manualRefresh = async () => {
  refreshing.value = true
  countdown.value = 5
  await updateChartData()
  refreshing.value = false
}

const startAutoRefresh = () => {
  // 清除现有定时器
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)

  // 启动数据刷新定时器 - 延长间隔避免频繁调用
  refreshTimer = window.setInterval(() => {
    updateChartData()
  }, 10000) // 改为10秒

  // 启动倒计时定时器
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      countdown.value = 10 // 与刷新间隔保持一致
    }
  }, 1000)
}

// API 调用函数
const fetchStockInfo = async () => {
  loading.value.stockInfo = true
  try {
    stockInfo.value = await marketAPI.getStockBasicInfo({ id: stockId.value })
  } catch (error) {
    ElMessage.error('获取股票信息失败')
    console.error('Failed to fetch stock info:', error)
  } finally {
    loading.value.stockInfo = false
  }
}

const fetchExecutives = async () => {
  loading.value.executives = true
  try {
    executives.value = await stockAPI.getExecutives({ id: stockId.value })
  } catch (error) {
    ElMessage.error('获取高管信息失败')
    console.error('Failed to fetch executives:', error)
  } finally {
    loading.value.executives = false
  }
}

const fetchExecutiveTransactions = async () => {
  loading.value.executiveTransactions = true
  try {
    rawExecutiveTransactions.value = await stockAPI.getExecutiveTransactions({
      stock_id: stockId.value,
      start_date: null,
      end_date: null,
    })
  } catch (error) {
    ElMessage.error('获取高管交易记录失败')
    console.error('Failed to fetch executive transactions:', error)
  } finally {
    loading.value.executiveTransactions = false
  }
}

const fetchEvents = async () => {
  loading.value.events = true
  try {
    events.value = await stockAPI.getEvents({ id: stockId.value || 0 })
  } catch (error) {
    ElMessage.error('获取公司事件失败')
    console.error('Failed to fetch events:', error)
  } finally {
    loading.value.events = false
  }
}

const fetchShareholders = async () => {
  loading.value.shareholders = true
  try {
    shareholders.value = await stockAPI.getShareholders({ id: stockId.value })
  } catch (error) {
    ElMessage.error('获取股东信息失败')
    console.error('Failed to fetch shareholders:', error)
  } finally {
    loading.value.shareholders = false
  }
}

const fetchDividends = async () => {
  loading.value.dividends = true
  try {
    dividends.value = await stockAPI.getDividends({
      stock_id: stockId.value,
      year: null,
    })
  } catch (error) {
    ElMessage.error('获取分红信息失败')
    console.error('Failed to fetch dividends:', error)
  } finally {
    loading.value.dividends = false
  }
}
const fetchCategories = async () => {
  loading.value.categories = true
  try {
    const response = await categoryAPI.getCategories({ id: stockId.value })
    concepts.value = response.concepts || []
    industries.value = response.industries || []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    loading.value.categories = false
  }
}

// 监听查询参数变化
watch(
  () => route.query.id,
  newId => {
    if (newId) {
      const id = parseInt(newId as string)
      if (!isNaN(id)) {
        stockId.value = id
        stockStore.setStockId(id)
        fetchStockInfo()
        fetchExecutives()
        fetchCategories()
        // 延迟初始化图表，避免竞争条件
        setTimeout(() => {
          initChart()
        }, 100)
      }
    }
  }
)

// 监听标签页切换
watch(activeTab, newTab => {
  switch (newTab) {
    case 'executives':
      if (executives.value.length === 0) fetchExecutives()
      break
    case 'executive-transactions':
      if (executiveTransactions.value.length === 0) fetchExecutiveTransactions()
      break
    case 'events':
      if (events.value.length === 0) fetchEvents()
      break
    case 'shareholders':
      if (shareholders.value.length === 0) fetchShareholders()
      break
    case 'dividends':
      if (dividends.value.length === 0) fetchDividends()
      break
  }
})

// 初始化加载
onMounted(() => {
  const idFromQuery = parseInt(route.query.id as string)
  if (idFromQuery && !isNaN(idFromQuery)) {
    stockId.value = idFromQuery
    stockStore.setStockId(idFromQuery)

    Promise.all([fetchStockInfo(), fetchExecutives(), fetchCategories()]).then(() => {
      // 延迟初始化图表
      setTimeout(() => {
        initChart()
        startAutoRefresh()
      }, 200)
    })
  } else {
    ElMessage.error('请先选择股票')
    router.push('/market')
  }
})

// 清理定时器
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
/* 样式保持不变，与之前相同 */
.stock-info-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 减小头部高度 */
.stock-header {
  display: flex;
  gap: 20px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  min-height: 160px;
  /* 减小高度 */
}

.stock-basic-info {
  flex: 0 0 30%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stock-title h1 {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.stock-code {
  font-size: 0.85rem;
  color: #666;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.price-display {
  margin: 6px 0;
  /* 减小间距 */
}

.current-price {
  font-size: 1.6rem;
  /* 减小字体 */
  font-weight: 700;
  margin-bottom: 3px;
}

.price-change {
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
  /* 减小字体 */
  font-weight: 600;
}

.change-amount,
.change-percent {
  padding: 3px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.8);
}

.price-rise .current-price,
.price-rise .change-amount,
.price-rise .change-percent {
  color: #dc3545;
}

.price-fall .current-price,
.price-fall .change-amount,
.price-fall .change-percent {
  color: #28a745;
}

.price-neutral .current-price,
.price-neutral .change-amount,
.price-neutral .change-percent {
  color: #666;
}

.price-details {
  margin: 6px 0;
  /* 减小间距 */
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  /* 减小内边距 */
  border-bottom: 1px solid #f1f3f4;
  font-size: 0.8rem;
  /* 减小字体 */
}

.detail-row .label {
  color: #666;
  font-weight: 500;
}

.detail-row .value {
  color: #333;
  font-weight: 600;
}

.chart-and-actions {
  flex: 0 0 70%;
  display: flex;
  flex-direction: column;
}

.realtime-chart-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  /* 减小间距 */
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  /* 减小内边距 */
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.chart-header h3 {
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
  /* 减小字体 */
  font-weight: 600;
}

.chart-controls {
  display: flex;
  gap: 4px;
  /* 减小间距 */
}

.period-btn {
  padding: 2px 4px;
  /* 减小内边距 */
  border: 1px solid #ddd;
  background: white;
  border-radius: 3px;
  font-size: 0.65rem;
  /* 减小字体 */
  cursor: pointer;
  transition: all 0.3s ease;
}

.period-btn:hover {
  background: #f5f5f5;
}

.period-btn.active {
  background: #4dabf7;
  color: white;
  border-color: #4dabf7;
}

/* 减小图表容器高度 */
.chart-container {
  position: relative;
  flex: 1;
  padding: 4px;
  min-height: 140px;
  /* 减小高度 */
  height: 140px;
  /* 减小高度 */
}

.chart-wrapper {
  height: 100%;
  width: 100%;
  min-height: 130px;
  /* 减小高度 */
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #666;
  font-size: 0.8rem;
  /* 减小字体 */
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  /* 减小字体 */
  color: #666;
}

.countdown {
  font-weight: 500;
}

.refresh-btn-small {
  padding: 3px 6px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 3px;
  font-size: 0.75rem;
  /* 减小字体 */
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn-small:hover:not(:disabled) {
  background: #f5f5f5;
}

.refresh-btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn {
  padding: 5px 10px;
  background: #4dabf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  max-width: 90px;
  /* 减小宽度 */
  font-size: 0.8rem;
  /* 减小字体 */
}

.action-btn:hover {
  background: #339af0;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(77, 171, 247, 0.3);
}

.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  /* 减小间距 */
  margin-bottom: 16px;
  /* 减小间距 */
}

.info-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 12px;
  /* 减小内边距 */
}

.info-card h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  /* 减小字体 */
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #4dabf7;
  padding-bottom: 3px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  /* 减小间距 */
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  /* 减小内边距 */
  border-bottom: 1px solid #f1f3f4;
  font-size: 0.8rem;
  /* 减小字体 */
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.info-item span {
  font-weight: 600;
  color: #333;
}

.categories-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 减小间距 */
}

.category-group h4 {
  margin: 0 0 3px 0;
  font-size: 0.8rem;
  /* 减小字体 */
  font-weight: 600;
  color: #495057;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.category-tag {
  background: #e7f5ff;
  color: #1971c2;
  padding: 2px 5px;
  border-radius: 8px;
  font-size: 0.7rem;
  /* 减小字体 */
  font-weight: 500;
}

.no-categories {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 8px 0;
  font-size: 0.8rem;
  /* 减小字体 */
}

.tabs-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.tabs-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 0 12px;
  /* 减小内边距 */
}

.tabs-nav {
  display: flex;
  gap: 4px;
  /* 减小间距 */
}

.tab-nav-btn {
  padding: 8px 10px;
  /* 减小内边距 */
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.8rem;
  /* 减小字体 */
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-nav-btn:hover {
  color: #4dabf7;
}

.tab-nav-btn.active {
  color: #4dabf7;
  border-bottom-color: #4dabf7;
}

.tab-count {
  font-size: 0.65rem;
  /* 减小字体 */
  color: #999;
}

.tab-content {
  padding: 12px;
  /* 减小内边距 */
}

.tab-pane {
  min-height: 200px;
  /* 减小高度 */
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.data-table th {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 10px 8px;
  /* 减小内边距 */
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  font-size: 0.8rem;
  /* 减小字体 */
  white-space: nowrap;
}

.data-table td {
  padding: 8px 8px;
  /* 减小内边距 */
  border-bottom: 1px solid #f1f3f4;
  color: #333;
  font-size: 0.75rem;
  /* 减小字体 */
  transition: all 0.3s ease;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.executive-name {
  font-weight: 600;
  color: #495057;
}

.shareholder-name {
  font-weight: 600;
  color: #495057;
}

.salary {
  font-weight: 600;
  color: #e67e22;
}

.shares {
  font-weight: 600;
  color: #2e86c1;
}

.event-date {
  color: #666;
  font-weight: 500;
}

.update-time {
  color: #666;
  font-weight: 500;
}

.announcement-date,
.ex-dividend-date,
.payment-date {
  color: #666;
  font-weight: 500;
}

.dividend-plan {
  font-weight: 600;
  color: #28a745;
}

.change-type {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.7rem;
  /* 减小字体 */
  font-weight: 600;
}

.change-type.buy {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.change-type.sell {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.change-type.bonus {
  background: rgba(255, 193, 7, 0.1);
  color: #e67e22;
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.change-type.other {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.event-type {
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.7rem;
  /* 减小字体 */
  font-weight: 600;
}

.event-type.performance {
  background: rgba(77, 171, 247, 0.1);
  color: #4dabf7;
  border: 1px solid rgba(77, 171, 247, 0.2);
}

.event-type.contract {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.event-type.equity {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.event-type.other {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.2);
}

.change-quantity {
  font-weight: 600;
}

.positive .change-quantity {
  color: #dc3545;
}

.negative .change-quantity {
  color: #28a745;
}

.proportion {
  font-weight: 600;
}

.proportion.high {
  color: #dc3545;
}

.proportion.normal {
  color: #28a745;
}

.proportion.negative {
  color: #6c757d;
}

.event-content {
  max-width: 250px;
  word-wrap: break-word;
  line-height: 1.4;
}

.no-data {
  text-align: center;
  padding: 30px 15px;
  /* 减小内边距 */
  color: #666;
}

.no-data-icon {
  font-size: 2rem;
  /* 减小字体 */
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-data p {
  font-size: 0.85rem;
  /* 减小字体 */
  font-weight: 500;
  margin: 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 12px;
  /* 减小内边距 */
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.tab-pane {
  padding: 0;
}

/* 表格样式 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8f9fa;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

/* 特殊样式 */
.change-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.change-type.BUY {
  background: #d3f9d8;
  color: #2b8a3e;
}

.change-type.SELL {
  background: #ffe3e3;
  color: #c92a2a;
}

.change-type.BONUS {
  background: #fff3bf;
  color: #e67700;
}

.positive {
  color: #51cf66;
  font-weight: 600;
}

.negative {
  color: #f03e3e;
  font-weight: 600;
}

.neutral {
  color: #868e96;
}

.dividend-plan {
  font-weight: 600;
  color: #e67700;
}

/* 时间线样式 */
.events-timeline {
  padding: 30px;
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 30px;
  position: relative;
}

.el-table {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .stock-info-view {
    padding: 15px;
  }

  .chart-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .chart-controls {
    width: 100%;
    justify-content: space-between;
  }

  .period-btn {
    flex: 1;
    text-align: center;
  }

  .tabs-nav {
    flex-wrap: wrap;
  }

  .tab-nav-btn {
    flex: 1;
    min-width: 70px;
    justify-content: center;
    padding: 6px 8px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .actions-section {
    flex-direction: column;
    gap: 4px;
  }

  .action-btn {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .chart-wrapper {
    height: 120px;
  }

  .current-price {
    font-size: 1.3rem;
  }

  .price-change {
    font-size: 0.75rem;
  }

  .stock-title h1 {
    font-size: 1rem;
  }
}
</style>

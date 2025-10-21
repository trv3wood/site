<template>
  <div class="stock-info-view">
    <div class="header">
      <el-row :gutter="20" align="middle">
        <el-col :span="18">
          <h1>{{ stockInfo?.stock_name }} ({{ stockInfo?.stock_code }})</h1>
        </el-col>
        <el-col :span="6" style="text-align: right">
          <el-button type="primary" size="large" @click="handleTradeClick()">交易</el-button>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="stock-basic-info">
        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="股票代码">{{
                stockInfo?.stock_code
              }}</el-descriptions-item>
              <el-descriptions-item label="股票名称">{{
                stockInfo?.stock_name
              }}</el-descriptions-item>
              <el-descriptions-item label="总股本"
                >{{ formatNumber(stockInfo?.total_shares) }}股</el-descriptions-item
              >
              <el-descriptions-item label="股东人数"
                >{{ formatNumber(stockInfo?.shareholder_count) }}人</el-descriptions-item
              >
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>财务指标</span>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="市盈率(PE)">
                <span :class="getRatioClass(stockInfo?.pe_ratio)">{{
                  stockInfo?.pe_ratio || '-'
                }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="市净率(PB)">
                <span :class="getRatioClass(stockInfo?.pb_ratio)">{{
                  stockInfo?.pb_ratio || '-'
                }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="每股收益">{{
                stockInfo?.eps ? `¥${stockInfo.eps}` : '-'
              }}</el-descriptions-item>
              <el-descriptions-item label="每股净资产">{{
                stockInfo?.navps ? `¥${stockInfo.navps}` : '-'
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>行业概念</span>
              </div>
            </template>
            <div class="categories-section">
              <div class="category-group">
                <h4>所属行业</h4>
                <div class="tags">
                  <el-tag
                    v-for="industry in industries"
                    :key="industry.industry_id"
                    type="primary"
                    style="margin: 2px"
                  >
                    {{ industry.industry_name }}
                  </el-tag>
                  <span v-if="industries.length === 0" class="no-data">暂无数据</span>
                </div>
              </div>
              <div class="category-group" style="margin-top: 10px">
                <h4>所属概念</h4>
                <div class="tags">
                  <el-tag
                    v-for="concept in concepts"
                    :key="concept.concept_id"
                    type="success"
                    style="margin: 2px"
                  >
                    {{ concept.concept_name }}
                  </el-tag>
                  <span v-if="concepts.length === 0" class="no-data">暂无数据</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 标签页内容 -->
      <div class="tabs-section" style="margin-top: 20px">
        <el-tabs v-model="activeTab" type="card">
          <el-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :label="tab.label">
          </el-tab-pane>
        </el-tabs>

        <!-- 高管信息 -->
        <div v-show="activeTab === 'executives'" class="tab-pane">
          <el-table :data="executives" empty-text="暂无高管信息">
            <el-table-column prop="executive_name" label="姓名" width="120" />
            <el-table-column prop="position" label="职位" width="150" />
            <el-table-column label="持股数量" width="120">
              <template #default="{ row }"> {{ formatNumber(row.share_quantity) }}股 </template>
            </el-table-column>
            <el-table-column label="年薪" width="120">
              <template #default="{ row }">
                {{ row.salary ? `${row.salary}万元` : '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 高管持股变动 -->
        <div v-show="activeTab === 'executive-transactions'" class="tab-pane">
          <el-table :data="executiveTransactions" empty-text="暂无高管持股变动记录">
            <el-table-column prop="executive_name" label="高管姓名" width="120" />
            <el-table-column label="交易日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.change_date) }}
              </template>
            </el-table-column>
            <el-table-column label="变动类型" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.change_type === '增持'
                      ? 'success'
                      : row.change_type === '减持'
                        ? 'danger'
                        : 'info'
                  "
                >
                  {{ row.change_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变动数量" width="120">
              <template #default="{ row }">
                <span :class="getChangeClass(row.change_quantity)">
                  {{ row.change_quantity > 0 ? '+' : '' }}{{ formatNumber(row.change_quantity) }}股
                </span>
              </template>
            </el-table-column>
            <el-table-column label="变动后持股" width="120">
              <template #default="{ row }">
                {{ formatNumber(row.after_change_quantity) }}股
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 公司大事记 -->
        <div v-show="activeTab === 'events'" class="tab-pane">
          <el-timeline v-if="events.length > 0">
            <el-timeline-item
              v-for="event in events"
              :key="event.event_id"
              :timestamp="formatDate(event.event_date)"
              placement="top"
            >
              <el-card>
                <h4>{{ event.event_type }}</h4>
                <p>{{ event.event_content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="no-data">暂无公司事件</div>
        </div>

        <!-- 股东信息 -->
        <div v-show="activeTab === 'shareholders'" class="tab-pane">
          <el-table :data="shareholders" empty-text="暂无股东信息">
            <el-table-column prop="shareholder_name" label="股东名称" width="200" />
            <el-table-column label="持股比例" width="120">
              <template #default="{ row }"> {{ (row.proportion * 100).toFixed(2) }}% </template>
            </el-table-column>
            <el-table-column label="持股数量" width="120">
              <template #default="{ row }"> {{ formatNumber(row.share_quantity) }}股 </template>
            </el-table-column>
            <el-table-column label="更新日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.update_time) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分红信息 -->
        <div v-show="activeTab === 'dividends'" class="tab-pane">
          <el-table :data="dividends" empty-text="暂无分红信息">
            <el-table-column prop="plan" label="分红方案" width="200" />
            <el-table-column label="公告日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.announcement_date) }}
              </template>
            </el-table-column>
            <el-table-column label="除权除息日" width="120">
              <template #default="{ row }">
                {{ formatDate(row.ex_dividend_date) }}
              </template>
            </el-table-column>
            <el-table-column label="派息日" width="120">
              <template #default="{ row }">
                {{ formatDate(row.payment_date) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 股票历史价格 -->
        <div v-show="activeTab === 'price-history'" class="tab-pane">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>股票历史价格走势</span>
              </div>
            </template>
            <div v-loading="loading.priceHistory" class="chart-container">
              <canvas ref="chartRef" style="height: 400px; width: 100%"></canvas>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Chart,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Title,
  Legend,
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
import { categoryAPI, marketAPI, stockAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'

// 注册Chart.js组件
Chart.register(
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Title,
  Legend
)

const stockId = ref(useStockStore().stockId)

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
const priceHistory = ref<HistoryResponse[]>([])

const activeTab = ref('executives')
const loading = ref({
  stockInfo: false,
  executives: false,
  executiveTransactions: false,
  events: false,
  shareholders: false,
  dividends: false,
  categories: false,
  priceHistory: false,
})

// Chart.js相关
const chartRef = ref<HTMLCanvasElement | null>(null)
const chartInstance = ref<Chart | null>(null)

// 标签页配置
const tabs = [
  { name: 'executives', label: '高管信息' },
  { name: 'executive-transactions', label: '高管持股变动' },
  { name: 'events', label: '公司大事记' },
  { name: 'shareholders', label: '股东信息' },
  { name: 'dividends', label: '分红信息' },
  { name: 'price-history', label: '历史价格' },
]

// 工具函数
const mapExecutiveChangeType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    BUY: '增持',
    SELL: '减持',
    BONUS: '分红',
    OTHER: '其他',
  }
  return typeMap[type] || type
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

const getRatioClass = (ratio: number | undefined): string => {
  if (ratio === undefined) return ''
  return ratio < 0 ? 'negative' : ratio > 50 ? 'high' : 'normal'
}

const getChangeClass = (change: number): string => {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

const router = useRouter()

// API 调用函数
const fetchStockInfo = async () => {
  loading.value.stockInfo = true
  try {
    if (!stockId.value) {
      throw new Error('股票ID不存在')
    }
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
    // const endDate = new Date().toISOString().split('T')[0]
    // const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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

// 获取股票历史价格数据
const fetchPriceHistory = async () => {
  loading.value.priceHistory = true
  try {
    priceHistory.value = await stockAPI.getPriceHistory({
      stock_id: stockId.value,
      start_date: null,
      end_date: null,
    })

    // 数据获取成功后初始化图表
    await nextTick()
    initChart()
  } catch (error) {
    ElMessage.error('获取历史价格数据失败')
    console.error('Failed to fetch price history:', error)
  } finally {
    loading.value.priceHistory = false
  }
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value || priceHistory.value.length === 0) return

  // 销毁现有图表实例
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  // 准备图表数据
  const labels = priceHistory.value.map(item => {
    const date = new Date(item.created_time)
    return date.toLocaleDateString('zh-CN')
  })

  const prices = priceHistory.value.map(item => item.current_price)
  const changes = priceHistory.value.map(item => item.change)

  // 创建图表
  chartInstance.value = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '价格 (元)',
          data: prices,
          borderColor: '#409EFF',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: '涨跌',
          data: changes,
          borderColor: '#67C23A',
          backgroundColor: 'rgba(103, 194, 58, 0.1)',
          borderWidth: 1,
          tension: 0.1,
          yAxisID: 'y1',
          hidden: true, // 默认隐藏
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              if (context.datasetIndex === 0) {
                label += '¥' + (context.parsed?.y || 0).toFixed(2)
              } else {
                label += (context.parsed?.y || 0).toFixed(2)
              }
              return label
            },
          },
        },
        title: {
          display: true,
          text: `${stockInfo.value?.stock_name} (${stockInfo.value?.stock_code}) 历史价格走势`,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: '日期',
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: '价格 (元)',
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: '涨跌',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  })
}

// 根据激活的标签页加载对应数据
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
    case 'price-history':
      if (priceHistory.value.length === 0) fetchPriceHistory()
      break
  }
})
// 初始化加载
onMounted(() => {
  fetchStockInfo()
  fetchExecutives()
  fetchCategories()
})
// 处理交易按钮点击事件
const handleTradeClick = () => {
  const stockStore = useStockStore()
  stockStore.setStockCode(stockInfo.value?.stock_code || '')
  stockStore.setStockId(stockId.value || 0)
  router.push(`/trade`)
}
</script>
<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

.chart-container canvas {
  max-width: 100%;
}
</style>

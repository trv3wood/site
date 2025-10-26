<template>
  <div class="stock-info-view">
    <div class="header">
      <el-row :gutter="20" align="middle">
        <el-col :span="18">
          <h1>
            {{ fetchStockInfo.data.value?.stock_name }} ({{
              fetchStockInfo.data.value?.stock_code
            }})
          </h1>
        </el-col>
        <el-col :span="6" style="text-align: right">
          <el-button type="primary" size="large" @click="handleTradeClick()">交易</el-button>
        </el-col>
      </el-row>
    </div>

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
              fetchStockInfo.data.value?.stock_code
            }}</el-descriptions-item>
            <el-descriptions-item label="股票名称">{{
              fetchStockInfo.data.value?.stock_name
            }}</el-descriptions-item>
            <el-descriptions-item label="总股本"
              >{{ formatNumber(fetchStockInfo.data.value?.total_shares) }}股</el-descriptions-item
            >
            <el-descriptions-item label="股东人数"
              >{{
                formatNumber(fetchStockInfo.data.value?.shareholder_count)
              }}人</el-descriptions-item
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
              <span :class="getRatioClass(fetchStockInfo.data.value?.pe_ratio)">{{
                fetchStockInfo.data.value?.pe_ratio || '-'
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="市净率(PB)">
              <span :class="getRatioClass(fetchStockInfo.data.value?.pb_ratio)">{{
                fetchStockInfo.data.value?.pb_ratio || '-'
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="每股收益">{{
              fetchStockInfo.data.value?.eps ? `¥${fetchStockInfo.data.value.eps}` : '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="每股净资产">{{
              fetchStockInfo.data.value?.navps ? `¥${fetchStockInfo.data.value.navps}` : '-'
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
                  v-for="industry in fetchStockCategories.data.value?.industries"
                  :key="industry.industry_id"
                  type="primary"
                  style="margin: 2px"
                >
                  {{ industry.industry_name }}
                </el-tag>
                <span v-if="!fetchStockCategories.data.value?.industries" class="no-data"
                  >暂无数据</span
                >
              </div>
            </div>
            <div class="category-group" style="margin-top: 10px">
              <h4>所属概念</h4>
              <div class="tags">
                <el-tag
                  v-for="concept in fetchStockCategories.data.value?.concepts"
                  :key="concept.concept_id"
                  type="success"
                  style="margin: 2px"
                >
                  {{ concept.concept_name }}
                </el-tag>
                <span v-if="!fetchStockCategories.data.value?.concepts" class="no-data"
                  >暂无数据</span
                >
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
        <el-table :data="fetchExecutives.data.value" empty-text="暂无高管信息">
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
        <el-pagination
          style="margin-bottom: 10px; text-align: right"
          background
          layout="prev, pager, next"
          :page-size="fetchExecutives.pagination.value.size"
          :current-page.sync="fetchExecutives.pagination.value.page"
          :total="fetchExecutives.pagination.value.total"
          @current-change="handleChange.handleExecutiveChange"
          @size-change="handleSize.handleExecutiveSizeChange"
        />
      </div>

      <!-- 高管持股变动 -->
      <div v-show="activeTab === 'executive-transactions'" class="tab-pane">
        <el-date-picker
          v-model="startDate"
          type="datetime"
          placeholder="选择开始日期"
        />
        <el-date-picker
          v-model="endDate"
          type="datetime"
          placeholder="选择结束日期"
        />
        <el-button type="primary" @click="handleExecutiveTransactionQuery">查询</el-button>
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
        <el-timeline v-if="fetchEvents.data.value.length > 0">
          <el-timeline-item
            v-for="event in fetchEvents.data.value"
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
        <el-pagination
          style="margin-bottom: 10px; text-align: right"
          background
          layout="prev, pager, next"
          :page-size="fetchEvents.pagination.value.size"
          :current-page.sync="fetchEvents.pagination.value.page"
          :total="fetchEvents.pagination.value.total"
          @current-change="handleChange.handleEventChange"
          @size-change="handleSize.handleEventSizeChange"
        />
      </div>

      <!-- 股东信息 -->
      <div v-show="activeTab === 'shareholders'" class="tab-pane">
        <el-table :data="fetchShareholders.data.value" empty-text="暂无股东信息">
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
        <el-pagination
          style="margin-bottom: 10px; text-align: right"
          background
          layout="prev, pager, next"
          :page-size="fetchShareholders.pagination.value.size"
          :current-page.sync="fetchShareholders.pagination.value.page"
          :total="fetchShareholders.pagination.value.total"
          @current-change="handleChange.handleShareholderChange"
          @size-change="handleSize.handleShareholderSizeChange"
        />
      </div>

      <!-- 分红信息 -->
      <div v-show="activeTab === 'dividends'" class="tab-pane">
        <el-form inline>
          <el-form-item label="起始分红年份">
            <el-input
              v-model="dividendsYearQuery"
              type="number"
              placeholder="请输入分红年份"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="queryDividends">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="fetchDividends.data.value" empty-text="暂无分红信息">
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
        <el-date-picker
          v-model="startDate"
          type="datetime"
          placeholder="选择开始日期"
        />
        <el-date-picker
          v-model="endDate"
          type="datetime"
          placeholder="选择结束日期"
        />
        <el-card>
          <template #header>
            <div class="card-header">
              <span>股票历史价格走势</span>
              <el-button
                type="primary"
                link
                size="small"
                style="float: right; margin-top: -5px"
                @click="toggleAutoRefresh"
              >
                {{ autoRefreshEnabled ? '停止自动刷新' : '开启自动刷新' }}
              </el-button>
              <!--显示倒计时-->
              <span v-if="autoRefreshEnabled" class="countdown">下次刷新时间:{{ timer }} s</span>
            </div>
          </template>
          <div v-loading="loading.priceHistory" class="chart-container">
            <LineChart
              v-if="chartData.labels && chartData.labels.length > 0"
              :chart-data="chartData"
              :options="chartOptions"
              :height="400"
            />
            <div v-else class="no-data">暂无历史价格数据</div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { LineChart } from 'vue-chart-3'
import { Chart, registerables, type ChartOptions } from 'chart.js'
import type { HistoryResponse } from '@/types'
import { marketAPI, stockAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'
import {
  formatNumber,
  getRatioClass,
  getChangeClass,
  formatDate,
  mapExecutiveChangeType,
  convertDateToISOString,
} from '@/types/utils'
import { useFetchedData, useFetchedList } from '@/components/fetch'

const stockId = ref(useStockStore().stockId)

// 响应式数据
const fetchStockInfo = useFetchedData(marketAPI.getStockBasicInfo)
const executiveTransactions = computed(() => {
  return fetchExecutiveTransactions.data.value?.map(transaction => ({
    ...transaction,
    change_type: mapExecutiveChangeType(transaction.change_type),
  }))
})
const priceHistory = ref<HistoryResponse[]>([])

const activeTab = ref('executives')
const loading = ref({
  priceHistory: false,
})

// 自动刷新相关
const autoRefreshEnabled = ref(false)
const interval = {
  refreshInterval: ref<number | null>(null),
  timerInterval: ref<number | null>(null),
}
const timer = ref<number>(5)
const xData = computed(() => {
  return priceHistory.value.map(item => item.created_time)
})
const priceData = computed(() => {
  return priceHistory.value.map(item => item.current_price)
})
const changeData = computed(() => {
  return priceHistory.value.map(item => item.change)
})
Chart.register(...registerables)

// 图表数据
const chartData = reactive({
  labels: xData,
  datasets: [
    {
      label: '价格 (元)',
      data: priceData,
      borderColor: '#409EFF',
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      borderWidth: 2,
      tension: 0.1,
      yAxisID: 'y',
    },
    {
      label: '涨跌',
      data: changeData,
      borderColor: '#67C23A',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      borderWidth: 1,
      tension: 0.1,
      yAxisID: 'y1',
      hidden: true,
    },
  ],
})

const chartOptions = ref<ChartOptions<'line'>>({
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
      text: '历史价格走势',
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
})

// 标签页配置
const tabs = [
  { name: 'executives', label: '高管信息' },
  { name: 'executive-transactions', label: '高管持股变动' },
  { name: 'events', label: '公司大事记' },
  { name: 'shareholders', label: '股东信息' },
  { name: 'dividends', label: '分红信息' },
  { name: 'price-history', label: '历史价格' },
]
// 监听标签页变化，加载对应数据
watch(activeTab, newTab => {
  switch (newTab) {
    case 'executives':
      if (fetchExecutives.data.value.length === 0) {
        fetchExecutives.fetchList({ id: stockId.value })
      }
      break
    case 'executive-transactions':
      if (!fetchExecutiveTransactions.data.value) {
        fetchExecutiveTransactions.fetchData({
          stock_id: stockId.value,
          start_date: null,
          end_date: null,
        })
      }
      break
    case 'events':
      if (fetchEvents.data.value.length === 0) {
        fetchEvents.fetchList({ id: stockId.value })
      }
      break
    case 'shareholders':
      if (fetchShareholders.data.value.length === 0) {
        fetchShareholders.fetchList({ id: stockId.value })
      }
      break
    case 'dividends':
      if (!fetchDividends.data.value) {
        fetchDividends.fetchData({ stock_id: stockId.value, start_year: undefined })
      }
      break
    case 'price-history':
      fetchPriceHistory()
      break
  }
})

const router = useRouter()

const dividendsYearQuery = ref<number | undefined>(undefined)
async function queryDividends() {
  if (dividendsYearQuery.value) {
    fetchDividends.fetchData({ stock_id: stockId.value, start_year: dividendsYearQuery.value })
  } else {
    fetchDividends.fetchData({ stock_id: stockId.value })
  }
}
const fetchDividends = useFetchedData(stockAPI.getDividends)
const fetchStockCategories = useFetchedData(stockAPI.getCategories)
const fetchExecutives = useFetchedList(stockAPI.getExecutives)
const fetchExecutiveTransactions = useFetchedData(stockAPI.getExecutiveTransactions)
async function handleExecutiveTransactionQuery() {
  fetchExecutiveTransactions.fetchData({
    stock_id: stockId.value,
    start_date: convertDateToISOString(startDate.value) || null,
    end_date: convertDateToISOString(endDate.value) || null,
  })
}

const startDate = ref<Date| null>(null)
const endDate = ref<Date| null>(null)
const fetchEvents = useFetchedList(stockAPI.getEvents)

const fetchShareholders = useFetchedList(stockAPI.getShareholders)
const fetchPriceHistory = async () => {
  loading.value.priceHistory = true
  try {
    priceHistory.value = await stockAPI.getPriceHistory({
      stock_id: stockId.value,
      start_date: convertDateToISOString(startDate.value),
      end_date: convertDateToISOString(endDate.value),
    })
  } catch (error: any) {
    ElMessage.error('获取价格信息失败')
    console.error('Failed to fetch price:', error)
  } finally {
    loading.value.priceHistory = false
  }
}

// 自动刷新功能
const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value

  if (autoRefreshEnabled.value) {
    // 开启自动刷新，每5秒刷新一次价格数据
    interval.refreshInterval.value = window.setInterval(() => {
      if (activeTab.value === 'price-history') {
        fetchPriceHistory()
        timer.value = (timer.value + 5) % 6
      }
    }, 5000)
    // 同时启动定时器，显示刷新倒计时
    interval.timerInterval.value = window.setInterval(() => {
      timer.value = (timer.value + 5) % 6
    }, 1000)
  } else {
    // 停止自动刷新
    if (interval.refreshInterval.value) {
      clearInterval(interval.refreshInterval.value)
      interval.refreshInterval.value = null
    }
    if (interval.timerInterval.value) {
      clearInterval(interval.timerInterval.value)
      interval.timerInterval.value = null
      timer.value = 5
    }
  }
}

const handleSize = {
  handleExecutiveSizeChange(newSize: number) {
    fetchExecutives.handleSize(newSize)
    fetchExecutives.fetchList({ id: stockId.value })
  },
  handleEventSizeChange(newSize: number) {
    fetchEvents.handleSize(newSize)
    fetchEvents.fetchList({ id: stockId.value })
  },
  handleShareholderSizeChange(newSize: number) {
    fetchShareholders.handleSize(newSize)
    fetchShareholders.fetchList({ id: stockId.value })
  },
}
const handleChange = {
  handleExecutiveChange(newPage: number) {
    fetchExecutives.handleChange(newPage)
    fetchExecutives.fetchList({ id: stockId.value })
  },
  handleEventChange(newPage: number) {
    fetchEvents.handleChange(newPage)
    fetchEvents.fetchList({ id: stockId.value })
  },
  handleShareholderChange(newPage: number) {
    fetchShareholders.handleChange(newPage)
    fetchShareholders.fetchList({ id: stockId.value })
  },
}

onMounted(() => {
  fetchStockCategories.fetchData({ id: stockId.value })
  fetchStockInfo.fetchData({ id: stockId.value })
  fetchExecutives.fetchList({ id: stockId.value })
})
// 清理定时器
onUnmounted(() => {
  if (interval.refreshInterval.value) {
    clearInterval(interval.refreshInterval.value)
  }
  if (interval.timerInterval.value) {
    clearInterval(interval.timerInterval.value)
  }
})
async function handleTradeClick() {
  try {
    const stockStore = useStockStore()
    stockStore.setStockId(stockId.value)
    stockStore.setStockCode(fetchStockInfo.data.value?.stock_code || '')
    router.push({ name: 'trade', query: { stockId: stockId.value } })
  } catch (error) {
    console.error('Failed to trade:', error)
    return
  }
}
</script>
<style scoped>
.countdown {
  float: right;
  font-size: small;
  margin-right: 10px;
}
</style>

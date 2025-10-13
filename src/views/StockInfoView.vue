<template>
  <div class="stock-info-view">
    <div class="header">
      <div class="title-container">
        <h1>{{ stockInfo?.stock_name }} ({{ stockInfo?.stock_code }})</h1>
        <el-button type="primary" class="trade-button" @click="handleTradeClick">交易</el-button>
      </div>
      <div class="stock-basic-info">
        <div class="basic-details">
          <div class="detail-item">
            <span class="label">股票代码:</span>
            <span class="value">{{ stockInfo?.stock_code }}</span>
          </div>
          <div class="detail-item">
            <span class="label">股票名称:</span>
            <span class="value">{{ stockInfo?.stock_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">市盈率:</span>
            <span class="value">{{ stockInfo?.pe_ratio }}</span>
          </div>
          <div class="detail-item">
            <span class="label">市净率:</span>
            <span class="value">{{ stockInfo?.pb_ratio }}</span>
          </div>
          <div class="detail-item">
            <span class="label">每股收益:</span>
            <span class="value">{{ stockInfo?.eps }}</span>
          </div>
          <div class="detail-item">
            <span class="label">每股净资产:</span>
            <span class="value">{{ stockInfo?.navps }}</span>
          </div>
          <div class="detail-item">
            <span class="label">总股本:</span>
            <span class="value">{{ stockInfo?.total_shares }}</span>
          </div>
          <div class="detail-item">
            <span class="label">股东人数:</span>
            <span class="value">{{ stockInfo?.shareholder_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs-section">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="高管信息" name="executives">
          <div class="tab-content">
            <el-table :data="executives" v-loading="loading.executives">
              <el-table-column prop="executive_name" label="姓名"></el-table-column>
              <el-table-column prop="position" label="职位"></el-table-column>
              <el-table-column prop="share_quantity" label="持股数量"></el-table-column>
              <el-table-column prop="salary" label="年薪">
                <template #default="{ row }">
                  {{ row.salary ? row.salary + '万' : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="高管交易" name="executive-transactions">
          <div class="tab-content">
            <el-table :data="executiveTransactions" v-loading="loading.executiveTransactions">
              <el-table-column prop="executive_name" label="高管姓名"></el-table-column>
              <el-table-column prop="change_quantity" label="变更数量"></el-table-column>
              <el-table-column prop="change_type" label="交易类型"></el-table-column>
              <el-table-column prop="change_date" label="交易日期"></el-table-column>
              <el-table-column prop="after_change_quantity" label="数量">
                <template #default="{ row }">
                  {{ row.after_change_quantity ? row.after_change_quantity + '股' : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="公司事件" name="events">
          <div class="tab-content">
            <el-table :data="events" v-loading="loading.events">
              <el-table-column prop="event_date" label="事件日期"></el-table-column>
              <el-table-column prop="event_type" label="事件类型"></el-table-column>
              <el-table-column prop="event_content" label="事件描述"></el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="股东信息" name="shareholders">
          <div class="tab-content">
            <el-table :data="shareholders" v-loading="loading.shareholders">
              <el-table-column prop="shareholder_name" label="股东名称"></el-table-column>
              <el-table-column prop="proportion" label="持股比例"></el-table-column>
              <el-table-column prop="share_quantity" label="持股数量">
                <template #default="{ row }">
                  {{ row.share_quantity ? row.share_quantity + '股' : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="分红信息" name="dividends">
          <div class="tab-content">
            <el-table :data="dividends" v-loading="loading.dividends">
              <el-table-column prop="announcement_date" label="分红年份"></el-table-column>
              <el-table-column prop="ex_dividend_date" label="除权除息日期"></el-table-column>
              <el-table-column prop="payment_date" label="支付日期"></el-table-column>
              <el-table-column prop="plan" label="分红计划"></el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type {
  StockBasicInfoResponse,
  Executive,
  ExecutiveTransaction,
  Event,
  Shareholder,
  Dividend,
} from '@/types'
import { marketAPI, stockAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'

const router = useRouter()
const stockStore = useStockStore()

const stockId = ref(stockStore.stockId)
function mapExecutiveChangeType(type: string) {
  switch (type) {
    case 'BUY':
      return '购买'
    case 'SELL':
      return '卖出'
    case 'BONUS':
      return '分红'
    case 'OTHER':
      return '其他'
    default:
      return type
  }
}

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

const activeTab = ref('executives')
const loading = ref({
  stockInfo: false,
  executives: false,
  executiveTransactions: false,
  events: false,
  shareholders: false,
  dividends: false,
})

// 获取股票基本信息
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

// 获取高管信息
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

// 获取高管交易记录
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

// 获取公司事件
const fetchEvents = async () => {
  loading.value.events = true
  try {
    events.value = await stockAPI.getEvents({ id: stockId.value })
  } catch (error) {
    ElMessage.error('获取公司事件失败')
    console.error('Failed to fetch events:', error)
  } finally {
    loading.value.events = false
  }
}

// 获取股东信息
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

// 获取分红信息
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

// 根据激活的标签页加载对应数据
watch(activeTab, newTab => {
  switch (newTab) {
    case 'executives':
      if (executives.value.length === 0) {
        fetchExecutives()
      }
      break
    case 'executive-transactions':
      if (executiveTransactions.value.length === 0) {
        fetchExecutiveTransactions()
      }
      break
    case 'events':
      if (events.value.length === 0) {
        fetchEvents()
      }
      break
    case 'shareholders':
      if (shareholders.value.length === 0) {
        fetchShareholders()
      }
      break
    case 'dividends':
      if (dividends.value.length === 0) {
        fetchDividends()
      }
      break
  }
})

onMounted(() => {
  fetchStockInfo()
  fetchExecutives()
})
// 处理交易按钮点击事件
const handleTradeClick = () => {
  stockStore.setStockCode(stockInfo.value?.stock_code || '')
  stockStore.setStockId(stockId.value || 0)
  router.push(`/trade`)
}
</script>

<style scoped>
.stock-info-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  margin-bottom: 20px;
  color: #333;
}

.stock-basic-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.current-price {
  font-size: 32px;
  font-weight: bold;
}

.change-info {
  font-size: 18px;
  font-weight: bold;
}

.basic-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: bold;
}

.tabs-section {
  margin-top: 30px;
}

.tab-content {
  padding: 20px 0;
}

.el-table {
  margin-top: 10px;
}

.title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-container button {
  width: 120px;
  height: 40px;
}
</style>

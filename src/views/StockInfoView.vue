<template>
  <div class="stock-info-view">
    <div class="header">
      <h1>{{ stockInfo?.stock_name }} ({{ stockInfo?.stock_code }})</h1>
      <el-button type="primary" @click="handleTradeClick()">交易</el-button>
      <div class="stock-basic-info">
        <div class="basic-details">
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">股票代码</span>
                <span class="value">{{ stockInfo?.stock_code }}</span>
              </div>
              <div class="info-item">
                <span class="label">股票名称</span>
                <span class="value">{{ stockInfo?.stock_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">总股本</span>
                <span class="value">{{ formatNumber(stockInfo?.total_shares) }}股</span>
              </div>
              <div class="info-item">
                <span class="label">股东人数</span>
                <span class="value">{{ formatNumber(stockInfo?.shareholder_count) }}人</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 财务指标卡片 -->
        <div class="info-card">
          <div class="card-header">
            <h3>财务指标</h3>
          </div>
          <div class="card-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">市盈率(PE)</span>
                <span class="value" :class="getRatioClass(stockInfo?.pe_ratio)">{{
                  stockInfo?.pe_ratio || '-'
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">市净率(PB)</span>
                <span class="value" :class="getRatioClass(stockInfo?.pb_ratio)">{{
                  stockInfo?.pb_ratio || '-'
                }}</span>
              </div>
              <div class="info-item">
                <span class="label">每股收益</span>
                <span class="value">{{ stockInfo?.eps ? `¥${stockInfo.eps}` : '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">每股净资产</span>
                <span class="value">{{ stockInfo?.navps ? `¥${stockInfo.navps}` : '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 行业概念卡片 -->
        <div class="info-card">
          <div class="card-header">
            <h3>行业概念</h3>
          </div>
          <div class="card-content">
            <div class="categories-section">
              <div class="category-group">
                <h4>所属行业</h4>
                <div class="tags">
                  <span
                    v-for="industry in industries"
                    :key="industry.industry_id"
                    class="tag industry-tag"
                  >
                    {{ industry.industry_name }}
                  </span>
                  <span v-if="industries.length === 0" class="no-data">暂无数据</span>
                </div>
              </div>
              <div class="category-group">
                <h4>所属概念</h4>
                <div class="tags">
                  <span
                    v-for="concept in concepts"
                    :key="concept.concept_id"
                    class="tag concept-tag"
                  >
                    {{ concept.concept_name }}
                  </span>
                  <span v-if="concepts.length === 0" class="no-data">暂无数据</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页内容 -->
      <div class="tabs-section">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            :class="['tab-btn', { active: activeTab === tab.name }]"
            @click="activeTab = tab.name"
          >
            {{ tab.label }}
            <span class="badge" v-if="getTabCount(tab.name) > 0">{{ getTabCount(tab.name) }}</span>
          </button>
        </div>

        <div class="tab-content">
          <!-- 高管信息 -->
          <div v-show="activeTab === 'executives'" class="tab-pane">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>职位</th>
                    <th>持股数量</th>
                    <th>年薪</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="executive in executives" :key="executive.executive_id">
                    <td>{{ executive.executive_name }}</td>
                    <td>{{ executive.position }}</td>
                    <td>{{ formatNumber(executive.share_quantity) }}股</td>
                    <td>{{ executive.salary ? `${executive.salary}万元` : '-' }}</td>
                  </tr>
                  <tr v-if="executives.length === 0">
                    <td colspan="4" class="no-data">暂无高管信息</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 高管持股变动 -->
          <div v-show="activeTab === 'executive-transactions'" class="tab-pane">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>高管姓名</th>
                    <th>交易日期</th>
                    <th>变动类型</th>
                    <th>变动数量</th>
                    <th>变动后持股</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in executiveTransactions">
                    <td>{{ transaction.executive_name }}</td>
                    <td>{{ formatDate(transaction.change_date) }}</td>
                    <td>
                      <span :class="['change-type', transaction.change_type]">
                        {{ mapExecutiveChangeType(transaction.change_type) }}
                      </span>
                    </td>
                    <td :class="getChangeClass(transaction.change_quantity)">
                      {{ transaction.change_quantity > 0 ? '+' : ''
                      }}{{ formatNumber(transaction.change_quantity) }}股
                    </td>
                    <td>{{ formatNumber(transaction.after_change_quantity) }}股</td>
                  </tr>
                  <tr v-if="executiveTransactions.length === 0">
                    <td colspan="5" class="no-data">暂无高管持股变动记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 公司大事记 -->
          <div v-show="activeTab === 'events'" class="tab-pane">
            <div class="events-timeline">
              <div v-for="event in sortedEvents" :key="event.event_id" class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                  <div class="event-date">{{ formatDate(event.event_date) }}</div>
                  <div class="event-type">{{ event.event_type }}</div>
                  <div class="event-content">{{ event.event_content }}</div>
                </div>
              </div>
              <div v-if="events.length === 0" class="no-data">暂无公司事件</div>
            </div>
          </div>

          <!-- 股东信息 -->
          <div v-show="activeTab === 'shareholders'" class="tab-pane">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>股东名称</th>
                    <th>持股比例</th>
                    <th>持股数量</th>
                    <th>更新日期</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="shareholder in topShareholders" :key="shareholder.shareholder_id">
                    <td>{{ shareholder.shareholder_name }}</td>
                    <td>{{ (shareholder.proportion * 100).toFixed(2) }}%</td>
                    <td>{{ formatNumber(shareholder.share_quantity) }}股</td>
                    <td>{{ formatDate(shareholder.update_time) }}</td>
                  </tr>
                  <tr v-if="shareholders.length === 0">
                    <td colspan="4" class="no-data">暂无股东信息</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 分红信息 -->
          <div v-show="activeTab === 'dividends'" class="tab-pane">
            <div class="table-container">
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
                  <tr v-for="dividend in dividends" :key="dividend.dividend_id">
                    <td class="dividend-plan">{{ dividend.plan }}</td>
                    <td>{{ formatDate(dividend.announcement_date) }}</td>
                    <td>{{ formatDate(dividend.ex_dividend_date) }}</td>
                    <td>{{ formatDate(dividend.payment_date) }}</td>
                  </tr>
                  <tr v-if="dividends.length === 0">
                    <td colspan="4" class="no-data">暂无分红信息</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type {
  StockBasicInfoResponse,
  Executive,
  ExecutiveTransaction,
  Event,
  Shareholder,
  Dividend,
  Concept,
  Industry,
} from '@/types'
import { categoryAPI, marketAPI, stockAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'

const stockId = ref(useStockStore().stockId)

// 响应式数据
const stockInfo = ref<StockBasicInfoResponse | null>(null)
const executives = ref<Executive[]>([])
const rawExecutiveTransactions = ref<ExecutiveTransaction[]>([])
const executiveTransactions = computed(() => {
  return rawExecutiveTransactions.value.map(transaction => ({
    ...transaction,
    change_type: mapExecutiveChangeType(transaction.change_type)
  }))
})
const events = ref<Event[]>([])
const shareholders = ref<Shareholder[]>([])
const dividends = ref<Dividend[]>([])
const concepts = ref<Concept[]>([])
const industries = ref<Industry[]>([])

const activeTab = ref('executives')
const loading = ref({
  stockInfo: false,
  executives: false,
  executiveTransactions: false,
  events: false,
  shareholders: false,
  dividends: false,
  categories: false,
})

// 标签页配置
const tabs = [
  { name: 'executives', label: '高管信息' },
  { name: 'executive-transactions', label: '高管持股变动' },
  { name: 'events', label: '公司大事记' },
  { name: 'shareholders', label: '股东信息' },
  { name: 'dividends', label: '分红信息' },
]

// 计算属性
const sortedEvents = computed(() => {
  return [...events.value].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  )
})

const topShareholders = computed(() => {
  return shareholders.value.sort((a, b) => b.proportion - a.proportion).slice(0, 10)
})

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

// 根据激活的标签页加载对应数据
watch(activeTab, (newTab) => {
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
  fetchStockInfo()
  fetchExecutives()
  fetchCategories()
})
// 处理交易按钮点击事件
const stockStore = useStockStore()
const handleTradeClick = () => {
  const stockStore = useStockStore()
  stockStore.setStockCode(stockInfo.value?.stock_code || '')
  stockStore.setStockId(stockId.value || 0)
  router.push(`/trade`)
}
</script>

<style scoped>
.stock-info-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

/* 加载样式 */
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
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #4dabf7;
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

/* 股票头部 */
.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
}

.stock-title h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.stock-code {
  font-size: 1.2rem;
  color: #666;
  background: #f8f9fa;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trade-btn {
  background: #4dabf7;
  color: white;
}

.trade-btn:hover {
  background: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.card-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
}

.card-content {
  padding: 20px;
}

.info-grid {
  display: grid;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f1f3f4;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.value.positive {
  color: #51cf66;
}

.value.negative {
  color: #f03e3e;
}

.value.high {
  color: #fab005;
}

/* 行业概念 */
.categories-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-group h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.industry-tag {
  background: #e7f5ff;
  color: #1971c2;
  border: 1px solid #a5d8ff;
}

.concept-tag {
  background: #fff0f6;
  color: #a61e4d;
  border: 1px solid #fcc2d7;
}

/* 标签页 */
.tabs-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 0 20px;
}

.tab-btn {
  padding: 16px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #4dabf7;
  background: rgba(77, 171, 247, 0.05);
}

.tab-btn.active {
  color: #4dabf7;
  background: white;
  border-bottom: 2px solid #4dabf7;
}

.badge {
  background: #4dabf7;
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tab-content {
  padding: 0;
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

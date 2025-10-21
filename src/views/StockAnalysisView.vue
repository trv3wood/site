<template>
  <div class="stock-analysis-container">
    <h1>个股盈亏分析</h1>
    
    <!-- 股票选择器 -->
    <div class="stock-selector">
      <label>选择股票：</label>
      <select v-model="selectedStockId" @change="handleStockChange">
        <option value="">请选择一只股票</option>
        <option v-for="stock in ownedStocks" :key="stock.stockId" :value="stock.stockId">
          {{ stock.stockName }} ({{ stock.stockCode }})
        </option>
      </select>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <!-- 股票盈亏详情 -->
    <div v-else-if="selectedStockId && stockAnalysisData" class="stock-details">
      <!-- 股票基本信息 -->
      <div class="stock-header">
        <h2>{{ selectedStock?.stockName }} ({{ selectedStock?.stockCode }})</h2>
        <div class="stock-status" :class="{ holding: isHolding, sold: !isHolding }">
          {{ isHolding ? '持有中' : '已清仓' }}
        </div>
      </div>
      
      <!-- 盈亏摘要卡片 -->
      <div class="profit-summary">
        <div class="summary-card">
          <h3>总盈亏</h3>
          <div class="value" :class="{ positive: totalProfit > 0, negative: totalProfit < 0 }">
            ¥{{ totalProfit.toFixed(2) }}
          </div>
          <div class="percentage" :class="{ positive: profitPercentage > 0, negative: profitPercentage < 0 }">
            ({{ profitPercentage.toFixed(2) }}%)
          </div>
        </div>
        <div class="summary-card">
          <h3>总投入</h3>
          <div class="value">¥{{ totalCost.toFixed(2) }}</div>
        </div>
        <div class="summary-card">
          <h3>当前价值</h3>
          <div class="value">¥{{ currentValue.toFixed(2) }}</div>
        </div>
        <div class="summary-card">
          <h3>{{ isHolding ? '持有数量' : '交易数量' }}</h3>
          <div class="value">{{ totalQuantity }}股</div>
        </div>
      </div>
      
      <!-- 持仓/交易明细 -->
      <div class="trade-details">
        <h3>{{ isHolding ? '持仓明细' : '交易明细' }}</h3>
        <div v-if="transactions.length === 0" class="no-data">
          <p>暂无交易记录</p>
        </div>
        <div v-else class="transactions-list">
          <div v-for="transaction in transactions" :key="transaction.transactionId" class="transaction-item">
            <div class="transaction-header">
              <span class="transaction-type" :class="transaction.type === 'BUY' ? 'buy' : 'sell'">
                {{ transaction.type === 'BUY' ? '买入' : '卖出' }}
              </span>
              <span class="transaction-date">{{ formatDate(transaction.transactionDate) }}</span>
            </div>
            <div class="transaction-body">
              <div class="transaction-info">
                <span>成交价格：¥{{ transaction.price.toFixed(2) }}</span>
                <span>成交数量：{{ transaction.quantity }}股</span>
                <span>成交金额：¥{{ (transaction.price * transaction.quantity).toFixed(2) }}</span>
              </div>
              <div v-if="transaction.type === 'SELL'" class="transaction-profit" :class="{ positive: transaction.profit > 0, negative: transaction.profit < 0 }">
                单笔盈亏：¥{{ transaction.profit.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 盈亏走势图 -->
      <div class="profit-chart">
        <h3>盈亏走势</h3>
        <canvas ref="profitChart"></canvas>
      </div>
      
      <!-- 成本分析 -->
      <div class="cost-analysis">
        <h3>成本分析</h3>
        <div class="cost-info">
          <div class="cost-item">
            <span>平均持仓成本：</span>
            <span class="value">¥{{ avgCost.toFixed(2) }}</span>
          </div>
          <div v-if="isHolding" class="cost-item">
            <span>当前价格：</span>
            <span class="value" :class="{ positive: currentPrice > avgCost, negative: currentPrice < avgCost }">
              ¥{{ currentPrice.toFixed(2) }}
            </span>
          </div>
          <div v-if="isHolding" class="cost-item">
            <span>持仓浮盈：</span>
            <span class="value" :class="{ positive: unrealizedProfit > 0, negative: unrealizedProfit < 0 }">
              ¥{{ unrealizedProfit.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 未选择股票时的提示 -->
    <div v-else class="no-selection">
      <p>请从上方选择一只股票查看盈亏分析</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { holdingsAPI, stockAPI, tradeAPI } from '@/services/api'
import type { DateQueryParam } from '@/types'
import { useRoute } from 'vue-router'

// 注册 Chart.js 组件
Chart.register(...registerables)

const route = useRoute()

// 响应式数据
const selectedStockId = ref(route.params.stockId as string || '')
const ownedStocks = ref<any[]>([])
const stockAnalysisData = ref<any>(null)
const transactions = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const profitChart = ref<HTMLCanvasElement>()
let profitChartInstance: Chart | null = null

// 计算属性
const selectedStock = computed(() => {
  return ownedStocks.value.find(stock => stock.stockId === selectedStockId.value)
})

const isHolding = computed(() => {
  return stockAnalysisData.value?.status === 'HOLDING'
})

const totalProfit = computed(() => {
  return stockAnalysisData.value?.totalProfit || 0
})

const profitPercentage = computed(() => {
  const cost = totalCost.value
  return cost > 0 ? (totalProfit.value / cost) * 100 : 0
})

const totalCost = computed(() => {
  return stockAnalysisData.value?.totalCost || 0
})

const currentValue = computed(() => {
  return stockAnalysisData.value?.currentValue || 0
})

const totalQuantity = computed(() => {
  return stockAnalysisData.value?.totalQuantity || 0
})

const avgCost = computed(() => {
  const quantity = totalQuantity.value
  return quantity > 0 ? totalCost.value / quantity : 0
})

const currentPrice = computed(() => {
  return stockAnalysisData.value?.currentPrice || 0
})

const unrealizedProfit = computed(() => {
  if (!isHolding.value) return 0
  return (currentPrice.value - avgCost.value) * totalQuantity.value
})

// 获取用户持有过的股票列表
const fetchOwnedStocks = async () => {
  try {
    const response = await holdingsAPI.getHoldings()
    if (response && response.data && Array.isArray(response.data)) {
      ownedStocks.value = response.data
      
      // 如果路由参数中有stockId且存在于列表中，自动选中
      if (route.params.stockId && !selectedStockId.value) {
        const stockId = route.params.stockId as string
        if (ownedStocks.value.some(stock => stock.stockId === stockId)) {
          selectedStockId.value = stockId
        }
      }
      
      // 如果有股票且未选择，默认选择第一个
      if (ownedStocks.value.length > 0 && !selectedStockId.value) {
        selectedStockId.value = ownedStocks.value[0].stockId
      }
    }
  } catch (error) {
    console.error('获取持有股票列表失败:', error)
    // 使用模拟数据
    ownedStocks.value = generateMockOwnedStocks()
    if (ownedStocks.value.length > 0) {
      selectedStockId.value = ownedStocks.value[0].stockId
    }
  }
}

// 获取股票盈亏分析数据
const fetchStockAnalysisData = async (stockId: string) => {
  if (!stockId) return
  
  loading.value = true
  error.value = ''
  
  try {
    // 获取持仓数据
    const holdingsResponse = await holdingsAPI.getHoldings()
    const holdingData = Array.isArray(holdingsResponse) ? holdingsResponse : []
    const targetHolding = holdingData.find(h => h.stockId === stockId || h.stock_code === stockId)
    
    // 获取订单数据
    const ordersResponse = await tradeAPI.getOrder()
    const orderData = Array.isArray(ordersResponse) ? ordersResponse : []
    const stockOrders = orderData.filter(o => o.stock_code === targetHolding?.stock_code)
    
    // 获取历史价格数据
    const dateQueryParam: DateQueryParam = {
      stock_id: parseInt(stockId),
      start_date: null,
      end_date: null
    }
    const historyResponse = await stockAPI.getPriceHistory(dateQueryParam)
    const historyData = Array.isArray(historyResponse) ? historyResponse : []
    
    // 构建分析数据
    stockAnalysisData.value = buildStockAnalysisData(
      stockId,
      targetHolding,
      stockOrders,
      historyData
    )
    
    // 格式化交易数据
    formatTransactions()
    
    // 更新图表
    updateProfitChart()
  } catch (err) {
    console.error('获取股票分析数据失败:', err)
    error.value = '获取数据失败，请稍后重试'
    // 仍然使用构建的数据，但确保不会崩溃
    if (!stockAnalysisData.value) {
      stockAnalysisData.value = buildEmptyAnalysisData(stockId)
      formatTransactions()
      updateProfitChart()
    }
  } finally {
    loading.value = false
  }
}

// 格式化交易数据
const formatTransactions = () => {
  if (!stockAnalysisData.value || !stockAnalysisData.value.transactions) {
    transactions.value = []
    return
  }
  
  // 按照日期倒序排列
  transactions.value = [...stockAnalysisData.value.transactions]
    .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
}

// 更新盈亏走势图
const updateProfitChart = () => {
  if (!stockAnalysisData.value || !stockAnalysisData.value.profitTrend) {
    return
  }
  
  const { dates, profits } = stockAnalysisData.value.profitTrend
  const labels = dates.map((date: string) => formatDate(date))
  
  if (profitChartInstance) {
    profitChartInstance.destroy()
  }
  
  if (profitChart.value) {
    profitChartInstance = new Chart(profitChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '盈亏金额',
          data: profits,
          borderColor: profits[profits.length - 1] >= 0 ? '#10B981' : '#EF4444',
          backgroundColor: profits[profits.length - 1] >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.5,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return `¥${context.parsed.y.toFixed(2)}`
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: function(value: any) {
                return '¥' + Number(value).toFixed(0)
              }
            },
            suggestedMin: Math.min(...profits) * 1.1,
            suggestedMax: Math.max(...profits) * 1.1
          }
        }
      }
    })
  }
}

// 处理股票选择变化
const handleStockChange = () => {
  fetchStockAnalysisData(selectedStockId.value)
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 从订单数据构建交易记录
const buildTransactionsFromOrders = (orders: any[]) => {
  return orders.map((order, index) => ({
    transactionId: `order_${index}_${order.created_time || Date.now()}`,
    transactionDate: order.created_time ? new Date(order.created_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: order.order_type,
    price: order.price,
    quantity: order.quantity,
    profit: order.order_type === 'SELL' ? calculateOrderProfit(order) : 0
  }))
}

// 计算卖出订单的利润
const calculateOrderProfit = (sellOrder: any): number => {
  // 这里简化处理，实际应该根据先进先出或其他成本计算方法
  return 0 // 后续可以根据实际需求完善利润计算逻辑
}

// 构建股票分析数据
const buildStockAnalysisData = (stockId: string, holding: any, orders: any[], history: any[]) => {
  const stock = ownedStocks.value.find(s => s.stockId === stockId || s.stock_code === stockId)
  const isHolding = holding && holding.quantity > 0
  
  // 计算总投入成本
  let totalCost = 0
  let totalBuyQuantity = 0
  let totalSellQuantity = 0
  
  orders.forEach(order => {
    if (order.order_type === 'BUY') {
      totalCost += order.price * order.quantity
      totalBuyQuantity += order.quantity
    } else if (order.order_type === 'SELL') {
      totalSellQuantity += order.quantity
    }
  })
  
  const remainingQuantity = totalBuyQuantity - totalSellQuantity
  const avgCost = totalBuyQuantity > 0 ? totalCost / totalBuyQuantity : 0
  
  // 获取当前价格（从历史数据或持仓数据）
  let currentPrice = 0
  if (history.length > 0) {
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
    )
    currentPrice = sortedHistory[0].current_price || 0
  } else if (holding) {
    currentPrice = holding.current_price || holding.avg_cost * (1 + (holding.profit_rate || 0) / 100)
  }
  
  // 计算当前价值和盈亏
  const currentValue = remainingQuantity * currentPrice
  const realizedProfit = 0 // 实际利润需要更复杂的计算
  const unrealizedProfit = remainingQuantity > 0 ? (currentPrice - avgCost) * remainingQuantity : 0
  const totalProfit = realizedProfit + unrealizedProfit
  
  // 构建盈亏趋势数据
  const profitTrend = buildProfitTrend(history, orders, avgCost)
  
  return {
    stockId,
    stockCode: stock?.stockCode || holding?.stock_code || stockId,
    stockName: stock?.stockName || holding?.stock_name || `股票${stockId}`,
    status: isHolding ? 'HOLDING' : 'SOLD',
    totalCost,
    totalProfit,
    currentValue,
    totalQuantity: remainingQuantity,
    currentPrice,
    transactions: buildTransactionsFromOrders(orders),
    profitTrend
  }
}

// 构建盈亏趋势数据
const buildProfitTrend = (history: any[], orders: any[], avgCost: number) => {
  // 按时间排序历史数据
  const sortedHistory = [...history].sort((a, b) => 
    new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
  )
  
  // 按时间排序订单
  const sortedOrders = [...orders].sort((a, b) => 
    new Date(a.created_time).getTime() - new Date(b.created_time).getTime()
  )
  
  const dates: string[] = []
  const profits: number[] = []
  let holdingQuantity = 0
  let investedAmount = 0
  
  // 如果有历史数据，基于历史数据构建趋势
  if (sortedHistory.length > 0) {
    sortedHistory.forEach(dayData => {
      const date = new Date(dayData.created_time).toISOString().split('T')[0]
      dates.push(date)
      
      // 更新该日期前的持仓
      updateHoldingUpToDate(sortedOrders, date, dayData.created_time, (qty, amount) => {
        holdingQuantity = qty
        investedAmount = amount
      })
      
      // 计算该日期的盈亏
      const currentValue = holdingQuantity * dayData.current_price
      profits.push(currentValue - investedAmount)
    })
  } else {
    // 如果没有历史数据，使用订单数据构建简单趋势
    let currentProfit = 0
    sortedOrders.forEach((order, index) => {
      const date = new Date(order.created_time).toISOString().split('T')[0]
      dates.push(date)
      
      if (order.order_type === 'BUY') {
        investedAmount += order.price * order.quantity
      } else if (order.order_type === 'SELL') {
        currentProfit += order.price * order.quantity - avgCost * order.quantity
      }
      
      profits.push(currentProfit)
    })
  }
  
  // 如果没有任何数据，生成默认趋势
  if (dates.length === 0) {
    const days = 30
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
      profits.push(0)
    }
  }
  
  return { dates, profits }
}

// 更新到指定日期的持仓情况
const updateHoldingUpToDate = (orders: any[], date: string, timestamp: string, callback: (quantity: number, amount: number) => void) => {
  let quantity = 0
  let amount = 0
  
  orders.forEach(order => {
    if (new Date(order.created_time) <= new Date(timestamp)) {
      if (order.order_type === 'BUY') {
        quantity += order.quantity
        amount += order.price * order.quantity
      } else if (order.order_type === 'SELL') {
        quantity -= order.quantity
        // 卖出时不减少投入金额，因为这是已实现的交易
      }
    }
  })
  
  callback(quantity, amount)
}

// 构建空的分析数据作为兜底
const buildEmptyAnalysisData = (stockId: string) => {
  const stock = ownedStocks.value.find(s => s.stockId === stockId || s.stock_code === stockId)
  const dates = []
  const profits = []
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
    profits.push(0)
  }
  
  return {
    stockId,
    stockCode: stock?.stock_code || stockId,
    stockName: stock?.stock_name || `股票${stockId}`,
    status: 'HOLDING',
    totalCost: 0,
    totalProfit: 0,
    currentValue: 0,
    totalQuantity: 0,
    currentPrice: 0,
    transactions: [],
    profitTrend: { dates, profits }
  }
}

// 监听路由参数变化
watch(() => route.params.stockId, (newStockId) => {
  if (newStockId && newStockId !== selectedStockId.value) {
    selectedStockId.value = newStockId as string
  }
})

// 组件挂载时获取数据
onMounted(async () => {
  await fetchOwnedStocks()
  if (selectedStockId.value) {
    fetchStockAnalysisData(selectedStockId.value)
  }
})

// 处理窗口大小变化，重新渲染图表
const handleResize = () => {
  updateProfitChart()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
const cleanup = () => {
  if (profitChartInstance) {
    profitChartInstance.destroy()
  }
  window.removeEventListener('resize', handleResize)
}

// 导出清理函数供父组件使用
defineExpose({
  cleanup
})
</script>

<style scoped>
.stock-analysis-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 30px;
  color: #1F2937;
}

.stock-selector {
  margin-bottom: 30px;
}

.stock-selector label {
  margin-right: 10px;
  font-weight: 500;
}

.stock-selector select {
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}

.loading, .error, .no-selection {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error {
  color: #EF4444;
}

.stock-details {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #E5E7EB;
}

.stock-header h2 {
  margin: 0;
  color: #1F2937;
}

.stock-status {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.stock-status.holding {
  background-color: #D1FAE5;
  color: #065F46;
}

.stock-status.sold {
  background-color: #FEE2E2;
  color: #991B1B;
}

.profit-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.summary-card {
  background-color: #F9FAFB;
  padding: 20px;
  border-radius: 8px;
}

.summary-card h3 {
  margin-bottom: 10px;
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
}

.summary-card .value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 5px;
}

.summary-card .percentage {
  font-size: 14px;
}

.value.positive, .percentage.positive {
  color: #10B981;
}

.value.negative, .percentage.negative {
  color: #EF4444;
}

.trade-details, .profit-chart, .cost-analysis {
  margin-bottom: 40px;
}

h3 {
  color: #1F2937;
  margin-bottom: 20px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.transaction-item {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 15px;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.transaction-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.transaction-type.buy {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.transaction-type.sell {
  background-color: #FEE2E2;
  color: #991B1B;
}

.transaction-date {
  color: #6B7280;
  font-size: 14px;
}

.transaction-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #4B5563;
}

.transaction-profit {
  font-weight: 500;
  font-size: 14px;
}

.profit-chart {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.profit-chart h3 {
  flex-shrink: 0;
}

.profit-chart canvas {
  flex: 1;
  height: auto !important;
  max-height: 350px;
  margin-top: 20px;
}

.cost-analysis {
  background-color: #F9FAFB;
  padding: 20px;
  border-radius: 8px;
}

.cost-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}

.cost-item .value {
  font-weight: 600;
}

@media (max-width: 768px) {
  .profit-summary {
    grid-template-columns: 1fr 1fr;
  }
  
  .transaction-body {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .transaction-info {
    flex-direction: column;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .profit-summary {
    grid-template-columns: 1fr;
  }
  
  .stock-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
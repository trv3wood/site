<template>
  <div class="transactions-view">
    <!-- 页面头部 -->
    <div class="header">
      <div class="header-top">
        <h1 class="page-title">交易记录</h1>
        <div class="account-info">
          <div class="balance-card">
            <span class="balance-label">账户余额：</span>
            <span class="balance-amount">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 交易统计 -->
    <div class="summary-section">
      <div class="records-summary">
        <div class="summary-item">
          <span class="summary-label">总交易次数：</span>
          <strong class="summary-value">{{ totalTrades }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">买入总额：</span>
          <strong class="summary-value buy">¥{{ buyTotal.toFixed(2) }}</strong>
        </div>
        <div class="summary-item">
          <span class="summary-label">卖出总额：</span>
          <strong class="summary-value sell">¥{{ sellTotal.toFixed(2) }}</strong>
        </div>
      </div>
    </div>

    <!-- 筛选器 -->
    <div class="filter-section">
      <div class="filter-controls">
        <label for="filter-type" class="filter-label">交易类型:</label>
        <select id="filter-type" v-model="filterType" class="filter-select">
          <option value="all">全部类型</option>
          <option value="BUY">买入</option>
          <option value="SELL">卖出</option>
        </select>
      </div>
    </div>

    <!-- 交易记录内容 -->
    <div class="records-content">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>暂无交易记录</p>
        <button @click="$router.push('/trade')" class="action-btn trade-btn">
          去交易
        </button>
      </div>

      <div v-else class="records-table-container">
        <div class="table-header">
          <div class="table-info">
            <span class="records-count">共 {{ filteredRecords.length }} 条记录</span>
          </div>
        </div>
        <div class="records-table-wrapper">
          <table class="records-table">
            <thead>
              <tr>
                <th>交易时间</th>
                <th>股票代码</th>
                <th>股票名称</th>
                <th>交易方向</th>
                <th>成交价格</th>
                <th>成交数量</th>
                <th>成交金额</th>
                <th>交易状态</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="record in filteredRecords" 
                :key="record.order_id" 
                class="record-row"
                @click="showStockProfit(record)"
              >
                <td>{{ formatDate(record.created_time) }}</td>
                <td class="stock-code">{{ record.stock_code }}</td>
                <td class="stock-name">{{ record.stock_name }}</td>
                <td :class="record.order_type === 'BUY' ? 'buy' : 'sell'">
                  {{ record.order_type === 'BUY' ? '买入' : '卖出' }}
                </td>
                <td>¥{{ record.price.toFixed(2) }}</td>
                <td>{{ record.quantity.toLocaleString() }}</td>
                <td>¥{{ (record.price * record.quantity).toFixed(2) }}</td>
                <td :class="getStatusClass(record.status)">
                  {{ getStatusText(record.status) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 股票盈亏弹窗 -->
    <div v-if="showProfitDialog" class="profit-dialog-overlay" @click="closeProfitDialog">
      <div class="profit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ selectedStock?.stock_name }} ({{ selectedStock?.stock_code }}) 盈亏情况</h3>
          <button class="close-btn" @click="closeProfitDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <!-- 当前持仓信息 -->
          <div v-if="currentHolding" class="holding-section">
            <h4>当前持仓</h4>
            <div class="profit-info">
              <div class="profit-item">
                <span class="label">持仓数量:</span>
                <span class="value">{{ currentHolding.quantity.toLocaleString() }}股</span>
              </div>
              <div class="profit-item">
                <span class="label">平均成本:</span>
                <span class="value">¥{{ currentHolding.avg_cost.toFixed(2) }}</span>
              </div>
              <div class="profit-item">
                <span class="label">当前价格:</span>
                <span class="value">¥{{ currentPrice.toFixed(2) }}</span>
              </div>
              <div class="profit-item">
                <span class="label">浮动盈亏:</span>
                <span :class="['value', currentHolding.profit >= 0 ? 'profit' : 'loss']">
                  {{ currentHolding.profit >= 0 ? '+' : '' }}¥{{ currentHolding.profit.toFixed(2) }}
                </span>
              </div>
              <div class="profit-item">
                <span class="label">盈亏比例:</span>
                <span :class="['value', currentHolding.profit_rate >= 0 ? 'profit' : 'loss']">
                  {{ currentHolding.profit_rate >= 0 ? '+' : '' }}{{ currentHolding.profit_rate.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- 历史交易统计 -->
          <div class="history-section">
            <h4>历史交易统计</h4>
            <div class="history-stats">
              <div class="stat-item">
                <span class="label">总买入:</span>
                <span class="value">¥{{ stockBuyTotal.toFixed(2) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">总卖出:</span>
                <span class="value">¥{{ stockSellTotal.toFixed(2) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">交易次数:</span>
                <span class="value">{{ stockTradeCount }}次</span>
              </div>
              <div v-if="!currentHolding" class="stat-item">
                <span class="label">已实现盈亏:</span>
                <span :class="['value', realizedProfit >= 0 ? 'profit' : 'loss']">
                  {{ realizedProfit >= 0 ? '+' : '' }}¥{{ realizedProfit.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 最近交易记录 -->
          <div class="recent-trades">
            <h4>最近交易记录</h4>
            <div class="trades-list">
              <div 
                v-for="trade in recentTrades" 
                :key="trade.order_id" 
                class="trade-item"
              >
                <span class="trade-time">{{ formatDate(trade.created_time) }}</span>
                <span :class="['trade-type', trade.order_type === 'BUY' ? 'buy' : 'sell']">
                  {{ trade.order_type === 'BUY' ? '买入' : '卖出' }}
                </span>
                <span class="trade-quantity">{{ trade.quantity.toLocaleString() }}股</span>
                <span class="trade-price">¥{{ trade.price.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button @click="goToTrade" class="action-btn trade-btn">立即交易</button>
          <button @click="closeProfitDialog" class="action-btn cancel-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useStockStore } from '@/stores/stock'
import api from '@/services/api'

interface OrderRecord {
  order_id: number
  created_time: string
  stock_code: string
  stock_name: string
  order_type: 'BUY' | 'SELL'
  price: number
  quantity: number
  status: string
}

interface StockHolding {
  stock_code: string
  stock_name: string
  quantity: number
  avg_cost: number
  profit: number
  profit_rate: number
}

const router = useRouter()
const userStore = useUserStore()
const stockStore = useStockStore()

const orderRecords = ref<OrderRecord[]>([])
const filterType = ref('all')
const showProfitDialog = ref(false)
const selectedStock = ref<OrderRecord | null>(null)
const currentHolding = ref<StockHolding | null>(null)
const currentPrice = ref(0)

const filteredRecords = computed(() => {
  let filtered = orderRecords.value

  if (filterType.value !== 'all') {
    filtered = filtered.filter(record => record.order_type === filterType.value)
  }

  return filtered.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
})

const totalTrades = computed(() => filteredRecords.value.length)

const buyTotal = computed(() => {
  return filteredRecords.value
    .filter(record => record.order_type === 'BUY')
    .reduce((sum, record) => sum + (record.price * record.quantity), 0)
})

const sellTotal = computed(() => {
  return filteredRecords.value
    .filter(record => record.order_type === 'SELL')
    .reduce((sum, record) => sum + (record.price * record.quantity), 0)
})

// 选中股票的统计数据
const stockTrades = computed(() => {
  if (!selectedStock.value) return []
  return orderRecords.value.filter(record => record.stock_code === selectedStock.value?.stock_code)
})

const stockBuyTotal = computed(() => {
  return stockTrades.value
    .filter(record => record.order_type === 'BUY')
    .reduce((sum, record) => sum + (record.price * record.quantity), 0)
})

const stockSellTotal = computed(() => {
  return stockTrades.value
    .filter(record => record.order_type === 'SELL')
    .reduce((sum, record) => sum + (record.price * record.quantity), 0)
})

const stockTradeCount = computed(() => stockTrades.value.length)

const realizedProfit = computed(() => {
  // 计算已清仓股票的盈亏
  if (currentHolding.value) return 0 // 如果还有持仓，已实现盈亏为0
  
  const buyTrades = stockTrades.value.filter(t => t.order_type === 'BUY')
  const sellTrades = stockTrades.value.filter(t => t.order_type === 'SELL')
  
  const totalBuyCost = buyTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0)
  const totalSellAmount = sellTrades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0)
  
  return totalSellAmount - totalBuyCost
})

const recentTrades = computed(() => {
  return stockTrades.value
    .slice(0, 5) // 只显示最近5条记录
    .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
})

const fetchOrderRecords = async () => {
  try {
    // 这里需要根据你的实际API调整
    // const response = await api.trade.getOrderHistory()
    // orderRecords.value = response.data || []
    
    // 模拟数据
    orderRecords.value = [
      {
        order_id: 1,
        created_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        stock_code: '000001',
        stock_name: '平安银行',
        order_type: 'BUY',
        price: 11.50,
        quantity: 1000,
        status: 'filled'
      },
      {
        order_id: 2,
        created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        stock_code: '600036',
        stock_name: '招商银行',
        order_type: 'BUY',
        price: 30.80,
        quantity: 500,
        status: 'filled'
      },
      {
        order_id: 3,
        created_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        stock_code: '000001',
        stock_name: '平安银行',
        order_type: 'SELL',
        price: 12.20,
        quantity: 200,
        status: 'filled'
      },
      {
        order_id: 4,
        created_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        stock_code: '600036',
        stock_name: '招商银行',
        order_type: 'SELL',
        price: 32.50,
        quantity: 200,
        status: 'filled'
      }
    ]
  } catch (error) {
    console.error('获取交易记录失败:', error)
  }
}

// 显示股票盈亏弹窗
const showStockProfit = async (record: OrderRecord) => {
  selectedStock.value = record
  showProfitDialog.value = true
  
  try {
    // 获取当前持仓信息
    const holdings = await api.holdings.getHoldings()
    const holding = holdings.find((h: StockHolding) => h.stock_code === record.stock_code)
    currentHolding.value = holding || null
    
    // 获取当前价格（模拟数据）
    // 在实际应用中，这里应该调用API获取实时价格
    currentPrice.value = await getCurrentStockPrice(record.stock_code)
    
  } catch (error) {
    console.error('获取股票盈亏信息失败:', error)
    currentHolding.value = null
    currentPrice.value = record.price // 使用交易记录中的价格作为备选
  }
}

// 获取当前股票价格（模拟函数）
const getCurrentStockPrice = async (stockCode: string): Promise<number> => {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 模拟价格数据
  const priceMap: { [key: string]: number } = {
    '000001': 12.50, // 平安银行
    '600036': 31.80  // 招商银行
  }
  
  return priceMap[stockCode] || 0
}

const closeProfitDialog = () => {
  showProfitDialog.value = false
  selectedStock.value = null
  currentHolding.value = null
  currentPrice.value = 0
}

const goToTrade = () => {
  if (selectedStock.value) {
    stockStore.setStockCode(selectedStock.value.stock_code)
    router.push('/trade')
    closeProfitDialog()
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusClass = (status: string) => {
  const statusMap: { [key: string]: string } = {
    filled: 'status-success',
    pending: 'status-pending',
    cancelled: 'status-cancelled'
  }
  return statusMap[status] || ''
}

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    filled: '已成交',
    pending: '处理中',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

onMounted(() => {
  fetchOrderRecords()
})
</script>

<style scoped>
.transactions-view {
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
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #495057;
}

.account-info {
  display: flex;
  gap: 15px;
}

.balance-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #e3f2fd, #d0ebff);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #a5d8ff;
}

.balance-label {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
  margin-bottom: 0;
}

.balance-amount {
  font-size: 1rem;
  font-weight: 700;
  color: #1971c2;
}

/* 统计区域 */
.summary-section {
  margin-bottom: 20px;
}

.records-summary {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0;
}

.summary-value {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.buy {
  color: #dc3545;
}

.sell {
  color: #28a745;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 20px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.filter-label {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  color: #495057;
  font-size: 0.85rem;
  transition: border-color 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #4dabf7;
}

/* 表格容器 */
.records-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

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

.records-count {
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

.records-table-wrapper {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.records-table th {
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

.records-table td {
  padding: 12px 12px;
  text-align: center;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.record-row:hover {
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

.status-success {
  color: #28a745;
  font-weight: 600;
}

.status-pending {
  color: #ffc107;
  font-weight: 600;
}

.status-cancelled {
  color: #6c757d;
  font-weight: 600;
}

/* 空状态样式 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #6c757d;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 15px;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.trade-btn {
  background: #4dabf7;
  color: white;
  border: 1px solid #4dabf7;
}

.trade-btn:hover {
  background: #339af0;
  border-color: #339af0;
  transform: translateY(-1px);
}

/* 盈亏弹窗样式 */
.profit-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.profit-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #e3f2fd, #d0ebff);
}

.dialog-header h3 {
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dialog-content {
  padding: 24px;
}

.holding-section,
.history-section,
.recent-trades {
  margin-bottom: 24px;
}

.holding-section h4,
.history-section h4,
.recent-trades h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  border-left: 4px solid #4dabf7;
  padding-left: 12px;
}

.profit-info,
.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.profit-item,
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profit-item .label,
.stat-item .label {
  color: #666;
  font-weight: 500;
}

.profit-item .value,
.stat-item .value {
  font-weight: 600;
  color: #333;
}

.profit {
  color: #dc3545;
}

.loss {
  color: #28a745;
}

.recent-trades .trades-list {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.trade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e9ecef;
}

.trade-item:last-child {
  border-bottom: none;
}

.trade-time {
  color: #666;
  font-size: 0.85rem;
  flex: 2;
}

.trade-type {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.trade-type.buy {
  background: #ffe3e3;
  color: #dc3545;
}

.trade-type.sell {
  background: #d3f9d8;
  color: #28a745;
}

.trade-quantity {
  flex: 1;
  text-align: right;
  font-weight: 500;
}

.trade-price {
  flex: 1;
  text-align: right;
  font-weight: 600;
  color: #333;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: 1px solid #6c757d;
}

.cancel-btn:hover {
  background: #5a6268;
  border-color: #5a6268;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-top {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .account-info {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .transactions-view {
    padding: 15px;
  }
  
  .header-top {
    padding: 12px 16px;
  }
  
  .page-title {
    font-size: 1.4rem;
  }
  
  .records-summary {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .summary-item {
    justify-content: space-between;
    width: 100%;
  }
  
  .balance-card {
    padding: 6px 12px;
  }
  
  .balance-amount {
    font-size: 0.95rem;
  }
  
  .profit-dialog {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .profit-info,
  .history-stats {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .trade-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .trade-time {
    flex: 100%;
    order: 1;
  }
  
  .trade-type {
    order: 2;
  }
  
  .trade-quantity {
    order: 3;
    text-align: left;
  }
  
  .trade-price {
    order: 4;
    text-align: right;
  }
}

@media (max-width: 480px) {
  .account-info {
    flex-direction: column;
    width: 100%;
  }
  
  .balance-card {
    width: 100%;
    justify-content: center;
  }
  
  .summary-label {
    font-size: 0.85rem;
  }
  
  .summary-value {
    font-size: 0.95rem;
  }
  
  .profit-dialog-overlay {
    padding: 10px;
  }
}
</style>
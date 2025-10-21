<template>
  <div class="trade-record-view">
    <div class="page-header">
      <h2>交易记录</h2>
      <div class="header-info">
        <span
          >账户余额: <strong>¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</strong></span
        >
        <div class="filters">
          <select v-model="filterType" class="filter-select">
            <option value="all">全部类型</option>
            <option value="BUY">买入</option>
            <option value="SELL">卖出</option>
          </select>
        </div>
      </div>
    </div>

    <div class="records-summary">
      <div class="summary-item">
        <span>总交易次数:</span>
        <strong>{{ totalTrades }}</strong>
      </div>
      <div class="summary-item">
        <span>买入总额:</span>
        <strong class="buy">¥{{ buyTotal.toFixed(2) }}</strong>
      </div>
      <div class="summary-item">
        <span>卖出总额:</span>
        <strong class="sell">¥{{ sellTotal.toFixed(2) }}</strong>
      </div>
    </div>

    <div class="records-content">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <p>暂无交易记录</p>
        <router-link to="/trade" class="trade-link">去交易</router-link>
      </div>

      <div v-else class="records-table-container">
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
            <tr v-for="record in filteredRecords" :key="record.order_id">
              <td>{{ formatDate(record.created_time) }}</td>
              <td>{{ record.stock_code }}</td>
              <td>{{ record.stock_name }}</td>
              <td :class="record.order_type === 'BUY' ? 'buy' : 'sell'">
                {{ record.order_type === 'BUY' ? '买入' : '卖出' }}
              </td>
              <td>¥{{ record.price.toFixed(2) }}</td>
              <td>{{ record.quantity }}</td>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

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

const userStore = useUserStore()
const orderRecords = ref<OrderRecord[]>([])
const filterType = ref('all')

const filteredRecords = computed(() => {
  let filtered = orderRecords.value

  if (filterType.value !== 'all') {
    filtered = filtered.filter(record => record.order_type === filterType.value)
  }

  return filtered.sort(
    (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
  )
})

const totalTrades = computed(() => filteredRecords.value.length)

const buyTotal = computed(() => {
  return filteredRecords.value
    .filter(record => record.order_type === 'BUY')
    .reduce((sum, record) => sum + record.price * record.quantity, 0)
})

const sellTotal = computed(() => {
  return filteredRecords.value
    .filter(record => record.order_type === 'SELL')
    .reduce((sum, record) => sum + record.price * record.quantity, 0)
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
        price: 11.5,
        quantity: 1000,
        status: 'filled',
      },
      {
        order_id: 2,
        created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        stock_code: '600036',
        stock_name: '招商银行',
        order_type: 'BUY',
        price: 30.8,
        quantity: 500,
        status: 'filled',
      },
      {
        order_id: 3,
        created_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        stock_code: '000001',
        stock_name: '平安银行',
        order_type: 'SELL',
        price: 12.2,
        quantity: 200,
        status: 'filled',
      },
    ]
  } catch (error) {
    console.error('获取交易记录失败:', error)
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getStatusClass = (status: string) => {
  const statusMap: { [key: string]: string } = {
    filled: 'status-success',
    pending: 'status-pending',
    cancelled: 'status-cancelled',
  }
  return statusMap[status] || ''
}

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    filled: '已成交',
    pending: '处理中',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

onMounted(() => {
  fetchOrderRecords()
})
</script>

<style scoped>
/* 样式与之前相同 */
.trade-record-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.page-header h2 {
  color: #333;
  margin: 0;
}

.header-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.trade-link {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background: #4dabf7;
  color: white;
  text-decoration: none;
  border-radius: 6px;
}

.records-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.records-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.records-table tbody tr:hover {
  background: #f8f9fa;
}

.buy {
  color: #f03e3e;
  font-weight: 600;
}

.sell {
  color: #51cf66;
  font-weight: 600;
}

.status-success {
  color: #51cf66;
  font-weight: 600;
}

.status-pending {
  color: #fab005;
  font-weight: 600;
}

.status-cancelled {
  color: #868e96;
  font-weight: 600;
}

.records-summary {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px; /* 新增 */
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-item span {
  color: #666;
  font-size: 14px;
}

.summary-item strong {
  font-size: 18px;
  color: #333;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  .header-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .records-table-container {
    overflow-x: auto;
  }

  .records-table {
    min-width: 800px;
  }

  .records-summary {
    flex-direction: column;
    gap: 15px;
  }
}
</style>

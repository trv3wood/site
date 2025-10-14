<template>
  <div class="portfolio-container">
    <h1>我的持仓</h1>
    <!-- 持仓列表 -->
    <div class="holdings-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>持仓列表</span>
            <el-button type="primary" @click="refreshHoldings" :loading="loading">刷新</el-button>
          </div>
        </template>

        <el-table :data="holdings" v-loading="loading" empty-text="暂无持仓">
          <el-table-column prop="stock_code" label="股票代码" width="120" />
          <el-table-column prop="stock_name" label="股票名称" width="150" />
          <el-table-column prop="quantity" label="持仓数量" width="120" align="right">
            <template #default="{ row }">
              {{ row.quantity.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="avg_cost" label="平均成本" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.avg_cost) }}
            </template>
          </el-table-column>
          <el-table-column prop="profit" label="盈亏" width="120" align="right">
            <template #default="{ row }">
              <span :class="{ profit: row.profit > 0, loss: row.profit < 0 }">
                {{ formatCurrency(row.profit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="profit_rate" label="收益率" width="120" align="right">
            <template #default="{ row }">
              <span :class="{ profit: row.profit_rate > 0, loss: row.profit_rate < 0 }">
                {{ row.profit_rate }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" @click="goToTrade(row)">交易</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { Holding } from '@/types'
import { useStockStore } from '@/stores/stock'

const router = useRouter()
const loading = ref(false)
const holdings = ref<Holding[]>([])

// 格式化货币显示
const formatCurrency = (value: number) => {
  return '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 跳转到交易页面
const goToTrade = (holding: Holding) => {
  const stockStore = useStockStore()
  stockStore.setStockCode(holding.stock_code)
  router.push('/trade')
}

// 刷新持仓数据
const refreshHoldings = async () => {
  loading.value = true
  try {
    await loadHoldings()
  } catch (error) {
    ElMessage.error('刷新持仓数据失败')
    console.error('Refresh holdings failed:', error)
  } finally {
    loading.value = false
  }
}

// 加载持仓列表
const loadHoldings = async () => {
  try {
    const response = await api.holdings.getHoldings()
    console.log(response)
    holdings.value = response
  } catch (error) {
    ElMessage.error('获取持仓列表失败')
    console.error('Load holdings failed:', error)
  }
}

// 页面加载时初始化数据
onMounted(() => {
  refreshHoldings()
})
</script>

<style scoped>
.portfolio-view {
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

.refresh-timer {
  color: #666;
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

.holdings-table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.holdings-table {
  width: 100%;
  border-collapse: collapse;
}

.holdings-table th,
.holdings-table td {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.holdings-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.holdings-table tbody tr:hover {
  background: #f8f9fa;
}

.positive {
  color: #f03e3e;
  font-weight: 600;
}

.negative {
  color: #51cf66;
  font-weight: 600;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px; /* 新增 */
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.total-profit,
.total-rate {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .holdings-table-container {
    overflow-x: auto;
  }

  .holdings-table {
    min-width: 800px;
  }

  .portfolio-summary {
    grid-template-columns: 1fr;
  }
}
</style>

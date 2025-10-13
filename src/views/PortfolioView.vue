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
.portfolio-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.analyze-section {
  margin-bottom: 20px;
}

.analyze-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.analyze-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.analyze-item {
  text-align: center;
}

.analyze-item .label {
  display: block;
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.analyze-item .value {
  display: block;
  font-size: 24px;
  font-weight: bold;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.holdings-section {
  margin-top: 20px;
}

.profit {
  color: #f56c6c;
}

.loss {
  color: #67c23a;
}

:deep(.el-table) {
  margin-top: 10px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}
</style>

<template>
  <div class="portfolio-view">
    <!-- 页面头部 -->
    <div class="header">
      <div class="header-top">
        <h1 class="page-title">我的持仓</h1>
        <div class="account-info">
          <div class="balance-card">
            <span class="balance-label">账户余额：</span>
            <span class="balance-amount">{{ formatCurrency(userBalance) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 持仓列表 -->
    <div class="holdings-section">
      <div class="table-header">
        <div class="table-info">
          <span class="stock-count">共 {{ holdings.length }} 只股票</span>
          <div class="refresh-controls">
            <button @click="manualRefresh" class="action-btn refresh-btn" :disabled="loading">
              {{ loading ? '刷新中...' : '立即刷新' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>数据加载中...</span>
      </div>

      <!-- 持仓表格 -->
      <div v-else class="stock-table-container">
        <div class="stock-table-wrapper">
          <table class="stock-table">
            <thead>
              <tr>
                <th>股票代码</th>
                <th>股票名称</th>
                <th>持仓数量</th>
                <th>成本价</th>
                <th>当前价</th>
                <th>盈亏</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="holding in holdings"
                :key="holding.stock_code"
                class="stock-row"
                @click="showStockProfit(holding)"
              >
                <td class="stock-code">{{ holding.stock_code }}</td>
                <td class="stock-name">{{ holding.stock_name }}</td>
                <td>{{ holding.quantity.toLocaleString() }}</td>
                <td>{{ formatCurrency(holding.avg_cost) }}</td>
                <td>
                  {{ formatCurrency(holding.current_price) }}
                </td>
                <td :class="getProfitClass(holding.profit)">
                  {{ formatCurrency(holding.profit) }}
                </td>
                <td>
                  <button @click.stop="goToTrade(holding)" class="action-btn trade-btn">
                    交易
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-if="holdings.length === 0" class="empty-state">
          <div class="empty-icon">📊</div>
          <p>暂无持仓数据</p>
          <button @click="$router.push('/market')" class="action-btn browse-btn">
            去市场浏览股票
          </button>
        </div>
      </div>
    </div>

    <!-- 股票盈亏弹窗 -->
    <el-dialog
      v-model="showProfitDialog"
      :title="`${selectedStock?.stock_name} (${selectedStock?.stock_code}) 盈亏情况`"
      width="600px"
    >
      <div v-if="selectedStock" class="stock-detail">
        <!-- 当前持仓信息 -->
        <div v-if="selectedStock.quantity > 0" class="detail-section">
          <h4>当前持仓</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>持仓数量：</label>
                <span>{{ selectedStock.quantity.toLocaleString() }} 股</span>
              </div>
              <div class="detail-item">
                <label>平均成本：</label>
                <span>{{ formatCurrency(selectedStock.avg_cost) }}</span>
              </div>
              <div class="detail-item">
                <label>当前价格：</label>
                <span>{{
                  formatCurrency(
                    selectedStock.current_price
                  )
                }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>持仓市值：</label>
                <span>{{
                  formatCurrency(
                    selectedStock.current_price *
                      selectedStock.quantity
                  )
                }}</span>
              </div>
              <div class="detail-item">
                <label>浮动盈亏：</label>
                <span :class="getProfitClass(selectedStock.profit)">
                  {{ selectedStock.profit >= 0 ? '+' : ''
                  }}{{ formatCurrency(selectedStock.profit) }}
                </span>
              </div>
              <div class="detail-item">
                <label>盈亏比例：</label>
                <span :class="getProfitClass(selectedStock.profit)">
                  {{ selectedStock.profit >= 0 ? '+' : ''
                  }}{{ (selectedStock.profit_rate * 100).toFixed(4) }}%
                </span>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 盈亏分析 -->
        <div class="profit-analysis">
          <h4>盈亏分析</h4>
          <el-progress
            :percentage="selectedStock.profit_rate"
            :status="selectedStock.profit >= 0 ? 'success' : 'exception'"
            :show-text="false"
          />
          <div class="analysis-text">
            <p v-if="selectedStock.profit > 0">
              当前盈利 {{ formatCurrency(selectedStock.profit) }} 元，相比成本上涨
              {{ formatRate(selectedStock.profit_rate)}}%
            </p>
            <p v-else-if="selectedStock.profit < 0">
              当前亏损 {{ formatCurrency(Math.abs(selectedStock.profit)) }} 元，相比成本下跌
              {{formatRate(selectedStock.profit_rate)}}%
            </p>
            <p v-else>当前不盈不亏</p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showProfitDialog = false">关闭</el-button>
        <el-button type="primary" @click="goToTrade(selectedStock!)">立即交易</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/services/api'
import type { Holding } from '@/types'
import { useStockStore } from '@/stores/stock'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const stockStore = useStockStore()
const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const holdings = ref<Holding[]>([])
const showProfitDialog = ref(false)
const selectedStock = ref<Holding | null>(null)

// 计算属性
const userBalance = computed(() => userStore.user?.balance || 0)

// 格式化货币显示
const formatCurrency = (value: number) => {
  return '¥' + value.toFixed(2)
}
function formatRate(value: number) {
  return (value * 100).toFixed(4)
}
// 获取盈亏样式类
const getProfitClass = (profit: number) => {
  if (profit > 0) return 'profit-positive'
  if (profit < 0) return 'profit-negative'
  return ''
}

// 显示股票盈亏弹窗
const showStockProfit = (holding: Holding) => {
  selectedStock.value = holding
  showProfitDialog.value = true
}

// 跳转到交易页面
const goToTrade = (holding: Holding) => {
  stockStore.setStockCode(holding.stock_code)
  router.push('/trade')
  showProfitDialog.value = false
}

// 手动刷新
const manualRefresh = async () => {
  if (loading.value) return

  loading.value = true
  try {
    await loadHoldings()
    ElMessage.success('刷新成功')
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
    // 修复类型错误：直接使用response，不访问data属性
    holdings.value = Array.isArray(response) ? response : []

    // 如果API返回的是对象且有data属性，使用data
    if (response && typeof response === 'object' && 'data' in response) {
      holdings.value = (response as any).data || []
    }
  } catch (error) {
    ElMessage.error('获取持仓列表失败')
    console.error('Load holdings failed:', error)
    throw error
  }
}

// 页面加载时初始化数据
onMounted(() => {
  loadHoldings()
})
</script>

<style scoped>
.portfolio-view {
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
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #495057;
}

.balance-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #e3f2fd, #d0ebff);
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #a5d8ff;
}

.balance-label {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.balance-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1971c2;
}

/* 表格头部样式 */
.table-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #e3f2fd, #d0ebff);
  border-bottom: 1px solid #dee2e6;
  border-radius: 12px 12px 0 0;
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.stock-count {
  color: #495057;
  font-weight: 600;
  font-size: 1rem;
}

/* 按钮样式 */
.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  background: #4dabf7;
  color: white;
  border: 1px solid #4dabf7;
}

.refresh-btn:hover:not(:disabled) {
  background: #339af0;
  border-color: #339af0;
  transform: translateY(-1px);
}

.trade-btn {
  background: #52c41a;
  color: white;
  border: 1px solid #52c41a;
  padding: 6px 12px;
  font-size: 0.85rem;
}

.trade-btn:hover {
  background: #46a018;
  border-color: #46a018;
  transform: translateY(-1px);
}

.browse-btn {
  background: #4dabf7;
  color: white;
  border: 1px solid #4dabf7;
  margin-top: 15px;
}

.browse-btn:hover {
  background: #339af0;
  border-color: #339af0;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 0 0 12px 12px;
  gap: 20px;
  color: #495057;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e9ecef;
  border-top: 3px solid #4dabf7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 持仓表格容器 */
.holdings-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.stock-table-container {
  min-height: 400px;
}

.stock-table-wrapper {
  overflow-x: auto;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.stock-table th {
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

.stock-table td {
  padding: 12px 12px;
  text-align: center;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.stock-row:hover {
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

.profit-positive {
  color: #dc3545;
  font-weight: 700;
}

.profit-negative {
  color: #28a745;
  font-weight: 700;
}

/* 空状态样式 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #6c757d;
  background: white;
  border-radius: 0 0 12px 12px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 10px;
}

/* 股票详情样式 */
.stock-detail {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
  border-left: 4px solid #4dabf7;
  padding-left: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
}

.detail-item label {
  color: #666;
  font-weight: 500;
}

.detail-item span {
  font-weight: 600;
  color: #333;
}

.profit-analysis {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.profit-analysis h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.analysis-text {
  margin-top: 12px;
  color: #666;
  font-size: 0.9rem;
}

.analysis-text p {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .portfolio-view {
    padding: 15px;
  }

  .header-top {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .table-info {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .stock-table th,
  .stock-table td {
    padding: 10px 8px;
    font-size: 0.85rem;
  }

  .balance-card {
    width: 100%;
    justify-content: center;
  }
}
</style>

<template>
    <div class="stock-profit-view">
        <!-- 页面头部 -->
        <div class="header">
            <div class="header-top">
                <div class="header-left">
                    <button @click="$router.back()" class="back-btn">
                        ← 返回
                    </button>
                    <h1 class="page-title">{{ stockName }} ({{ stockCode }}) 盈亏详情</h1>
                </div>
                <div class="account-info">
                    <div class="balance-card">
                        <span class="balance-label">账户余额</span>
                        <span class="balance-amount">¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <span>数据加载中...</span>
        </div>

        <!-- 主要内容 -->
        <div v-else class="content-container">
            <!-- 盈亏概览 -->
            <div class="profit-overview">
                <div class="overview-cards">
                    <div class="overview-card">
                        <div class="card-icon">📊</div>
                        <div class="card-content">
                            <div class="card-label">当前持仓</div>
                            <div class="card-value">{{ currentPosition.quantity.toLocaleString() }} 股</div>
                        </div>
                    </div>
                    <div class="overview-card">
                        <div class="card-icon">💰</div>
                        <div class="card-content">
                            <div class="card-label">持仓成本</div>
                            <div class="card-value">¥{{ currentPosition.avgCost.toFixed(2) }}</div>
                        </div>
                    </div>
                    <div class="overview-card">
                        <div class="card-icon">📈</div>
                        <div class="card-content">
                            <div class="card-label">当前价格</div>
                            <div class="card-value">¥{{ currentPrice.toFixed(2) }}</div>
                        </div>
                    </div>
                    <div class="overview-card" :class="getProfitClass(totalProfit)">
                        <div class="card-icon">💹</div>
                        <div class="card-content">
                            <div class="card-label">总盈亏</div>
                            <div class="card-value">¥{{ totalProfit.toFixed(2) }}</div>
                            <div class="card-subtext">{{ totalProfitRate >= 0 ? '+' : '' }}{{ totalProfitRate.toFixed(2)
                                }}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 盈亏详情 -->
            <div class="profit-details">
                <div class="detail-section">
                    <h3>持仓盈亏</h3>
                    <div class="detail-cards">
                        <div class="detail-card">
                            <span class="detail-label">浮动盈亏</span>
                            <span class="detail-value" :class="getProfitClass(floatingProfit)">
                                {{ floatingProfit >= 0 ? '+' : '' }}¥{{ floatingProfit.toFixed(2) }}
                            </span>
                        </div>
                        <div class="detail-card">
                            <span class="detail-label">浮动盈亏率</span>
                            <span class="detail-value" :class="getProfitClass(floatingProfit)">
                                {{ floatingProfitRate >= 0 ? '+' : '' }}{{ floatingProfitRate.toFixed(2) }}%
                            </span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>已实现盈亏</h3>
                    <div class="detail-cards">
                        <div class="detail-card">
                            <span class="detail-label">卖出盈利</span>
                            <span class="detail-value" :class="getProfitClass(realizedProfit)">
                                {{ realizedProfit >= 0 ? '+' : '' }}¥{{ realizedProfit.toFixed(2) }}
                            </span>
                        </div>
                        <div class="detail-card">
                            <span class="detail-label">交易费用</span>
                            <span class="detail-value negative">-¥{{ transactionCost.toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 交易记录 -->
            <div class="transaction-history">
                <div class="section-header">
                    <h3>交易记录</h3>
                    <div class="total-info">
                        共 {{ stockTransactions.length }} 笔交易
                    </div>
                </div>
                <div class="transaction-table-container">
                    <table class="transaction-table">
                        <thead>
                            <tr>
                                <th>交易时间</th>
                                <th>方向</th>
                                <th>价格</th>
                                <th>数量</th>
                                <th>金额</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="transaction in stockTransactions" :key="transaction.order_id">
                                <td>{{ formatDate(transaction.created_time) }}</td>
                                <td :class="transaction.order_type === 'BUY' ? 'buy' : 'sell'">
                                    {{ transaction.order_type === 'BUY' ? '买入' : '卖出' }}
                                </td>
                                <td>¥{{ transaction.price.toFixed(2) }}</td>
                                <td>{{ transaction.quantity.toLocaleString() }}</td>
                                <td>¥{{ (transaction.price * transaction.quantity).toFixed(2) }}</td>
                                <td :class="getStatusClass(transaction.status)">
                                    {{ getStatusText(transaction.status) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
                <button @click="goToTrade" class="action-btn primary-btn">
                    继续交易
                </button>
                <button @click="$router.back()" class="action-btn secondary-btn">
                    返回记录
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useStockStore } from '@/stores/stock'

interface Transaction {
    order_id: number
    created_time: string
    stock_code: string
    stock_name: string
    order_type: 'BUY' | 'SELL'
    price: number
    quantity: number
    status: string
}

interface Position {
    quantity: number
    avgCost: number
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const stockStore = useStockStore()

// 响应式数据
const loading = ref(true)
const stockCode = ref('')
const stockName = ref('')
const stockTransactions = ref<Transaction[]>([])
const currentPrice = ref(0)

// 从路由参数获取股票信息
onMounted(() => {
    stockCode.value = route.query.stock_code as string
    stockName.value = route.query.stock_name as string
    loadStockData()
})

// 计算属性
const currentPosition = computed<Position>(() => {
    const buyTransactions = stockTransactions.value.filter(t => t.order_type === 'BUY' && t.status === 'filled')
    const sellTransactions = stockTransactions.value.filter(t => t.order_type === 'SELL' && t.status === 'filled')

    const totalBuyQuantity = buyTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalSellQuantity = sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + (t.price * t.quantity), 0)

    const currentQuantity = totalBuyQuantity - totalSellQuantity
    const avgCost = currentQuantity > 0 ? totalBuyAmount / totalBuyQuantity : 0

    return {
        quantity: currentQuantity,
        avgCost: avgCost
    }
})

const floatingProfit = computed(() => {
    if (currentPosition.value.quantity === 0) return 0
    return (currentPrice.value - currentPosition.value.avgCost) * currentPosition.value.quantity
})

const floatingProfitRate = computed(() => {
    if (currentPosition.value.avgCost === 0) return 0
    return ((currentPrice.value - currentPosition.value.avgCost) / currentPosition.value.avgCost) * 100
})

const realizedProfit = computed(() => {
    const sellTransactions = stockTransactions.value.filter(t => t.order_type === 'SELL' && t.status === 'filled')
    const buyTransactions = stockTransactions.value.filter(t => t.order_type === 'BUY' && t.status === 'filled')

    let profit = 0
    let remainingBuys = [...buyTransactions]

    sellTransactions.forEach(sell => {
  let sellQuantity = sell.quantity ?? 0; 
  
  while (sellQuantity > 0 && remainingBuys.length > 0) {
    const buy = remainingBuys[0];
    if (!buy) break; 
    
    const buyQuantity = Math.min(buy?.quantity ?? 0, sellQuantity);
    const buyCost = (buy?.price ?? 0) * buyQuantity;
    
    profit += (sell?.price ?? 0) * buyQuantity - buyCost;
    sellQuantity -= buyQuantity;
    
    if (buy?.quantity === buyQuantity) {
      remainingBuys.shift();
    } else {
      if (remainingBuys[0]) {
        remainingBuys[0].quantity = (remainingBuys[0].quantity ?? 0) - buyQuantity;
      }
    }
  }
});

    return profit
})

const transactionCost = computed(() => {
    // 简化计算：假设交易费用为成交金额的0.1%
    const totalAmount = stockTransactions.value
        .filter(t => t.status === 'filled')
        .reduce((sum, t) => sum + (t.price * t.quantity), 0)
    return totalAmount * 0.001
})

const totalProfit = computed(() => {
    return floatingProfit.value + realizedProfit.value - transactionCost.value
})

const totalProfitRate = computed(() => {
    const totalCost = stockTransactions.value
        .filter(t => t.order_type === 'BUY' && t.status === 'filled')
        .reduce((sum, t) => sum + (t.price * t.quantity), 0)

    if (totalCost === 0) return 0
    return (totalProfit.value / totalCost) * 100
})

// 方法
const getProfitClass = (profit: number) => {
    if (profit > 0) return 'positive'
    if (profit < 0) return 'negative'
    return ''
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

const goToTrade = () => {
    stockStore.setStockCode(stockCode.value)
    router.push('/trade')
}

const loadStockData = async () => {
    loading.value = true
    try {
        // 模拟加载数据
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟获取该股票的交易记录
        stockTransactions.value = [
            {
                order_id: 1,
                created_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                stock_code: stockCode.value,
                stock_name: stockName.value,
                order_type: 'BUY',
                price: 11.50,
                quantity: 1000,
                status: 'filled'
            },
            {
                order_id: 2,
                created_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                stock_code: stockCode.value,
                stock_name: stockName.value,
                order_type: 'BUY',
                price: 12.00,
                quantity: 500,
                status: 'filled'
            },
            {
                order_id: 3,
                created_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                stock_code: stockCode.value,
                stock_name: stockName.value,
                order_type: 'SELL',
                price: 12.50,
                quantity: 800,
                status: 'filled'
            }
        ]

        // 模拟获取当前价格（这里应该调用API获取实时价格）
        currentPrice.value = 12.80

    } catch (error) {
        console.error('加载股票数据失败:', error)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.stock-profit-view {
    padding: 20px;
    max-width: 1200px;
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
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    border: 1px solid #e9ecef;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.back-btn {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.back-btn:hover {
    background: #f8f9fa;
    border-color: #4dabf7;
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
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #e3f2fd, #d0ebff);
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid #a5d8ff;
}

.balance-label {
    font-size: 0.85rem;
    color: #495057;
    font-weight: 500;
    margin-bottom: 4px;
}

.balance-amount {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1971c2;
}

/* 加载状态 */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    gap: 20px;
    color: #495057;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e9ecef;
    border-top: 4px solid #4dabf7;
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

/* 盈亏概览 */
.profit-overview {
    margin-bottom: 24px;
}

.overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

.overview-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid #e9ecef;
}

.overview-card.positive {
    border-left: 4px solid #28a745;
}

.overview-card.negative {
    border-left: 4px solid #dc3545;
}

.card-icon {
    font-size: 2rem;
}

.card-content {
    flex: 1;
}

.card-label {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 4px;
}

.card-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #333;
}

.card-subtext {
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 2px;
}

.positive .card-subtext {
    color: #28a745;
}

.negative .card-subtext {
    color: #dc3545;
}

/* 盈亏详情 */
.profit-details {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    border: 1px solid #e9ecef;
}

.detail-section {
    margin-bottom: 24px;
}

.detail-section:last-child {
    margin-bottom: 0;
}

.detail-section h3 {
    margin: 0 0 16px 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
}

.detail-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.detail-card {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #e9ecef;
}

.detail-label {
    color: #666;
    font-size: 0.9rem;
}

.detail-value {
    font-size: 1.1rem;
    font-weight: 600;
}

.detail-value.positive {
    color: #28a745;
}

.detail-value.negative {
    color: #dc3545;
}

/* 交易记录 */
.transaction-history {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    border: 1px solid #e9ecef;
}

.section-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-header h3 {
    margin: 0;
    color: #495057;
    font-size: 1.1rem;
    font-weight: 600;
}

.total-info {
    color: #666;
    font-size: 0.9rem;
}

.transaction-table-container {
    overflow-x: auto;
}

.transaction-table {
    width: 100%;
    border-collapse: collapse;
}

.transaction-table th {
    background: #f8f9fa;
    padding: 14px 12px;
    text-align: center;
    font-weight: 700;
    color: #495057;
    border-bottom: 1px solid #dee2e6;
    font-size: 0.9rem;
}

.transaction-table td {
    padding: 12px 12px;
    text-align: center;
    border-bottom: 1px solid #f1f3f4;
    font-size: 0.9rem;
}

.transaction-table tbody tr:hover {
    background: #f8f9fa;
}

.buy {
    color: #dc3545;
    font-weight: 600;
}

.sell {
    color: #28a745;
    font-weight: 600;
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

/* 操作按钮 */
.action-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.action-btn {
    padding: 12px 32px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.primary-btn {
    background: #4dabf7;
    color: white;
}

.primary-btn:hover {
    background: #339af0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.secondary-btn {
    background: white;
    color: #495057;
    border: 1px solid #ddd;
}

.secondary-btn:hover {
    background: #f8f9fa;
    border-color: #4dabf7;
    transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stock-profit-view {
        padding: 15px;
    }

    .header-top {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }

    .overview-cards {
        grid-template-columns: 1fr;
    }

    .detail-cards {
        grid-template-columns: 1fr;
    }

    .action-buttons {
        flex-direction: column;
    }

    .action-btn {
        width: 100%;
    }
}
</style>
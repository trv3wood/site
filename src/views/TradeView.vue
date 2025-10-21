<template>
  <div class="trade-view">
    <div class="trade-container">
      <!-- 股票代码输入 -->
      <div class="stock-input">
        <div class="form-group">
          <label>股票代码:</label>
          <input 
            v-model="stockCode" 
            type="text" 
            class="form-input" 
            placeholder="输入股票代码，如：000001"
            @blur="searchStock"
          />
          <div v-if="stockSearchError" class="error-message">{{ stockSearchError }}</div>
        </div>

        <div v-if="selectedStock" class="stock-info">
          <h3>{{ selectedStock.stock_name }} ({{ selectedStock.stock_code }})</h3>
          <div class="price-info">
            <span>当前价格: ¥{{ selectedStock.current_price }}</span>
            <span :class="selectedStock.change >= 0 ? 'positive' : 'negative'">
              {{ selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.change }}%
            </span>
          </div>
        </div>
        <div v-else-if="stockCode && !stockSearchError" class="stock-info">
          <p class="no-stock">正在搜索股票...</p>
        </div>
      </div>

      <!-- 交易表单 -->
      <div class="trade-form">
        <div class="form-group">
          <label>交易类型:</label>
          <div class="trade-type">
            <button :class="['type-btn', orderType === 'BUY' ? 'active' : '']" @click="orderType = 'BUY'">
              买入
            </button>
            <button :class="['type-btn', orderType === 'SELL' ? 'active' : '']" @click="orderType = 'SELL'">
              卖出
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>价格 (¥):</label>
          <input v-model.number="price" type="number" step="0.01" min="0" class="form-input" placeholder="输入交易价格" />
        </div>

        <div class="form-group">
          <label>数量 (100的整数倍):</label>
          <input v-model.number="quantity" type="number" min="100" step="100" class="form-input" placeholder="输入交易数量"
            @blur="validateQuantity" />
          <div v-if="quantityError" class="error-message">{{ quantityError }}</div>
        </div>

        <div class="trade-summary">
          <p>交易金额: <strong>¥{{ tradeAmount.toFixed(2) }}</strong></p>
          <p>账户余额: <strong>¥{{ userStore.user?.balance?.toFixed(2) || '0.00' }}</strong></p>
          <p v-if="orderType === 'BUY' && tradeAmount > (userStore.user?.balance || 0)" class="error-message">
            余额不足
          </p>
        </div>

        <button @click="submitTrade" :disabled="!canTrade" class="submit-btn">
          {{ orderType === 'BUY' ? '买入' : '卖出' }}
        </button>
      </div>

      <!-- 交易结果提示 -->
      <div v-if="tradeResult" class="trade-result" :class="tradeResult.type">
        {{ tradeResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useStockStore } from '@/stores/stock'
import api from '@/services/api'
import { ElMessage } from 'element-plus'

interface Stock {
  stock_id: number
  stock_code: string
  stock_name: string
  current_price: number
  change: number
}

const userStore = useUserStore()
const stockStore = useStockStore()
const stockCode = ref('')
const selectedStock = ref<Stock | null>(null)
const orderType = ref<'BUY' | 'SELL'>('BUY')
const price = ref<number>(0)
const quantity = ref<number>(100)
const quantityError = ref('')
const availableStocks = ref<Stock[]>([])
const tradeResult = ref<{ type: string, message: string } | null>(null)
const stockSearchError = ref('')

const tradeAmount = computed(() => {
  return price.value * quantity.value
})

const canTrade = computed(() => {
  return selectedStock.value &&
    price.value > 0 &&
    quantity.value >= 100 &&
    quantity.value % 100 === 0 &&
    !quantityError.value &&
    (orderType.value === 'SELL' || tradeAmount.value <= (userStore.user?.balance || 0))
})

const validateQuantity = () => {
  if (quantity.value < 100) {
    quantityError.value = '数量不能少于100股'
  } else if (quantity.value % 100 !== 0) {
    quantityError.value = '数量必须是100的整数倍'
  } else {
    quantityError.value = ''
  }
}

const searchStock = async () => {
  if (!stockCode.value.trim()) {
    selectedStock.value = null
    stockSearchError.value = ''
    return
  }

  stockSearchError.value = ''
  
  try {
    // 从可用股票列表中搜索
    const foundStock = availableStocks.value.find(stock => 
      stock.stock_code === stockCode.value.trim()
    )
    
    if (foundStock) {
      selectedStock.value = foundStock
      price.value = foundStock.current_price
    } else {
      selectedStock.value = null
      stockSearchError.value = '未找到该股票代码，请检查后重新输入'
    }
  } catch (error) {
    console.error('搜索股票失败:', error)
    stockSearchError.value = '搜索股票失败，请重试'
  }
}

const submitTrade = async () => {
  if (!canTrade.value || !selectedStock.value) return

  try {
    const tradeRequest = {
      stock_id: selectedStock.value.stock_id,
      stock_code: selectedStock.value.stock_code,
      order_type: orderType.value,
      price: price.value,
      quantity: quantity.value
    }

    const response = await api.trade.trade(tradeRequest)

    if (response.success) {
      tradeResult.value = {
        type: 'success',
        message: response.message || '委托成功'
      }

      // 更新用户余额
      if (userStore.user) {
        const newBalance = orderType.value === 'BUY'
          ? (userStore.user.balance - tradeAmount.value)
          : (userStore.user.balance + tradeAmount.value)
        userStore.updateBalance(newBalance)
      }

      // 重置表单
      quantity.value = 100
    } else {
      tradeResult.value = {
        type: 'error',
        message: response.message || '交易失败'
      }
    }
  } catch (error: any) {
    tradeResult.value = {
      type: 'error',
      message: error.response?.data?.message || '交易失败，请重试'
    }
  }

  // 3秒后清除提示
  setTimeout(() => {
    tradeResult.value = null
  }, 3000)
}

const loadAvailableStocks = async () => {
  try {
    // 修复：添加 type 参数
    const response = await api.market.getMarketOverview({ type: '' })
    availableStocks.value = Array.isArray(response) ? response : [response]

    // 如果 stockStore 中有股票代码，自动填充
    if (stockStore.stockCode) {
      stockCode.value = stockStore.stockCode
      await searchStock()
    }
  } catch (error) {
    console.error('获取股票列表失败:', error)
    ElMessage.error('获取股票列表失败')
  }
}

onMounted(() => {
  loadAvailableStocks()
})
</script>

<style scoped>
.trade-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.trade-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.stock-input {
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4dabf7;
  box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.1);
}

.stock-info {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4dabf7;
  margin-top: 10px;
}

.stock-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.price-info {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.no-stock {
  color: #666;
  font-style: italic;
  margin: 0;
}

.positive {
  color: #f03e3e;
  font-weight: 600;
}

.negative {
  color: #51cf66;
  font-weight: 600;
}

.trade-type {
  display: flex;
  gap: 10px;
}

.type-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  flex: 1;
}

.type-btn.active {
  border-color: #4dabf7;
  background: #4dabf7;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(77, 171, 247, 0.3);
}

.type-btn:hover:not(.active) {
  border-color: #4dabf7;
  background: #e7f5ff;
}

.error-message {
  color: #fa5252;
  font-size: 12px;
  margin-top: 5px;
  font-weight: 500;
}

.trade-summary {
  padding: 15px;
  background: #e7f5ff;
  border-radius: 8px;
  margin: 20px 0;
  border: 1px solid #a5d8ff;
}

.trade-summary p {
  margin: 5px 0;
  font-size: 0.95rem;
}

.submit-btn {
  padding: 15px;
  background: #4dabf7;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:hover:not(:disabled) {
  background: #339af0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
}

.trade-result {
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.trade-result.success {
  background: #d3f9d8;
  color: #2b8a3e;
  border: 1px solid #51cf66;
}

.trade-result.error {
  background: #ffe3e3;
  color: #c92a2a;
  border: 1px solid #ff6b6b;
}

@media (max-width: 768px) {
  .trade-view {
    padding: 15px;
  }

  .trade-container {
    padding: 20px;
  }

  .trade-type {
    flex-direction: column;
  }

  .type-btn {
    width: 100%;
  }
}
</style>

<template>
  <div class="stock-detail-view">
    <div class="header">
      <h1>{{ stock?.name }} ({{ stock?.code }})</h1>
      <div class="nav-tabs">
        <router-link :to="`/stock/${stockCode}/realtime`" class="nav-tab">实时行情</router-link>
        <router-link :to="`/stock/${stockCode}/info`" class="nav-tab">个股信息</router-link>
        <button
          v-if="$route.meta.requiresAuth"
          @click="$router.push(`/trade/${stockCode}`)"
          class="trade-btn"
        >
          交易
        </button>
      </div>
    </div>

    <div class="stock-info">
      <div class="price-section">
        <div
          class="current-price"
          :class="{ 'text-red': stock?.changePercent < 0, 'text-green': stock?.changePercent > 0 }"
        >
          {{ stock?.currentPrice }}
        </div>
        <div
          class="price-change"
          :class="{ 'text-red': stock?.changePercent < 0, 'text-green': stock?.changePercent > 0 }"
        >
          <span>{{ stock?.changeAmount }}</span>
          <span>{{ stock?.changePercent }}%</span>
        </div>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <label>开盘价</label>
          <span>{{ stock?.openPrice }}</span>
        </div>
        <div class="detail-item">
          <label>最高价</label>
          <span>{{ stock?.highPrice }}</span>
        </div>
        <div class="detail-item">
          <label>最低价</label>
          <span>{{ stock?.lowPrice }}</span>
        </div>
        <div class="detail-item">
          <label>成交量</label>
          <span>{{ stock?.volume }}</span>
        </div>
      </div>
    </div>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface Stock {
  code: string
  name: string
  openPrice: number
  currentPrice: number
  highPrice: number
  lowPrice: number
  changePercent: number
  changeAmount: number
  volume: number
}

const route = useRoute()
const stock = ref<Stock | null>(null)

const stockCode = computed(() => route.params.code as string)

const fetchStockData = async () => {
  // 模拟数据，实际应该调用后端API
  stock.value = {
    code: stockCode.value,
    name: '示例股票',
    openPrice: 10.5,
    currentPrice: 10.8,
    highPrice: 11.2,
    lowPrice: 10.3,
    changePercent: 2.86,
    changeAmount: 0.3,
    volume: 1000000,
  }
}

onMounted(() => {
  fetchStockData()
})
</script>

<style scoped>
.stock-detail-view {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.nav-tabs {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  align-items: center;
}

.nav-tab {
  padding: 8px 16px;
  text-decoration: none;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.nav-tab.router-link-active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.trade-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.stock-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.current-price {
  font-size: 2rem;
  font-weight: bold;
}

.price-change {
  font-size: 1.2rem;
}

.detail-grid {
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

.text-red {
  color: #ff4d4f;
}

.text-green {
  color: #52c41a;
}
</style>

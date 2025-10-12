<template>
  <div class="market-view">
    <div class="header">
      <h1>大盘行情</h1>
      <div class="market-tabs">
        <button :class="{ active: activeTab === 'sh' }" @click="activeTab = 'sh'; fetchMarketData()">
          沪市 (6开头)
        </button>
        <button :class="{ active: activeTab === 'sz' }" @click="activeTab = 'sz'; fetchMarketData()">
          深市 (0开头)
        </button>
        <button :class="{ active: activeTab === 'cyb' }" @click="activeTab = 'cyb'; fetchMarketData()">
          创业板 (3开头)
        </button>
      </div>
    </div>

    <div class="stock-table">
      <table>
        <thead>
          <tr>
            <th>代码</th>
            <th>名称</th>
            <th>开盘价</th>
            <th>当前价</th>
            <th>最高价</th>
            <th>最低价</th>
            <th>涨跌幅</th>
            <th>涨跌价</th>
            <th>成交量</th>
            <th>成交额</th>
            <th>市值</th>
            <th>换手率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stocks" :key="stock.stock_id" @click="$router.push(`/stock/${stock.stock_id}/info`)"
            class="stock-row">
            <td>{{ stock.stock_code }}</td>
            <td>{{ stock.stock_name }}</td>
            <td>{{ stock.open_price }}</td>
            <td :class="{ 'text-red': stock.change_rate > 0, 'text-green': stock.change_rate < 0 }">
              {{ stock.current_price }}
            </td>
            <td>{{ stock.high_price }}</td>
            <td>{{ stock.low_price }}</td>
            <td :class="{ 'text-red': stock.change_rate > 0, 'text-green': stock.change_rate < 0 }">
              {{ stock.change_rate }}%
            </td>
            <td :class="{ 'text-red': stock.change > 0, 'text-green': stock.change < 0 }">
              {{ stock.change }}
            </td>
            <td>{{ stock.volume }}</td>
            <td>{{ stock.turnover }}</td>
            <td>{{ stock.market_cap }}</td>
            <td>{{ stock.turnover_rate }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { MarketOverviewResponse as Stock } from '@/types/index'
import { marketAPI } from '@/services/api'

const activeTab = ref<'sh' | 'sz' | 'cyb'>('sh')
const stocks = ref<Stock[]>([])

const fetchMarketData = async () => {
  stocks.value = await marketAPI.getMarketOverview({ type: activeTab.value })
  console.log(stocks.value.length)
}
let intervalId = -1

onMounted(() => {
  fetchMarketData()
  intervalId = setInterval(() => {
    fetchMarketData()
  }, 5000)
})
onUnmounted(() => {
  clearInterval(intervalId)
})
</script>

<style scoped>
.market-view {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.market-tabs {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.market-tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.market-tabs button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.stock-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.stock-row:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}

.text-red {
  color: #ff4d4f;
}

.text-green {
  color: #52c41a;
}
</style>
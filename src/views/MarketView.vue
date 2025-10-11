<template>
  <div class="market-view">
    <div class="header">
      <h1>大盘行情</h1>
      <div class="market-tabs">
        <button 
          :class="{ active: activeTab === 'sh' }" 
          @click="activeTab = 'sh'"
        >
          沪市 (6开头)
        </button>
        <button 
          :class="{ active: activeTab === 'sz' }" 
          @click="activeTab = 'sz'"
        >
          深市 (3开头)
        </button>
        <button 
          :class="{ active: activeTab === 'cyb' }" 
          @click="activeTab = 'cyb'"
        >
          创业板 (0开头)
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
          <tr 
            v-for="stock in filteredStocks" 
            :key="stock.code"
            @click="$router.push(`/stock/${stock.code}`)"
            class="stock-row"
          >
            <td>{{ stock.code }}</td>
            <td>{{ stock.name }}</td>
            <td>{{ stock.openPrice }}</td>
            <td :class="{ 'text-red': stock.changePercent < 0, 'text-green': stock.changePercent > 0 }">
              {{ stock.currentPrice }}
            </td>
            <td>{{ stock.highPrice }}</td>
            <td>{{ stock.lowPrice }}</td>
            <td :class="{ 'text-red': stock.changePercent < 0, 'text-green': stock.changePercent > 0 }">
              {{ stock.changePercent }}%
            </td>
            <td :class="{ 'text-red': stock.changeAmount < 0, 'text-green': stock.changeAmount > 0 }">
              {{ stock.changeAmount }}
            </td>
            <td>{{ stock.volume }}</td>
            <td>{{ stock.turnover }}</td>
            <td>{{ stock.marketValue }}</td>
            <td>{{ stock.turnoverRate }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Stock } from '@/types/index'

const activeTab = ref<'sh' | 'sz' | 'cyb'>('sh')
const stocks = ref<Stock[]>([])

const filteredStocks = computed(() => {
  return stocks.value.filter(stock => {
    if (activeTab.value === 'sh') {
      return stock.code.startsWith('6')
    } else if (activeTab.value === 'sz') {
      return stock.code.startsWith('3')
    } else {
      return stock.code.startsWith('0')
    }
  })
})

const fetchMarketData = async () => {
  // 模拟数据，实际应该调用后端API
  stocks.value = [
    {
      code: '600000',
      name: '浦发银行',
      openPrice: 8.5,
      currentPrice: 8.6,
      highPrice: 8.7,
      lowPrice: 8.4,
      changePercent: 1.18,
      changeAmount: 0.1,
      volume: 1000000,
      turnover: 8600000,
      marketValue: 1000000000,
      turnoverRate: 0.86
    },
    // 更多模拟数据...
  ]
}

onMounted(() => {
  fetchMarketData()
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

th, td {
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

<style scoped>
/* 样式与之前相同 */
.trade-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  color: #666;
}

.trade-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stock-selector {
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
}

.stock-select,
.form-input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.stock-info {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4dabf7;
}

.price-info {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.positive {
  color: #f03e3e;
}

.negative {
  color: #51cf66;
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
}

.type-btn.active {
  border-color: #4dabf7;
  background: #4dabf7;
  color: white;
}

.error-message {
  color: #fa5252;
  font-size: 12px;
  margin-top: 5px;
}

.trade-summary {
  padding: 15px;
  background: #e7f5ff;
  border-radius: 8px;
  margin: 20px 0;
}

.trade-summary p {
  margin: 5px 0;
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
  transition: background 0.3s;
  width: 100%;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background: #339af0;
}

.trade-result {
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  text-align: center;
  font-weight: 600;
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
</style>
<template>
  <div class="trade-container">
    <h1>股票交易</h1>
    <el-card class="trade-form">
      <el-form :model="form" label-width="120px">
        <el-form-item label="股票代码">
          <el-input v-model="form.stock_code" placeholder="请输入股票代码" type="text" />
        </el-form-item>

        <el-form-item label="交易类型">
          <el-radio-group v-model="form.order_type">
            <el-radio label="BUY">买入</el-radio>
            <el-radio label="SELL">卖出</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="数量">
          <el-input v-model="form.quantity" placeholder="请输入交易数量" type="number" />
        </el-form-item>

        <el-form-item label="价格">
          <el-input v-model="form.price" placeholder="请输入交易价格" type="number" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="trade(form)">提交交易</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="account-balance">
      <p>当前账户余额: {{ userStore.user?.balance }}</p>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { tradeAPI } from '@/services/api'
import { useStockStore } from '@/stores/stock'
import { useUserStore } from '@/stores/user'
import type { TradeRequest, TradeResponse } from '@/types'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
const userStore = useUserStore()
const stockStore = useStockStore()
const form = ref<TradeRequest>({
  stock_id: stockStore.stockId == 0 ? null : stockStore.stockId,
  stock_code: stockStore.stockCode,
  order_type: 'BUY',
  quantity: 0,
  price: 0,
})

async function trade(tradeForm: TradeRequest) {
  try {
    // 将字符串类型的quantity和price转换为数字
    const processedForm = {
      ...tradeForm,
      quantity: Number(tradeForm.quantity),
      price: Number(tradeForm.price),
    }

    console.debug('提交的交易数据:', processedForm)
    const response = (await tradeAPI.trade(processedForm)) as TradeResponse
    console.debug('交易响应:', response)
    if (!response.success) {
      throw new Error(response.message)
    }
    userStore.updateBalance(response.data?.updated_balance)
    ElMessage.success('交易成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('交易失败: ' + (e as Error).message)
  }
}

function resetForm() {
  form.value = {
    ...form.value,
    order_type: 'BUY',
    quantity: 0,
    price: 0,
  }
}
</script>

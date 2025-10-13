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
<style lang="css" scoped></style>

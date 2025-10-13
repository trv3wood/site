<template>
  <div class="transactions-view">
    <h1>交易记录</h1>
    <el-table :data="mappedOrders">
      <el-table-column prop="stock_name" label="股票名称" width="180" />
      <el-table-column prop="stock_code" label="股票代码" width="180" />
      <el-table-column prop="order_type" label="订单类型" width="180" />
      <el-table-column prop="price" label="价格" width="180" />
      <el-table-column prop="quantity" label="数量" width="180" />
      <el-table-column prop="created_time" label="订单时间" width="180" />
      <el-table-column prop="status" label="状态" width="180" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Order } from '@/types'
import { tradeAPI } from '@/services/api'
import { ElMessage } from 'element-plus'
function mapOrderType(orderType: string) {
  switch (orderType) {
    case 'BUY':
      return '购买'
    case 'SELL':
      return '卖出'
    default:
      return orderType
  }
}
function mapOrderStatus(status: string) {
  switch (status) {
    case 'PENDING':
      return '待处理'
    case 'EXECUTED':
      return '已执行'
    case 'CANCELLED':
      return '已取消'
    default:
      return status
  }
}
const orders = ref<Order[]>([])
const mappedOrders = computed(() => {
  return orders.value.map(order => ({
    ...order,
    price: order.price.toFixed(2),
    quantity: order.quantity.toFixed(2),
    created_time: new Date(order.created_time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    order_type: mapOrderType(order.order_type),
    status: mapOrderStatus(order.status),
  }))
})
async function loadOrders() {
  try {
    const response = await tradeAPI.getOrder()
    console.log(response)
    orders.value = response
  } catch (error) {
    ElMessage.error('获取订单列表失败')
    console.error('Load orders failed:', error)
  }
}
onMounted(() => {
  loadOrders()
})
</script>

<template>

</template>
<script setup lang="ts">
import { tradeAPI } from '@/services/api';
import { useUserStore } from '@/stores/user';
import { TradeRequest } from '@/types';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
const userStore = useUserStore()
const form = ref<TradeRequest>();
async function trade(form: TradeRequest) {
  try {
    await tradeAPI.trade(form.stock_id, form.quantity, form.price, form.order_type)
  } catch(e) {
    ElMessage.error(e.response.message)
  }
}
</script>
<style lang="css" scoped></style>
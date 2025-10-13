import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useStockStore = defineStore('stock', () => {
  // 状态
  const stockId = ref<number>(0)
  const stockCode = ref<string>('')
  // 操作
  const setStockId = (id: number) => {
    stockId.value = id
  }
  const setStockCode = (code: string) => {
    stockCode.value = code
  }
  return {
    stockId,
    stockCode,
    setStockId,
    setStockCode,
  }
})

import { ref } from 'vue'

import { ElMessage } from 'element-plus'

export function useFetchedList<T, P>(api: (params: P) => Promise<{ data: T[]; total: number }>) {
  const loading = ref(false)
  const data = ref<T[]>([])
  const pagination = ref({
    page: 1,
    size: 10,
    total: 0,
  })
  const fetchList = async (params: P) => {
    loading.value = true
    try {
      const result = await api({
        ...params,
        page: pagination.value.page,
        size: pagination.value.size,
      })
      data.value = result.data
      pagination.value.total = result.total
    } catch (error) {
      ElMessage.error('获取列表失败')
      console.error('Failed to fetch list:', error)
    } finally {
      loading.value = false
    }
  }
  const handleChange = (newPage: number) => {
    pagination.value.page = newPage
  }
  const handleSize = (newSize: number) => {
    pagination.value.size = newSize
  }
  return {
    loading,
    data,
    pagination,
    fetchList,
    handleChange,
    handleSize,
  }
}
export function useFetchedData<T, P>(api: (params: P) => Promise<T>) {
  const loading = ref(false)
  const data = ref<T>()
  const fetchData = async (params: P) => {
    loading.value = true
    try {
      const result = await api(params)
      data.value = result
    } catch (error) {
      ElMessage.error('获取数据失败')
      console.error('Failed to fetch data:', error)
    } finally {
      loading.value = false
    }
  }
  return {
    loading,
    data,
    fetchData,
  }
}

// 工具函数
export const mapExecutiveChangeType = (type: string) => {
  const typeMap: { [key: string]: string } = {
    BUY: '增持',
    SELL: '减持',
    BONUS: '分红',
    OTHER: '其他',
  }
  return typeMap[type] || type
}

export const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '-'
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toString()
}

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

export const getRatioClass = (ratio: number | undefined): string => {
  if (ratio === undefined) return ''
  return ratio < 0 ? 'negative' : ratio > 50 ? 'high' : 'normal'
}

export const getChangeClass = (change: number): string => {
  return change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
}

export function convertDateToISOString(date: Date | null): string | null {
  if (!date) return null
  return date.toISOString().slice(0, 19)
}

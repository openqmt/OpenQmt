import { defineStore } from 'pinia'
import { ref } from 'vue'
import eastmoneyApi, { type FundRsfType } from '../api/eastmoney'
import type { FundRankItem } from '../types'

export const useFundStore = defineStore('fund', () => {
    const data = ref<FundRankItem[]>([])
    const loading = ref(false)
    const loadingMore = ref(false)
    const lastUpdate = ref('')
    const error = ref<string | null>(null)
    const currentPage = ref(1)
    const pageSize = ref(30)
    const hasMore = ref(false)
    const fundType = ref('all')
    const rsfType = ref<FundRsfType>(0)
    /** 排序字段，格式如 '5_1_-1'（日涨幅正序） */
    const orderField = ref('5_1_-1')

    async function loadData(reset = true): Promise<void> {
        if (reset) {
            currentPage.value = 1
            loading.value = true
            data.value = []
        } else {
            if (loadingMore.value || !hasMore.value || loading.value) return
            loadingMore.value = true
            currentPage.value += 1
        }

        error.value = null
        try {
            const result = await eastmoneyApi.fetchFundRanking(
                currentPage.value,
                pageSize.value,
                rsfType.value,
                orderField.value,
            )
            data.value = reset ? result.items : [...data.value, ...result.items]
            hasMore.value = result.hasMore
            lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
        } catch (e: unknown) {
            if (!reset) currentPage.value -= 1
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            loading.value = false
            loadingMore.value = false
        }
    }

    function loadMore(): void {
        loadData(false)
    }

    function setFundType(type: string): void {
        fundType.value = type
        rsfType.value = eastmoneyApi.fundTypeToRsfType(type)
        loadData(true)
    }

    /** 切换排序：点击同一列切换正序/倒序，切换不同列默认正序 */
    function setSort(field: string): void {
        const current = orderField.value
        const currentPrefix = current.substring(0, current.lastIndexOf('_'))
        if (currentPrefix === field) {
            // 同一列，切换排序方向：-1(正序) ↔ 1(倒序)
            const dir = current.endsWith('-1') ? '1' : '-1'
            orderField.value = `${field}_${dir}`
        } else {
            // 新列，默认正序
            orderField.value = `${field}_-1`
        }
        loadData(true)
    }

    return {
        data,
        loading,
        loadingMore,
        lastUpdate,
        error,
        currentPage,
        pageSize,
        hasMore,
        fundType,
        rsfType,
        orderField,
        loadData,
        loadMore,
        setFundType,
        setSort,
    }
})

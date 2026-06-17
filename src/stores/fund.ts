import { defineStore } from 'pinia'
import { ref } from 'vue'
import eastmoneyApi, { type FundRsfType } from '../api/eastmoney'
import type { FundRankItem } from '../types'

export const useFundStore = defineStore('fund', () => {
    const data = ref<FundRankItem[]>([])
    const loading = ref(false)
    const lastUpdate = ref('')
    const error = ref<string | null>(null)
    const currentPage = ref(1)
    const pageSize = ref(30)
    const fundType = ref('all')
    const rsfType = ref<FundRsfType>(0)

    async function loadData(page?: number): Promise<void> {
        loading.value = true
        error.value = null
        if (page) currentPage.value = page
        try {
            const result = await eastmoneyApi.fetchFundRanking(
                currentPage.value,
                pageSize.value,
                rsfType.value
            )
            data.value = result
            lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            loading.value = false
        }
    }

    function setFundType(type: string): void {
        fundType.value = type
        rsfType.value = eastmoneyApi.fundTypeToRsfType(type)
        currentPage.value = 1
        loadData(1)
    }

    function changePage(page: number): void {
        currentPage.value = page
        loadData(page)
    }

    return {
        data,
        loading,
        lastUpdate,
        error,
        currentPage,
        pageSize,
        fundType,
        rsfType,
        loadData,
        setFundType,
        changePage,
    }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FundRankItem } from '../types'

export const useFundStore = defineStore('fund', () => {
    const data = ref<FundRankItem[]>([])
    const loading = ref(false)
    const lastUpdate = ref('')
    const error = ref<string | null>(null)
    const currentPage = ref(1)
    const pageSize = ref(20)

    async function loadData(page?: number): Promise<void> {
        loading.value = true
        error.value = null
        if (page) currentPage.value = page
        try {
            // const result = await fetchFundRanking(
            //     currentPage.value,
            //     pageSize.value
            // )
            // data.value = result
            // lastUpdate.value = new Date().toLocaleTimeString('zh-CN')
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            loading.value = false
        }
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
        loadData,
        changePage,
    }
})

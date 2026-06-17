import { defineStore } from 'pinia'
import { ref } from 'vue'
import eastmoneyApi, { type FundDetail } from '../api/eastmoney'

export const useFundDetailStore = defineStore('fundDetail', () => {
    const detail = ref<FundDetail | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const currentCode = ref('')

    async function loadDetail(code: string): Promise<void> {
        if (!code) return
        if (currentCode.value === code && detail.value && !error.value) return

        currentCode.value = code
        loading.value = true
        error.value = null
        detail.value = null

        try {
            detail.value = await eastmoneyApi.fetchFundDetail(code)
        } catch (e: unknown) {
            error.value = e instanceof Error ? e.message : String(e)
        } finally {
            loading.value = false
        }
    }

    function reset(): void {
        detail.value = null
        currentCode.value = ''
        error.value = null
        loading.value = false
    }

    return {
        detail,
        loading,
        error,
        currentCode,
        loadDetail,
        reset,
    }
})

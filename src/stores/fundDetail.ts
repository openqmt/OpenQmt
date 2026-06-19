import { defineStore } from 'pinia'
import { ref } from 'vue'
import eastmoneyApi, { type FundDetail, fetchFundProfile } from '../api/eastmoney'

export const useFundDetailStore = defineStore('fundDetail', () => {
    const detail = ref<FundDetail | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const currentCode = ref('')

    async function loadDetail(code: string, forceRefresh = false): Promise<void> {
        if (!code) return
        if (!forceRefresh && currentCode.value === code && detail.value && !error.value && detail.value.profile) return

        currentCode.value = code
        loading.value = true
        error.value = null
        detail.value = null

        try {
            const [fundResult, profileResult] = await Promise.allSettled([
                eastmoneyApi.fetchFundDetail(code),
                fetchFundProfile(code),
            ])
            if (fundResult.status === 'rejected') throw fundResult.reason
            const d = fundResult.value
            if (profileResult.status === 'fulfilled') d.profile = profileResult.value
            detail.value = d
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

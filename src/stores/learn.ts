import { defineStore } from 'pinia'
import { ref } from 'vue'

export type LearnCategory = 'all' | 'basic' | 'strategy'

export const useLearnStore = defineStore('learn', () => {
    const category = ref<LearnCategory>('all')

    return { category }
})

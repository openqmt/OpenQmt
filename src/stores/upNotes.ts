import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as storage from '../utils/storage'

const SHOWN_NOTE_KEY = 'openqmt_up_note_shown'
export const FEATURE_DISABLED_MSG = '暂未开启'

export interface UpNoteLocale {
    note: string
    always: string
    contact: string
}

export interface UpNoteConfig {
    version: string
    show: boolean
    webShow: boolean
    appShow: boolean
    pub_date: string
    openUrl: string
    repeatShow: boolean
    login: boolean
    register: boolean
    search: boolean
    learn: boolean
    aichat: boolean
    aipage: boolean
    payMethods: string[]
    zh: UpNoteLocale
    rightBtn: boolean
    devtools: boolean
}

export const useUpNotesStore = defineStore('upNotes', () => {
    const config = ref<UpNoteConfig | null>(null)

    const loginEnabled = computed(() => config.value?.login ?? true)
    const registerEnabled = computed(() => config.value?.register ?? true)
    const searchEnabled = computed(() => config.value?.search ?? true)
    const learnEnabled = computed(() => config.value?.learn ?? true)
    const aichatEnabled = computed(() => config.value?.aichat ?? true)
    const aipageEnabled = computed(() => config.value?.aipage ?? true)
    const rightBtnEnabled = computed(() => config.value?.rightBtn ?? true)
    const devtoolsEnabled = computed(() => config.value?.devtools ?? true)

    function setConfig(data: UpNoteConfig) {
        config.value = data
    }

    function getShownNote(): string | null {
        return storage.getSync<string>(SHOWN_NOTE_KEY)
    }

    function markNoteShown(note: string) {
        storage.set(SHOWN_NOTE_KEY, note)
    }

    return {
        config,
        loginEnabled,
        registerEnabled,
        searchEnabled,
        learnEnabled,
        aichatEnabled,
        aipageEnabled,
        rightBtnEnabled,
        devtoolsEnabled,
        setConfig,
        getShownNote,
        markNoteShown,
    }
})

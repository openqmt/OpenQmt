import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as storage from '../utils/storage'

const SHOWN_NOTE_KEY = 'openqmt_up_note_shown'

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

    function setConfig(data: UpNoteConfig) {
        config.value = data
    }

    function getShownNote(): string | null {
        return storage.getSync<string>(SHOWN_NOTE_KEY)
    }

    function markNoteShown(note: string) {
        storage.set(SHOWN_NOTE_KEY, note)
    }

    return { config, setConfig, getShownNote, markNoteShown }
})

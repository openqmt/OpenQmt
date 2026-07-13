<template>
    <n-modal
        :show="show"
        :mask-closable="false"
        :close-on-esc="false"
        @update:show="onUpdateShow"
    >
        <div class="up-notes-dialog">
            <h2 class="up-notes-title">通知</h2>
            <p class="up-notes-content">{{ noteText }}</p>
            <n-button block type="primary" @click="onConfirm">确定 </n-button>
        </div>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { NModal, NButton } from 'naive-ui'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { useUpNotesStore, type UpNoteConfig } from '../stores/upNotes'

const upNotesStore = useUpNotesStore()
const show = ref(false)
const noteText = ref('')

function shouldShow(data: UpNoteConfig): boolean {
    if (!data.show) return false
    if (isTauri() && !data.appShow) return false
    if (!isTauri() && !data.webShow) return false
    if (!data.repeatShow && upNotesStore.getShownNote() === data.zh.note) {
        return false
    }
    return !!data.zh.note
}

async function fetchAndShowNote() {
    const url = import.meta.env.VITE_NOTE_URL
    if (!url) return

    try {
        const res = await fetch(url)
        if (!res.ok) return

        const data = (await res.json()) as UpNoteConfig
        upNotesStore.setConfig(data)

        if (!shouldShow(data)) return

        noteText.value = data.zh.note
        if (!data.repeatShow) {
            upNotesStore.markNoteShown(data.zh.note)
        }
        show.value = true
    } catch (error) {
        console.warn('Failed to fetch up notes:', error)
    }
}

async function openUrl(url: string) {
    if (!url) return

    try {
        if (isTauri()) {
            await invoke('open_url', { url })
        } else {
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    } catch (error) {
        console.warn('Failed to open url:', error)
    }
}

async function onConfirm() {
    const openUrlValue = upNotesStore.config?.openUrl
    if (openUrlValue) {
        await openUrl(openUrlValue)
    }
    show.value = false
}

function onUpdateShow(value: boolean) {
    show.value = value
}

function preventContextMenu(e: Event) {
    e.preventDefault()
}

watch(
    () => upNotesStore.rightBtnEnabled,
    (enabled) => {
        if (enabled) {
            document.removeEventListener('contextmenu', preventContextMenu)
        } else {
            document.addEventListener('contextmenu', preventContextMenu)
        }
    },
    { immediate: true },
)

onMounted(() => {
    fetchAndShowNote()
})

onUnmounted(() => {
    document.removeEventListener('contextmenu', preventContextMenu)
})
</script>

<style scoped>
.up-notes-dialog {
    width: 400px;
    max-width: calc(100vw - 32px);
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: 28px 24px 20px;
}

.up-notes-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: center;
}

.up-notes-content {
    margin: 0 0 24px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-secondary);
    white-space: pre-wrap;
}
</style>

<template>
    <!-- 升级提醒优先于通知 -->
    <n-modal
        :show="showUpdate"
        :mask-closable="false"
        :close-on-esc="false"
        @update:show="onUpdateShowUpdate"
    >
        <div class="up-notes-dialog">
            <h2 class="up-notes-title">发现新版本 {{ updateVersion }}</h2>
            <p class="up-notes-content">{{ updateNotes }}</p>

            <template v-if="updating">
                <p class="up-notes-status">升级中.....</p>
                <n-progress
                    type="line"
                    :percentage="progress"
                    :show-indicator="true"
                />
            </template>
            <div v-else class="up-notes-actions">
                <n-button
                    v-if="!updateForce"
                    class="up-notes-btn"
                    @click="onCancelUpdate"
                >
                    取消
                </n-button>
                <n-button
                    class="up-notes-btn"
                    type="primary"
                    @click="onConfirmUpdate"
                >
                    升级
                </n-button>
            </div>
        </div>
    </n-modal>

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
import { NModal, NButton, NProgress } from 'naive-ui'
import { invoke, isTauri } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useUpNotesStore, type UpNoteConfig } from '../stores/upNotes'

interface UpdateConfig {
    version: string
    force: boolean
    zh: string
    en?: string
    ja?: string
}

const upNotesStore = useUpNotesStore()
const show = ref(false)
const noteText = ref('')

const showUpdate = ref(false)
const updateVersion = ref('')
const updateNotes = ref('')
const updateForce = ref(false)
const updating = ref(false)
const progress = ref(0)

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
        console.log('data', data)
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

/** 检查升级，有新版本返回 true */
async function checkAndShowUpdate(): Promise<boolean> {
    if (!isTauri()) return false

    const url = import.meta.env.VITE_UPDATE_URL
    if (!url) return false

    try {
        const res = await fetch(url)
        if (!res.ok) return false

        const data = (await res.json()) as UpdateConfig
        const localVersion = await getVersion()
        if (!data.version || data.version === localVersion) return false

        updateVersion.value = data.version
        updateNotes.value = data.zh || ''
        updateForce.value = !!data.force
        showUpdate.value = true
        return true
    } catch (error) {
        console.warn('Failed to fetch update info:', error)
        return false
    }
}

async function onConfirmUpdate() {
    if (updating.value) return
    updating.value = true
    progress.value = 0

    try {
        const update = await check()
        if (!update) {
            updating.value = false
            showUpdate.value = false
            await fetchAndShowNote()
            return
        }

        let downloaded = 0
        let contentLength = 0

        await update.downloadAndInstall((event) => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength ?? 0
                    downloaded = 0
                    progress.value = 0
                    break
                case 'Progress':
                    downloaded += event.data.chunkLength
                    if (contentLength > 0) {
                        progress.value = Math.min(
                            100,
                            Math.round((downloaded / contentLength) * 100)
                        )
                    }
                    break
                case 'Finished':
                    progress.value = 100
                    break
            }
        })

        await relaunch()
    } catch (error) {
        console.warn('Failed to update:', error)
        updating.value = false
    }
}

async function onCancelUpdate() {
    if (updateForce.value || updating.value) return
    showUpdate.value = false
    await fetchAndShowNote()
}

function onUpdateShowUpdate(value: boolean) {
    // 强制升级或升级中不允许关闭
    if (!value && (updateForce.value || updating.value)) return
    showUpdate.value = value
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
    { immediate: true }
)

onMounted(async () => {
    const hasUpdate = await checkAndShowUpdate()
    if (!hasUpdate) {
        await fetchAndShowNote()
    }
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

.up-notes-status {
    margin: 0 0 12px;
    font-size: 14px;
    color: var(--text-primary);
    text-align: center;
}

.up-notes-actions {
    display: flex;
    gap: 10px;
}

.up-notes-btn {
    flex: 1;
}
</style>

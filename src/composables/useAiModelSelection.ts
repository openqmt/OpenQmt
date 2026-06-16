import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ModelProvider } from '../types'
import { useSettingsStore, PROVIDER_LABELS } from '../stores/settings'
import { useAiStore } from '../stores/ai'

const selectedProvider = ref<ModelProvider>('openai')
const selectedModel = ref<string>('')
let stateInitialized = false
let watchersInitialized = false

export function useAiModelSelection() {
    const route = useRoute()
    const settingsStore = useSettingsStore()
    const aiStore = useAiStore()

    if (!stateInitialized) {
        stateInitialized = true
        selectedProvider.value = settingsStore.model.provider
        selectedModel.value = settingsStore.model.model
    }

    if (!watchersInitialized) {
        watchersInitialized = true

        function syncFromConversation(): void {
            const conv = aiStore.currentConversation
            if (conv) {
                selectedProvider.value = conv.provider
                selectedModel.value = conv.model
            }
        }

        watch(
            () => route.params.id,
            (id) => {
                if (id && typeof id === 'string') {
                    aiStore.switchConversation(id)
                    syncFromConversation()
                }
            },
            { immediate: true }
        )

        watch(() => aiStore.currentConversation, syncFromConversation)
    }

    const providerOptions = computed(() =>
        settingsStore.providerOptions.map((opt) => ({
            label: opt.label,
            value: opt.value as ModelProvider,
        }))
    )

    const modelOptions = computed(() => {
        const config = settingsStore.model.providers[selectedProvider.value]
        if (!config) return []
        return config.models
            .filter((m) => m.enabled)
            .map((m) => ({
                label: m.name,
                value: m.id,
            }))
    })

    const currentProviderLabel = computed(
        () => PROVIDER_LABELS[selectedProvider.value]
    )

    function onProviderChange(provider: ModelProvider): void {
        settingsStore.setProvider(provider)
        const config = settingsStore.model.providers[provider]
        if (config) {
            selectedProvider.value = provider
            selectedModel.value = config.activeModel
        }
        aiStore.updateConversationModel(provider, selectedModel.value)
    }

    function onModelChange(model: string): void {
        selectedModel.value = model
        settingsStore.model.model = model
        const config = settingsStore.model.providers[selectedProvider.value]
        if (config) {
            config.activeModel = model
        }
        settingsStore.saveCurrentConfig()
        aiStore.updateConversationModel(selectedProvider.value, model)
    }

    return {
        selectedProvider,
        selectedModel,
        providerOptions,
        modelOptions,
        currentProviderLabel,
        onProviderChange,
        onModelChange,
    }
}

<template>
    <div class="settings-page">
        <div class="settings-header">
            <h2 class="page-title">系统设置</h2>
            <p class="page-subtitle">配置 AI 分析使用的模型提供商</p>
        </div>

        <div class="settings-card surface-card surface-card--flat">
            <n-form class="settings-form" label-placement="top" :show-feedback="false">
                <n-form-item label="模型提供商">
                    <n-select
                        v-model:value="form.provider"
                        :options="settingsStore.providerOptions"
                        @update:value="onProviderChange"
                    />
                </n-form-item>

                <n-form-item label="API Key" v-if="form.provider !== 'ollama'">
                    <n-input
                        v-model:value="form.apiKey"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入 API Key(仅保存在本地)"
                    />
                </n-form-item>

                <n-form-item
                    label="API 地址"
                    v-if="form.provider === 'custom' || form.provider === 'ollama'"
                >
                    <n-input
                        v-model:value="form.baseUrl"
                        placeholder="https://api.example.com/v1"
                    />
                </n-form-item>

                <n-form-item label="模型名称">
                    <n-input
                        v-model:value="form.model"
                        :placeholder="modelPlaceholder"
                    />
                </n-form-item>
            </n-form>

            <div class="settings-actions">
                <n-button quaternary @click="handleReset">恢复默认</n-button>
                <n-button type="primary" @click="handleSave">保存设置</n-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { NForm, NFormItem, NSelect, NInput, NButton, useMessage } from 'naive-ui'
import { useSettingsStore, PROVIDER_DEFAULTS } from '../stores/settings'
import type { ModelProvider } from '../types'

const settingsStore = useSettingsStore()
const message = useMessage()

const form = reactive({
    provider: settingsStore.model.provider,
    apiKey: settingsStore.model.apiKey,
    baseUrl: settingsStore.model.baseUrl,
    model: settingsStore.model.model,
})

const modelPlaceholder = computed(
    () => PROVIDER_DEFAULTS[form.provider as ModelProvider]?.model || '输入模型名称'
)

watch(
    () => settingsStore.model,
    (val) => {
        form.provider = val.provider
        form.apiKey = val.apiKey
        form.baseUrl = val.baseUrl
        form.model = val.model
    },
    { deep: true }
)

function onProviderChange(provider: ModelProvider) {
    settingsStore.setProvider(provider)
    form.baseUrl = settingsStore.model.baseUrl
    form.model = settingsStore.model.model
}

function handleSave() {
    settingsStore.save({
        provider: form.provider,
        apiKey: form.apiKey.trim(),
        baseUrl: form.baseUrl.trim(),
        model: form.model.trim(),
    })
    message.success('设置已保存')
}

function handleReset() {
    settingsStore.reset()
    form.provider = settingsStore.model.provider
    form.apiKey = settingsStore.model.apiKey
    form.baseUrl = settingsStore.model.baseUrl
    form.model = settingsStore.model.model
    message.info('已恢复默认设置')
}
</script>

<style scoped>
.settings-page {
    max-width: 100%;
    width: 100%;
    min-width: 0;
}

.settings-header {
    margin-bottom: 24px;
}

.page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 6px 0;
    letter-spacing: -0.02em;
}

.page-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0;
}

.settings-card {
    padding: 28px;
    max-width: 600px;
}

.settings-form {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-subtle);
}

@media (max-width: 768px) {
    .settings-card {
        padding: 20px;
    }
}
</style>

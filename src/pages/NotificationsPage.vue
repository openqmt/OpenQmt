<template>
    <div class="notifications-page">
        <div class="notifications-header">
            <h2 class="page-title">推送通知</h2>
            <p class="page-subtitle">管理您的通知偏好和推送设置</p>
        </div>

        <div class="notifications-card surface-card surface-card--flat">
            <div class="notification-group">
                <h3 class="group-title">行情提醒</h3>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">黄金价格波动</span>
                        <span class="item-desc">当黄金价格波动超过设定阈值时推送</span>
                    </div>
                    <n-switch v-model:value="notifications.goldPrice" />
                </div>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">股票异动</span>
                        <span class="item-desc">关注股票出现大幅波动时推送</span>
                    </div>
                    <n-switch v-model:value="notifications.stockAlert" />
                </div>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">基金排行更新</span>
                        <span class="item-desc">基金排行榜每日更新提醒</span>
                    </div>
                    <n-switch v-model:value="notifications.fundUpdate" />
                </div>
            </div>

            <div class="notification-divider"></div>

            <div class="notification-group">
                <h3 class="group-title">AI 分析</h3>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">分析报告完成</span>
                        <span class="item-desc">AI 分析报告生成完成后推送</span>
                    </div>
                    <n-switch v-model:value="notifications.aiReport" />
                </div>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">学习进度提醒</span>
                        <span class="item-desc">定期推送学习进度和建议</span>
                    </div>
                    <n-switch v-model:value="notifications.learnProgress" />
                </div>
            </div>

            <div class="notification-divider"></div>

            <div class="notification-group">
                <h3 class="group-title">系统通知</h3>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">系统更新</span>
                        <span class="item-desc">系统版本更新和功能优化通知</span>
                    </div>
                    <n-switch v-model:value="notifications.systemUpdate" />
                </div>
                <div class="notification-item">
                    <div class="item-info">
                        <span class="item-label">积分变动</span>
                        <span class="item-desc">积分充值、消费变动通知</span>
                    </div>
                    <n-switch v-model:value="notifications.creditsChange" />
                </div>
            </div>

            <div class="notification-actions">
                <n-button quaternary @click="handleReset">恢复默认</n-button>
                <n-button type="primary" @click="handleSave">保存设置</n-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { NSwitch, NButton, useMessage } from 'naive-ui'

const message = useMessage()

const NOTIFICATIONS_KEY = 'openqmt_notifications'

const defaultNotifications = {
    goldPrice: true,
    stockAlert: true,
    fundUpdate: false,
    aiReport: true,
    learnProgress: false,
    systemUpdate: true,
    creditsChange: true,
}

const notifications = reactive({ ...defaultNotifications })

function loadNotifications() {
    try {
        const saved = localStorage.getItem(NOTIFICATIONS_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            Object.assign(notifications, parsed)
        }
    } catch (error) {
        console.error('Failed to load notifications:', error)
    }
}

function handleSave() {
    try {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
        message.success('通知设置已保存')
    } catch (error) {
        message.error('保存失败')
    }
}

function handleReset() {
    Object.assign(notifications, defaultNotifications)
    localStorage.removeItem(NOTIFICATIONS_KEY)
    message.info('已恢复默认设置')
}

onMounted(() => {
    loadNotifications()
})
</script>

<style scoped>
.notifications-page {
    max-width: 100%;
    width: 100%;
    min-width: 0;
}

.notifications-header {
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

.notifications-card {
    padding: 28px;
    max-width: 700px;
}

.notification-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.group-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.notification-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
}

.item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    margin-right: 16px;
}

.item-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
}

.item-desc {
    font-size: 12px;
    color: var(--text-muted);
}

.notification-divider {
    height: 1px;
    background: var(--border-subtle);
    margin: 20px 0;
}

.notification-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-subtle);
}

@media (max-width: 768px) {
    .notifications-card {
        padding: 20px;
    }
}
</style>

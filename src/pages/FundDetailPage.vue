<template>
    <div class="fund-detail-page">
        <n-spin :show="store.loading">
            <n-result
                v-if="store.error"
                status="error"
                title="加载失败"
                :description="store.error"
            >
                <template #footer>
                    <n-button type="primary" @click="reload">重试</n-button>
                </template>
            </n-result>

            <template v-else-if="detail">
                <div class="detail-header surface-card">
                    <div class="header-main">
                        <span class="fund-code num-mono">{{ detail.code }}</span>
                        <div v-if="detail.topics.length" class="topic-tags">
                            <n-tag
                                v-for="item in detail.topics"
                                :key="item.topic"
                                size="medium"
                                :bordered="false"
                                type="info"
                                round
                            >
                                {{ item.topic }}({{ item.weight.toFixed(2) }}%)
                            </n-tag>
                        </div>
                        <h2 v-else class="fund-name">{{ fundName }}</h2>
                    </div>
                    <div v-if="detail.reportDate" class="header-meta">
                        <n-tag size="small" :bordered="false" type="info" round>
                            报告期 {{ detail.reportDate }}
                        </n-tag>
                    </div>
                    <p v-if="detail.aiSummary" class="ai-summary">
                        {{ detail.aiSummary }}
                    </p>
                </div>

                <div v-if="detail.assetAllocation" class="asset-overview">
                    <div
                        v-for="item in assetItems"
                        :key="item.label"
                        class="asset-item surface-card"
                    >
                        <span class="asset-label">{{ item.label }}</span>
                        <span class="asset-value num-mono">{{ item.value }}</span>
                    </div>
                </div>

                <h3 class="section-title">行业配置</h3>
                <div class="surface-card table-card">
                    <n-data-table
                        v-if="detail.sectors.length"
                        :columns="sectorColumns"
                        :data="detail.sectors"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                    <n-empty v-else description="暂无行业配置数据" />
                </div>

                <h3 class="section-title">重仓股票</h3>
                <div class="surface-card table-card">
                    <n-data-table
                        :columns="holdingColumns"
                        :data="detail.holdings"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                </div>

                <h3 class="section-title">规模变化</h3>
                <div class="surface-card table-card">
                    <n-data-table
                        v-if="detail.scales.length"
                        :columns="scaleColumns"
                        :data="detail.scales"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                    <n-empty v-else description="暂无规模数据" />
                </div>

                <h3 v-if="detail.bonuses.length" class="section-title">分红记录</h3>
                <div v-if="detail.bonuses.length" class="surface-card table-card">
                    <n-data-table
                        :columns="bonusColumns"
                        :data="detail.bonuses"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                </div>
            </template>
        </n-spin>
    </div>
</template>

<script setup lang="ts">
import { computed, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
    NButton,
    NDataTable,
    NEmpty,
    NResult,
    NSpin,
    NTag,
    type DataTableColumns,
} from 'naive-ui'
import { useFundDetailStore } from '../stores/fundDetail'
import type {
    FundBonusItem,
    FundScaleItem,
    FundSectorItem,
    FundStockHolding,
    FundTopicItem,
} from '../api/eastmoney'

const route = useRoute()
const store = useFundDetailStore()

const fundCode = computed(() => String(route.params.code ?? ''))
const fundName = computed(() => String(route.query.name ?? '基金详情'))
const detail = computed(() => store.detail)

const assetItems = computed(() => {
    const asset = detail.value?.assetAllocation
    if (!asset) return []
    const items = [
        { label: '股票', value: `${asset.stockPct.toFixed(2)}%` },
        { label: '现金', value: `${asset.cashPct.toFixed(2)}%` },
    ]
    if (asset.bondPct > 0) {
        items.push({ label: '债券', value: `${asset.bondPct.toFixed(2)}%` })
    }
    if (asset.otherPct > 0) {
        items.push({ label: '其他', value: `${asset.otherPct.toFixed(2)}%` })
    }
    if (detail.value?.cashManagementPct != null) {
        items.push({
            label: '货币管理',
            value: `${detail.value.cashManagementPct.toFixed(2)}%`,
        })
    }
    return items
})

const holdingColumns: DataTableColumns<FundStockHolding> = [
    { title: '股票', key: 'name', ellipsis: { tooltip: true } },
    {
        title: '代码',
        key: 'code',
        width: 88,
        render(row) {
            return h('span', { class: 'num-mono' }, row.code)
        },
    },
    {
        title: '行业',
        key: 'industry',
        width: 110,
        ellipsis: { tooltip: true },
    },
    {
        title: '占净值',
        key: 'weight',
        width: 88,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, `${row.weight.toFixed(2)}%`)
        },
    },
    {
        title: '变动',
        key: 'changeType',
        width: 72,
        align: 'center',
        render(row) {
            const type =
                row.changeType === '新增'
                    ? 'success'
                    : row.changeType === '减持'
                      ? 'warning'
                      : 'info'
            return h(
                NTag,
                { size: 'tiny', bordered: false, type, round: true },
                { default: () => row.changeType }
            )
        },
    },
    {
        title: '季度',
        key: 'holdQuarters',
        width: 64,
        align: 'center',
        render(row) {
            return h('span', { class: 'num-mono' }, String(row.holdQuarters))
        },
    },
]

const sectorColumns: DataTableColumns<FundSectorItem> = [
    { title: '行业', key: 'name', ellipsis: { tooltip: true } },
    {
        title: '占比',
        key: 'weight',
        width: 96,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, `${row.weight.toFixed(2)}%`)
        },
    },
]

const topicColumns: DataTableColumns<FundTopicItem> = [
    { title: '主题', key: 'topic' },
    {
        title: '占比',
        key: 'weight',
        width: 96,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, `${row.weight.toFixed(2)}%`)
        },
    },
]

const scaleColumns: DataTableColumns<FundScaleItem> = [
    {
        title: '报告期',
        key: 'reportDate',
        width: 120,
        render(row) {
            return h('span', { class: 'num-mono' }, row.reportDate)
        },
    },
    {
        title: '净资产（元）',
        key: 'netNav',
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, formatNav(row.netNav))
        },
    },
    {
        title: '环比变化',
        key: 'changePct',
        width: 110,
        align: 'right',
        render(row) {
            return changeCell(row.changePct)
        },
    },
]

const bonusColumns: DataTableColumns<FundBonusItem> = [
    { title: '权益登记日', key: 'exDate', width: 120 },
    { title: '发放日', key: 'payDate', width: 120 },
    {
        title: '每份分红（元）',
        key: 'amount',
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, row.amount)
        },
    },
]

function formatNav(val: number): string {
    if (!val) return '--'
    return val.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function changeCell(val: number | null) {
    if (val == null) return h('span', { class: 'num-mono' }, '--')
    const sign = val > 0 ? '+' : ''
    const color =
        val > 0
            ? 'var(--color-up)'
            : val < 0
              ? 'var(--color-down)'
              : 'var(--color-flat)'
    return h(
        'span',
        {
            class: 'num-mono',
            style: { color, fontWeight: '600' },
        },
        `${sign}${val.toFixed(2)}%`
    )
}

function reload(): void {
    store.loadDetail(fundCode.value)
}

watch(
    fundCode,
    (code) => {
        if (code) store.loadDetail(code)
    },
    { immediate: true }
)
</script>

<style scoped>
.fund-detail-page {
    max-width: 100%;
    min-width: 0;
}

.detail-header {
    padding: 20px 22px;
    margin-bottom: 16px;
}

.header-main {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
}

.fund-code {
    color: rgba(212, 168, 67, 0.8);
    font-size: 13px;
}

.topic-tags {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
}

.fund-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.header-meta {
    margin-top: 10px;
}

.ai-summary {
    margin: 14px 0 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.7;
}

.asset-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 8px;
}

.asset-item {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.asset-label {
    color: var(--text-muted);
    font-size: 12px;
}

.asset-value {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 700;
}

.table-card {
    padding: 4px 0;
    margin-bottom: 8px;
    overflow: hidden;
}

:deep(.n-data-table .n-data-table-th) {
    background: var(--surface-muted) !important;
    color: var(--text-muted) !important;
    font-weight: 600;
    font-size: 11px;
}

:deep(.n-data-table .n-data-table-td) {
    border-bottom: 1px solid var(--border-subtle) !important;
}
</style>

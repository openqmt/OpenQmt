<template>
    <div class="sector-detail-page">
        <!-- 基本信息 -->
        <div class="detail-header surface-card">
            <div class="header-top">
                <span class="sector-icon">📈</span>
                <div class="header-names">
                    <h2 class="sector-name">{{ info.name }}</h2>
                    <span class="sector-code num-mono">{{ info.code }}</span>
                </div>
                <div class="header-price">
                    <span class="price-value num-mono" :class="priceClass">
                        {{ info.price.toFixed(2) }}
                    </span>
                    <span class="price-change num-mono" :class="priceClass">
                        {{ changeStr }}
                    </span>
                </div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">今开</span>
                    <span class="info-value num-mono">{{
                        info.open.toFixed(2)
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">最高</span>
                    <span class="info-value num-mono up">{{
                        info.high.toFixed(2)
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">最低</span>
                    <span class="info-value num-mono down">{{
                        info.low.toFixed(2)
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">换手率</span>
                    <span class="info-value num-mono"
                        >{{ info.turnoverRate }}%</span
                    >
                </div>
                <div class="info-item">
                    <span class="info-label">量比</span>
                    <span class="info-value num-mono">{{
                        info.volumeRatio
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">成交量</span>
                    <span class="info-value num-mono">{{
                        formatVolume(info.volume)
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">板块排名</span>
                    <span class="info-value num-mono"
                        >第 {{ info.rank }} 名</span
                    >
                </div>
                <div class="info-item">
                    <span class="info-label">涨跌数</span>
                    <span class="info-value">
                        <span class="num-mono up">{{ info.upCount }}</span>
                        <span style="color: var(--text-muted)"> / </span>
                        <span class="num-mono down">{{ info.downCount }}</span>
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">资金净流入</span>
                    <span
                        class="info-value num-mono"
                        :class="info.netInflow >= 0 ? 'up' : 'down'"
                    >
                        {{ formatAmount(info.netInflow) }}
                    </span>
                </div>
                <div class="info-item">
                    <span class="info-label">成交额</span>
                    <span class="info-value num-mono">{{
                        formatAmount(info.amount)
                    }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">板块市值</span>
                    <span class="info-value num-mono">{{
                        formatAmount(info.marketCap)
                    }}</span>
                </div>
            </div>
            <p class="sector-intro">{{ info.intro }}</p>
        </div>

        <!-- 板块分析 -->
        <h3 class="section-title">板块分析</h3>
        <div class="surface-card analysis-card">
            <div class="analysis-grid">
                <div class="analysis-item">
                    <span class="analysis-label">是否主线</span>
                    <n-tag
                        :type="analysis.isMainLine ? 'success' : 'warning'"
                        size="small"
                        round
                        :bordered="false"
                    >
                        {{ analysis.isMainLine ? '主线' : '非主线' }}
                    </n-tag>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">持仓建议</span>
                    <span class="analysis-value">{{
                        analysis.positionAdvice
                    }}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">短期趋势</span>
                    <span class="analysis-value trend-tag">{{
                        analysis.shortTrend
                    }}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">中期趋势</span>
                    <span class="analysis-value trend-tag">{{
                        analysis.midTrend
                    }}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">长期趋势</span>
                    <span class="analysis-value trend-tag">{{
                        analysis.longTrend
                    }}</span>
                </div>
            </div>
            <div class="analysis-outlook">
                <span class="analysis-label">行业展望</span>
                <p class="outlook-text">{{ analysis.industryOutlook }}</p>
            </div>
        </div>

        <!-- Tab: 龙头股 / 成分股 / 相关基金 / 相关资讯 -->
        <h3 class="section-title">相关数据</h3>
        <div class="surface-card tabs-card">
            <n-tabs v-model:value="activeTab" type="line" animated size="small">
                <n-tab-pane name="leading" tab="龙头股票">
                    <n-data-table
                        :columns="leadingColumns"
                        :data="leadingStocks"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                </n-tab-pane>
                <n-tab-pane name="constituent" tab="成分股票">
                    <n-data-table
                        :columns="constituentColumns"
                        :data="constituentStocks"
                        :bordered="false"
                        size="small"
                        :pagination="{ pageSize: 10 }"
                    />
                </n-tab-pane>
                <n-tab-pane name="fund" tab="相关基金">
                    <n-data-table
                        :columns="fundColumns"
                        :data="relatedFunds"
                        :bordered="false"
                        size="small"
                        :pagination="false"
                    />
                </n-tab-pane>
                <n-tab-pane name="news" tab="相关资讯">
                    <div class="news-list">
                        <div
                            v-for="item in newsList"
                            :key="item.id"
                            class="news-item"
                        >
                            <div class="news-header">
                                <span class="news-title">{{ item.title }}</span>
                                <span class="news-meta num-mono"
                                    >{{ item.source }} · {{ item.time }}</span
                                >
                            </div>
                            <p class="news-summary">{{ item.summary }}</p>
                        </div>
                    </div>
                </n-tab-pane>
            </n-tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    NDataTable,
    NTag,
    NTabs,
    NTabPane,
    type DataTableColumns,
} from 'naive-ui'
import {
    getSectorDetailInfo,
    getSectorAnalysis,
    getLeadingStocks,
    getConstituentStocks,
    getRelatedFunds,
    getSectorNewsList,
    type LeadingStock,
    type ConstituentStock,
    type RelatedFund,
} from '../data/sectorDetailMock'

const route = useRoute()
const router = useRouter()
const activeTab = ref('leading')

const sectorName = computed(() =>
    decodeURIComponent(String(route.params.name ?? '')),
)
const info = computed(() => getSectorDetailInfo(sectorName.value))
const analysis = computed(() => getSectorAnalysis(sectorName.value))
const leadingStocks = computed(() => getLeadingStocks(sectorName.value))
const constituentStocks = computed(() => getConstituentStocks(sectorName.value))
const relatedFunds = computed(() => getRelatedFunds(sectorName.value))
const newsList = computed(() => getSectorNewsList(sectorName.value))

/** 涨跌颜色 class */
const priceClass = computed(() => {
    if (info.value.change > 0) return 'up'
    if (info.value.change < 0) return 'down'
    return 'flat'
})

/** 涨跌额字符串 */
const changeStr = computed(() => {
    const sign = info.value.change > 0 ? '+' : ''
    return `${sign}${info.value.change.toFixed(2)} (${sign}${info.value.changePercent.toFixed(2)}%)`
})

/** 涨跌单元格渲染 */
function changeCell(val: number) {
    const sign = val > 0 ? '+' : ''
    const color =
        val > 0
            ? 'var(--color-up)'
            : val < 0
              ? 'var(--color-down)'
              : 'var(--color-flat)'
    return h(
        'span',
        { class: 'num-mono', style: { color, fontWeight: '600' } },
        `${sign}${val.toFixed(2)}%`,
    )
}

/** 成交量格式化 */
function formatVolume(val: number): string {
    if (!val) return '--'
    if (val >= 1e8) return (val / 1e8).toFixed(2) + '亿手'
    if (val >= 1e4) return (val / 1e4).toFixed(2) + '万手'
    return val.toString() + '手'
}

/** 金额格式化 */
function formatAmount(val: number): string {
    if (!val) return '--'
    if (val >= 1e12) return (val / 1e12).toFixed(2) + '万亿'
    if (val >= 1e8) return (val / 1e8).toFixed(2) + '亿'
    if (val >= 1e4) return (val / 1e4).toFixed(2) + '万'
    return val.toString()
}

/** 龙头股列定义 */
const leadingColumns: DataTableColumns<LeadingStock> = [
    {
        title: '序号',
        key: 'rank',
        width: 44,
        align: 'center',
        render(_row, index) {
            return h('span', { class: 'num-mono' }, String(index + 1))
        },
    },
    {
        title: '股票',
        key: 'name',
        render(row) {
            return h(
                'span',
                {
                    style: 'cursor:pointer;color:var(--gold-primary);font-weight:600',
                    onClick: () =>
                        router.push({
                            name: 'StockInfo',
                            params: { code: row.code },
                        }),
                },
                row.name,
            )
        },
    },
    {
        title: '代码',
        key: 'code',
        width: 80,
        render(row) {
            return h('span', { class: 'num-mono' }, row.code)
        },
    },
    {
        title: '现价',
        key: 'price',
        width: 80,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, row.price.toFixed(2))
        },
    },
    {
        title: '涨跌幅',
        key: 'changePercent',
        width: 90,
        align: 'right',
        render(row) {
            return changeCell(row.changePercent)
        },
    },
    {
        title: '市值',
        key: 'marketCap',
        width: 90,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, formatAmount(row.marketCap))
        },
    },
    {
        title: '入选原因',
        key: 'reason',
        ellipsis: { tooltip: true },
    },
]

/** 成分股列定义 */
const constituentColumns: DataTableColumns<ConstituentStock> = [
    {
        title: '#',
        key: 'rank',
        width: 44,
        align: 'center',
        render(_row, index) {
            return h('span', { class: 'num-mono' }, String(index + 1))
        },
    },
    {
        title: '股票',
        key: 'name',
        render(row) {
            return h(
                'span',
                {
                    style: 'cursor:pointer;color:var(--gold-primary);font-weight:600',
                    onClick: () =>
                        router.push({
                            name: 'StockInfo',
                            params: { code: row.code },
                        }),
                },
                row.name,
            )
        },
    },
    {
        title: '代码',
        key: 'code',
        width: 80,
        render(row) {
            return h('span', { class: 'num-mono' }, row.code)
        },
    },
    {
        title: '现价',
        key: 'price',
        width: 80,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, row.price.toFixed(2))
        },
    },
    {
        title: '涨跌幅',
        key: 'changePercent',
        width: 90,
        align: 'right',
        render(row) {
            return changeCell(row.changePercent)
        },
    },
    {
        title: '权重',
        key: 'weight',
        width: 70,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, `${row.weight}%`)
        },
    },
    {
        title: '成交量',
        key: 'volume',
        width: 90,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, formatAmount(row.volume))
        },
    },
]

/** 相关基金列定义 */
const fundColumns: DataTableColumns<RelatedFund> = [
    {
        title: '基金',
        key: 'name',
        render(row) {
            return h(
                'span',
                {
                    style: 'cursor:pointer;color:var(--gold-primary);font-weight:600',
                    onClick: () =>
                        router.push({
                            name: 'FundDetail',
                            params: { code: row.code },
                        }),
                },
                row.name,
            )
        },
    },
    {
        title: '代码',
        key: 'code',
        width: 80,
        render(row) {
            return h('span', { class: 'num-mono' }, row.code)
        },
    },
    {
        title: '净值',
        key: 'nav',
        width: 80,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, row.nav.toFixed(4))
        },
    },
    {
        title: '日涨跌',
        key: 'dayChange',
        width: 90,
        align: 'right',
        render(row) {
            return changeCell(row.dayChange)
        },
    },
    {
        title: '月涨跌',
        key: 'monthChange',
        width: 90,
        align: 'right',
        render(row) {
            return changeCell(row.monthChange)
        },
    },
    {
        title: '规模',
        key: 'scale',
        width: 90,
        align: 'right',
        render(row) {
            return h('span', { class: 'num-mono' }, formatAmount(row.scale))
        },
    },
]
</script>

<style scoped>
.sector-detail-page {
    max-width: 100%;
    min-width: 0;
    padding: var(--content-padding);
}

.detail-header {
    padding: 20px 22px;
    margin-bottom: 8px;
}

.header-top {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.sector-icon {
    font-size: 28px;
    line-height: 1;
}

.header-names {
    flex: 1;
    min-width: 120px;
}

.sector-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.sector-code {
    font-size: 12px;
    color: var(--text-muted);
}

.header-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.price-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
}
.price-value.up {
    color: var(--color-up);
}
.price-value.down {
    color: var(--color-down);
}
.price-value.flat {
    color: var(--text-primary);
}

.price-change {
    font-size: 14px;
    font-weight: 600;
}
.price-change.up {
    color: var(--color-up);
}
.price-change.down {
    color: var(--color-down);
}
.price-change.flat {
    color: var(--color-flat);
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px 16px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--border-subtle);
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.info-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
}

.info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}
.info-value.up {
    color: var(--color-up);
}
.info-value.down {
    color: var(--color-down);
}

.sector-intro {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
}

/* 板块分析 */
.analysis-card {
    padding: 18px 22px;
    margin-bottom: 8px;
}

.analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px 20px;
    align-items: start;
}

.analysis-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.analysis-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
}

.analysis-value {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
}

.trend-tag {
    display: inline-block;
    padding: 2px 8px;
    background: var(--surface-muted);
    border-radius: 4px;
    font-size: 12px;
    width: fit-content;
}

.analysis-outlook {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.outlook-text {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.7;
    margin: 0;
}

/* Tabs */
.tabs-card {
    padding: 8px 0 4px;
    margin-bottom: 8px;
    overflow: hidden;
}

.tabs-card :deep(.n-tabs-nav) {
    padding: 0 16px;
}

/* 新闻列表 */
.news-list {
    padding: 8px 16px 12px;
}

.news-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--border-subtle);
}

.news-item:last-child {
    border-bottom: none;
}

.news-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
}

.news-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}

.news-meta {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
}

.news-summary {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
}

/* 表格通用样式 */
:deep(.n-data-table .n-data-table-th) {
    background: var(--surface-muted) !important;
    color: var(--text-muted) !important;
    font-weight: 600;
    font-size: 11px;
}

:deep(.n-data-table .n-data-table-td) {
    border-bottom: 1px solid var(--border-subtle) !important;
}

.up {
    color: var(--color-up);
}
.down {
    color: var(--color-down);
}

@media (max-width: 768px) {
    .info-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .header-price {
        width: 100%;
        align-items: flex-start;
    }
    .analysis-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>

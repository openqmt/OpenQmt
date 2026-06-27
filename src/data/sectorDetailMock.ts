/** 板块详情 Mock 数据 */

// ============ 类型定义 ============

/** 板块基本信息 */
export interface SectorDetailInfo {
    name: string
    code: string
    price: number
    change: number
    changePercent: number
    open: number
    high: number
    low: number
    turnoverRate: number
    volumeRatio: number
    volume: number
    rank: number
    upCount: number
    downCount: number
    netInflow: number
    amount: number
    marketCap: number
    intro: string
}

/** 板块分析 */
export interface SectorAnalysis {
    isMainLine: boolean
    positionAdvice: string
    shortTrend: string
    midTrend: string
    longTrend: string
    industryOutlook: string
}

/** 龙头股 */
export interface LeadingStock {
    code: string
    name: string
    price: number
    changePercent: number
    marketCap: number
    reason: string
}

/** 成分股 */
export interface ConstituentStock {
    code: string
    name: string
    price: number
    changePercent: number
    weight: number
    volume: number
}

/** 相关基金 */
export interface RelatedFund {
    code: string
    name: string
    nav: number
    dayChange: number
    monthChange: number
    scale: number
}

/** 相关资讯 */
export interface SectorNews {
    id: number
    title: string
    source: string
    time: string
    summary: string
}

// ============ Mock 数据生成 ============

/** 根据板块名称哈希生成确定性随机数 */
function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

function hashStr(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++)
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    return Math.abs(h) || 1
}

/** 板块介绍文案 */
const SECTOR_INTROS: Record<string, string> = {
    人工智能:
        '人工智能板块涵盖AI算力、大模型、智能驾驶、AI应用等方向，是当前科技革命的核心赛道。随着大模型技术突破和产业化落地加速，板块持续受到政策和资本的双重关注。',
    半导体: '半导体板块覆盖芯片设计、制造、封测、设备和材料等环节，是国产替代和科技自主可控的关键领域。受益全球芯片需求回暖和国内晶圆厂扩产，行业景气度持续修复。',
    低空经济:
        '低空经济板块聚焦eVTOL、无人机、通用航空等新兴领域，政策端持续出台产业规划，多地试点加速推进，被视为新质生产力的重要方向。',
    固态电池:
        '固态电池板块代表下一代电池技术方向，能量密度更高、安全性更好。多家企业进入中试阶段，产业化预期逐步升温。',
    人形机器人:
        '人形机器人板块聚焦机器人本体、执行器、传感器、控制器等核心环节，特斯拉Optimus等标杆产品推动产业从概念走向量产。',
}

/** 生成板块基本信息 */
export function getSectorDetailInfo(sectorName: string): SectorDetailInfo {
    const rand = seededRandom(hashStr(sectorName))
    const base = 800 + rand() * 2000
    const change = (rand() - 0.42) * base * 0.04
    const price = base + change
    const open = base + (rand() - 0.5) * base * 0.015
    const high = Math.max(price, open) + rand() * base * 0.01
    const low = Math.min(price, open) - rand() * base * 0.01
    const upCount = Math.floor(rand() * 80 + 20)
    const downCount = Math.floor(rand() * 40 + 5)

    return {
        name: sectorName,
        code: `BK${String((hashStr(sectorName) % 9000) + 1000)}`,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(((change / base) * 100).toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        turnoverRate: Number((rand() * 6 + 1).toFixed(2)),
        volumeRatio: Number((rand() * 3 + 0.5).toFixed(2)),
        volume: Math.floor(rand() * 5000000000 + 500000000),
        rank: Math.floor(rand() * 30 + 1),
        upCount,
        downCount,
        netInflow: Math.floor((rand() - 0.3) * 10000000000),
        amount: Math.floor(rand() * 80000000000 + 10000000000),
        marketCap: Math.floor(rand() * 5000000000000 + 500000000000),
        intro:
            SECTOR_INTROS[sectorName] ||
            `${sectorName}板块是A股市场重要的主题板块之一，涵盖多个细分领域的优质上市公司，受到市场资金的持续关注。`,
    }
}

/** 生成板块分析 */
export function getSectorAnalysis(sectorName: string): SectorAnalysis {
    const rand = seededRandom(hashStr(sectorName) * 3)
    const isMain = rand() > 0.4
    const advices = [
        '建议重仓配置，逢低加仓龙头',
        '建议标配持有，关注回调低吸机会',
        '建议轻仓参与，控制仓位风险',
    ]
    const trends = ['偏多上行', '震荡偏强', '横盘整理', '弱势调整']

    return {
        isMainLine: isMain,
        positionAdvice: advices[Math.floor(rand() * advices.length)],
        shortTrend: trends[Math.floor(rand() * 2)],
        midTrend: trends[Math.floor(rand() * 3)],
        longTrend: trends[Math.floor(rand() * 4)],
        industryOutlook: `${sectorName}行业处于高景气周期，政策持续催化，技术突破加速，产业规模快速扩张。龙头企业业绩增长确定性强，估值仍有提升空间。中长期看好板块发展，建议关注产业格局变化和技术迭代带来的结构性机会。`,
    }
}

/** 生成龙头股列表 */
export function getLeadingStocks(sectorName: string): LeadingStock[] {
    const rand = seededRandom(hashStr(sectorName) * 7)
    const suffixes = [
        '科技',
        '股份',
        '集团',
        '电子',
        '新材',
        '智能',
        '信息',
        '光电',
    ]
    return Array.from({ length: 8 }, (_, i) => {
        const base = 15 + rand() * 120
        const change = (rand() - 0.4) * base * 0.08
        return {
            code: `${String(600000 + (hashStr(sectorName + i) % 399999)).padStart(6, '0')}`,
            name: `${sectorName.slice(0, 2)}${suffixes[i % suffixes.length]}`,
            price: Number((base + change).toFixed(2)),
            changePercent: Number(((change / base) * 100).toFixed(2)),
            marketCap: Math.floor(rand() * 300000000000 + 10000000000),
            reason: [
                '龙头地位稳固，业绩确定性强',
                '技术壁垒深厚，订单持续放量',
                '受益政策催化，估值修复中',
                '产能扩张落地，盈利加速释放',
                '核心供应商，国产替代首选',
            ][i % 5],
        }
    })
}

/** 生成成分股列表 */
export function getConstituentStocks(sectorName: string): ConstituentStock[] {
    const rand = seededRandom(hashStr(sectorName) * 11)
    const suffixes = [
        '科技',
        '股份',
        '电子',
        '材料',
        '智能',
        '信息',
        '装备',
        '光电',
        '新材',
        '芯片',
        '软件',
        '通信',
    ]
    return Array.from({ length: 20 }, (_, i) => {
        const base = 8 + rand() * 80
        const change = (rand() - 0.45) * base * 0.06
        return {
            code: `${String(600000 + (hashStr(sectorName + 'c' + i) % 399999)).padStart(6, '0')}`,
            name: `${sectorName.slice(0, 2)}${suffixes[i % suffixes.length]}`,
            price: Number((base + change).toFixed(2)),
            changePercent: Number(((change / base) * 100).toFixed(2)),
            weight: Number((rand() * 8 + 0.5).toFixed(2)),
            volume: Math.floor(rand() * 200000000 + 10000000),
        }
    })
}

/** 生成相关基金列表 */
export function getRelatedFunds(sectorName: string): RelatedFund[] {
    const rand = seededRandom(hashStr(sectorName) * 13)
    const types = ['ETF', '指数基金', '主题基金', 'LOF']
    return Array.from({ length: 6 }, (_, i) => {
        const nav = 0.5 + rand() * 3
        return {
            code: `${String(500000 + (hashStr(sectorName + 'f' + i) % 499999)).padStart(6, '0')}`,
            name: `${sectorName}${types[i % types.length]}`,
            nav: Number(nav.toFixed(4)),
            dayChange: Number(((rand() - 0.45) * 4).toFixed(2)),
            monthChange: Number(((rand() - 0.4) * 15).toFixed(2)),
            scale: Math.floor(rand() * 50000000000 + 1000000000),
        }
    })
}

/** 生成相关资讯 */
export function getSectorNewsList(sectorName: string): SectorNews[] {
    const rand = seededRandom(hashStr(sectorName) * 17)
    const titles = [
        `${sectorName}板块今日大涨，龙头股集体封板`,
        `政策利好频出，${sectorName}产业迎来发展黄金期`,
        `${sectorName}行业半年报前瞻：多家企业业绩超预期`,
        `机构调研密集，${sectorName}赛道获资金持续加仓`,
        `${sectorName}技术突破加速，产业化落地进入关键期`,
        `券商看好${sectorName}板块：给予超配评级`,
        `${sectorName}产业链公司订单饱满，景气度持续验证`,
        `${sectorName}板块估值分析：当前处于历史什么位置？`,
    ]
    const sources = [
        '证券时报',
        '中国证券报',
        '上海证券报',
        '每日经济新闻',
        '第一财经',
        '21世纪经济报道',
    ]
    return titles.map((title, i) => ({
        id: i + 1,
        title,
        source: sources[Math.floor(rand() * sources.length)],
        time: `${String(Math.floor(rand() * 12 + 7)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}`,
        summary: `${sectorName}板块最新动态，市场关注度持续提升，机构观点积极。`,
    }))
}

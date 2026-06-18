import type { StockKey } from '../types'

export type ChartPeriod = 'intraday' | 'daily' | 'monthly'
export type SectorTab = 'hot' | 'industry' | 'concept' | 'main'
export type ReviewTab = 'aShare' | 'usShare' | 'hotNews' | 'dragonTiger'

export interface MarketReview {
    trend: string
    temperature: string
    temperatureScore: number
    mainSectors: { name: string; reason: string }[]
    subSectors: { name: string; reason: string }[]
    positionAdvice: string
    strategy: string
    avoidance: string[]
    negativeFactors: string[]
}

export interface HotNewsItem {
    id: number
    title: string
    source: string
    time: string
    type: 'domestic' | 'international'
}

export interface DragonTigerItem {
    rank: number
    stockName: string
    stockCode: string
    buyAmount: number
    sellAmount: number
    netBuy: number
    reason: string
    department: string
}

export interface IntradayPoint {
    time: string
    price: number
    volume: number
}

export interface KLinePoint {
    time: string
    open: number
    close: number
    high: number
    low: number
    volume: number
}

export interface MacdPoint {
    time: string
    dif: number
    dea: number
    macd: number
}

export interface KdjPoint {
    time: string
    k: number
    d: number
    j: number
}

export interface MAPoint {
    time: string
    ma5: number | null
    ma10: number | null
    ma20: number | null
    ma30: number | null
    ma60: number | null
    ma150: number | null
}

export interface SectorItem {
    rank: number
    name: string
    changePercent: number
    leadStock: string
    leadChange: number
    amount: number
}

export interface StockDetailInfo {
    key: StockKey
    name: string
    icon: string
    code: string
    market: string
    current: number
    open: number
    high: number
    low: number
    change: number
    changePercent: number
    volume: number
    amount: number
    pe: number
    pb: number
    turnover: number
    amplitude: number
}

const BASE_PRICES: Record<StockKey, number> = {
    sh: 3380,
    cy: 2150,
    hk: 19800,
    us: 18200,
}

const STOCK_META: Record<
    StockKey,
    { name: string; icon: string; code: string; market: string }
> = {
    sh: { name: '上证指数', icon: '📊', code: '000001', market: 'A股' },
    cy: { name: '创业板指', icon: '🚀', code: '399006', market: 'A股' },
    hk: { name: '恒生指数', icon: '🌃', code: 'HSI', market: '港股' },
    us: { name: '纳斯达克', icon: '💻', code: 'IXIC', market: '美股' },
}

function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

function hashKey(key: StockKey): number {
    const map: Record<StockKey, number> = { sh: 42, cy: 77, hk: 13, us: 99 }
    return map[key]
}

function generateIntraday(key: StockKey): IntradayPoint[] {
    const rand = seededRandom(hashKey(key) * 1000)
    const base = BASE_PRICES[key]
    const points: IntradayPoint[] = []
    let price = base * (1 + (rand() - 0.5) * 0.008)
    const times = [
        '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
        '11:00', '11:15', '11:30', '13:00', '13:15', '13:30',
        '13:45', '14:00', '14:15', '14:30', '14:45', '15:00',
    ]
    for (const time of times) {
        price += (rand() - 0.48) * base * 0.002
        points.push({
            time,
            price: Number(price.toFixed(2)),
            volume: Math.floor(rand() * 800000000 + 200000000),
        })
    }
    return points
}

function generateKLine(key: StockKey, count: number, isMonthly: boolean): KLinePoint[] {
    const rand = seededRandom(hashKey(key) * (isMonthly ? 3000 : 2000))
    const base = BASE_PRICES[key]
    const points: KLinePoint[] = []
    let close = base * (1 + (rand() - 0.5) * 0.05)
    const now = new Date()

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now)
        if (isMonthly) {
            d.setMonth(d.getMonth() - i)
            const time = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const open = close
            const change = (rand() - 0.48) * base * 0.04
            close = open + change
            const high = Math.max(open, close) + rand() * base * 0.015
            const low = Math.min(open, close) - rand() * base * 0.015
            points.push({
                time,
                open: Number(open.toFixed(2)),
                close: Number(close.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                volume: Math.floor(rand() * 50000000000 + 10000000000),
            })
        } else {
            d.setDate(d.getDate() - i)
            const time = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const open = close
            const change = (rand() - 0.48) * base * 0.012
            close = open + change
            const high = Math.max(open, close) + rand() * base * 0.006
            const low = Math.min(open, close) - rand() * base * 0.006
            points.push({
                time,
                open: Number(open.toFixed(2)),
                close: Number(close.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                volume: Math.floor(rand() * 3000000000 + 500000000),
            })
        }
    }
    return points
}

function calcMacd(klines: KLinePoint[]): MacdPoint[] {
    const closes = klines.map((k) => k.close)
    const ema = (data: number[], period: number): number[] => {
        const k = 2 / (period + 1)
        const result: number[] = [data[0]]
        for (let i = 1; i < data.length; i++) {
            result.push(data[i] * k + result[i - 1] * (1 - k))
        }
        return result
    }
    const ema12 = ema(closes, 12)
    const ema26 = ema(closes, 26)
    const difArr = ema12.map((v, i) => v - ema26[i])
    const deaArr = ema(difArr, 9)
    return klines.map((k, i) => ({
        time: k.time,
        dif: Number(difArr[i].toFixed(2)),
        dea: Number(deaArr[i].toFixed(2)),
        macd: Number(((difArr[i] - deaArr[i]) * 2).toFixed(2)),
    }))
}

function calcKdj(klines: KLinePoint[]): KdjPoint[] {
    const result: KdjPoint[] = []
    let k = 50
    let d = 50
    for (let i = 0; i < klines.length; i++) {
        const start = Math.max(0, i - 8)
        const slice = klines.slice(start, i + 1)
        const high = Math.max(...slice.map((s) => s.high))
        const low = Math.min(...slice.map((s) => s.low))
        const close = klines[i].close
        const rsv = high === low ? 50 : ((close - low) / (high - low)) * 100
        k = (2 / 3) * k + (1 / 3) * rsv
        d = (2 / 3) * d + (1 / 3) * k
        const j = 3 * k - 2 * d
        result.push({
            time: klines[i].time,
            k: Number(k.toFixed(2)),
            d: Number(d.toFixed(2)),
            j: Number(j.toFixed(2)),
        })
    }
    return result
}

function calcMAs(klines: KLinePoint[]): MAPoint[] {
    const closes = klines.map((k) => k.close)
    const periods = [5, 10, 20, 30, 60, 150] as const
    const maData: Record<string, (number | null)[]> = {}
    for (const p of periods) {
        const key = `ma${p}`
        maData[key] = closes.map((_, i) => {
            if (i < p - 1) return null
            let sum = 0
            for (let j = i - p + 1; j <= i; j++) sum += closes[j]
            return Number((sum / p).toFixed(2))
        })
    }
    return klines.map((k, i) => ({
        time: k.time,
        ma5: maData.ma5[i],
        ma10: maData.ma10[i],
        ma20: maData.ma20[i],
        ma30: maData.ma30[i],
        ma60: maData.ma60[i],
        ma150: maData.ma150[i],
    }))
}

function intradayToKLine(intraday: IntradayPoint[]): KLinePoint[] {
    return intraday.map((p) => ({
        time: p.time,
        open: p.price,
        close: p.price,
        high: p.price,
        low: p.price,
        volume: p.volume,
    }))
}

const SECTOR_NAMES: Record<SectorTab, string[]> = {
    hot: ['人工智能', '低空经济', '固态电池', '人形机器人', 'CPO概念', '华为概念', '算力租赁', '量子科技'],
    industry: ['半导体', '医药生物', '银行', '食品饮料', '电力设备', '汽车', '计算机', '国防军工'],
    concept: ['ChatGPT', '数字经济', '一带一路', '碳中和', '元宇宙', '国产替代', '信创', '跨境电商'],
    main: ['白酒', '新能源', '光伏', '锂电池', '芯片', '5G通信', '消费电子', '军工'],
}

function generateSectors(tab: SectorTab, key: StockKey): SectorItem[] {
    const rand = seededRandom(hashKey(key) * 500 + tab.length * 17)
    const names = SECTOR_NAMES[tab]
    return names.map((name, i) => {
        const change = (rand() - 0.42) * 6
        const leadChange = change + (rand() - 0.5) * 4
        return {
            rank: i + 1,
            name,
            changePercent: Number(change.toFixed(2)),
            leadStock: `${name.slice(0, 2)}${['科技', '股份', '集团', '电子', '新材'][i % 5]}`,
            leadChange: Number(leadChange.toFixed(2)),
            amount: Math.floor(rand() * 80000000000 + 5000000000),
        }
    }).sort((a, b) => b.changePercent - a.changePercent)
        .map((item, i) => ({ ...item, rank: i + 1 }))
}

export function getStockDetailInfo(key: StockKey): StockDetailInfo {
    const meta = STOCK_META[key]
    const base = BASE_PRICES[key]
    const rand = seededRandom(hashKey(key))
    const change = (rand() - 0.45) * base * 0.015
    const current = base + change
    const open = base + (rand() - 0.5) * base * 0.008
    const high = Math.max(current, open) + rand() * base * 0.005
    const low = Math.min(current, open) - rand() * base * 0.005

    return {
        key,
        ...meta,
        current: Number(current.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(((change / base) * 100).toFixed(2)),
        volume: Math.floor(rand() * 400000000000 + 80000000000),
        amount: Math.floor(rand() * 6000000000000 + 1000000000000),
        pe: Number((rand() * 20 + 10).toFixed(2)),
        pb: Number((rand() * 3 + 1).toFixed(2)),
        turnover: Number((rand() * 2 + 0.5).toFixed(2)),
        amplitude: Number((((high - low) / base) * 100).toFixed(2)),
    }
}

export function getChartData(key: StockKey, period: ChartPeriod) {
    if (period === 'intraday') {
        const intraday = generateIntraday(key)
        const klines = intradayToKLine(intraday)
        return {
            intraday,
            klines,
            macd: calcMacd(klines),
            kdj: calcKdj(klines),
        }
    }
    const klines = generateKLine(key, period === 'daily' ? 250 : 200, period === 'monthly')
    return {
        intraday: null,
        klines,
        macd: calcMacd(klines),
        kdj: calcKdj(klines),
        mas: calcMAs(klines),
    }
}

export function getSectorData(key: StockKey, tab: SectorTab): SectorItem[] {
    return generateSectors(tab, key)
}

export function isValidStockKey(key: string): key is StockKey {
    return ['sh', 'cy', 'hk', 'us'].includes(key)
}

// ============ 逻辑复盘 Mock 数据 ============

const MOCK_A_SHARE_REVIEW: MarketReview = {
    trend: '今日A股三大指数分化明显，上证指数小幅回调，创业板指逆势走强。市场整体呈现缩量调整态势，两市成交额较昨日有所回落，但仍维持在万亿以上水平。盘面上看，成长风格占优，价值板块承压。',
    temperature: '偏热',
    temperatureScore: 72,
    mainSectors: [
        { name: '人工智能', reason: '受OpenAI发布新一代模型刺激，国内AI概念股集体走强，算力、数据、应用端全面爆发，龙头股封板带动板块情绪' },
        { name: '半导体', reason: '国产替代逻辑持续强化，设备板块订单超预期，叠加全球芯片库存去化接近尾声，资金持续加仓' },
        { name: '新能源车', reason: '6月新能源车销量数据超预期，智能化渗透率加速提升，产业链龙头业绩预告向好' },
    ],
    subSectors: [
        { name: '低空经济', reason: '政策催化持续，多地出台低空经济产业规划，eVTOL试飞进展顺利，短期情绪推动明显' },
        { name: '人形机器人', reason: '特斯拉Optimus量产预期升温，国内厂商加速布局执行器与传感器环节，题材活跃' },
    ],
    positionAdvice: '建议仓位6-7成，保持均衡配置，成长方向可适当偏重。关注AI、半导体等主线板块回调后的低吸机会，同时保留部分防御性仓位应对不确定性。',
    strategy: '逢低布局主线板块龙头，关注中报业绩超预期标的。短线操作以AI+半导体双主线轮动为主，中线可逢低配置新能源车及消费电子方向。注意控制追高风险，优先选择有业绩支撑的品种。',
    avoidance: ['高位连板股（追高风险大）', '题材退潮期的纯概念股', '业绩预告不达预期的白马股'],
    negativeFactors: ['美联储议息会议临近，降息预期反复', '北向资金连续净流出，外资情绪偏谨慎', '地缘政治风险升温，避险情绪有所抬头'],
}

const MOCK_US_SHARE_REVIEW: MarketReview = {
    trend: '美股三大指数集体收跌，纳斯达克跌幅较大。科技股受AI估值争议影响出现回调，半导体板块领跌。市场等待CPI数据公布，投资者风险偏好下降，VIX指数小幅上行。中概股表现分化，新能源车板块逆势走强。',
    temperature: '中性偏冷',
    temperatureScore: 45,
    mainSectors: [
        { name: 'AI基础设施', reason: '虽然短期估值承压，但算力需求持续增长，云厂商资本开支指引上调，长期逻辑未破坏' },
        { name: '新能源车/智能驾驶', reason: '特斯拉FSD V13发布预期升温，自动驾驶立法推进，中国新能源车出口数据强劲' },
    ],
    subSectors: [
        { name: '生物科技', reason: 'GLP-1减肥药赛道持续扩容，多家药企临床数据积极，板块估值修复中' },
        { name: '网络安全', reason: '近期多起重大数据泄露事件推动安全支出预期上调，政策催化明显' },
    ],
    positionAdvice: '建议美股仓位4-5成，适当降低科技股权重。关注防御性板块如必需消费、医疗保健的配置价值。等待宏观不确定性落地后再考虑加仓。',
    strategy: '短期以防守为主，逢高减仓估值偏高的科技龙头。关注AI基础设施回调后的长期布局机会，以及中概股中业绩确定性高的标的。加密货币相关标的波动加剧，建议规避。',
    avoidance: ['估值过高的AI概念股', '加密货币相关标的', '高杠杆中小盘股'],
    negativeFactors: ['CPI数据不确定性，通胀粘性风险', '美债收益率上行压力', '科技巨头反垄断监管加码'],
}

const MOCK_HOT_NEWS: HotNewsItem[] = [
    { id: 1, title: 'OpenAI发布GPT-5模型，推理能力实现重大突破', source: '新华网', time: '10:25', type: 'international' },
    { id: 2, title: '国常会审议通过低空经济产业发展规划', source: '央视新闻', time: '09:30', type: 'domestic' },
    { id: 3, title: '美联储主席鲍威尔暗示年内可能降息一次', source: '路透社', time: '08:15', type: 'international' },
    { id: 4, title: '6月新能源车零售销量突破120万辆创新高', source: '证券时报', time: '08:00', type: 'domestic' },
    { id: 5, title: '欧盟对华电动车加征临时关税正式生效', source: '环球时报', time: '07:45', type: 'international' },
    { id: 6, title: '上交所调整科创板做市商制度，提升流动性', source: '上海证券报', time: '07:30', type: 'domestic' },
    { id: 7, title: '日本央行意外加息，日元大幅走强', source: '日经中文网', time: '07:15', type: 'international' },
    { id: 8, title: '国务院印发关于促进数据要素市场化配置的指导意见', source: '中国政府网', time: '06:50', type: 'domestic' },
    { id: 9, title: '英伟达市值突破5万亿美元，创半导体公司纪录', source: '华尔街日报', time: '06:30', type: 'international' },
    { id: 10, title: '沪深交易所优化IPO审核流程，提升市场效率', source: '中国证券报', time: '06:15', type: 'domestic' },
]

const MOCK_DRAGON_TIGER: DragonTigerItem[] = [
    { rank: 1, stockName: '中科曙光', stockCode: '603019', buyAmount: 85200, sellAmount: 32400, netBuy: 52800, reason: 'AI算力龙头，机构大额净买入', department: '中信证券上海分公司' },
    { rank: 2, stockName: '寒武纪', stockCode: '688256', buyAmount: 68900, sellAmount: 28700, netBuy: 40200, reason: 'AI芯片国产替代核心标的', department: '国泰君安上海江苏路' },
    { rank: 3, stockName: '宁德时代', stockCode: '300750', buyAmount: 54300, sellAmount: 22100, netBuy: 32200, reason: '新能源车销量超预期，龙头受益', department: '华泰证券深圳益田路' },
    { rank: 4, stockName: '北方华创', stockCode: '002371', buyAmount: 47600, sellAmount: 19800, netBuy: 27800, reason: '半导体设备订单持续高增', department: '招商证券深圳深南东路' },
    { rank: 5, stockName: '金山办公', stockCode: '688111', buyAmount: 39200, sellAmount: 16500, netBuy: 22700, reason: 'AI办公应用落地加速', department: '东方财富证券拉萨团结路' },
    { rank: 6, stockName: '汇川技术', stockCode: '300124', buyAmount: 35800, sellAmount: 15200, netBuy: 20600, reason: '人形机器人执行器核心供应商', department: '广发证券上海东方路' },
    { rank: 7, stockName: '科大讯飞', stockCode: '002230', buyAmount: 31400, sellAmount: 12800, netBuy: 18600, reason: '大模型应用端持续突破', department: '海通证券上海建国西路' },
    { rank: 8, stockName: '兆易创新', stockCode: '603986', buyAmount: 28700, sellAmount: 11300, netBuy: 17400, reason: '存储芯片周期反转预期', department: '中金公司上海分公司' },
]

export function getMarketReview(tab: ReviewTab): MarketReview {
    if (tab === 'usShare') return MOCK_US_SHARE_REVIEW
    return MOCK_A_SHARE_REVIEW
}

export function getHotNews(): HotNewsItem[] {
    return MOCK_HOT_NEWS
}

export function getDragonTiger(): DragonTigerItem[] {
    return MOCK_DRAGON_TIGER
}

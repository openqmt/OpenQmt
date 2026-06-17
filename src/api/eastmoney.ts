import { isTauri } from '@tauri-apps/api/core'
import { httpFetch } from '../utils/http'
import type { FundRankItem } from '../types'

/** 基金类型筛选：0全部 1指数 2股票 3混合 4债券 5货币 6海外 */
export type FundRsfType = 0 | 1 | 2 | 3 | 4 | 5 | 6

interface TiantianFundItem {
    fundCode: string
    fundName: string
    ftype: string
    perNav: string
    accPerNav: string
    daySyl: string
    weekSyl: string
    monthSyl: string
    quarterReturn: string
    hySyl: string
    yearSyl: string
}

interface FundSelectResponse {
    Data: TiantianFundItem[]
    Message: string | null
    ErrCode: number
    Succeed: boolean
}

export interface FundRankingResult {
    items: FundRankItem[]
    hasMore: boolean
}

const FUND_SELECT_PATH = '/condition/conditionFund/fundSelect'
const FUND_SELECT_URL = `https://condition.tiantianfunds.com${FUND_SELECT_PATH}`

function getFundSelectUrl(): string {
    if (isTauri()) return FUND_SELECT_URL
    return `/api/fund${FUND_SELECT_PATH}`
}

function parseNum(val: string | undefined): number {
    if (!val) return 0
    const n = parseFloat(val)
    return Number.isFinite(n) ? n : 0
}

function toFundRankItem(item: TiantianFundItem, rank: number): FundRankItem {
    return {
        rank,
        code: item.fundCode,
        name: item.fundName,
        type: item.ftype,
        nav: parseNum(item.perNav),
        accNav: parseNum(item.accPerNav),
        dayChange: parseNum(item.daySyl),
        weekChange: parseNum(item.weekSyl),
        monthChange: parseNum(item.monthSyl),
        threeMonthChange: parseNum(item.quarterReturn),
        sixMonthChange: parseNum(item.hySyl),
        yearChange: parseNum(item.yearSyl),
    }
}

export function fundTypeToRsfType(type: string): FundRsfType {
    const map: Record<string, FundRsfType> = {
        all: 0,
        zs: 1,
        gp: 2,
        hh: 3,
        zq: 4,
        qdii: 6,
    }
    return map[type] ?? 0
}

export async function fetchFundRanking(
    pageIndex = 1,
    pageNum = 30,
    rsfType: FundRsfType = 0
): Promise<FundRankingResult> {
    const body = new URLSearchParams({
        orderField: '5_1_-1',
        pageIndex: String(pageIndex),
        pageNum: String(pageNum),
        pageType: '5',
        deviceid: 'Wap',
        plat: 'Wap',
        product: 'EFund',
        version: '2.0.0',
        abnormal: '3',
        rankSy: '1',
        rsfType: String(rsfType),
    })

    const response = await httpFetch(getFundSelectUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Priority: 'u=3, i',
        },
        body,
    })

    if (!response.ok) {
        throw new Error(`基金排行请求失败: ${response.status}`)
    }

    const json: FundSelectResponse = await response.json()

    if (!json.Succeed || json.ErrCode !== 0) {
        throw new Error(json.Message || '基金排行数据获取失败')
    }

    const startRank = (pageIndex - 1) * pageNum + 1
    const list = json.Data ?? []
    return {
        items: list.map((item, i) => toFundRankItem(item, startRank + i)),
        hasMore: list.length >= pageNum,
    }
}

export default {
    fetchFundRanking,
    fundTypeToRsfType,
}

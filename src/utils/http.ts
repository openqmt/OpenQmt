import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

/** 是否在 Tauri 桌面环境中运行 */
export function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 统一 HTTP 请求：
 * - Tauri 环境：走原生 HTTP 插件，绕过 CORS
 * - 浏览器开发：走 Vite 代理或原生 fetch
 */
export async function httpFetch(
    input: string | URL | Request,
    init?: RequestInit
): Promise<Response> {
    if (isTauri()) {
        return tauriFetch(input, init)
    }
    return fetch(input, init)
}

/** 东方财富基金排行接口 */
export function getFundRankUrl(params: URLSearchParams): string {
    const path = `/data/rankhandler.aspx?${params}`
    if (isTauri()) {
        return `https://fund.eastmoney.com${path}`
    }
    return `/api/fund${path}`
}

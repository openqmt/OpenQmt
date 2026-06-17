import { isTauri } from '@tauri-apps/api/core'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

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

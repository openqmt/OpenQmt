import * as storage from './storage'

export const getHeaders: any = () => {
    const timestamp = Date.now().toString()
    const secret = import.meta.env.VITE_SECRET
    const sign = btoa(timestamp + secret)
    const token = storage.getSync<string>('token')
    return {
        'x-timestamp': timestamp,
        'x-sign': sign,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}
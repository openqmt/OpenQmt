export const getHeaders: any = () => {
    const timestamp = Date.now().toString()
    const secret = import.meta.env.VITE_SECRET
    const sign = btoa(timestamp + secret)
    const token = localStorage.getItem('token')
            ? localStorage.getItem('token')
            : null
    return {
        'x-timestamp': timestamp,
        'x-sign': sign,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}
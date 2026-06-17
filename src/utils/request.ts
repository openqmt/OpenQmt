import axios from 'axios'
import { getHeaders } from './index'

// base url
const baseURL = import.meta.env.VITE_API_URL

const isAbsoluteURL = (url: string): boolean => {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
}

const combineURLs = (baseURL: string, relativeURL: string): string => {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL
}

const buildFullPath = (baseURL: string, pathUrl: string) => {
    if (baseURL && !isAbsoluteURL(pathUrl)) {
        return combineURLs(baseURL, pathUrl)
    }
    return pathUrl
}

const http = axios.create({
    baseURL,
    // timeout
    timeout: 60 * 1000 * 10,
})

http.interceptors.request.use((config) => {
    const requestUrl = buildFullPath(baseURL, config.url || '')
    config.url = requestUrl
    config.headers = {
        ...config.headers,
        ...getHeaders(),
    }
    return config
})

http.interceptors.response.use(
    (res) => {
        // console.log('response-----', res)
        return Promise.resolve(res)
    },
    (error) => {
        console.log('HTTP request failed:', error)
        return Promise.reject(error)
    }
)

export default http
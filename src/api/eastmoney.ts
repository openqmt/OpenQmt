import { httpFetch } from '../utils/http'

export default {
    getFundRanking(page: number, pageSize: number) {
        return httpFetch(`/api/fund/ranking?page=${page}&pageSize=${pageSize}`)
    },
}

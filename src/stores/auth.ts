import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, AuthResult } from '../types'

// ── Mock 用户数据库 (localStorage) ──

interface MockUser {
    id: string
    email: string
    password: string
    nickname: string
    avatar_url: string | null
    github_id: string | null
    credits: number
    created_at: string
}

const USERS_KEY = 'openqmt_mock_users'
const SESSION_KEY = 'openqmt_mock_session'

function loadMockUsers(): MockUser[] {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
}

function saveMockUsers(users: MockUser[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function loadSession(): { userId: string; token: string } | null {
    const data = localStorage.getItem(SESSION_KEY)
    return data ? JSON.parse(data) : null
}

function saveSession(session: { userId: string; token: string } | null) {
    if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
        localStorage.removeItem(SESSION_KEY)
    }
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function generateToken(): string {
    return generateId() + generateId()
}

function userToInfo(u: MockUser): UserInfo {
    return {
        id: u.id,
        email: u.email,
        nickname: u.nickname,
        avatar_url: u.avatar_url,
        github_id: u.github_id,
        credits: u.credits,
    }
}

// ── Store ──

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserInfo | null>(null)
    const token = ref<string | null>(null)
    const loading = ref(false)
    const pendingAuthRoute = ref<string | null>(null)

    const isAuthenticated = computed(() => !!user.value && !!token.value)

    /** 邮箱登录或自动注册（账号不存在则自动创建） */
    async function loginOrRegister(
        email: string,
        password: string,
    ): Promise<AuthResult & { isNew?: boolean }> {
        loading.value = true
        await new Promise((r) => setTimeout(r, 500))
        try {
            if (!email.includes('@') || !email.includes('.')) {
                return {
                    success: false,
                    message: '邮箱格式不正确',
                    user: null,
                    token: null,
                }
            }
            if (password.length < 6) {
                return {
                    success: false,
                    message: '密码至少6位',
                    user: null,
                    token: null,
                }
            }
            const users = loadMockUsers()
            let found = users.find((u) => u.email === email)
            let isNew = false

            if (!found) {
                // 账号不存在，自动注册
                found = {
                    id: generateId(),
                    email,
                    password,
                    nickname: email.split('@')[0],
                    avatar_url: null,
                    github_id: null,
                    credits: 100,
                    created_at: new Date().toISOString(),
                }
                users.push(found)
                saveMockUsers(users)
                isNew = true
            } else if (found.password !== password) {
                return {
                    success: false,
                    message: '密码错误',
                    user: null,
                    token: null,
                }
            }

            const tk = generateToken()
            const info = userToInfo(found)
            user.value = info
            token.value = tk
            saveSession({ userId: found.id, token: tk })
            return {
                success: true,
                message: isNew ? '注册并登录成功' : '登录成功',
                user: info,
                token: tk,
                isNew,
            }
        } finally {
            loading.value = false
        }
    }

    /** 邮箱登录 */
    async function login(email: string, password: string): Promise<AuthResult> {
        loading.value = true
        // 模拟网络延迟
        await new Promise((r) => setTimeout(r, 500))
        try {
            const users = loadMockUsers()
            const found = users.find((u) => u.email === email)
            if (!found || found.password !== password) {
                return {
                    success: false,
                    message: '邮箱或密码错误',
                    user: null,
                    token: null,
                }
            }
            const tk = generateToken()
            const info = userToInfo(found)
            user.value = info
            token.value = tk
            saveSession({ userId: found.id, token: tk })
            return { success: true, message: '登录成功', user: info, token: tk }
        } finally {
            loading.value = false
        }
    }

    /** 邮箱注册 */
    async function register(
        email: string,
        password: string,
    ): Promise<AuthResult> {
        loading.value = true
        await new Promise((r) => setTimeout(r, 500))
        try {
            if (!email.includes('@') || !email.includes('.')) {
                return {
                    success: false,
                    message: '邮箱格式不正确',
                    user: null,
                    token: null,
                }
            }
            if (password.length < 6) {
                return {
                    success: false,
                    message: '密码至少6位',
                    user: null,
                    token: null,
                }
            }
            const users = loadMockUsers()
            if (users.find((u) => u.email === email)) {
                return {
                    success: false,
                    message: '该邮箱已注册',
                    user: null,
                    token: null,
                }
            }
            const newUser: MockUser = {
                id: generateId(),
                email,
                password,
                nickname: email.split('@')[0],
                avatar_url: null,
                github_id: null,
                credits: 100,
                created_at: new Date().toISOString(),
            }
            users.push(newUser)
            saveMockUsers(users)

            const tk = generateToken()
            const info = userToInfo(newUser)
            user.value = info
            token.value = tk
            saveSession({ userId: newUser.id, token: tk })
            return { success: true, message: '注册成功', user: info, token: tk }
        } finally {
            loading.value = false
        }
    }

    /** GitHub 登录 (mock) */
    async function githubLogin(): Promise<AuthResult> {
        loading.value = true
        await new Promise((r) => setTimeout(r, 800))
        try {
            const githubId = 'gh_' + generateId()
            const email = `github_${githubId}@openqmt.local`
            const users = loadMockUsers()

            let found = users.find((u) => u.github_id === githubId)
            if (!found) {
                found = {
                    id: generateId(),
                    email,
                    password: '',
                    nickname: 'GitHub用户',
                    avatar_url:
                        'https://api.dicebear.com/7.x/identicon/svg?seed=' +
                        githubId,
                    github_id: githubId,
                    credits: 100,
                    created_at: new Date().toISOString(),
                }
                users.push(found)
                saveMockUsers(users)
            }

            const tk = generateToken()
            const info = userToInfo(found)
            user.value = info
            token.value = tk
            saveSession({ userId: found.id, token: tk })
            return {
                success: true,
                message: 'GitHub 登录成功',
                user: info,
                token: tk,
            }
        } finally {
            loading.value = false
        }
    }

    /** Google 登录 (mock) */
    async function googleLogin(): Promise<AuthResult> {
        loading.value = true
        await new Promise((r) => setTimeout(r, 800))
        try {
            const googleId = 'gg_' + generateId()
            const email = `google_${googleId}@openqmt.local`
            const users = loadMockUsers()

            let found = users.find((u) => u.email === email)
            if (!found) {
                found = {
                    id: generateId(),
                    email,
                    password: '',
                    nickname: 'Google用户',
                    avatar_url:
                        'https://api.dicebear.com/7.x/identicon/svg?seed=' +
                        googleId,
                    github_id: null,
                    credits: 100,
                    created_at: new Date().toISOString(),
                }
                users.push(found)
                saveMockUsers(users)
            }

            const tk = generateToken()
            const info = userToInfo(found)
            user.value = info
            token.value = tk
            saveSession({ userId: found.id, token: tk })
            return {
                success: true,
                message: 'Google 登录成功',
                user: info,
                token: tk,
            }
        } finally {
            loading.value = false
        }
    }

    /** 退出登录 */
    async function logout() {
        user.value = null
        token.value = null
        saveSession(null)
    }

    /** 恢复会话（应用启动时调用） */
    async function checkAuth() {
        const session = loadSession()
        if (!session) return
        const users = loadMockUsers()
        const found = users.find((u) => u.id === session.userId)
        if (found) {
            user.value = userToInfo(found)
            token.value = session.token
        } else {
            saveSession(null)
        }
    }

    /** 修改昵称 */
    async function updateNickname(nickname: string): Promise<AuthResult> {
        if (!user.value)
            return {
                success: false,
                message: '未登录',
                user: null,
                token: null,
            }
        await new Promise((r) => setTimeout(r, 300))
        const users = loadMockUsers()
        const found = users.find((u) => u.id === user.value!.id)
        if (found) {
            found.nickname = nickname.trim()
            saveMockUsers(users)
            const info = userToInfo(found)
            user.value = info
            return {
                success: true,
                message: '昵称修改成功',
                user: info,
                token: null,
            }
        }
        return {
            success: false,
            message: '用户不存在',
            user: null,
            token: null,
        }
    }

    /** 修改密码 */
    async function updatePassword(
        oldPassword: string,
        newPassword: string,
    ): Promise<AuthResult> {
        if (!user.value)
            return {
                success: false,
                message: '未登录',
                user: null,
                token: null,
            }
        if (newPassword.length < 6)
            return {
                success: false,
                message: '新密码至少6位',
                user: null,
                token: null,
            }
        await new Promise((r) => setTimeout(r, 300))
        const users = loadMockUsers()
        const found = users.find((u) => u.id === user.value!.id)
        if (found) {
            // GitHub 用户没有密码，允许直接设置；有密码的需要验证旧密码
            if (found.password && found.password !== oldPassword) {
                return {
                    success: false,
                    message: '旧密码错误',
                    user: null,
                    token: null,
                }
            }
            found.password = newPassword
            saveMockUsers(users)
            return {
                success: true,
                message: '密码修改成功',
                user: null,
                token: null,
            }
        }
        return {
            success: false,
            message: '用户不存在',
            user: null,
            token: null,
        }
    }

    /** 积分充值 */
    async function rechargeCredits(amount: number): Promise<AuthResult> {
        if (!user.value)
            return {
                success: false,
                message: '未登录',
                user: null,
                token: null,
            }
        if (amount <= 0)
            return {
                success: false,
                message: '充值金额必须大于0',
                user: null,
                token: null,
            }
        await new Promise((r) => setTimeout(r, 500))
        const users = loadMockUsers()
        const found = users.find((u) => u.id === user.value!.id)
        if (found) {
            found.credits += amount
            saveMockUsers(users)
            const info = userToInfo(found)
            user.value = info
            return {
                success: true,
                message: `充值成功，当前积分: ${found.credits}`,
                user: info,
                token: null,
            }
        }
        return {
            success: false,
            message: '用户不存在',
            user: null,
            token: null,
        }
    }

    return {
        user,
        token,
        loading,
        pendingAuthRoute,
        isAuthenticated,
        loginOrRegister,
        login,
        register,
        githubLogin,
        googleLogin,
        logout,
        checkAuth,
        updateNickname,
        updatePassword,
        rechargeCredits,
    }
})

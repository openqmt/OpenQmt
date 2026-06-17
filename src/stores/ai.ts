import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AiConversation, AiMessage, ModelProvider } from '../types'

const CONVERSATIONS_KEY = 'openqmt_ai_conversations'
const CURRENT_CONVERSATION_KEY = 'openqmt_ai_current_conversation'

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadConversations(): AiConversation[] {
    try {
        const raw = localStorage.getItem(CONVERSATIONS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveConversations(conversations: AiConversation[]) {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}

function loadCurrentId(): string | null {
    return localStorage.getItem(CURRENT_CONVERSATION_KEY)
}

function saveCurrentId(id: string | null) {
    if (id) {
        localStorage.setItem(CURRENT_CONVERSATION_KEY, id)
    } else {
        localStorage.removeItem(CURRENT_CONVERSATION_KEY)
    }
}

export const useAiStore = defineStore('ai', () => {
    const conversations = ref<AiConversation[]>(loadConversations())
    const currentConversationId = ref<string | null>(loadCurrentId())

    const currentConversation = computed(() => {
        if (!currentConversationId.value) return null
        return (
            conversations.value.find(
                (c) => c.id === currentConversationId.value
            ) || null
        )
    })

    const sortedConversations = computed(() => {
        return [...conversations.value].sort(
            (a, b) => b.updatedAt - a.updatedAt
        )
    })

    function persist() {
        saveConversations(conversations.value)
        saveCurrentId(currentConversationId.value)
    }

    /** 创建新对话 */
    function createConversation(
        provider: ModelProvider,
        model: string
    ): AiConversation {
        const conversation: AiConversation = {
            id: generateId(),
            title: '新对话',
            messages: [],
            provider,
            model,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }
        conversations.value.push(conversation)
        currentConversationId.value = conversation.id
        persist()
        return conversation
    }

    /** 切换到指定对话 */
    function switchConversation(id: string) {
        const exists = conversations.value.find((c) => c.id === id)
        if (exists) {
            currentConversationId.value = id
            persist()
        }
    }

    /** 删除对话 */
    function deleteConversation(id: string) {
        conversations.value = conversations.value.filter((c) => c.id !== id)
        if (currentConversationId.value === id) {
            // 如果删除的是当前对话，切换到最近的对话或置空
            if (conversations.value.length > 0) {
                const sorted = [...conversations.value].sort(
                    (a, b) => b.updatedAt - a.updatedAt
                )
                currentConversationId.value = sorted[0].id
            } else {
                currentConversationId.value = null
            }
        }
        persist()
    }

    /** 添加消息到当前对话 */
    function addMessage(message: AiMessage) {
        const conv = conversations.value.find(
            (c) => c.id === currentConversationId.value
        )
        if (!conv) return
        conv.messages.push(message)
        conv.updatedAt = Date.now()
        // 用第一条用户消息作为标题（截断到20字）
        if (conv.title === '新对话' && message.role === 'user') {
            conv.title =
                message.content.length > 20
                    ? message.content.slice(0, 20) + '...'
                    : message.content
        }
        persist()
    }

    /** 更新指定消息的内容（流式输出时使用） */
    function updateMessage(messageId: string, content: string) {
        const conv = conversations.value.find(
            (c) => c.id === currentConversationId.value
        )
        if (!conv) return
        const msg = conv.messages.find((m) => m.id === messageId)
        if (msg) {
            msg.content = content
            conv.updatedAt = Date.now()
            persist()
        }
    }

    /** 更新当前对话的模型信息 */
    function updateConversationModel(provider: ModelProvider, model: string) {
        const conv = conversations.value.find(
            (c) => c.id === currentConversationId.value
        )
        if (conv) {
            conv.provider = provider
            conv.model = model
            persist()
        }
    }

    return {
        conversations,
        currentConversationId,
        currentConversation,
        sortedConversations,
        createConversation,
        switchConversation,
        deleteConversation,
        addMessage,
        updateMessage,
        updateConversationModel,
        persist,
    }
})

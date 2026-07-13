import { createDiscreteApi } from 'naive-ui'

// 用于 App 根组件、router 等 n-message-provider 外部的场景
export const { message } = createDiscreteApi(['message'])

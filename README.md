# OpenQmt

最简单的 AI 投资助手 —— 仅 8M 的开源 Ai 投资分析工具，简洁、高效、开箱即用

## 功能特性

-   **黄金行情** — 实时查看各类黄金品种价格走势
-   **股市行情** — A 股大盘、个股、板块行情，分时图与成交量柱状图
-   **基金排行** — 基金收益排行与详情
-   **认知学习** — 金融投资知识库（免登录）
-   **AI 分析** — 对接 OpenAI、DeepSeek、通义千问等大模型，流式对话实时分析（免登录）
-   **系统设置** — 多模型提供商配置、系统提示词（免登录）
-   **推送通知** — 飞书、企业微信、钉钉、WxPusher 及自定义 Webhook（免登录）
-   **功能控制** — 主页菜单可见性与排序管理（免登录）
-   **个人中心** — 昵称/密码修改（需登录）

## 技术栈

| 层级     | 技术               |
| -------- | ------------------ |
| 桌面框架 | Tauri 2            |
| 前端框架 | Vue 3 + TypeScript |
| UI 组件  | Naive UI           |
| 状态管理 | Pinia              |
| 图表     | ECharts            |
| 路由     | Vue Router         |
| 文档     | VitePress          |
| 构建     | Vite + pnpm        |

## 快速开始

### 环境要求

-   Node.js >= 18
-   pnpm >= 10
-   Rust（如需构建桌面应用）

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
# 前端开发服务器（端口 1421）
pnpm dev

# Tauri 桌面应用开发
pnpm tauri-dev

# 文档网站开发
pnpm docs:dev
```

### 构建

```bash
# 前端构建
pnpm build

# Tauri 桌面应用构建
pnpm tauri-build

# 文档网站构建
pnpm docs:build
```

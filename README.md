# OpenQmt

最简单的 AI 投资助手 —— 仅 8M 的开源 Ai 投资分析工具，简洁、高效、开箱即用

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

# 快速上手

## 环境要求

在开始之前，请确保已安装以下工具：

- [Node.js](https://nodejs.org/) 18+ (推荐 20+)
- [pnpm](https://pnpm.io/) 或 npm
- [Rust](https://www.rust-lang.org/)（仅桌面应用构建需要）
- 系统依赖（Tauri 2 要求，详见 [Tauri 官方文档](https://v2.tauri.app/start/prerequisites/)）

## 获取源码

```bash
git clone <仓库地址>
cd OpenQmt
```

## 安装依赖

```bash
npm install
```

## 启动开发

### 前端开发服务器

```bash
npm run dev
```

启动后访问 `http://localhost:1420`。

### Tauri 桌面应用开发模式

```bash
npm run tauri-dev
```

这将同时启动前端开发服务器和 Tauri 原生窗口，支持热更新。

## 构建生产版本

### 前端构建

```bash
npm run build
```

### 桌面应用打包

```bash
npm run tauri-build
```

构建产物位于 `src-tauri/target/release/` 目录下。

## 环境变量

项目使用 `.env` 文件管理环境变量，参考 `.env.example` 进行配置：

```bash
# 基金排行数据源
VITE_FUND_RANK_BASE_URL=https://condition.tiantianfunds.com

# 基金详情数据源
VITE_FUND_DETAIL_BASE_URL=https://dgs.tiantianfunds.com
```

## NPM Scripts

| 命令                  | 说明                    |
| --------------------- | ----------------------- |
| `npm run dev`         | 启动前端开发服务器      |
| `npm run build`       | 类型检查 + 前端构建     |
| `npm run preview`     | 预览构建产物            |
| `npm run tauri-dev`   | 启动 Tauri 桌面应用开发 |
| `npm run tauri-build` | 打包桌面应用            |
| `npm run docs:dev`    | 启动文档站点开发服务器  |
| `npm run docs:build`  | 构建文档站点            |

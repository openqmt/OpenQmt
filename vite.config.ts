import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [vue()],
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    proxy: {
      // 浏览器开发模式代理，避免东方财富 API 的 CORS 限制
      "/api/eastmoney": {
        target: "https://push2.eastmoney.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney/, ""),
      },
      "/api/fund": {
        target: "https://fund.eastmoney.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/fund/, ""),
      },
    },
  },
}));

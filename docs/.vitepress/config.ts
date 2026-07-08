import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'OpenQmt',
  description: '最简单的 AI 投资助手 — 基于 Tauri 2 + Vue 3 的股票分析工具',

  head: [
    ['meta', { name: 'theme-color', content: '#b8922e' }],
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: '功能', link: '/guide/features', activeMatch: '/guide/features' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '项目介绍', link: '/guide/introduction' },
            { text: '快速上手', link: '/guide/getting-started' },
          ],
        },
        {
          text: '功能',
          items: [
            { text: '功能总览', link: '/guide/features' },
            { text: '黄金行情', link: '/guide/gold' },
            { text: '股市行情', link: '/guide/stock' },
            { text: '基金排行', link: '/guide/fund' },
            { text: '认知学习', link: '/guide/learn' },
            { text: 'AI 分析', link: '/guide/ai' },
            { text: '系统设置', link: '/guide/settings' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: '基于 MIT 协议发布',
      copyright: '© 2024-present OpenQmt',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除条件',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
              closeKeyAriaLabel: '关闭',
            },
          },
        },
      },
    },
  },
})

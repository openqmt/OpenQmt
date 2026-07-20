import { defineConfig } from "vitepress";

const SITE_URL = "https://openqmt.com";
const SITE_TITLE = "OpenQmt — 最简单的 AI 投资助手";
const SITE_DESC =
  "仅8M的开源免费Ai投资分析工具，简洁、高效、开箱即用，支持黄金行情、股市行情、基金排行、AI 智能分析，开箱即用。";

export default defineConfig({
  lang: "zh-CN",
  title: "OpenQmt",
  titleTemplate: ":title - OpenQmt",
  description: SITE_DESC,

  head: [
    ["meta", { name: "theme-color", content: "#b8922e" }],
    [
      "meta",
      {
        name: "keywords",
        content:
          "OpenQmt,AI投资助手,股票分析,黄金行情,基金排行,AI分析,跨平台,Tauri,Vue3,开源",
      },
    ],
    ["meta", { name: "author", content: "OpenQmt" }],
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "OpenQmt" }],
    ["meta", { property: "og:locale", content: "zh_CN" }],
    ["meta", { property: "og:title", content: SITE_TITLE }],
    ["meta", { property: "og:description", content: SITE_DESC }],
    ["meta", { property: "og:image", content: `${SITE_URL}/logo.png` }],
    ["meta", { property: "og:url", content: SITE_URL }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: SITE_TITLE }],
    ["meta", { name: "twitter:description", content: SITE_DESC }],
    ["meta", { name: "twitter:image", content: `${SITE_URL}/logo.png` }],
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "OpenQmt",
        description: SITE_DESC,
        url: SITE_URL,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Windows, macOS, Linux, iOS, Android",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Organization", name: "OpenQmt" },
      }),
    ],
    // Google Analytics (gtag.js)
    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-1NBCMY0QMB",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1NBCMY0QMB');`,
    ],
    // Baidu Analytics
    [
      "script",
      {},
      `var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?044d200013d860fe6cbf21a8b5d33adb";
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(hm, s);
            })();`,
    ],
  ],

  sitemap: {
    hostname: SITE_URL,
  },

  transformHead({ pageData }) {
    const head: [string, Record<string, string>][] = [];
    const title = pageData.title ? `${pageData.title} - OpenQmt` : SITE_TITLE;
    const desc = pageData.frontmatter.description || SITE_DESC;
    const url = `${SITE_URL}/${pageData.relativePath}`
      .replace(/index\.md$/, "")
      .replace(/\.md$/, ".html");

    head.push(["meta", { property: "og:title", content: title }]);
    head.push(["meta", { property: "og:description", content: desc }]);
    head.push(["meta", { property: "og:url", content: url }]);
    head.push(["meta", { name: "twitter:title", content: title }]);
    head.push(["meta", { name: "twitter:description", content: desc }]);
    head.push(["link", { rel: "canonical", href: url }]);

    if (pageData.frontmatter.keywords) {
      head.push([
        "meta",
        { name: "keywords", content: pageData.frontmatter.keywords },
      ]);
    }

    return head;
  },

  themeConfig: {
    logo: "/logo.png",
    nav: [
      { text: "首页", link: "/" },
      {
        text: "指南",
        link: "/guide/introduction",
        activeMatch: "/guide/",
      },
      { text: "社区", link: "/community/community" },
      { text: "下载", link: "/guide/download" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "开始",
          items: [
            { text: "项目介绍", link: "/guide/introduction" },
            { text: "快速上手", link: "/guide/getting-started" },
            { text: "下载", link: "/guide/download" },
          ],
        },
        {
          text: "功能",
          items: [
            { text: "功能总览", link: "/guide/features" },
            { text: "黄金行情", link: "/guide/gold" },
            { text: "股市行情", link: "/guide/stock" },
            { text: "基金排行", link: "/guide/fund" },
            { text: "认知学习", link: "/guide/learn" },
            { text: "AI 分析", link: "/guide/ai" },
            { text: "系统设置", link: "/guide/settings" },
          ],
        },
      ],
      "/community/": [
        {
          text: "社区",
          items: [{ text: "社区交流", link: "/community/community" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/openqmt/OpenQmt" },
    ],

    footer: {
      message: "基于 MIT 协议发布",
      copyright: "© 2024-present OpenQmt",
    },

    outline: {
      label: "本页目录",
      level: [2, 3],
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    lastUpdated: {
      text: "最后更新于",
    },

    search: {
      provider: "local",
      options: {
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            displayDetails: "显示详情",
            resetButtonTitle: "清除条件",
            backButtonTitle: "返回",
            noResultsText: "没有找到结果",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
              closeKeyAriaLabel: "关闭",
            },
          },
        },
      },
    },
  },
});

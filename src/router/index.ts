import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/gold",
  },
  {
    path: "/gold",
    name: "Gold",
    component: () => import("../pages/GoldPage.vue"),
    meta: { title: "黄金行情" },
  },
  {
    path: "/stock",
    name: "Stock",
    component: () => import("../pages/StockPage.vue"),
    meta: { title: "股票行情" },
  },
  {
    path: "/fund",
    name: "Fund",
    component: () => import("../pages/FundPage.vue"),
    meta: { title: "基金排行" },
  },
  {
    path: "/learn",
    name: "Learn",
    component: () => import("../pages/LearnPage.vue"),
    meta: { title: "认知学习" },
  },
  {
    path: "/ai",
    name: "AI",
    component: () => import("../pages/AIPage.vue"),
    meta: { title: "AI分析" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;

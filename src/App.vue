<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-layout has-sider style="height: 100vh">
        <n-layout-sider
          collapse-mode="width"
          :collapsed-width="64"
          :width="220"
          show-trigger
          :bordered="false"
          class="app-sidebar"
        >
          <div class="logo-area">
            <div class="logo-icon-wrap">
              <span class="logo-letter">Q</span>
            </div>
            <div class="logo-text-wrap" v-show="!collapsed">
              <span class="logo-text">OpenQmt</span>
              <span class="logo-sub">金融信息平台</span>
            </div>
          </div>
          <div class="sidebar-divider"></div>
          <n-menu
            v-model:value="activeKey"
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="20"
            :options="menuOptions"
            :indent="20"
            @update:collapsed="collapsed = $event"
          />
        </n-layout-sider>
        <n-layout class="app-main">
          <n-layout-header :bordered="false" class="app-header">
            <div class="header-left">
              <span class="header-title">{{ currentTitle }}</span>
              <span class="header-badge" v-if="store.loading">更新中...</span>
            </div>
            <div class="header-right">
              <span class="header-time">{{ currentTime }}</span>
            </div>
          </n-layout-header>
          <n-layout-content
            content-style="padding: 24px 28px;"
            class="app-content"
          >
            <router-view />
          </n-layout-content>
        </n-layout>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { darkTheme, NIcon, type GlobalThemeOverrides } from "naive-ui";
import type { MenuOption } from "naive-ui";
import {
  FlashOutline,
  TrendingUpOutline,
  WalletOutline,
  BookOutline,
  SparklesOutline,
} from "@vicons/ionicons5";
import router from "./router";
import { useGoldStore } from "./stores/gold";

const route = useRoute();
const goldStore = useGoldStore();
const store = goldStore;
const activeKey = ref<string>("gold");
const collapsed = ref(false);
const currentTime = ref("");
let timer: ReturnType<typeof setInterval> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderIcon = (icon: any) => () =>
  h(NIcon, { size: 18 }, { default: () => h(icon) });

const menuOptions: MenuOption[] = [
  { label: "黄金行情", key: "gold", icon: renderIcon(FlashOutline) },
  { label: "股票行情", key: "stock", icon: renderIcon(TrendingUpOutline) },
  { label: "基金排行", key: "fund", icon: renderIcon(WalletOutline) },
  { label: "认知学习", key: "learn", icon: renderIcon(BookOutline) },
  { label: "AI 分析", key: "ai", icon: renderIcon(SparklesOutline) },
];

const titleMap: Record<string, string> = {
  gold: "黄金行情",
  stock: "股票行情",
  fund: "基金排行",
  learn: "认知学习",
  ai: "AI 分析",
};

const currentTitle = computed(() => titleMap[activeKey.value] || "OpenQmt");

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

watch(
  () => route.path,
  (path) => {
    const key = path.replace("/", "") || "gold";
    activeKey.value = key;
  },
  { immediate: true }
);

watch(activeKey, (key) => {
  if (route.path !== `/${key}`) {
    router.push(`/${key}`);
  }
});

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: "#d4a843",
    primaryColorHover: "#e8c46a",
    primaryColorPressed: "#b8922e",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  Card: {
    color: "#1a2332",
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: "12px",
  },
  Menu: {
    itemTextColor: "#a0aec0",
    itemTextColorHover: "#d4a843",
    itemTextColorActive: "#e8c46a",
    itemIconColor: "#636e80",
    itemIconColorHover: "#d4a843",
    itemIconColorActive: "#e8c46a",
    itemColorActive: "rgba(212, 168, 67, 0.08)",
    itemColorActiveHover: "rgba(212, 168, 67, 0.12)",
    itemHeight: "44px",
  },
  Button: {
    borderRadiusMedium: "8px",
  },
  Tag: {
    borderRadius: "6px",
  },
  DataTable: {
    borderRadius: "12px",
  },
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.app-sidebar {
  background: var(--bg-sidebar) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

.logo-area {
  display: flex;
  align-items: center;
  padding: 18px 16px 14px;
  gap: 12px;
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #d4a843 0%, #e8c46a 50%, #b8922e 100%);
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(212, 168, 67, 0.35);
}

.logo-letter {
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  letter-spacing: -1px;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--gold-primary);
  letter-spacing: 0.5px;
}

.logo-sub {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.sidebar-divider {
  height: 1px;
  margin: 0 16px 8px;
  background: linear-gradient(90deg, rgba(212,168,67,0.3) 0%, rgba(255,255,255,0.04) 100%);
}

.app-main {
  background: var(--bg-primary);
}

.app-header {
  height: 52px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-badge {
  font-size: 11px;
  color: var(--gold-primary);
  background: rgba(212, 168, 67, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-time {
  color: var(--text-muted);
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.5px;
}

.app-content {
  height: calc(100vh - 52px);
  background: var(--bg-primary);
  overflow-y: auto;
}
</style>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

interface Platform {
  key: string;
  name: string;
  icon: string;
  files: { label: string; ext: string; url: string }[];
}

const REPO = "https://github.com/openqmt/OpenQmt/releases/latest/download";
const VERSION = "0.1.0";

const platforms: Platform[] = [
  {
    key: "windows",
    name: "Windows",
    icon: "🪟",
    files: [
      {
        label: "Windows 安装包",
        ext: ".exe",
        url: `${REPO}/OpenQmt_${VERSION}_x64-setup.exe`,
      },
    ],
  },
  {
    key: "macos",
    name: "macOS",
    icon: "🍎",
    files: [
      {
        label: "Apple Silicon",
        ext: ".dmg",
        url: `${REPO}/OpenQmt_${VERSION}_aarch64.dmg`,
      },
      {
        label: "Intel",
        ext: ".dmg",
        url: `${REPO}/OpenQmt_${VERSION}_x64.dmg`,
      },
    ],
  },
  {
    key: "linux",
    name: "Linux",
    icon: "🐧",
    files: [
      {
        label: "Debian / Ubuntu",
        ext: ".deb",
        url: `${REPO}/OpenQmt_${VERSION}_amd64.deb`,
      },
      {
        label: "AppImage",
        ext: ".AppImage",
        url: `${REPO}/OpenQmt_${VERSION}_amd64.AppImage`,
      },
    ],
  },
  {
    key: "ios",
    name: "iOS",
    icon: "📱",
    files: [{ label: "App Store", ext: "", url: "https://apps.apple.com" }],
  },
  {
    key: "android",
    name: "Android",
    icon: "🤖",
    files: [
      {
        label: "APK (arm64)",
        ext: ".apk",
        url: `${REPO}/OpenQmt_${VERSION}_arm64.apk`,
      },
    ],
  },
];

const detected = ref("");

onMounted(() => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) detected.value = "ios";
  else if (/android/.test(ua)) detected.value = "android";
  else if (/mac/.test(ua)) detected.value = "macos";
  else if (/win/.test(ua)) detected.value = "windows";
  else if (/linux/.test(ua)) detected.value = "linux";
});

const recommendedLabel = computed(() => {
  if (!detected.value) return "";
  const p = platforms.find((p) => p.key === detected.value);
  return p ? `已检测到你的设备：${p.name}` : "";
});
</script>

<template>
  <div class="download-page">
    <p v-if="recommendedLabel" class="detected-hint">
      <span class="detected-icon">✅</span> {{ recommendedLabel }}
    </p>
    <p v-else class="detected-hint hint-muted">请选择适合你设备的版本下载</p>

    <div class="platform-grid">
      <div
        v-for="p in platforms"
        :key="p.key"
        class="platform-card"
        :class="{ 'platform-card--recommended': p.key === detected }"
      >
        <div class="platform-header">
          <span class="platform-icon">{{ p.icon }}</span>
          <span class="platform-name">{{ p.name }}</span>
          <span v-if="p.key === detected" class="badge-recommended">推荐</span>
        </div>
        <div class="platform-files">
          <a
            v-for="f in p.files"
            :key="f.label"
            :href="f.url"
            class="download-btn"
          >
            <span class="download-label">{{ f.label }}</span>
            <span v-if="f.ext" class="download-ext">{{ f.ext }}</span>
          </a>
        </div>
      </div>
    </div>

    <p class="download-note">
      所有版本均可从
      <a
        href="https://github.com/openqmt/OpenQmt/releases"
        target="_blank"
        rel="noopener"
        >GitHub Releases</a
      >
      获取。桌面版支持自动更新。
    </p>
  </div>
</template>

<style scoped>
.download-page {
  margin-top: 24px;
}

.detected-hint {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detected-hint.hint-muted {
  color: var(--vp-c-text-2);
  font-weight: 400;
}

.detected-icon {
  font-size: 16px;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.platform-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.platform-card:hover {
  border-color: var(--vp-c-brand-2);
}

.platform-card--recommended {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 1px var(--vp-c-brand-1);
}

.platform-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.platform-icon {
  font-size: 24px;
}

.platform-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.badge-recommended {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  padding: 2px 8px;
  border-radius: 100px;
  line-height: 1.5;
}

.platform-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.download-btn:hover {
  border-color: var(--vp-c-brand-2);
  background: var(--vp-c-bg-alt);
}

.download-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.download-ext {
  font-size: 12px;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.download-note {
  margin-top: 24px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.download-note a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.download-note a:hover {
  text-decoration: underline;
}
</style>

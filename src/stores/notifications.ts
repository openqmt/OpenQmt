import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  PushChannel,
  PushChannelConfig,
  NotificationType,
  NotificationTypeConfig,
  PushNotificationSettings,
} from "../types";
import * as storage from "../utils/storage";

const NOTIFICATIONS_KEY = "openqmt_notifications";

export const CHANNEL_LABELS: Record<PushChannel, string> = {
  feishu: "飞书",
  wecom: "企业微信",
  dingtalk: "钉钉",
  wxpusher: "WxPusher",
  custom: "自定义",
};

export const CHANNEL_ICONS: Record<PushChannel, string> = {
  feishu: "🟢",
  wecom: "💚",
  dingtalk: "🔵",
  wxpusher: "📨",
  custom: "⚙️",
};

const DEFAULT_NOTIFICATIONS: NotificationTypeConfig[] = [
  {
    type: "gold_price",
    name: "黄金价格波动",
    description: "当黄金价格波动超过设定阈值时推送",
    enabled: true,
    channels: [],
  },
  {
    type: "stock_alert",
    name: "股票异动",
    description: "关注股票出现大幅波动时推送",
    enabled: true,
    channels: [],
  },
  {
    type: "fund_update",
    name: "基金排行更新",
    description: "基金排行榜每日更新提醒",
    enabled: false,
    channels: [],
  },
  {
    type: "ai_report",
    name: "AI 分析报告",
    description: "AI 分析报告生成完成后推送",
    enabled: true,
    channels: [],
  },
  {
    type: "learn_progress",
    name: "学习进度提醒",
    description: "定期推送学习进度和建议",
    enabled: false,
    channels: [],
  },
  {
    type: "system_update",
    name: "系统更新",
    description: "系统版本更新和功能优化通知",
    enabled: true,
    channels: [],
  },
  {
    type: "credits_change",
    name: "积分变动",
    description: "积分充值、消费变动通知",
    enabled: true,
    channels: [],
  },
];

const DEFAULT_SETTINGS: PushNotificationSettings = {
  channels: [],
  notifications: DEFAULT_NOTIFICATIONS,
};

function loadSettings(): PushNotificationSettings {
  try {
    const parsed = storage.getSync<Partial<PushNotificationSettings>>(NOTIFICATIONS_KEY);
    if (!parsed) return { ...DEFAULT_SETTINGS, notifications: [...DEFAULT_NOTIFICATIONS] };
    return {
      channels: parsed.channels ?? [],
      notifications: parsed.notifications ?? [...DEFAULT_NOTIFICATIONS],
    };
  } catch {
    return { ...DEFAULT_SETTINGS, notifications: [...DEFAULT_NOTIFICATIONS] };
  }
}

export const useNotificationStore = defineStore("notifications", () => {
  const settings = ref<PushNotificationSettings>(loadSettings());

  const enabledChannels = computed(() =>
    settings.value.channels.filter(c => c.enabled)
  );

  const channelOptions = computed(() =>
    (Object.keys(CHANNEL_LABELS) as PushChannel[]).map(key => ({
      label: `${CHANNEL_ICONS[key]} ${CHANNEL_LABELS[key]}`,
      value: key,
    }))
  );

  function addChannel(channel: Omit<PushChannelConfig, "id">) {
    const newChannel: PushChannelConfig = {
      ...channel,
      id: `channel_${Date.now()}`,
    };
    settings.value.channels.push(newChannel);
  }

  function updateChannel(id: string, updates: Partial<PushChannelConfig>) {
    const channel = settings.value.channels.find(c => c.id === id);
    if (channel) {
      Object.assign(channel, updates);
    }
  }

  function removeChannel(id: string) {
    settings.value.channels = settings.value.channels.filter(c => c.id !== id);
    // 从所有通知中移除该渠道
    settings.value.notifications.forEach(notification => {
      notification.channels = notification.channels.filter(ch => ch !== id);
    });
  }

  function toggleChannel(id: string) {
    const channel = settings.value.channels.find(c => c.id === id);
    if (channel) {
      channel.enabled = !channel.enabled;
    }
  }

  function toggleNotification(type: NotificationType) {
    const notification = settings.value.notifications.find(n => n.type === type);
    if (notification) {
      notification.enabled = !notification.enabled;
    }
  }

  function toggleNotificationChannel(
    notificationType: NotificationType,
    channelId: string
  ) {
    const notification = settings.value.notifications.find(
      n => n.type === notificationType
    );
    if (notification) {
      const index = notification.channels.indexOf(channelId);
      if (index > -1) {
        notification.channels.splice(index, 1);
      } else {
        notification.channels.push(channelId);
      }
    }
  }

  function save() {
    storage.set(NOTIFICATIONS_KEY, settings.value);
  }

  function reset() {
    settings.value = {
      ...DEFAULT_SETTINGS,
      notifications: [...DEFAULT_NOTIFICATIONS],
    };
    storage.set(NOTIFICATIONS_KEY, settings.value);
  }

  return {
    settings,
    enabledChannels,
    channelOptions,
    addChannel,
    updateChannel,
    removeChannel,
    toggleChannel,
    toggleNotification,
    toggleNotificationChannel,
    save,
    reset,
  };
});

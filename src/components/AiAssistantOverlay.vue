<template>
  <Teleport to="body">
    <Transition name="ai-overlay">
      <div
        v-if="show"
        class="ai-overlay"
        @click.self="close"
        @keydown.esc="close"
      >
        <div class="ai-grid-bg" aria-hidden="true"></div>
        <div class="ai-scanline" aria-hidden="true"></div>

        <div class="ai-panel" role="dialog" aria-label="AI 页面助手">
          <div class="ai-corner ai-corner-tl" aria-hidden="true"></div>
          <div class="ai-corner ai-corner-tr" aria-hidden="true"></div>
          <div class="ai-corner ai-corner-bl" aria-hidden="true"></div>
          <div class="ai-corner ai-corner-br" aria-hidden="true"></div>

          <!-- Header -->
          <div class="ai-panel-header">
            <div class="ai-panel-title-wrap">
              <div class="ai-panel-title">
                <span class="ai-status-dot"></span>
                <span class="ai-title-text">AI 页面助手</span>
                <span class="ai-page-badge">{{ pageTitle }}</span>
              </div>
              <div class="ai-panel-model">
                <span class="ai-model-label">MODEL</span>
                {{ currentProviderLabel }} · {{ selectedModel }}
              </div>
            </div>
            <div class="ai-header-actions">
              <button
                v-if="messages.length > 0"
                class="ai-action-btn"
                title="清空对话"
                @click="clearChat"
              >
                <n-icon size="16"><RefreshOutline /></n-icon>
              </button>
              <button class="ai-close-btn" title="关闭 (Esc)" @click="close">
                <n-icon size="18"><CloseOutline /></n-icon>
              </button>
            </div>
          </div>

          <div class="ai-panel-body">
            <!-- Sidebar: Page Context -->
            <aside v-if="pageContextText" class="ai-sidebar">
              <div class="ai-sidebar-header">
                <span class="ai-sidebar-label">DATA FEED</span>
                <button
                  class="ai-sidebar-toggle"
                  @click="contextExpanded = !contextExpanded"
                >
                  <n-icon
                    size="14"
                    class="ai-context-arrow"
                    :class="{ expanded: contextExpanded }"
                  >
                    <ChevronDownOutline />
                  </n-icon>
                </button>
              </div>
              <div v-show="contextExpanded" class="ai-context-content">
                {{ pageContextText }}
              </div>
            </aside>

            <!-- Main Chat -->
            <main class="ai-main">
              <div class="ai-messages" ref="messagesRef">
                <div
                  v-if="displayMessages.length === 0 && !isAnalyzing"
                  class="ai-welcome"
                >
                  <div class="ai-welcome-ring">
                    <span class="ai-welcome-icon">AI</span>
                  </div>
                  <h3 class="ai-welcome-title">智能页面分析</h3>
                  <p class="ai-welcome-text">
                    基于当前页面实时数据，AI 将给出专业解读与趋势判断
                  </p>
                  <button
                    class="ai-analyze-btn"
                    @click="analyzePage"
                    :disabled="isAnalyzing || !pageContextText"
                  >
                    <span class="ai-btn-glow"></span>
                    启动分析
                  </button>
                  <div v-if="quickQuestions.length" class="ai-quick-questions">
                    <span class="ai-quick-label">快捷指令</span>
                    <div class="ai-quick-list">
                      <div
                        v-for="q in quickQuestions"
                        :key="q"
                        class="ai-quick-item"
                        @click="sendQuickQuestion(q)"
                      >
                        {{ q }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-for="msg in displayMessages"
                  :key="msg.id"
                  :class="[
                    'ai-msg',
                    msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-ai',
                  ]"
                >
                  <div class="ai-msg-avatar">
                    {{ msg.role === "user" ? "U" : "AI" }}
                  </div>
                  <div class="ai-msg-body">
                    <div
                      v-if="msg.role === 'assistant'"
                      class="ai-msg-text markdown-body"
                      v-html="renderMarkdown(msg.content)"
                    ></div>
                    <div v-else class="ai-msg-text">{{ msg.content }}</div>
                  </div>
                </div>

                <div v-if="showLoadingBubble" class="ai-msg ai-msg-ai">
                  <div class="ai-msg-avatar">AI</div>
                  <div class="ai-msg-body">
                    <div class="ai-loading">
                      <span class="dot"></span><span class="dot"></span
                      ><span class="dot"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Input -->
              <div class="ai-input-area">
                <div class="ai-input-wrap">
                  <span class="ai-input-prefix">&gt;</span>
                  <input
                    v-model="inputText"
                    type="text"
                    class="ai-input-field"
                    placeholder="输入指令或继续提问..."
                    @keydown.enter.exact="handleSend"
                  />
                  <button
                    class="ai-send-btn"
                    @click="handleSend"
                    :disabled="!inputText.trim() || isAnalyzing"
                  >
                    SEND
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onUnmounted } from "vue";
import { useMessage } from "naive-ui";
import { NIcon } from "naive-ui";
import {
  CloseOutline,
  ChevronDownOutline,
  RefreshOutline,
} from "@vicons/ionicons5";
import { httpFetch } from "../utils/http";
import type { AiMessage } from "../types";
import { useSettingsStore } from "../stores/settings";
import { usePageContext } from "../composables/usePageContext";
import { useAiModelSelection } from "../composables/useAiModelSelection";
import { renderMarkdown } from "../utils/markdown";

const ANALYZE_PROMPT = "分析当前页面数据";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: "update:show", val: boolean): void }>();

const settingsStore = useSettingsStore();
const { selectedProvider, selectedModel, currentProviderLabel } =
  useAiModelSelection();
const { pageType, pageTitle, pageContextText } = usePageContext();
const message = useMessage();

const messages = ref<AiMessage[]>([]);
const inputText = ref("");
const isAnalyzing = ref(false);
const contextExpanded = ref(true);
const messagesRef = ref<HTMLElement | null>(null);

/** 各页面快捷提问 */
const quickQuestions = computed(() => {
  const map: Record<string, string[]> = {
    gold: ["今日黄金走势如何？", "现在适合买入吗？", "各品种对比分析"],
    stock: ["当前市场情绪如何？", "哪个指数表现最好？", "短期趋势判断"],
    "stock-detail": ["当前市场情绪如何？", "短期趋势判断", "有什么风险？"],
    fund: ["哪些基金值得关注？", "涨幅前几名分析", "适合定投的有哪些？"],
    "fund-detail": ["这只基金怎么样？", "适合长期持有吗？", "同类对比分析"],
    learn: ["推荐学习路径", "新手该从哪里开始？"],
  };
  return map[pageType.value] || ["总结一下当前页面", "有什么值得关注？"];
});

/** 流式输出时隐藏空的 assistant 占位消息 */
const displayMessages = computed(() => {
  const all = messages.value;
  if (
    isAnalyzing.value &&
    all.length > 0 &&
    all[all.length - 1].role === "assistant" &&
    all[all.length - 1].content === ""
  ) {
    return all.slice(0, -1);
  }
  return all;
});

const showLoadingBubble = computed(
  () =>
    isAnalyzing.value &&
    messages.value.length > 0 &&
    messages.value[messages.value.length - 1].content === "",
);

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function close() {
  emit("update:show", false);
}

function clearChat() {
  messages.value = [];
  inputText.value = "";
  contextExpanded.value = true;
}

function scrollToBottom(): void {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

function onEscKey(e: KeyboardEvent) {
  if (e.key === "Escape" && props.show) close();
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      messages.value = [];
      inputText.value = "";
      contextExpanded.value = true;
      document.addEventListener("keydown", onEscKey);
    } else {
      document.removeEventListener("keydown", onEscKey);
    }
  },
);

onUnmounted(() => {
  document.removeEventListener("keydown", onEscKey);
});

function checkApiKey(): boolean {
  const config = settingsStore.model.providers[selectedProvider.value];
  if (!config?.apiKey) {
    message.error("请先在系统设置中配置 API Key");
    return false;
  }
  return true;
}

/** 构建 API 请求消息，页面上下文注入 system prompt */
function buildApiMessages(): Array<{ role: string; content: string }> {
  const context = pageContextText.value;
  const systemContent = context
    ? `${settingsStore.model.systemPrompt}\n\n当前页面数据：\n${context}`
    : settingsStore.model.systemPrompt;

  const result: Array<{ role: string; content: string }> = [
    { role: "system", content: systemContent },
  ];

  for (const msg of messages.value) {
    if (msg.role === "assistant" && !msg.content) continue;

    let content = msg.content;
    // 首次分析：界面显示简短文案，API 发送完整指令
    if (msg.role === "user" && content === ANALYZE_PROMPT) {
      content = `请分析以下页面数据并给出总结。要求简洁专业，包含关键数据解读和趋势判断：\n\n${context}`;
    }
    result.push({ role: msg.role, content });
  }
  return result;
}

async function startAiReply(): Promise<string> {
  const aiMessageId = genId();
  messages.value.push({
    id: aiMessageId,
    role: "assistant",
    content: "",
    timestamp: Date.now(),
  });
  contextExpanded.value = false;
  scrollToBottom();
  return aiMessageId;
}

async function analyzePage(): Promise<void> {
  if (!pageContextText.value || isAnalyzing.value) return;
  if (!checkApiKey()) return;

  messages.value.push({
    id: genId(),
    role: "user",
    content: ANALYZE_PROMPT,
    timestamp: Date.now(),
  });

  isAnalyzing.value = true;
  const aiMessageId = await startAiReply();

  try {
    await callAIStream(aiMessageId);
  } catch (error: any) {
    message.error(error.message || "请求失败");
    updateLocalMessage(
      aiMessageId,
      `❌ 请求失败: ${error.message || "未知错误"}`,
    );
  } finally {
    isAnalyzing.value = false;
    scrollToBottom();
  }
}

async function sendQuickQuestion(question: string): Promise<void> {
  inputText.value = question;
  await handleSend();
}

async function handleSend(): Promise<void> {
  const text = inputText.value.trim();
  if (!text || isAnalyzing.value) return;
  if (!checkApiKey()) return;

  messages.value.push({
    id: genId(),
    role: "user",
    content: text,
    timestamp: Date.now(),
  });
  inputText.value = "";
  scrollToBottom();

  isAnalyzing.value = true;
  const aiMessageId = await startAiReply();

  try {
    await callAIStream(aiMessageId);
  } catch (error: any) {
    message.error(error.message || "请求失败");
    updateLocalMessage(
      aiMessageId,
      `❌ 请求失败: ${error.message || "未知错误"}`,
    );
  } finally {
    isAnalyzing.value = false;
    scrollToBottom();
  }
}

function updateLocalMessage(messageId: string, content: string): void {
  const msg = messages.value.find((m) => m.id === messageId);
  if (msg) msg.content = content;
}

async function callAIStream(messageId: string): Promise<void> {
  const config = settingsStore.model.providers[selectedProvider.value];
  if (!config) throw new Error("模型配置不存在");

  const response = await httpFetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel.value,
      messages: buildApiMessages(),
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith(":")) continue;

      if (trimmedLine.startsWith("data: ")) {
        const dataStr = trimmedLine.slice(6);
        if (dataStr === "[DONE]") return;

        try {
          const data = JSON.parse(dataStr);
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            updateLocalMessage(messageId, fullContent);
            scrollToBottom();
          }
        } catch (e) {
          console.warn("Failed to parse SSE data:", e);
        }
      }
    }
  }
}
</script>

<style scoped>
/* ── Overlay：轻遮罩 + 磨砂，底层页面可见 ── */
.ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 16px;
  background: var(--ai-overlay-bg);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
}

.ai-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--ai-grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--ai-grid-color) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%);
  pointer-events: none;
}

.ai-scanline {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ── Main panel：全屏磨砂玻璃层 ── */
.ai-panel {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1280px;
  margin: 0 auto;
  background: var(--ai-panel-bg);
  backdrop-filter: blur(40px) saturate(1.4);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  border: 1px solid var(--ai-panel-border);
  border-radius: 6px;
  box-shadow: var(--ai-panel-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* HUD corner brackets */
.ai-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--gold-primary);
  border-style: solid;
  opacity: 0.6;
  pointer-events: none;
  z-index: 2;
}

.ai-corner-tl {
  top: 8px;
  left: 8px;
  border-width: 2px 0 0 2px;
}

.ai-corner-tr {
  top: 8px;
  right: 8px;
  border-width: 2px 2px 0 0;
}

.ai-corner-bl {
  bottom: 8px;
  left: 8px;
  border-width: 0 0 2px 2px;
}

.ai-corner-br {
  bottom: 8px;
  right: 8px;
  border-width: 0 2px 2px 0;
}

/* ── Header ── */
.ai-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--ai-panel-divider);
  background: var(--ai-panel-header-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  flex-shrink: 0;
}

.ai-panel-title-wrap {
  min-width: 0;
}

.ai-panel-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.ai-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gold-primary);
  box-shadow: 0 0 8px var(--gold-primary);
  animation: status-pulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 8px var(--gold-primary);
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 4px var(--gold-primary);
  }
}

.ai-title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.ai-page-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--gold-primary);
  background: var(--ai-gold-bg);
  border: 1px solid var(--ai-gold-border);
  padding: 3px 10px;
  border-radius: 2px;
  letter-spacing: 0.06em;
}

.ai-panel-model {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  padding-left: 18px;
}

.ai-model-label {
  color: var(--gold-primary);
  margin-right: 8px;
  opacity: 0.8;
}

.ai-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ai-action-btn,
.ai-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-subtle);
  background: var(--ai-surface);
  border-radius: 2px;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.ai-action-btn:hover,
.ai-close-btn:hover {
  background: var(--ai-gold-bg);
  border-color: var(--ai-gold-border);
  color: var(--gold-primary);
}

/* ── Body layout ── */
.ai-panel-body {
  flex: 1 1 0;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* Sidebar */
.ai-sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--ai-panel-divider);
  background: var(--ai-surface-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ai-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.ai-sidebar-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--gold-primary);
  letter-spacing: 0.12em;
}

.ai-sidebar-toggle {
  display: none;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
}

.ai-context-arrow {
  transition: transform var(--transition-fast);
}

.ai-context-arrow.expanded {
  transform: rotate(180deg);
}

.ai-context-content {
  flex: 1 1 0;
  overflow-y: auto;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 14px 16px;
}

/* Main chat area */
.ai-main {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ai-messages {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 24px 28px;
  min-height: 0;
}

/* Welcome */
.ai-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  min-height: 100%;
}

.ai-welcome-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--ai-gold-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 0 30px var(--ai-gold-glow);
}

.ai-welcome-ring::before {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid var(--ai-gold-bg);
  animation: ring-spin 8s linear infinite;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-welcome-icon {
  font-family: "JetBrains Mono", monospace;
  font-size: 18px;
  font-weight: 700;
  color: var(--gold-primary);
  letter-spacing: 0.1em;
}

.ai-welcome-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

.ai-welcome-text {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 28px;
  line-height: 1.6;
  max-width: 420px;
}

.ai-analyze-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 12px 32px;
  background: transparent;
  color: var(--gold-primary);
  border: 1px solid var(--ai-gold-border-strong);
  border-radius: 2px;
  font-family: "JetBrains Mono", monospace;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: pointer;
  overflow: hidden;
  transition:
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.ai-analyze-btn:hover:not(:disabled) {
  background: var(--ai-gold-bg);
  box-shadow: 0 0 20px var(--ai-gold-glow);
}

.ai-analyze-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ai-btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    var(--ai-gold-glow),
    transparent
  );
  transform: translateX(-100%);
  animation: btn-sweep 3s ease-in-out infinite;
}

@keyframes btn-sweep {
  0%,
  100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

.ai-quick-questions {
  margin-top: 32px;
  width: 100%;
  max-width: 560px;
}

.ai-quick-label {
  display: block;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 0.12em;
  margin-bottom: 12px;
}

.ai-quick-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.ai-quick-item {
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--ai-surface);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  padding: 8px 14px;
  border-radius: 2px;
  transition:
    background var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.ai-quick-item:hover {
  background: var(--ai-gold-bg);
  color: var(--gold-primary);
  border-color: var(--ai-gold-border);
}

/* Messages */
.ai-msg {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.ai-msg-user {
  flex-direction: row-reverse;
}

.ai-msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--ai-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
}

.ai-msg-user .ai-msg-avatar {
  background: var(--ai-gold-bg);
  border-color: var(--ai-gold-border);
  color: var(--gold-primary);
}

.ai-msg-ai .ai-msg-avatar {
  background: var(--ai-gold-bg);
  border-color: var(--ai-gold-border);
  color: var(--gold-primary);
}

.ai-msg-body {
  max-width: 75%;
  min-width: 0;
}

.ai-msg-user .ai-msg-body {
  background: var(--ai-msg-user-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--ai-gold-border);
  border-radius: 2px 2px 0 2px;
  padding: 12px 16px;
}

.ai-msg-ai .ai-msg-body {
  background: var(--ai-msg-ai-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: 2px 2px 2px 0;
  padding: 12px 16px;
}

.ai-msg-text {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
  word-break: break-word;
}

.ai-loading {
  display: flex;
  gap: 5px;
  padding: 4px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold-primary);
  animation: pulse 1.4s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Input */
.ai-input-area {
  flex-shrink: 0;
  padding: 16px 24px;
  border-top: 1px solid var(--ai-panel-divider);
  background: var(--ai-surface-strong);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.ai-input-wrap {
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--ai-gold-border);
  border-radius: 2px;
  padding: 4px 4px 4px 14px;
  background: var(--ai-input-wrap-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.ai-input-wrap:focus-within {
  border-color: var(--ai-gold-border-strong);
  box-shadow: 0 0 16px var(--ai-gold-glow);
}

.ai-input-prefix {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  color: var(--gold-primary);
  opacity: 0.6;
  flex-shrink: 0;
}

.ai-input-field {
  flex: 1;
  background: transparent;
  border: none;
  padding: 10px 0;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.ai-input-field::placeholder {
  color: var(--text-muted);
}

.ai-send-btn {
  padding: 10px 20px;
  border-radius: 2px;
  background: var(--ai-gold-bg);
  color: var(--gold-primary);
  border: 1px solid var(--ai-gold-border);
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    box-shadow var(--transition-fast);
  flex-shrink: 0;
}

.ai-send-btn:hover:not(:disabled) {
  background: var(--ai-gold-bg);
  box-shadow: 0 0 12px var(--ai-gold-glow);
  filter: brightness(1.1);
}

.ai-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Transitions */
.ai-overlay-enter-active,
.ai-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.ai-overlay-enter-active .ai-panel,
.ai-overlay-leave-active .ai-panel {
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
}

.ai-overlay-enter-from,
.ai-overlay-leave-to {
  opacity: 0;
}

.ai-overlay-enter-from .ai-panel,
.ai-overlay-leave-to .ai-panel {
  transform: scale(0.96) translateY(16px);
  opacity: 0;
}

/* Mobile */
@media (max-width: 768px) {
  .ai-overlay {
    padding: 0;
  }

  .ai-panel {
    max-width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
    border-top: none;
  }

  .ai-corner {
    display: none;
  }

  .ai-panel-body {
    flex-direction: column;
  }

  .ai-sidebar {
    width: 100%;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--ai-panel-divider);
  }

  .ai-sidebar-toggle {
    display: flex;
  }

  .ai-context-content {
    max-height: 120px;
    flex: none;
  }

  .ai-messages {
    padding: 16px;
  }

  .ai-msg-body {
    max-width: 88%;
  }

  .ai-input-area {
    padding: 12px 16px;
  }

  .ai-send-btn {
    padding: 10px 14px;
  }

  .ai-overlay-enter-from .ai-panel,
  .ai-overlay-leave-to .ai-panel {
    transform: translateY(100%);
    opacity: 1;
  }
}
</style>

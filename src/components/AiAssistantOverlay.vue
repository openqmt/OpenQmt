<template>
  <Teleport to="body">
    <Transition name="ai-overlay">
      <div v-if="show" class="ai-overlay" @click.self="close">
        <div class="ai-panel">
          <!-- Header -->
          <div class="ai-panel-header">
            <div class="ai-panel-title">
              <span class="ai-panel-icon">✨</span>
              <span>AI 页面助手</span>
              <n-tag
                size="small"
                :bordered="false"
                type="warning"
                class="ai-page-tag"
              >
                {{ pageTitle }}
              </n-tag>
            </div>
            <button class="ai-close-btn" @click="close">
              <n-icon size="18"><CloseOutline /></n-icon>
            </button>
          </div>

          <!-- Page Context Summary -->
          <div class="ai-context-section" v-if="pageContextText">
            <div class="ai-context-label">页面数据摘要</div>
            <div class="ai-context-content">{{ pageContextText }}</div>
          </div>

          <!-- Chat Messages -->
          <div class="ai-messages" ref="messagesRef">
            <div
              v-if="messages.length === 0 && !isAnalyzing"
              class="ai-welcome"
            >
              <p class="ai-welcome-text">
                点击下方按钮，AI 将自动分析当前页面数据并给出总结
              </p>
              <button
                class="ai-analyze-btn"
                @click="analyzePage"
                :disabled="isAnalyzing"
              >
                🔍 分析当前页面
              </button>
            </div>

            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="[
                'ai-msg',
                msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-ai',
              ]"
            >
              <div class="ai-msg-avatar">
                {{ msg.role === "user" ? "👤" : "🤖" }}
              </div>
              <div class="ai-msg-body">
                <div
                  class="ai-msg-text markdown-body"
                  v-html="renderMarkdown(msg.content)"
                ></div>
              </div>
            </div>

            <div
              v-if="
                isAnalyzing &&
                (messages.length === 0 ||
                  messages[messages.length - 1].content === '')
              "
              class="ai-msg ai-msg-ai"
            >
              <div class="ai-msg-avatar">🤖</div>
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
              <input
                v-model="inputText"
                type="text"
                class="ai-input-field"
                placeholder="输入问题，如：当前行情如何？..."
                @keydown.enter.exact="handleSend"
              />
              <button
                class="ai-send-btn"
                @click="handleSend"
                :disabled="!inputText.trim() || isAnalyzing"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useMessage } from "naive-ui";
import { NTag, NIcon } from "naive-ui";
import { CloseOutline } from "@vicons/ionicons5";
import { httpFetch } from "../utils/http";
import type { AiMessage } from "../types";
import { useSettingsStore } from "../stores/settings";
import { usePageContext } from "../composables/usePageContext";
import { useAiModelSelection } from "../composables/useAiModelSelection";
import { renderMarkdown } from "../utils/markdown";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: "update:show", val: boolean): void }>();

const settingsStore = useSettingsStore();
const { selectedProvider, selectedModel } = useAiModelSelection();
const { pageTitle, pageContextText } = usePageContext();
const message = useMessage();

const messages = ref<AiMessage[]>([]);
const inputText = ref("");
const isAnalyzing = ref(false);
const messagesRef = ref<HTMLElement | null>(null);

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function close() {
  emit("update:show", false);
}

function scrollToBottom(): void {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

// Clear messages when overlay opens
watch(
  () => props.show,
  (val) => {
    if (val) {
      messages.value = [];
      inputText.value = "";
    }
  },
);

async function analyzePage(): Promise<void> {
  const context = pageContextText.value;
  if (!context) return;

  // Check API Key
  const config = settingsStore.model.providers[selectedProvider.value];
  if (!config || !config.apiKey) {
    message.error("请先在系统设置中配置 API Key");
    return;
  }

  const userMessage: AiMessage = {
    id: genId(),
    role: "user",
    content: `请分析以下页面数据并给出总结：\n\n${context}`,
    timestamp: Date.now(),
  };
  messages.value.push(userMessage);

  isAnalyzing.value = true;
  const aiMessageId = genId();
  messages.value.push({
    id: aiMessageId,
    role: "assistant",
    content: "",
    timestamp: Date.now(),
  });
  scrollToBottom();

  try {
    await callAIStream(
      `请分析以下页面数据并给出总结。要求简洁专业，包含关键数据解读和趋势判断：\n\n${context}`,
      aiMessageId,
    );
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

async function handleSend(): Promise<void> {
  const text = inputText.value.trim();
  if (!text || isAnalyzing.value) return;

  // Check API Key
  const config = settingsStore.model.providers[selectedProvider.value];
  if (!config || !config.apiKey) {
    message.error("请先在系统设置中配置 API Key");
    return;
  }

  const userMessage: AiMessage = {
    id: genId(),
    role: "user",
    content: text,
    timestamp: Date.now(),
  };
  messages.value.push(userMessage);
  inputText.value = "";
  scrollToBottom();

  isAnalyzing.value = true;
  const aiMessageId = genId();
  messages.value.push({
    id: aiMessageId,
    role: "assistant",
    content: "",
    timestamp: Date.now(),
  });

  // Include page context + conversation history for follow-up questions
  const contextPrefix =
    messages.value.length <= 3
      ? `当前页面数据：\n${pageContextText.value}\n\n用户问题：${text}`
      : text;

  try {
    await callAIStream(contextPrefix, aiMessageId);
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
  if (msg) {
    msg.content = content;
  }
}

async function callAIStream(
  userMessage: string,
  messageId: string,
): Promise<void> {
  const config = settingsStore.model.providers[selectedProvider.value];
  if (!config) throw new Error("模型配置不存在");

  const baseUrl = config.baseUrl;
  const apiKey = config.apiKey;
  const model = selectedModel.value;
  const url = `${baseUrl}/chat/completions`;

  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content: settingsStore.model.systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  };

  const response = await httpFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

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
.ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.ai-panel {
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.ai-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-panel-icon {
  font-size: 18px;
}

.ai-page-tag {
  font-size: 11px !important;
}

.ai-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--surface-muted);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
}

.ai-close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

/* Context Section */
.ai-context-section {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-muted);
  flex-shrink: 0;
  max-height: 120px;
  overflow-y: auto;
}

.ai-context-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gold-primary);
  letter-spacing: 0.04em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.ai-context-content {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Messages */
.ai-messages {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 0;
}

.ai-welcome {
  text-align: center;
  padding: 24px 8px;
}

.ai-welcome-text {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.ai-analyze-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: var(--gold-primary);
  color: #fff;
  border: none;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.ai-analyze-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.ai-analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Message Bubbles */
.ai-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: flex-start;
}

.ai-msg-user {
  flex-direction: row-reverse;
}

.ai-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
  background: var(--surface-muted);
}

.ai-msg-user .ai-msg-avatar {
  background: rgba(212, 168, 67, 0.12);
}

.ai-msg-body {
  max-width: 80%;
  min-width: 0;
}

.ai-msg-user .ai-msg-body {
  background: rgba(212, 168, 67, 0.1);
  border: 1px solid rgba(212, 168, 67, 0.15);
  border-radius: var(--radius-lg) var(--radius-sm) var(--radius-lg)
    var(--radius-lg);
  padding: 10px 14px;
}

.ai-msg-ai .ai-msg-body {
  background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm) var(--radius-lg) var(--radius-lg)
    var(--radius-lg);
  padding: 10px 14px;
}

.ai-msg-text {
  font-size: 13px;
}

.ai-loading {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 5px;
  height: 5px;
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
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-muted);
}

.ai-input-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ai-input-field {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 9px 14px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.ai-input-field:focus {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 3px rgba(212, 168, 67, 0.08);
}

.ai-input-field::placeholder {
  color: var(--text-muted);
}

.ai-send-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--gold-primary);
  color: #fff;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: opacity var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.ai-send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Transitions */
.ai-overlay-enter-active,
.ai-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.ai-overlay-enter-active .ai-panel,
.ai-overlay-leave-active .ai-panel {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.ai-overlay-enter-from,
.ai-overlay-leave-to {
  opacity: 0;
}

.ai-overlay-enter-from .ai-panel,
.ai-overlay-leave-to .ai-panel {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* Mobile */
@media (max-width: 768px) {
  .ai-overlay {
    padding: 16px;
    align-items: flex-end;
  }

  .ai-panel {
    max-height: 85vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .ai-overlay-enter-from .ai-panel,
  .ai-overlay-leave-to .ai-panel {
    transform: translateY(20px);
    opacity: 0;
  }

  .ai-msg-body {
    max-width: 88%;
  }
}
</style>

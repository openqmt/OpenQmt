<template>
  <n-modal
    :show="show"
    :mask-closable="true"
    :close-on-esc="true"
    @update:show="$emit('update:show', $event)"
  >
    <div class="auth-dialog">
      <div class="auth-header">
        <div class="auth-logo">
          <span class="auth-logo-letter">Q</span>
        </div>
        <h2 class="auth-title">OpenQmt</h2>
        <p class="auth-subtitle">登录以解锁全部功能</p>
      </div>

      <n-tabs v-model:value="activeTab" type="segment" animated class="auth-tabs">
        <!-- 邮箱登录 -->
        <n-tab-pane name="login" tab="邮箱登录">
          <n-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="auth-form">
            <n-form-item path="email" label="邮箱">
              <n-input
                v-model:value="loginForm.email"
                placeholder="请输入邮箱"
                size="large"
                :input-props="{ autocomplete: 'email' }"
              >
                <template #prefix>
                  <n-icon :component="MailOutline" />
                </template>
              </n-input>
            </n-form-item>
            <n-form-item path="password" label="密码">
              <n-input
                v-model:value="loginForm.password"
                type="password"
                show-password-on="click"
                placeholder="请输入密码"
                size="large"
                :input-props="{ autocomplete: 'current-password' }"
              >
                <template #prefix>
                  <n-icon :component="LockClosedOutline" />
                </template>
              </n-input>
            </n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="authStore.loading"
              @click="handleLogin"
              class="auth-submit-btn"
            >
              登录
            </n-button>
          </n-form>
        </n-tab-pane>

        <!-- 邮箱注册 -->
        <n-tab-pane name="register" tab="邮箱注册">
          <n-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="auth-form">
            <n-form-item path="email" label="邮箱">
              <n-input
                v-model:value="registerForm.email"
                placeholder="请输入邮箱"
                size="large"
                :input-props="{ autocomplete: 'email' }"
              >
                <template #prefix>
                  <n-icon :component="MailOutline" />
                </template>
              </n-input>
            </n-form-item>
            <n-form-item path="password" label="密码">
              <n-input
                v-model:value="registerForm.password"
                type="password"
                show-password-on="click"
                placeholder="至少6位密码"
                size="large"
                :input-props="{ autocomplete: 'new-password' }"
              >
                <template #prefix>
                  <n-icon :component="LockClosedOutline" />
                </template>
              </n-input>
            </n-form-item>
            <n-form-item path="confirmPassword" label="确认密码">
              <n-input
                v-model:value="registerForm.confirmPassword"
                type="password"
                show-password-on="click"
                placeholder="再次输入密码"
                size="large"
                :input-props="{ autocomplete: 'new-password' }"
              >
                <template #prefix>
                  <n-icon :component="LockClosedOutline" />
                </template>
              </n-input>
            </n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="authStore.loading"
              @click="handleRegister"
              class="auth-submit-btn"
            >
              注册
            </n-button>
          </n-form>
        </n-tab-pane>

        <!-- GitHub 登录 -->
        <n-tab-pane name="github" tab="GitHub">
          <div class="github-flow" v-if="!githubStep">
            <div class="github-icon-area">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" class="github-svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <p class="github-desc">使用 GitHub 账号登录 OpenQmt</p>
            <n-button
              type="primary"
              block
              size="large"
              :loading="githubLoading"
              @click="handleGithubStart"
              class="auth-submit-btn github-btn"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </template>
              GitHub 登录
            </n-button>
          </div>

          <div class="github-flow" v-else>
            <div class="github-step-info">
              <n-icon size="28" color="var(--gold-primary)"><InformationCircleOutline /></n-icon>
              <p class="github-step-title">请在 GitHub 上授权</p>
            </div>

            <div class="github-code-area">
              <span class="github-code-label">验证码</span>
              <div class="github-code-value">
                <span class="github-user-code">{{ githubUserCode }}</span>
                <n-button text size="small" @click="copyUserCode" class="copy-btn">
                  <n-icon size="16"><CopyOutline /></n-icon>
                </n-button>
              </div>
            </div>

            <p class="github-hint">
              1. 打开 <a href="#" @click.prevent="openGithubVerify" class="github-link">{{ githubVerifyUrl }}</a><br/>
              2. 输入上方验证码<br/>
              3. 授权后自动完成登录
            </p>

            <div class="github-polling" v-if="githubPolling">
              <n-spin size="small" />
              <span>等待授权中...</span>
            </div>
            <div class="github-polling github-success" v-else-if="githubDone">
              <n-icon size="20" color="#22c55e"><CheckmarkCircleOutline /></n-icon>
              <span>授权成功!</span>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>

      <div class="auth-footer">
        <span>未登录也可浏览行情数据</span>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import {
  NModal, NTabs, NTabPane, NForm, NFormItem, NInput, NButton, NIcon, NSpin,
  useMessage,
} from "naive-ui";
import { MailOutline, LockClosedOutline, InformationCircleOutline, CopyOutline, CheckmarkCircleOutline } from "@vicons/ionicons5";
import { useAuthStore } from "../stores/auth";
import type { FormInst, FormRules } from "naive-ui";
import { openUrl } from "@tauri-apps/plugin-opener";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ "update:show": [value: boolean] }>();

const authStore = useAuthStore();
const message = useMessage();

const activeTab = ref("login");

// ── Login Form ──
const loginFormRef = ref<FormInst | null>(null);
const loginForm = reactive({ email: "", password: "" });
const loginRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

async function handleLogin() {
  try {
    await loginFormRef.value?.validate();
  } catch {
    return;
  }
  const result = await authStore.login(loginForm.email, loginForm.password);
  if (result.success) {
    message.success("登录成功");
    emit("update:show", false);
    resetForms();
  } else {
    message.error(result.message);
  }
}

// ── Register Form ──
const registerFormRef = ref<FormInst | null>(null);
const registerForm = reactive({ email: "", password: "", confirmPassword: "" });
const registerRules: FormRules = {
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (_rule, value) => {
        return value === registerForm.password;
      },
      message: "两次密码不一致",
      trigger: "blur",
    },
  ],
};

async function handleRegister() {
  try {
    await registerFormRef.value?.validate();
  } catch {
    return;
  }
  const result = await authStore.register(registerForm.email, registerForm.password);
  if (result.success) {
    message.success("注册成功");
    emit("update:show", false);
    resetForms();
  } else {
    message.error(result.message);
  }
}

// ── GitHub Device Flow ──
const githubLoading = ref(false);
const githubStep = ref(false);
const githubUserCode = ref("");
const githubVerifyUrl = ref("https://github.com/login/device");
const githubDeviceCode = ref("");
const githubPolling = ref(false);
const githubDone = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function handleGithubStart() {
  githubLoading.value = true;
  const result = await authStore.githubStartDeviceFlow();
  githubLoading.value = false;

  if (!result) {
    message.error("无法连接 GitHub，请检查网络");
    return;
  }

  githubUserCode.value = result.user_code;
  githubVerifyUrl.value = result.verification_uri;
  githubDeviceCode.value = result.device_code;
  githubStep.value = true;
  githubPolling.value = true;
  githubDone.value = false;

  // start polling
  const interval = result.interval * 1000;
  pollTimer = setInterval(async () => {
    const pollResult = await authStore.githubPollToken(githubDeviceCode.value);
    if (pollResult.success) {
      stopPolling();
      githubDone.value = true;
      githubPolling.value = false;
      message.success("GitHub 登录成功");
      setTimeout(() => {
        emit("update:show", false);
        resetGithub();
      }, 1000);
    } else if (pollResult.error && pollResult.error !== "authorization_pending" && pollResult.error !== "slow_down") {
      stopPolling();
      githubPolling.value = false;
      if (pollResult.error === "expired_token") {
        message.error("验证码已过期，请重试");
        resetGithub();
      }
    }
  }, interval);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function resetGithub() {
  githubStep.value = false;
  githubUserCode.value = "";
  githubDeviceCode.value = "";
  githubPolling.value = false;
  githubDone.value = false;
}

function copyUserCode() {
  navigator.clipboard.writeText(githubUserCode.value);
  message.success("验证码已复制");
}

async function openGithubVerify() {
  try {
    await openUrl(githubVerifyUrl.value);
  } catch {
    // fallback
    window.open(githubVerifyUrl.value, "_blank");
  }
}

// ── Helpers ──
function resetForms() {
  loginForm.email = "";
  loginForm.password = "";
  registerForm.email = "";
  registerForm.password = "";
  registerForm.confirmPassword = "";
  activeTab.value = "login";
  stopPolling();
  resetGithub();
}
</script>

<style scoped>
.auth-dialog {
  width: 420px;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 32px 36px 24px;
  box-shadow: var(--shadow-card), var(--shadow-glow-gold);
  border: 1px solid var(--border-accent);
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 4px 16px rgba(212, 168, 67, 0.3);
}

.auth-logo-letter {
  font-size: 28px;
  font-weight: 700;
  color: #0a0e1a;
  font-family: 'Inter', sans-serif;
}

.auth-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.auth-tabs {
  margin-bottom: 8px;
}

.auth-form {
  padding: 16px 0 0;
}

.auth-submit-btn {
  margin-top: 8px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--gold-primary), var(--gold-dark)) !important;
  border: none !important;
}

.auth-submit-btn:hover {
  opacity: 0.9;
}

.github-btn {
  background: #24292e !important;
}

.github-btn:hover {
  background: #2f363d !important;
}

/* GitHub Flow */
.github-flow {
  padding: 24px 0;
  text-align: center;
}

.github-icon-area {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.github-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.github-step-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.github-step-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.github-code-area {
  background: var(--bg-primary);
  border: 1px solid var(--border-accent);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.github-code-label {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 6px;
}

.github-code-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.github-user-code {
  font-size: 28px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--gold-primary);
  letter-spacing: 4px;
}

.copy-btn {
  color: var(--text-muted) !important;
}

.copy-btn:hover {
  color: var(--gold-primary) !important;
}

.github-hint {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  text-align: left;
  padding: 0 8px;
  margin-bottom: 16px;
}

.github-link {
  color: var(--gold-primary);
  text-decoration: none;
}

.github-link:hover {
  text-decoration: underline;
}

.github-polling {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.github-success {
  color: #22c55e !important;
}

.auth-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  color: var(--text-muted);
}
</style>
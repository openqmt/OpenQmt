import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import type { UserInfo, AuthResult, GithubDeviceCode, GithubTokenResult } from "../types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserInfo | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const pendingAuthRoute = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && !!token.value);

  /** 邮箱登录 */
  async function login(email: string, password: string): Promise<AuthResult> {
    loading.value = true;
    try {
      const result = await invoke<AuthResult>("auth_login", { email, password });
      if (result.success && result.user && result.token) {
        user.value = result.user;
        token.value = result.token;
        localStorage.setItem("auth_token", result.token);
      }
      return result;
    } catch (e: any) {
      return { success: false, message: e?.toString() || "登录失败", user: null, token: null };
    } finally {
      loading.value = false;
    }
  }

  /** 邮箱注册 */
  async function register(email: string, password: string): Promise<AuthResult> {
    loading.value = true;
    try {
      const result = await invoke<AuthResult>("auth_register", { email, password });
      if (result.success && result.user && result.token) {
        user.value = result.user;
        token.value = result.token;
        localStorage.setItem("auth_token", result.token);
      }
      return result;
    } catch (e: any) {
      return { success: false, message: e?.toString() || "注册失败", user: null, token: null };
    } finally {
      loading.value = false;
    }
  }

  /** 退出登录 */
  async function logout() {
    try {
      await invoke<AuthResult>("auth_logout");
    } catch {
      // ignore
    }
    user.value = null;
    token.value = null;
    localStorage.removeItem("auth_token");
  }

  /** 恢复会话（应用启动时调用） */
  async function checkAuth() {
    const savedToken = localStorage.getItem("auth_token");
    if (!savedToken) return;

    try {
      const result = await invoke<AuthResult>("auth_restore_session", { token: savedToken });
      if (result.success && result.user && result.token) {
        user.value = result.user;
        token.value = result.token;
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch {
      localStorage.removeItem("auth_token");
    }
  }

  /** GitHub Device Flow — 获取设备码 */
  async function githubStartDeviceFlow(): Promise<GithubDeviceCode | null> {
    try {
      return await invoke<GithubDeviceCode>("github_start_device_flow");
    } catch {
      return null;
    }
  }

  /** GitHub Device Flow — 轮询 token */
  async function githubPollToken(deviceCode: string): Promise<GithubTokenResult> {
    try {
      const result = await invoke<GithubTokenResult>("github_poll_token", { deviceCode });
      if (result.success && result.access_token) {
        token.value = result.access_token;
        localStorage.setItem("auth_token", result.access_token);
        // fetch current user info
        const authResult = await invoke<AuthResult>("auth_get_current_user");
        if (authResult.success && authResult.user) {
          user.value = authResult.user;
        }
      }
      return result;
    } catch (e: any) {
      return { success: false, access_token: null, error: e?.toString() || "GitHub登录失败" };
    }
  }

  return {
    user,
    token,
    loading,
    pendingAuthRoute,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    githubStartDeviceFlow,
    githubPollToken,
  };
});
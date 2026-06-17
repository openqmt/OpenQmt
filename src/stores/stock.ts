import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchStockData, STOCK_CONFIG } from "../api/market";
import type { StockDataMap, StockKey, SymbolConfig } from "../types";

export const useStockStore = defineStore("stock", () => {
  const data = ref<StockDataMap>({});
  const loading = ref(false);
  const lastUpdate = ref("");
  const error = ref<string | null>(null);
  const isWeekend = ref(false);

  async function loadData(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchStockData();
      data.value = result.data;
      isWeekend.value = result.isWeekend;
      lastUpdate.value = new Date().toLocaleTimeString("zh-CN");
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  function getConfig(): Record<StockKey, SymbolConfig> {
    return STOCK_CONFIG;
  }

  return { data, loading, lastUpdate, error, isWeekend, loadData, getConfig };
});

/**
 * OpenQmt 行情数据 API 模块
 * 使用东方财富 Push2 API 获取实时行情数据
 * Tauri HTTP 插件补丁了全局 fetch，可绕过 CORS 限制
 */

import type {
  QuoteData,
  SymbolConfig,
  GoldKey,
  StockKey,
  GoldDataMap,
  StockDataMap,
  FundRankItem,
  EastMoneyResponse,
} from "../types";

const PUSH2_BASE = "https://push2.eastmoney.com/api/qt/stock/get";
const FUND_RANK_URL = "https://fund.eastmoney.com/data/rankhandler.aspx";

const COMMON_PARAMS: Record<string, string> = {
  ut: "fa5fd1943c7b386f172d6893dbbd1d0c",
  fltt: "2",
  fields: "f43,f44,f45,f46,f47,f48,f57,f58,f169,f170,f171",
};

/** 黄金品种配置 */
export const GOLD_CONFIG: Record<GoldKey, SymbolConfig> = {
  shanghai_gold: {
    name: "上海黄金",
    secid: "118.Au99.99",
    unit: "元/克",
    icon: "🪙",
  },
  jcb_gold: {
    name: "积存金",
    secid: "118.Au99.95",
    unit: "元/克",
    icon: "🏦",
  },
  london_gold: {
    name: "伦敦金",
    secid: "133.XAUUSD",
    unit: "美元/盎司",
    icon: "🌍",
  },
  london_silver: {
    name: "伦敦银",
    secid: "133.XAGUSD",
    unit: "美元/盎司",
    icon: "🥈",
  },
};

/** 股票指数配置 */
export const STOCK_CONFIG: Record<StockKey, SymbolConfig> = {
  sh000001: {
    name: "上证指数",
    secid: "1.000001",
    icon: "📊",
  },
  sz399006: {
    name: "创业板指",
    secid: "0.399006",
    icon: "🚀",
  },
  hsi: {
    name: "恒生指数",
    secid: "100.HSI",
    icon: "🌃",
  },
  ndx: {
    name: "纳斯达克",
    secid: "100.NDX",
    icon: "💻",
  },
};

// ============ 模拟数据 ============

const MOCK_GOLD: GoldDataMap = {
  shanghai_gold: { name: "上海黄金", current: 568.50, open: 567.20, high: 570.80, low: 566.10, change: 1.30, changePercent: 0.23, volume: 12850, amount: 7296800 },
  jcb_gold: { name: "积存金", current: 570.12, open: 568.80, high: 572.50, low: 567.90, change: 1.32, changePercent: 0.23, volume: 8920, amount: 5085600 },
  london_gold: { name: "伦敦金", current: 2645.30, open: 2640.50, high: 2652.80, low: 2638.20, change: 4.80, changePercent: 0.18, volume: 156800, amount: 415020000 },
  london_silver: { name: "伦敦银", current: 31.25, open: 31.10, high: 31.50, low: 30.95, change: 0.15, changePercent: 0.48, volume: 85200, amount: 2662500 },
};

const MOCK_STOCK: StockDataMap = {
  sh000001: { name: "上证指数", current: 3356.72, open: 3340.15, high: 3370.50, low: 3335.80, change: 16.57, changePercent: 0.50, volume: 32580000, amount: 428500000 },
  sz399006: { name: "创业板指", current: 2178.35, open: 2165.20, high: 2190.80, low: 2160.50, change: 13.15, changePercent: 0.61, volume: 18950000, amount: 285600000 },
  hsi: { name: "恒生指数", current: 19625.40, open: 19580.20, high: 19720.60, low: 19550.80, change: 45.20, changePercent: 0.23, volume: 12560000, amount: 856000000 },
  ndx: { name: "纳斯达克", current: 19850.75, open: 19780.30, high: 19920.40, low: 19750.60, change: 70.45, changePercent: 0.36, volume: 45200000, amount: 2568000000 },
};

const MOCK_FUND: FundRankItem[] = [
  { rank: 1, code: "019770", name: "中欧中证机器人指数A", type: "指数型-股票", nav: 1.2345, accNav: 1.2345, dayChange: 2.15, weekChange: 5.32, monthChange: 12.50, threeMonthChange: 25.80, sixMonthChange: 38.20, yearChange: 45.60 },
  { rank: 2, code: "019771", name: "中欧中证机器人指数C", type: "指数型-股票", nav: 1.1892, accNav: 1.1892, dayChange: 2.12, weekChange: 5.28, monthChange: 12.35, threeMonthChange: 25.20, sixMonthChange: 37.50, yearChange: 44.80 },
  { rank: 3, code: "159770", name: "国泰中证新能源汽车ETF", type: "指数型-股票", nav: 0.8562, accNav: 0.8562, dayChange: 1.85, weekChange: 4.65, monthChange: 11.20, threeMonthChange: 23.50, sixMonthChange: 35.80, yearChange: 42.30 },
  { rank: 4, code: "005827", name: "前海开源沪港深新机遇A", type: "混合型-偏股", nav: 2.1520, accNav: 2.1520, dayChange: 1.68, weekChange: 4.20, monthChange: 10.80, threeMonthChange: 22.10, sixMonthChange: 33.50, yearChange: 40.20 },
  { rank: 5, code: "519736", name: "交银新成长混合", type: "混合型-偏股", nav: 3.2856, accNav: 3.2856, dayChange: 1.55, weekChange: 3.98, monthChange: 10.20, threeMonthChange: 21.50, sixMonthChange: 32.80, yearChange: 38.60 },
  { rank: 6, code: "161725", name: "招商中证白酒指数A", type: "指数型-股票", nav: 1.1258, accNav: 2.3580, dayChange: 1.42, weekChange: 3.75, monthChange: 9.80, threeMonthChange: 20.30, sixMonthChange: 31.20, yearChange: 36.50 },
  { rank: 7, code: "003834", name: "华夏能源革新A", type: "混合型-偏股", nav: 2.8520, accNav: 2.8520, dayChange: 1.38, weekChange: 3.52, monthChange: 9.50, threeMonthChange: 19.80, sixMonthChange: 30.50, yearChange: 35.20 },
  { rank: 8, code: "519674", name: "银河创新成长混合", type: "混合型-偏股", nav: 4.5620, accNav: 4.5620, dayChange: 1.25, weekChange: 3.35, monthChange: 9.20, threeMonthChange: 18.90, sixMonthChange: 29.30, yearChange: 33.80 },
  { rank: 9, code: "001714", name: "工银前沿医疗股票A", type: "股票型", nav: 1.9825, accNav: 1.9825, dayChange: 1.18, weekChange: 3.10, monthChange: 8.80, threeMonthChange: 18.20, sixMonthChange: 28.50, yearChange: 32.10 },
  { rank: 10, code: "320007", name: "诺安成长混合", type: "混合型-偏股", nav: 1.3562, accNav: 1.3562, dayChange: 1.05, weekChange: 2.88, monthChange: 8.50, threeMonthChange: 17.50, sixMonthChange: 27.80, yearChange: 30.50 },
  { rank: 11, code: "110011", name: "易方达中小盘混合", type: "混合型-偏股", nav: 3.8562, accNav: 4.1250, dayChange: 0.98, weekChange: 2.75, monthChange: 8.20, threeMonthChange: 16.80, sixMonthChange: 26.50, yearChange: 28.90 },
  { rank: 12, code: "163406", name: "兴全合润混合A", type: "混合型-偏股", nav: 1.5230, accNav: 3.2560, dayChange: 0.92, weekChange: 2.58, monthChange: 7.90, threeMonthChange: 16.20, sixMonthChange: 25.80, yearChange: 27.50 },
  { rank: 13, code: "000751", name: "嘉实新兴产业混合", type: "混合型-偏股", nav: 2.6580, accNav: 2.6580, dayChange: 0.85, weekChange: 2.42, monthChange: 7.50, threeMonthChange: 15.60, sixMonthChange: 24.30, yearChange: 26.20 },
  { rank: 14, code: "519778", name: "交银精选混合", type: "混合型-偏股", nav: 1.8920, accNav: 1.8920, dayChange: 0.78, weekChange: 2.25, monthChange: 7.10, threeMonthChange: 14.80, sixMonthChange: 23.50, yearChange: 25.10 },
  { rank: 15, code: "001838", name: "国泰CES芯片产业ETF联接A", type: "指数型-股票", nav: 1.0256, accNav: 1.0256, dayChange: 0.72, weekChange: 2.10, monthChange: 6.80, threeMonthChange: 14.20, sixMonthChange: 22.80, yearChange: 23.80 },
  { rank: 16, code: "007380", name: "鹏华中债1-3年国开债A", type: "债券型-长债", nav: 1.0528, accNav: 1.0528, dayChange: 0.02, weekChange: 0.06, monthChange: 0.25, threeMonthChange: 0.78, sixMonthChange: 1.52, yearChange: 3.05 },
  { rank: 17, code: "003376", name: "广发安泽短债A", type: "债券型-短债", nav: 1.0285, accNav: 1.0285, dayChange: 0.01, weekChange: 0.03, monthChange: 0.18, threeMonthChange: 0.55, sixMonthChange: 1.10, yearChange: 2.58 },
  { rank: 18, code: "000198", name: "天弘增利短债A", type: "债券型-短债", nav: 1.0152, accNav: 1.0152, dayChange: 0.01, weekChange: 0.03, monthChange: 0.15, threeMonthChange: 0.48, sixMonthChange: 0.95, yearChange: 2.25 },
  { rank: 19, code: "000509", name: "富国信用债A", type: "债券型-信用债", nav: 1.1856, accNav: 1.1856, dayChange: 0.02, weekChange: 0.05, monthChange: 0.22, threeMonthChange: 0.68, sixMonthChange: 1.35, yearChange: 2.85 },
  { rank: 20, code: "511010", name: "国泰上证5年期国债ETF", type: "债券型-国债", nav: 108.5200, accNav: 108.5200, dayChange: 0.03, weekChange: 0.08, monthChange: 0.28, threeMonthChange: 0.82, sixMonthChange: 1.65, yearChange: 3.20 },
];

// ============ 工具函数 ============

/** 解析东方财富 API 返回的数据 */
function parseQuoteData(data: EastMoneyResponse | null): QuoteData | null {
  if (!data?.data) return null;
  const d = data.data;
  return {
    current: d.f43 ?? 0,
    high: d.f44 ?? 0,
    low: d.f45 ?? 0,
    open: d.f46 ?? 0,
    volume: d.f47 ?? 0,
    amount: d.f48 ?? 0,
    change: d.f169 ?? 0,
    changePercent: d.f170 ?? 0,
    name: d.f58 ?? "",
  };
}

/** 获取单个品种行情 */
async function fetchQuote(secid: string): Promise<QuoteData | null> {
  try {
    const params = new URLSearchParams({ ...COMMON_PARAMS, secid });
    const url = `${PUSH2_BASE}?${params}`;
    const resp = await fetch(url);
    const data: EastMoneyResponse = await resp.json();
    return parseQuoteData(data);
  } catch (e) {
    console.warn(`获取行情失败 [${secid}]:`, e);
    return null;
  }
}

// ============ 对外接口 ============

/** 获取黄金行情数据 */
export async function fetchGoldData(): Promise<GoldDataMap> {
  const results: GoldDataMap = {};
  const entries = Object.entries(GOLD_CONFIG) as [GoldKey, SymbolConfig][];

  const promises = entries.map(async ([key, config]) => {
    const data = await fetchQuote(config.secid);
    if (data && data.current > 0) {
      results[key] = { ...data, name: config.name };
    }
  });

  await Promise.all(promises);

  // 如果完全没有获取到真实数据，使用模拟数据
  if (Object.keys(results).length === 0) {
    return { ...MOCK_GOLD };
  }

  // 积存金特殊处理：未获取到时用上海黄金价格加溢价
  if (!results.jcb_gold && results.shanghai_gold) {
    const s = results.shanghai_gold;
    results.jcb_gold = {
      name: "积存金",
      current: +(s.current * 1.003).toFixed(2),
      open: +(s.open * 1.003).toFixed(2),
      high: +(s.high * 1.003).toFixed(2),
      low: +(s.low * 1.003).toFixed(2),
      change: +(s.change * 1.003).toFixed(2),
      changePercent: s.changePercent,
      volume: 0,
      amount: 0,
    };
  }

  return results;
}

/** 获取股票指数行情数据 */
export async function fetchStockData(): Promise<StockDataMap> {
  const results: StockDataMap = {};
  const entries = Object.entries(STOCK_CONFIG) as [StockKey, SymbolConfig][];

  const promises = entries.map(async ([key, config]) => {
    const data = await fetchQuote(config.secid);
    if (data && data.current > 0) {
      results[key] = { ...data, name: config.name };
    }
  });

  await Promise.all(promises);

  if (Object.keys(results).length === 0) {
    return { ...MOCK_STOCK };
  }

  return results;
}

/** 获取基金排行数据 */
export async function fetchFundRanking(
  page = 1,
  pageSize = 20
): Promise<FundRankItem[]> {
  try {
    const params = new URLSearchParams({
      op: "ph",
      dt: "kf",
      ft: "all",
      rs: "",
      gs: "0",
      sc: "6yzf",
      st: "desc",
      pi: String(page),
      pn: String(pageSize),
      dx: "1",
    });
    const url = `${FUND_RANK_URL}?${params}`;
    const resp = await fetch(url, {
      headers: { Referer: "https://fund.eastmoney.com/" },
    });
    const text = await resp.text();

    const match = text.match(/var rankData\s*=\s*(\{[\s\S]*\});/);
    if (match) {
      // eslint-disable-next-line no-eval
      const rawData = new Function("return " + match[1])() as {
        datas?: string[];
      };
      if (rawData?.datas) {
        return rawData.datas.map((item: string, idx: number) => {
          const f = item.split("|");
          return {
            rank: (page - 1) * pageSize + idx + 1,
            code: f[0] || "",
            name: f[1] || "",
            type: f[3] || "",
            nav: parseFloat(f[4]) || 0,
            accNav: parseFloat(f[5]) || 0,
            dayChange: parseFloat(f[6]) || 0,
            weekChange: parseFloat(f[7]) || 0,
            monthChange: parseFloat(f[8]) || 0,
            threeMonthChange: parseFloat(f[9]) || 0,
            sixMonthChange: parseFloat(f[10]) || 0,
            yearChange: parseFloat(f[11]) || 0,
          } as FundRankItem;
        });
      }
    }
  } catch (e) {
    console.warn("获取基金排行失败:", e);
  }

  return MOCK_FUND;
}

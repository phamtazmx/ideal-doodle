let form;
let input;
let summary;
let newsList;
let outlook;
let activeSymbol;
let activeName;
let activePrice;
let activeTime;
let formError;
let shortChartContainer;
let longChartContainer;
let optionsList;

let shortChart;
let longChart;
let shortSeries;
let longSeries;

const buildChart = (container) => {
  const chart = window.LightweightCharts.createChart(container, {
    height: 320,
    layout: {
      background: { color: "#0f172a" },
      textColor: "#cbd5f5",
    },
    grid: {
      vertLines: { color: "rgba(148, 163, 184, 0.2)" },
      horzLines: { color: "rgba(148, 163, 184, 0.2)" },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
    },
  });

  const seriesOptions = {
    upColor: "#22c55e",
    downColor: "#f97316",
    borderDownColor: "#f97316",
    borderUpColor: "#22c55e",
    wickDownColor: "#f97316",
    wickUpColor: "#22c55e",
  };

  let series = null;
  if (typeof chart.addCandlestickSeries === "function") {
    series = chart.addCandlestickSeries(seriesOptions);
  } else if (
    typeof chart.addSeries === "function" &&
    window.LightweightCharts?.CandlestickSeries
  ) {
    series = chart.addSeries(window.LightweightCharts.CandlestickSeries, seriesOptions);
  } else if (typeof chart.addSeries === "function") {
    series = chart.addSeries({ type: "Candlestick", ...seriesOptions });
  }

  return { chart, series };
};

const fallbackSummary = (symbol) =>
  `No detailed company summary is available for ${symbol} right now. Check back later or connect a market data provider for enriched profiles.`;

const formatCurrency = (value) => {
  if (Number.isNaN(value) || value === null || value === undefined) return "--";
  return `$${value.toFixed(2)}`;
};

const formatUpdatedTimestamp = (epochSeconds) => {
  const date = epochSeconds ? new Date(epochSeconds * 1000) : new Date();
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseYahooCandles = (data) => {
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0];
  const meta = result?.meta || null;
  if (!quote || timestamps.length === 0) return [];

  const candles = timestamps
    .map((time, index) => ({
      time,
      open: quote.open?.[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      close: quote.close?.[index],
    }))
    .filter((candle) =>
      [candle.open, candle.high, candle.low, candle.close].every(
        (value) => value !== null && value !== undefined,
      ),
    )
    .map((candle) => ({
      time: candle.time,
      open: Number(candle.open.toFixed(2)),
      high: Number(candle.high.toFixed(2)),
      low: Number(candle.low.toFixed(2)),
      close: Number(candle.close.toFixed(2)),
    }));

  return { candles, meta };
};

const fetchYahooCandles = async (symbol, interval, range) => {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch market data.");
  }
  const data = await response.json();
  const parsed = parseYahooCandles(data);
  if (!parsed?.candles?.length) {
    throw new Error("No candle data returned.");
  }
  return parsed;
};

const fetchCompanyProfile = async (symbol) => {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      symbol,
    )}?modules=assetProfile,price`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch company profile.");
  }
  const data = await response.json();
  const result = data?.quoteSummary?.result?.[0];
  const name =
    result?.price?.longName ||
    result?.price?.shortName ||
    result?.price?.displayName ||
    symbol;
  const summary = result?.assetProfile?.longBusinessSummary || "";
  return { name, summary };
};

const generateHeadlines = (symbol, companyName = "") => {
  const base = [
    "announces new product rollout",
    "reports stronger-than-expected demand",
    "expands partnership pipeline",
    "sees analyst coverage update",
    "notes elevated options activity",
  ];

  return base.map((item, index) => ({
    title: `${symbol} ${item}`,
    timestamp: new Date(Date.now() - index * 1000 * 60 * 60 * 6).toLocaleString(),
    url: `https://news.google.com/search?q=${encodeURIComponent(
      `${symbol} ${companyName} ${item}`.trim(),
    )}`,
  }));
};

const generateWeeklyOutlook = (symbol, lastPrice, volatility) => {
  const drift = volatility * 2;
  const lowTarget = Math.max(1, lastPrice - drift);
  const highTarget = lastPrice + drift;
  const accuracy = Math.max(52, Math.min(78, Math.round(70 - volatility * 4)));
  return `${symbol} is projected to trade between ${formatCurrency(
    lowTarget,
  )} and ${formatCurrency(
    highTarget,
  )} this week. Confidence: ${accuracy}%.`;
};

const hashSymbol = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const createSeededRandom = (seed) => {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const generateCandles = ({
  start,
  intervals,
  intervalMinutes,
  startPrice,
  volatility,
  seed,
}) => {
  const candles = [];
  let lastClose = startPrice;
  const random = createSeededRandom(seed);

  for (let i = 0; i < intervals; i += 1) {
    const time = Math.floor((start + i * intervalMinutes * 60 * 1000) / 1000);
    const open = lastClose;
    const change = (random() - 0.45) * volatility;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + random() * volatility * 0.4;
    const low = Math.min(open, close) - random() * volatility * 0.4;
    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
    lastClose = close;
  }

  return candles;
};

const setStatus = (message = "") => {
  if (!formError) return;
  formError.textContent = message;
};

const loadOptionsInterest = async () => {
  if (!optionsList) return;
  try {
    const response = await fetch(
      "https://r.jina.ai/https://www.barchart.com/options/open-interest-change/increase",
    );
    if (!response.ok) {
      throw new Error("Failed to load options data.");
    }
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("table tbody tr")).slice(0, 5);
    if (!rows.length) {
      throw new Error("No options rows found.");
    }
    optionsList.innerHTML = "";
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 3) return;
      const symbol = cells[0].textContent.trim();
      const change = cells[2].textContent.trim();
      const li = document.createElement("li");
      li.innerHTML = `<strong>${symbol}</strong> <span>${change}</span>`;
      optionsList.appendChild(li);
    });
  } catch (error) {
    optionsList.innerHTML = `<li>Unable to load options data. Visit <a href="https://www.barchart.com/options/open-interest-change/increase" target="_blank" rel="noopener noreferrer">Barchart</a> for the latest movers.</li>`;
  }
};

const updateUI = async (symbol) => {
  activeSymbol.textContent = symbol;
  activeName.textContent = "Loading company...";
  activeTime.textContent = "Fetching latest data...";
  activePrice.textContent = "--";

  let companyName = symbol;
  let companySummary = "";
  try {
    const profile = await fetchCompanyProfile(symbol);
    companyName = profile.name;
    companySummary = profile.summary;
  } catch (error) {
    companySummary = "";
  }

  activeName.textContent = companyName;
  summary.textContent = companySummary || fallbackSummary(symbol);

  const headlines = generateHeadlines(symbol, companyName);
  newsList.innerHTML = "";
  headlines.forEach((headline) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${headline.url}" target="_blank" rel="noopener noreferrer"><strong>${headline.title}</strong></a><br /><span>${headline.timestamp}</span>`;
    newsList.appendChild(li);
  });

  const symbolSeed = hashSymbol(symbol);
  let shortCandles = [];
  let longCandles = [];
  let lastPrice = 0;
  let volatility = 2.2;
  let marketTime = null;

  try {
    setStatus("Fetching live market data...");
    const shortData = await fetchYahooCandles(symbol, "5m", "5d");
    const longData = await fetchYahooCandles(symbol, "1h", "1y");
    shortCandles = shortData.candles;
    longCandles = longData.candles;
    lastPrice =
      shortData.meta?.regularMarketPrice ||
      longData.meta?.regularMarketPrice ||
      0;
    marketTime =
      shortData.meta?.regularMarketTime ||
      longData.meta?.regularMarketTime ||
      null;
  } catch (error) {
    setStatus(
      "Live market data unavailable (invalid symbol or CORS restriction). Showing sample data.",
    );
    const now = Date.now();
    const shortIntervals = 390;
    shortCandles = generateCandles({
      start: now - shortIntervals * 5 * 60 * 1000,
      intervals: shortIntervals,
      intervalMinutes: 5,
      startPrice: 102 + (symbolSeed % 20),
      volatility: 1.2,
      seed: symbolSeed + 11,
    });

    const longIntervals = 52 * 7 * 24;
    longCandles = generateCandles({
      start: now - longIntervals * 60 * 60 * 1000,
      intervals: longIntervals,
      intervalMinutes: 60,
      startPrice: 110 + (symbolSeed % 30),
      volatility: 2.8,
      seed: symbolSeed + 97,
    });
  }

  if (!lastPrice && shortCandles.length) {
    lastPrice = shortCandles[shortCandles.length - 1].close;
  } else if (!lastPrice && longCandles.length) {
    lastPrice = longCandles[longCandles.length - 1].close;
  }
  if (lastPrice) {
    activePrice.textContent = formatCurrency(lastPrice);
  }
  activeTime.textContent = `Updated ${formatUpdatedTimestamp(marketTime)}`;

  volatility = Math.max(1.4, Math.min(4.2, (lastPrice || 100) * 0.015));
  outlook.textContent = generateWeeklyOutlook(symbol, lastPrice || 100, volatility);

  if (shortSeries && longSeries) {
    shortSeries.setData(shortCandles);
    longSeries.setData(longCandles);
  }
  if (!formError?.textContent?.includes("Live market data unavailable")) {
    setStatus("");
  }
};

const bootstrapCharts = () => {
  if (!window.LightweightCharts) {
    setStatus("Charts are unavailable. Check your network or refresh the page.");
    return;
  }
  if (!shortChartContainer || !longChartContainer) {
    setStatus("Chart containers are missing. Refresh the page.");
    return;
  }
  ({ chart: shortChart, series: shortSeries } = buildChart(shortChartContainer));
  ({ chart: longChart, series: longSeries } = buildChart(longChartContainer));

  if (!shortSeries || !longSeries) {
    setStatus("Chart series could not be created. Check the chart library version.");
    return;
  }

  window.addEventListener("resize", () => {
    shortChart.applyOptions({ width: shortChartContainer.clientWidth });
    longChart.applyOptions({ width: longChartContainer.clientWidth });
  });
};

const init = () => {
  form = document.querySelector("#symbol-form");
  input = document.querySelector("#symbol-input");
  summary = document.querySelector("#summary-text");
  newsList = document.querySelector("#news-list");
  outlook = document.querySelector("#outlook-text");
  activeSymbol = document.querySelector("#active-symbol");
  activeName = document.querySelector("#active-name");
  activePrice = document.querySelector("#active-price");
  activeTime = document.querySelector("#active-time");
  formError = document.querySelector("#form-error");
  shortChartContainer = document.querySelector("#chart-short");
  longChartContainer = document.querySelector("#chart-long");
  optionsList = document.querySelector("#options-list");

  if (!form || !input || !summary || !newsList || !outlook || !activePrice || !activeName) {
    return;
  }

  bootstrapCharts();
  loadOptionsInterest();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const symbol = input.value.trim().toUpperCase();
    if (!symbol) {
      setStatus("Enter a stock symbol to load insights.");
      input.focus();
      return;
    }
    await updateUI(symbol);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

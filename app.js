let form;
let input;
let summary;
let newsList;
let outlook;
let activeSymbol;
let activeTime;
let formError;
let shortChartContainer;
let longChartContainer;

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

  const series = chart.addCandlestickSeries
    ? chart.addCandlestickSeries(seriesOptions)
    : chart.addSeries
      ? chart.addSeries({ type: "Candlestick", ...seriesOptions })
      : null;

  return { chart, series };
};

const seedSummary = (symbol) =>
  `${symbol} is seeing heightened interest from investors as it balances near-term execution with long-term growth initiatives. The company is positioned in a competitive sector, with recent momentum suggesting steady demand. Upcoming catalysts this week could shift sentiment quickly.`;

const generateHeadlines = (symbol) => {
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
  }));
};

const generateCandles = ({
  start,
  intervals,
  intervalMinutes,
  startPrice,
  volatility,
}) => {
  const candles = [];
  let lastClose = startPrice;

  for (let i = 0; i < intervals; i += 1) {
    const time = Math.floor((start + i * intervalMinutes * 60 * 1000) / 1000);
    const open = lastClose;
    const change = (Math.random() - 0.45) * volatility;
    const close = Math.max(1, open + change);
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
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

const OUTLOOK_DISABLED_MESSAGE = "Weekly outlook is temporarily disabled.";

const setStatus = (message = "") => {
  if (!formError) return;
  formError.textContent = message;
};

const formatUpdatedTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const updateUI = (symbol) => {
  summary.textContent = seedSummary(symbol);
  activeSymbol.textContent = symbol;
  activeTime.textContent = `Updated at ${formatUpdatedTime()}`;

  const headlines = generateHeadlines(symbol);
  newsList.innerHTML = "";
  headlines.forEach((headline) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${headline.title}</strong><br /><span>${headline.timestamp}</span>`;
    newsList.appendChild(li);
  });

  const now = Date.now();
  const shortCandles = generateCandles({
    start: now - 1000 * 60 * 60 * 24 * 5,
    intervals: 390,
    intervalMinutes: 5,
    startPrice: 102 + Math.random() * 20,
    volatility: 1.2,
  });

  const longCandles = generateCandles({
    start: now - 1000 * 60 * 60 * 24 * 365,
    intervals: 1700,
    intervalMinutes: 60,
    startPrice: 110 + Math.random() * 30,
    volatility: 2.8,
  });

  outlook.textContent = OUTLOOK_DISABLED_MESSAGE;

  if (shortSeries && longSeries) {
    shortSeries.setData(shortCandles);
    longSeries.setData(longCandles);
  }
  setStatus("");
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
    setStatus("Chart series could not be created. Update the chart library.");
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
  activeTime = document.querySelector("#active-time");
  formError = document.querySelector("#form-error");
  shortChartContainer = document.querySelector("#chart-short");
  longChartContainer = document.querySelector("#chart-long");

  if (!form || !input || !summary || !newsList || !outlook) {
    return;
  }

  bootstrapCharts();
  outlook.textContent = OUTLOOK_DISABLED_MESSAGE;
  updateUI("AAPL");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const symbol = input.value.trim().toUpperCase();
    if (!symbol) {
      setStatus("Enter a stock symbol to load insights.");
      input.focus();
      return;
    }
    updateUI(symbol);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

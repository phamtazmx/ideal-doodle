const form = document.querySelector("#symbol-form");
const input = document.querySelector("#symbol-input");
const summary = document.querySelector("#summary-text");
const newsList = document.querySelector("#news-list");
const outlook = document.querySelector("#outlook-text");

const shortChartContainer = document.querySelector("#chart-short");
const longChartContainer = document.querySelector("#chart-long");

let shortChart;
let longChart;
let shortSeries;
let longSeries;

const buildChart = (container) => {
  const chart = LightweightCharts.createChart(container, {
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

  const series = chart.addCandlestickSeries({
    upColor: "#22c55e",
    downColor: "#f97316",
    borderDownColor: "#f97316",
    borderUpColor: "#22c55e",
    wickDownColor: "#f97316",
    wickUpColor: "#22c55e",
  });

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

const determineOutlook = (candles) => {
  if (!candles.length) return "No outlook available.";
  const first = candles[0].open;
  const last = candles[candles.length - 1].close;
  const diff = ((last - first) / first) * 100;
  if (diff > 1) {
    return `Momentum is leaning bullish with prices up ${diff.toFixed(
      2
    )}% over the sample window, suggesting a higher chance of a steady climb this week.`;
  }
  if (diff < -1) {
    return `Momentum is leaning bearish with prices down ${Math.abs(diff).toFixed(
      2
    )}% over the sample window, pointing to potential softness this week.`;
  }
  return `Momentum is mostly range-bound with prices within ${Math.abs(
    diff
  ).toFixed(2)}% of the start, so a sideways outcome is most likely this week.`;
};

const updateUI = (symbol) => {
  summary.textContent = seedSummary(symbol);

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

  outlook.textContent = determineOutlook(shortCandles);

  shortSeries.setData(shortCandles);
  longSeries.setData(longCandles);
};

const bootstrapCharts = () => {
  ({ chart: shortChart, series: shortSeries } = buildChart(shortChartContainer));
  ({ chart: longChart, series: longSeries } = buildChart(longChartContainer));

  window.addEventListener("resize", () => {
    shortChart.applyOptions({ width: shortChartContainer.clientWidth });
    longChart.applyOptions({ width: longChartContainer.clientWidth });
  });
};

bootstrapCharts();
updateUI("AAPL");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const symbol = input.value.trim().toUpperCase();
  if (!symbol) return;
  updateUI(symbol);
});

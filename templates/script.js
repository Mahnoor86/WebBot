// ========================
// STATE
// ========================
let pair = "EURUSD=X";
let timeframe = 10;
let autoTimer = null;
let countdownTimer = null;
let isLoading = false;
let signalHistory = [];
let lastChartData = null;
let lastSignal = null;

// ========================
// UTILS
// ========================
function formatPair(p) {
    const map = {
        "EURUSD=X": "EUR/USD",
        "GBPUSD=X": "GBP/USD",
        "USDJPY=X": "USD/JPY",
        "BTC-USD": "BTC/USD",
        "ETH-USD": "ETH/USD",
        "GC=F": "GOLD"
    };
    return map[p] || p;
}

function getTfText(tf) {
    const n = parseInt(tf);
    if (n < 60) return n + " SEC";
    if (n === 60) return "1 MIN";
    if (n === 300) return "5 MIN";
    if (n === 900) return "15 MIN";
    return n + "s";
}

// ========================
// DOTS — STRENGTH INDICATOR
// ========================
function updateDots(strength) {
    let dots = "";
    for (let i = 1; i <= 5; i++) {
        dots += i <= strength ? "● " : "○ ";
    }
    document.getElementById("dots").innerText = dots.trim();
    document.getElementById("strengthText").innerText = strength + " / 5";
}

// ========================
// COUNTDOWN TIMER
// ========================
function startCountdown(seconds) {
    clearInterval(countdownTimer);
    const wrap = document.getElementById("countdownWrap");
    const el = document.getElementById("countdown");
    if (!wrap || !el) return;
    wrap.style.display = "block";
    let remaining = parseInt(seconds);

    function tick() {
        if (remaining <= 0) {
            clearInterval(countdownTimer);
            el.innerText = "0s";
            return;
        }
        el.innerText = remaining + "s";
        remaining--;
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
}

// ========================
// INDICATOR LIST
// ========================
function renderIndicators(indicators) {
    const list = document.getElementById("indicatorList");
    if (!list) return;
    if (!indicators || indicators.length === 0) {
        list.innerHTML = '<div class="indicator-row placeholder"><span>No data available</span></div>';
        return;
    }
    list.innerHTML = indicators.map(ind => `
        <div class="indicator-row">
            <div class="ind-dot ${ind.direction}"></div>
            <span class="ind-name">${ind.name}</span>
            <span class="ind-val ${ind.direction}">${ind.value}</span>
        </div>
    `).join("");
}

// ========================
// LIVE FEED
// ========================
function addToFeed(data) {
    const direction = (data.signal.includes("BUY") || data.signal.includes("CALL")) ? "up" : "down";
    const entry = {
        time: new Date().toLocaleTimeString(),
        pair: formatPair(pair),
        signal: data.signal,
        winRate: data.win_rate,
        price: data.price,
        direction: direction
    };
    signalHistory.unshift(entry);
    if (signalHistory.length > 30) signalHistory.pop();

    const feed = document.getElementById("liveFeed");
    if (!feed) return;
    feed.innerHTML = signalHistory.map(e => `
        <div class="feed-entry ${e.direction}">
            <div class="fe-signal" style="color: ${e.direction === 'up' ? 'var(--up)' : 'var(--down)'}">
                ${e.direction === 'up' ? '⬆' : '⬇'} ${e.signal}
            </div>
            <div class="fe-meta">${e.pair} &middot; Win Rate: ${e.winRate}% &middot; Price: ${e.price} &middot; ${e.time}</div>
        </div>
    `).join("");
}

// ========================
// CHART — REAL PRICE DATA
// ========================
function drawChart(chartData, signal) {
    const canvas = document.getElementById("chart");
    if (!canvas || !chartData || chartData.length < 2) return;

    lastChartData = chartData;
    lastSignal = signal;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.parentElement ? canvas.parentElement.clientWidth - 28 : 400;
    const displayH = 130;

    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayW, displayH);

    const prices = chartData;
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 0.0001;

    const padL = 8, padR = 8, padT = 12, padB = 12;
    const w = displayW - padL - padR;
    const h = displayH - padT - padB;

    const toX = i => padL + (i / (prices.length - 1)) * w;
    const toY = v => padT + h - ((v - minP) / range) * h;

    const isBuy = signal && (signal.includes("BUY") || signal.includes("CALL"));
    const lineColor = isBuy ? "#00c853" : "#f44336";
    const glowColor = isBuy ? "rgba(0,200,83,0.18)" : "rgba(244,67,54,0.18)";

    // --- Grid lines (subtle) ---
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
        const y = padT + (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + w, y);
        ctx.stroke();
    }

    // --- EMA line (smoothed) ---
    const emaSpan = 10;
    let ema = prices[0];
    const k = 2 / (emaSpan + 1);
    const emaLine = prices.map(p => {
        ema = p * k + ema * (1 - k);
        return ema;
    });
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(emaLine[0]));
    for (let i = 1; i < emaLine.length; i++) ctx.lineTo(toX(i), toY(emaLine[i]));
    ctx.strokeStyle = "rgba(155,89,182,0.5)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Gradient fill ---
    const grad = ctx.createLinearGradient(0, padT, 0, displayH);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) ctx.lineTo(toX(i), toY(prices[i]));
    ctx.lineTo(toX(prices.length - 1), displayH);
    ctx.lineTo(toX(0), displayH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // --- Main price line ---
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(prices[0]));
    for (let i = 1; i < prices.length; i++) ctx.lineTo(toX(i), toY(prices[i]));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // --- Pulse dot at latest price ---
    const lastX = toX(prices.length - 1);
    const lastY = toY(prices[prices.length - 1]);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.fillStyle = glowColor.replace("0.18", "0.4");
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    // --- Price label ---
    const lastPrice = prices[prices.length - 1];
    ctx.font = "bold 10px 'Segoe UI', sans-serif";
    ctx.fillStyle = lineColor;
    ctx.textAlign = lastX > displayW - 50 ? "right" : "left";
    ctx.fillText(lastPrice.toFixed(5), lastX + (lastX > displayW - 50 ? -8 : 8), lastY - 6);
}

// ========================
// MAIN SIGNAL LOAD
// ========================
function loadData() {
    if (isLoading) return;
    isLoading = true;

    const btn = document.getElementById("generateBtn");
    const btnText = document.getElementById("btnText");
    const processing = document.getElementById("processing");

    if (btn) btn.disabled = true;
    if (btnText) btnText.innerText = "⏳ Analyzing Market...";
    if (processing) processing.style.display = "block";

    fetch("/data?pair=" + encodeURIComponent(pair) + "&timeframe=" + timeframe)
        .then(res => {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
        })
        .then(data => {
            if (processing) processing.style.display = "none";
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = "⚡ Generate Signal";
            isLoading = false;

            if (data.error) {
                showError(data.error);
                return;
            }

            const isBuy = data.signal.includes("BUY") || data.signal.includes("CALL");

            // --- Signal circle ---
            const circle = document.getElementById("signalCircle");
            if (circle) {
                circle.classList.remove("up-state", "down-state");
                circle.classList.add(isBuy ? "up-state" : "down-state");
            }

            const arrowEl = document.getElementById("arrow");
            const signalEl = document.getElementById("signal");
            if (arrowEl) arrowEl.innerText = isBuy ? "⬆" : "⬇";
            if (signalEl) signalEl.innerText = data.signal;

            // --- Stat cards ---
            setText("winrate", data.win_rate + "%");
            setText("upPct", data.up + "%");
            setText("downPct", data.down + "%");
            updateDots(data.strength);

            // --- Meta row ---
            setText("currentPrice", data.price);
            setText("rsiDisplay", data.rsi);

            // --- Probability bar ---
            const fill = document.getElementById("probFill");
            if (fill) fill.style.width = data.up + "%";

            // --- Chart badge ---
            const badge = document.getElementById("chartSignalLabel");
            if (badge) {
                badge.innerText = data.signal;
                badge.style.color = isBuy ? "var(--up)" : "var(--down)";
            }

            // --- Real price chart ---
            if (data.chart_data && data.chart_data.length > 0) {
                drawChart(data.chart_data, data.signal);
            }

            // --- Indicators ---
            renderIndicators(data.indicators);

            // --- Trade tab ---
            setText("tradePair", data.pair_name || formatPair(pair));
            setText("tradeFrame", getTfText(timeframe));
            setHtml("tradeSignal", data.signal,
                isBuy ? "color:var(--up);font-weight:700" : "color:var(--down);font-weight:700");
            setText("tradeWin", data.win_rate + "%");
            setText("tradePrice", data.price);
            setText("tradeRsi", data.rsi);
            setText("tradeTime", new Date().toLocaleTimeString());

            // --- Live feed ---
            addToFeed(data);

            // --- Countdown ---
            if (document.getElementById("autoRefresh")?.checked) {
                startCountdown(timeframe);
            }
        })
        .catch(err => {
            if (processing) processing.style.display = "none";
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = "⚡ Generate Signal";
            isLoading = false;
            console.error("Fetch error:", err);
            showError("Server error. Make sure the Flask app is running.");
        });
}

// ========================
// DOM HELPERS
// ========================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function setHtml(id, html, style) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = html;
        if (style) el.setAttribute("style", style);
    }
}

function showError(msg) {
    const processing = document.getElementById("processing");
    if (processing) {
        processing.style.display = "block";
        processing.style.color = "var(--down)";
        processing.innerHTML = `<span>⚠ ${msg}</span>`;
        setTimeout(() => {
            processing.style.display = "none";
            processing.style.color = "";
            processing.innerHTML = '<span class="blink">●</span> AI PROCESSING...';
        }, 5000);
    }
}

// ========================
// AUTO REFRESH
// ========================
function toggleAuto() {
    const checked = document.getElementById("autoRefresh")?.checked;
    clearInterval(autoTimer);
    clearInterval(countdownTimer);

    const wrap = document.getElementById("countdownWrap");

    if (checked) {
        loadData();
        autoTimer = setInterval(loadData, parseInt(timeframe) * 1000);
        if (wrap) wrap.style.display = "block";
    } else {
        if (wrap) wrap.style.display = "none";
    }
}

// ========================
// SETTINGS
// ========================
function applySettings() {
    const newPair = document.getElementById("setPair")?.value;
    const newTime = document.getElementById("setTime")?.value;
    if (!newPair || !newTime) return;

    pair = newPair;
    timeframe = newTime;

    const tfText = getTfText(timeframe);
    const pairName = formatPair(pair);

    setText("pair", pairName);
    setText("timeframe", tfText);
    setText("tradePair", pairName);
    setText("tradeFrame", tfText);
    setText("tfLabel", tfText);

    // Restart auto-refresh if enabled
    if (document.getElementById("autoRefresh")?.checked) {
        clearInterval(autoTimer);
        clearInterval(countdownTimer);
        loadData();
        autoTimer = setInterval(loadData, parseInt(timeframe) * 1000);
    }

    showTab("trade");
    loadData();
}

// ========================
// TABS
// ========================
function showTab(tab) {
    const tabs = { trade: "tradeTab", live: "liveTab", settings: "settingsTab" };
    const navs = { trade: "navTrade", live: "navLive", settings: "navSettings" };

    Object.values(tabs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    Object.values(navs).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("active");
    });

    const activeTab = document.getElementById(tabs[tab]);
    const activeNav = document.getElementById(navs[tab]);
    if (activeTab) activeTab.style.display = "block";
    if (activeNav) activeNav.classList.add("active");
}

// ========================
// CHART RESIZE
// ========================
let resizeDebounce;
window.addEventListener("resize", () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
        if (lastChartData && lastSignal) {
            drawChart(lastChartData, lastSignal);
        }
    }, 200);
});

// ========================
// INIT
// ========================
window.onload = function () {
    const tfText = getTfText(timeframe);
    const pairName = formatPair(pair);

    setText("pair", pairName);
    setText("timeframe", tfText);
    setText("tradePair", pairName);
    setText("tradeFrame", tfText);
    setText("tfLabel", tfText);

    showTab("trade");
};

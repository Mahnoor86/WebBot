// let pair = "EURUSD=X";
// let timeframe = 10;
// let liveFeedStarted = false;

// // =========================
// // FORMAT PAIR
// // =========================

// function formatPair(p) {
//     if (p === "EURUSD=X") return "EUR/USD";
//     if (p === "BTC-USD") return "BTC/USD";
//     if (p === "GC=F") return "GOLD";
//     return p;
// }

// // =========================
// // SETTINGS
// // =========================

// function applySettings() {

//     pair = document.getElementById("setPair").value;
//     timeframe = document.getElementById("setTime").value;

//     let tfText = "10 SEC";

//     if (timeframe == 5) tfText = "5 SEC";
//     else if (timeframe == 10) tfText = "10 SEC";
//     else if (timeframe == 60) tfText = "1 MIN";
//     else if (timeframe == 300) tfText = "5 MIN";
//     else if (timeframe == 900) tfText = "15 MIN";

//     document.getElementById("pair").innerText =
//         "Signal For: " + formatPair(pair);

//     document.getElementById("timeframe").innerText = tfText;

//     document.getElementById("tradePair").innerText = formatPair(pair);
//     document.getElementById("tradeFrame").innerText = tfText;

//     document.getElementById("settingsPanel")?.style && (document.getElementById("settingsPanel").style.display = "none");

//     loadData();
// }

// // =========================
// // DOTS
// // =========================

// function updateDots(strength) {
//     let dots = "";
//     for (let i = 1; i <= 5; i++) {
//         dots += i <= strength ? "● " : "○ ";
//     }

//     document.getElementById("dots").innerText = dots;
//     document.getElementById("strengthText").innerText = strength + "/5";
// }

// // =========================
// // MAIN SIGNAL FUNCTION
// // =========================

// function loadData() {

//     fetch("/data")
//         .then(res => res.json())
//         .then(data => {

//             if (data.error) {
//                 alert(data.error);
//                 return;
//             }

//             // MAIN SIGNAL
//             document.getElementById("signal").innerText = data.signal;
//             document.getElementById("tradeSignal").innerText = data.signal;
//             document.getElementById("winrate").innerText = data.win_rate + "%";

//             updateDots(data.strength);

//             // COLOR + ARROW
//             const circle = document.querySelector(".signal-circle");

//             if (data.signal.includes("BUY") || data.signal.includes("CALL")) {
//                 document.getElementById("arrow").innerText = "⬆";
//                 circle.style.background = "#16a34a";
//             } else {
//                 document.getElementById("arrow").innerText = "⬇";
//                 circle.style.background = "#dc2626";
//             }

//             updateLiveFeed(data);
//             drawChart(data.signal);
//         })
//         .catch(err => {
//             console.error(err);
//             alert("Server error");
//         });
// }

// // =========================
// // LIVE FEED (NO SPAM FIX)
// // =========================

// function updateLiveFeed(data) {

//     const time = new Date().toLocaleTimeString();

//     document.getElementById("liveData").innerHTML = `
//         <b>Asset:</b> ${formatPair(pair)} <br><br>
//         <b>Timeframe:</b> ${document.getElementById("timeframe").innerText} <br><br>
//         <b>Signal:</b> ${data.signal} <br><br>
//         <b>Win Rate:</b> ${data.win_rate}% <br><br>
//         <b>Updated:</b> ${time}
//     `;
// }

// // =========================
// // SIMPLE CLEAN CHART
// // =========================

// function drawChart(signal) {

//     const canvas = document.getElementById("chart");
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");

//     canvas.width = 320;
//     canvas.height = 150;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.beginPath();

//     let x = 0;
//     let y = 80;

//     ctx.moveTo(x, y);

//     for (let i = 0; i < 20; i++) {

//         x += 15;

//         y += (signal.includes("BUY") ? -1 : 1) * Math.random() * 10;

//         ctx.lineTo(x, y);
//     }

//     ctx.strokeStyle =
//         signal.includes("BUY") ? "#16a34a" : "#dc2626";

//     ctx.lineWidth = 3;
//     ctx.stroke();
// }

// // =========================
// // TABS (FIXED CLEAN)
// // =========================

// function showTab(tab) {

//     document.getElementById("tradeTab").style.display = "none";
//     document.getElementById("liveTab").style.display = "none";
//     document.getElementById("settingsTab").style.display = "none";

//     if (tab === "trade")
//         document.getElementById("tradeTab").style.display = "block";

//     if (tab === "live")
//         document.getElementById("liveTab").style.display = "block";

//     if (tab === "settings")
//         document.getElementById("settingsTab").style.display = "block";
// }

// // =========================
// // INIT
// // =========================

// window.onload = function () {
//     showTab("trade");
// };
// let pair = "EURUSD=X";
// let timeframe = 10;

// // =========================
// // FORMAT PAIR
// // =========================
// function formatPair(p) {
//     if (p === "EURUSD=X") return "EUR/USD";
//     if (p === "BTC-USD") return "BTC/USD";
//     if (p === "GC=F") return "GOLD";
//     return p;
// }

// // =========================
// // SETTINGS
// // =========================
// function applySettings() {
//     pair = document.getElementById("setPair").value;
//     timeframe = document.getElementById("setTime").value;

//     let tfText = `${timeframe} SEC`;
//     if (timeframe == 60) tfText = "1 MIN";
//     if (timeframe == 300) tfText = "5 MIN";
//     if (timeframe == 900) tfText = "15 MIN";

//     document.getElementById("pair").innerText = "Signal For: " + formatPair(pair);
//     document.getElementById("timeframe").innerText = tfText;

//     document.getElementById("tradePair").innerText = formatPair(pair);
//     document.getElementById("tradeFrame").innerText = tfText;
// }

// // =========================
// // UPDATE DOTS
// // =========================
// function updateDots(strength) {
//     let dots = "";

//     for (let i = 1; i <= 5; i++) {
//         dots += i <= strength ? "● " : "○ ";
//     }

//     document.getElementById("dots").innerText = dots;
//     document.getElementById("strengthText").innerText = strength + "/5";
// }

// // =========================
// // MAIN BUTTON ONLY FUNCTION
// // =========================
// function loadData() {

//     fetch("/data?pair=" + pair + "&timeframe=" + timeframe)
//         .then(res => res.json())
//         .then(data => {

//             if (data.error) {
//                 alert(data.error);
//                 return;
//             }

//             // =====================
//             // SIGNAL
//             // =====================
//             document.getElementById("signal").innerText = data.signal;
//             document.getElementById("tradeSignal").innerText = data.signal;

//             // =====================
//             // WIN RATE
//             // =====================
//             document.getElementById("winrate").innerText = data.win_rate + "%";

//             // =====================
//             // STRENGTH
//             // =====================
//             updateDots(data.strength);

//             // =====================
//             // UI COLOR
//             // =====================
//             const circle = document.querySelector(".signal-circle");

//             if (data.signal.includes("BUY") || data.signal.includes("CALL")) {
//                 document.getElementById("arrow").innerText = "⬆";
//                 circle.style.background = "#16a34a";
//             } else {
//                 document.getElementById("arrow").innerText = "⬇";
//                 circle.style.background = "#dc2626";
//             }

//             // =====================
//             // LIVE FEED UPDATE
//             // =====================
//             document.getElementById("liveData").innerHTML = `
//                 <b>Asset:</b> ${formatPair(pair)} <br><br>
//                 <b>Timeframe:</b> ${document.getElementById("timeframe").innerText} <br><br>
//                 <b>Signal:</b> ${data.signal} <br><br>
//                 <b>Win Rate:</b> ${data.win_rate}% <br><br>
//                 <b>Strength:</b> ${data.strength}/5 <br><br>
//                 <b>Updated:</b> ${new Date().toLocaleTimeString()}
//             `;

//             // =====================
//             // CHART UPDATE
//             // =====================
//             drawChart(data.signal);
//         })
//         .catch(err => {
//             console.error(err);
//             alert("Server error");
//         });
// }

// // =========================
// // CHART
// // =========================
// function drawChart(signal) {

//     const canvas = document.getElementById("chart");
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");

//     canvas.width = 320;
//     canvas.height = 150;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.beginPath();

//     let x = 0;
//     let y = 80;

//     ctx.moveTo(x, y);

//     for (let i = 0; i < 20; i++) {

//         x += 15;

//         if (signal.includes("BUY") || signal.includes("CALL")) {
//             y -= Math.random() * 10;
//         } else {
//             y += Math.random() * 10;
//         }

//         ctx.lineTo(x, y);
//     }

//     ctx.strokeStyle =
//         (signal.includes("BUY") || signal.includes("CALL"))
//             ? "#16a34a"
//             : "#dc2626";

//     ctx.lineWidth = 3;
//     ctx.stroke();
// }

// // =========================
// // INIT ONLY (NO AUTO SIGNAL)
// // =========================
// window.onload = function () {

//     document.getElementById("pair").innerText = "Signal For: EUR/USD";
//     document.getElementById("timeframe").innerText = "10 SEC";

//     document.getElementById("tradePair").innerText = "EUR/USD";
//     document.getElementById("tradeFrame").innerText = "10 SEC";
// };
let pair = "EURUSD=X";
let timeframe = 10;

// =========================
// FORMAT PAIR
// =========================
function formatPair(p) {
    if (p === "EURUSD=X") return "EUR/USD";
    if (p === "BTC-USD") return "BTC/USD";
    if (p === "GC=F") return "GOLD";
    return p;
}

// =========================
// SETTINGS APPLY
// =========================
function applySettings() {

    pair = document.getElementById("setPair").value;
    timeframe = document.getElementById("setTime").value;

    let tfText = `${timeframe} SEC`;

    if (timeframe == 60) tfText = "1 MIN";
    else if (timeframe == 300) tfText = "5 MIN";
    else if (timeframe == 900) tfText = "15 MIN";

    document.getElementById("pair").innerText =
        "Signal For: " + formatPair(pair);

    document.getElementById("timeframe").innerText = tfText;

    document.getElementById("tradePair").innerText = formatPair(pair);
    document.getElementById("tradeFrame").innerText = tfText;

    // close settings tab if open
    showTab("trade");

    // refresh data after settings change
    loadData();
}

// =========================
// DOTS (strength)
// =========================
function updateDots(strength) {

    let dots = "";

    for (let i = 1; i <= 5; i++) {
        dots += i <= strength ? "● " : "○ ";
    }

    document.getElementById("dots").innerText = dots;
    document.getElementById("strengthText").innerText =
        strength + "/5";
}

// =========================
// MAIN SIGNAL BUTTON
// =========================
function loadData() {

    fetch("/data?pair=" + pair + "&timeframe=" + timeframe)
        .then(res => res.json())
        .then(data => {

            if (data.error) {
                alert(data.error);
                return;
            }

            // SIGNAL
            document.getElementById("signal").innerText = data.signal;
            document.getElementById("tradeSignal").innerText = data.signal;

            // WIN RATE
            document.getElementById("winrate").innerText =
                data.win_rate + "%";

            // STRENGTH
            updateDots(data.strength);

            // COLOR + ARROW
            const circle = document.querySelector(".signal-circle");

            if (data.signal.includes("BUY") || data.signal.includes("CALL")) {
                document.getElementById("arrow").innerText = "⬆";
                circle.style.background = "#16a34a";
            } else {
                document.getElementById("arrow").innerText = "⬇";
                circle.style.background = "#dc2626";
            }

            // LIVE FEED UPDATE
            document.getElementById("liveData").innerHTML = `
                <b>Asset:</b> ${formatPair(pair)} <br><br>
                <b>Timeframe:</b> ${document.getElementById("timeframe").innerText} <br><br>
                <b>Signal:</b> ${data.signal} <br><br>
                <b>Win Rate:</b> ${data.win_rate}% <br><br>
                <b>Strength:</b> ${data.strength}/5 <br><br>
                <b>Updated:</b> ${new Date().toLocaleTimeString()}
            `;

            // CHART
            drawChart(data.signal);
        })
        .catch(err => {
            console.error(err);
            alert("Server error");
        });
}

// =========================
// CHART
// =========================
function drawChart(signal) {

    const canvas = document.getElementById("chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = 320;
    canvas.height = 150;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();

    let x = 0;
    let y = 80;

    ctx.moveTo(x, y);

    for (let i = 0; i < 20; i++) {

        x += 15;

        if (signal.includes("BUY") || signal.includes("CALL")) {
            y -= Math.random() * 10;
        } else {
            y += Math.random() * 10;
        }

        ctx.lineTo(x, y);
    }

    ctx.strokeStyle =
        (signal.includes("BUY") || signal.includes("CALL"))
            ? "#16a34a"
            : "#dc2626";

    ctx.lineWidth = 3;
    ctx.stroke();
}

// =========================
// TABS FIX (IMPORTANT)
// =========================
function showTab(tab) {

    const trade = document.getElementById("tradeTab");
    const live = document.getElementById("liveTab");
    const settings = document.getElementById("settingsTab");

    if (!trade || !live || !settings) return;

    trade.style.display = "none";
    live.style.display = "none";
    settings.style.display = "none";

    if (tab === "trade") trade.style.display = "block";
    if (tab === "live") live.style.display = "block";
    if (tab === "settings") settings.style.display = "block";
}

// =========================
// INIT (NO AUTO SIGNAL)
// =========================
window.onload = function () {

    document.getElementById("pair").innerText = "Signal For: EUR/USD";
    document.getElementById("timeframe").innerText = "10 SEC";

    document.getElementById("tradePair").innerText = "EUR/USD";
    document.getElementById("tradeFrame").innerText = "10 SEC";

    showTab("trade");
};
from flask import Flask, render_template, jsonify, send_from_directory, request
import yfinance as yf
import pandas as pd
import numpy as np
import os
import logging

# Silence yfinance noise
logging.getLogger("yfinance").setLevel(logging.CRITICAL)

app = Flask(__name__, template_folder="templates", static_folder="templates")

# ----------------------------
# SUPPORTED PAIRS
# ----------------------------
PAIRS = {
    "EURUSD=X": "EUR/USD",
    "BTC-USD":  "BTC/USD",
    "GC=F":     "GOLD",
    "GBPUSD=X": "GBP/USD",
    "USDJPY=X": "USD/JPY",
    "ETH-USD":  "ETH/USD",
}


# ----------------------------
# LIVE MARKET DATA
# ----------------------------
def get_data(pair="EURUSD=X"):
    df = yf.download(pair, period="7d", interval="1m", progress=False, auto_adjust=True)
    if df.empty:
        raise ValueError("No market data returned. Market may be closed or rate-limited.")
    df = df.reset_index()

    # Handle both flat and multi-level column headers (yfinance v0.2+)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = ["_".join([c for c in col if c]).strip("_").lower() for col in df.columns]
        close_col = [c for c in df.columns if "close" in c][0]
        time_col = [c for c in df.columns if "datetime" in c or "date" in c][0]
        df = df.rename(columns={time_col: "datetime", close_col: "close"})
    else:
        df.columns = [c.lower() for c in df.columns]
        if "datetime" not in df.columns and "date" in df.columns:
            df = df.rename(columns={"date": "datetime"})

    df = df[["datetime", "close"]].copy()
    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna(subset=["close"])
    df = df.tail(300)
    return df


# ----------------------------
# TECHNICAL INDICATORS
# ----------------------------
def calc_rsi(series, period=14):
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def calc_macd(series, fast=12, slow=26, signal=9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def calc_bollinger(series, period=20, std_dev=2):
    sma = series.rolling(window=period).mean()
    std = series.rolling(window=period).std()
    return sma + (std * std_dev), sma, sma - (std * std_dev)


def calc_stochastic(df, k_period=14, d_period=3):
    low_min  = df["close"].rolling(window=k_period).min()
    high_max = df["close"].rolling(window=k_period).max()
    rng = high_max - low_min
    rng = rng.replace(0, np.nan)
    k = 100 * (df["close"] - low_min) / rng
    d = k.rolling(window=d_period).mean()
    return k, d


# ----------------------------
# SIGNAL ENGINE
# ----------------------------
def calculate_signals(pair="EURUSD=X"):
    try:
        df = get_data(pair)

        if len(df) < 60:
            return {"error": "Not enough market data. Try again in a moment."}

        # --- EMAs ---
        df["EMA20"]  = df["close"].ewm(span=20, adjust=False).mean()
        df["EMA50"]  = df["close"].ewm(span=50, adjust=False).mean()
        df["EMA200"] = df["close"].ewm(span=200, adjust=False).mean()

        # --- Indicators ---
        df["RSI"] = calc_rsi(df["close"], 14)
        df["MACD"], df["MACD_signal"], df["MACD_hist"] = calc_macd(df["close"])
        df["BB_upper"], df["BB_mid"], df["BB_lower"] = calc_bollinger(df["close"])
        df["Stoch_K"], df["Stoch_D"] = calc_stochastic(df)

        latest = df.iloc[-1]
        prev   = df.iloc[-2]

        score = 50
        signals_detail = []

        # ---- EMA Trend ----
        if latest["EMA20"] > latest["EMA50"]:
            score += 15
            signals_detail.append({"name": "EMA Trend", "value": "Bullish", "direction": "up"})
        else:
            score -= 15
            signals_detail.append({"name": "EMA Trend", "value": "Bearish", "direction": "down"})

        # ---- Momentum ----
        if latest["close"] > latest["EMA20"]:
            score += 10
            signals_detail.append({"name": "Momentum", "value": "Above EMA20", "direction": "up"})
        else:
            score -= 10
            signals_detail.append({"name": "Momentum", "value": "Below EMA20", "direction": "down"})

        # ---- RSI ----
        rsi_val = round(float(latest["RSI"]), 1)
        if rsi_val < 30:
            score += 20
            signals_detail.append({"name": "RSI", "value": f"{rsi_val} (Oversold)", "direction": "up"})
        elif rsi_val > 70:
            score -= 20
            signals_detail.append({"name": "RSI", "value": f"{rsi_val} (Overbought)", "direction": "down"})
        elif 40 < rsi_val < 60:
            signals_detail.append({"name": "RSI", "value": f"{rsi_val} (Neutral)", "direction": "neutral"})
        elif rsi_val >= 50:
            score += 8
            signals_detail.append({"name": "RSI", "value": f"{rsi_val} (Bullish)", "direction": "up"})
        else:
            score -= 8
            signals_detail.append({"name": "RSI", "value": f"{rsi_val} (Bearish)", "direction": "down"})

        # ---- MACD ----
        macd_val  = float(latest["MACD"])
        macd_sig  = float(latest["MACD_signal"])
        macd_hist = float(latest["MACD_hist"])
        prev_hist = float(prev["MACD_hist"])

        if macd_val > macd_sig:
            score += 12
            signals_detail.append({"name": "MACD", "value": "Bullish Cross", "direction": "up"})
        else:
            score -= 12
            signals_detail.append({"name": "MACD", "value": "Bearish Cross", "direction": "down"})

        score += 5 if macd_hist > prev_hist else -5

        # ---- Bollinger Bands ----
        bb_upper = float(latest["BB_upper"])
        bb_lower = float(latest["BB_lower"])
        close_v  = float(latest["close"])
        bb_range = bb_upper - bb_lower
        bb_pos   = (close_v - bb_lower) / bb_range * 100 if bb_range != 0 else 50

        if bb_pos < 20:
            score += 10
            signals_detail.append({"name": "Bollinger", "value": "Near Lower Band", "direction": "up"})
        elif bb_pos > 80:
            score -= 10
            signals_detail.append({"name": "Bollinger", "value": "Near Upper Band", "direction": "down"})
        else:
            signals_detail.append({"name": "Bollinger", "value": f"Mid Band ({round(bb_pos)}%)", "direction": "neutral"})

        # ---- Stochastic ----
        stoch_k = float(latest["Stoch_K"]) if not pd.isna(latest["Stoch_K"]) else 50
        stoch_d = float(latest["Stoch_D"]) if not pd.isna(latest["Stoch_D"]) else 50

        if stoch_k < 20 and stoch_d < 20:
            score += 8
            signals_detail.append({"name": "Stochastic", "value": "Oversold", "direction": "up"})
        elif stoch_k > 80 and stoch_d > 80:
            score -= 8
            signals_detail.append({"name": "Stochastic", "value": "Overbought", "direction": "down"})
        elif stoch_k > stoch_d:
            score += 4
            signals_detail.append({"name": "Stochastic", "value": "Bullish Cross", "direction": "up"})
        else:
            score -= 4
            signals_detail.append({"name": "Stochastic", "value": "Bearish Cross", "direction": "down"})

        # ---- Final score ----
        up   = max(min(score, 98), 2)
        down = 100 - up

        signal   = "BUY (CALL)" if up > down else "SELL (PUT)"
        win_rate = round(max(up, down), 1)

        strength = (
            5 if win_rate >= 90 else
            4 if win_rate >= 80 else
            3 if win_rate >= 70 else
            2 if win_rate >= 60 else
            1
        )

        chart_data = [round(float(v), 5) for v in df["close"].tail(60).tolist()]

        return {
            "signal":    signal,
            "win_rate":  win_rate,
            "strength":  strength,
            "up":        round(up, 2),
            "down":      round(down, 2),
            "price":     round(float(latest["close"]), 5),
            "rsi":       rsi_val,
            "macd":      round(macd_val, 6),
            "pair_name": PAIRS.get(pair, pair),
            "indicators": signals_detail,
            "chart_data": chart_data,
        }

    except Exception as e:
        app.logger.error(f"Signal error [{pair}]: {e}")
        return {"error": str(e)}


# ----------------------------
# ROUTES
# ----------------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/style.css")
def style():
    return send_from_directory("templates", "style.css")

@app.route("/script.js")
def script():
    return send_from_directory("templates", "script.js")

@app.route("/data")
def data():
    pair = request.args.get("pair", "EURUSD=X")
    if pair not in PAIRS:
        pair = "EURUSD=X"
    return jsonify(calculate_signals(pair))

@app.route("/health")
def health():
    return jsonify({"status": "ok", "pairs": list(PAIRS.keys())})


# ----------------------------
# RUN
# ----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port, debug=False)

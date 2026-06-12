from flask import Flask, render_template, jsonify, send_file
import yfinance as yf
import pandas as pd
import os

app = Flask(__name__)


# ----------------------------
# LIVE MARKET DATA (Yahoo Finance)
# ----------------------------
def get_data():
    df = yf.download("EURUSD=X", period="7d", interval="1m")

    df = df.reset_index()
    df = df[["Close"]]
    df.columns = ["close"]

    df["close"] = pd.to_numeric(df["close"], errors="coerce")
    df = df.dropna()

    return df


# ----------------------------
# SIGNAL ENGINE
# ----------------------------
def calculate_signals():
    try:
        df = get_data()

        if len(df) < 50:
            return {
                "error": "Not enough market data yet"
            }

        # EMA calculations
        df["EMA20"] = df["close"].ewm(span=20).mean()
        df["EMA50"] = df["close"].ewm(span=50).mean()

        latest = df.iloc[-1]
        previous = df.iloc[-2]

        score = 50

        # Trend analysis
        if latest["EMA20"] > latest["EMA50"]:
            score += 20
        else:
            score -= 20

        # Momentum
        if latest["close"] > latest["EMA20"]:
            score += 15
        else:
            score -= 15

        # EMA trend change
        if latest["EMA20"] > previous["EMA20"]:
            score += 15
        else:
            score -= 15

        # Clamp probability
        up = max(min(score, 100), 0)
        down = 100 - up

        signal = "BUY (CALL)" if up > down else "SELL (PUT)"

        win_rate = round(max(up, down), 1)

        if win_rate >= 90:
            strength = 5
        elif win_rate >= 80:
            strength = 4
        elif win_rate >= 70:
            strength = 3
        elif win_rate >= 60:
            strength = 2
        else:
            strength = 1

        return {
            "signal": signal,
            "win_rate": win_rate,
            "strength": strength,
            "up": round(up, 2),
            "down": round(down, 2),
            "price": round(float(latest["close"]), 5)
        }

    except Exception as e:
        return {
            "error": str(e)
        }


# ----------------------------
# ROUTES
# ----------------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/style.css")
def style():
    return send_file("templates/style.css")


@app.route("/script.js")
def script():
    return send_file("templates/script.js")


@app.route("/data")
def data():
    return jsonify(calculate_signals())


# ----------------------------
# RUN APP
# ----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))
    app.run(host="0.0.0.0", port=port, debug=True)
from flask import Flask, render_template, jsonify, send_file
import pandas as pd
import os

app = Flask(__name__)

CSV_FILE = "prices.csv"


def calculate_signals():
    try:

        df = pd.read_csv(CSV_FILE)

        df["close"] = pd.to_numeric(df["close"], errors="coerce")
        df = df.dropna()

        if len(df) < 50:
            return {
                "error": "Not enough data in prices.csv"
            }

        # EMA Calculations
        df["EMA20"] = df["close"].ewm(span=20).mean()
        df["EMA50"] = df["close"].ewm(span=50).mean()

        latest = df.iloc[-1]
        previous = df.iloc[-2]

        score = 50

        # Trend Analysis
        if latest["EMA20"] > latest["EMA50"]:
            score += 20
        else:
            score -= 20

        if latest["close"] > latest["EMA20"]:
            score += 15
        else:
            score -= 15

        if latest["EMA20"] > previous["EMA20"]:
            score += 15
        else:
            score -= 15

        up = max(min(score, 100), 0)
        down = 100 - up

        signal = "BUY" if up > down else "SELL"

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
            "down": round(down, 2)
        }

    except Exception as e:
        return {
            "error": str(e)
        }


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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=True)
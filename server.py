from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}

    api_key = data.get("apiKey")
    model = data.get("model", "claude-sonnet-4-6")
    max_tokens = data.get("max_tokens", 500)
    messages = data.get("messages")

    if not api_key:
        return jsonify({"error": "apiKey가 필요합니다."}), 400
    if not messages:
        return jsonify({"error": "messages가 필요합니다."}), 400

    payload = {"model": model, "max_tokens": max_tokens, "messages": messages}
    headers = {
        "x-api-key": api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }

    try:
        resp = requests.post(ANTHROPIC_API_URL, json=payload, headers=headers, timeout=60)
    except requests.exceptions.RequestException as exc:
        return jsonify({"error": "Anthropic API 호출에 실패했습니다.", "detail": str(exc)}), 502

    return jsonify(resp.json()), resp.status_code


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/analyze" || request.method !== "POST") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return jsonResponse({ error: "잘못된 JSON 요청입니다." }, 400);
    }

    // apiKey는 클라이언트가 보내거나, Worker Secret(ANTHROPIC_API_KEY)을 사용할 수 있습니다.
    const apiKey = data.apiKey || env.ANTHROPIC_API_KEY;
    const model = data.model || "claude-sonnet-4-6";
    const max_tokens = data.max_tokens || 500;
    const messages = data.messages;

    if (!apiKey) {
      return jsonResponse({ error: "apiKey가 필요합니다." }, 400);
    }
    if (!messages) {
      return jsonResponse({ error: "messages가 필요합니다." }, 400);
    }

    let upstream;
    try {
      upstream = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
        },
        body: JSON.stringify({ model, max_tokens, messages }),
      });
    } catch (err) {
      return jsonResponse({ error: "Anthropic API 호출에 실패했습니다.", detail: String(err) }, 502);
    }

    const result = await upstream.json();
    return jsonResponse(result, upstream.status);
  },
};

export function onRequestGet({ env }) {
  return Response.json({
    ok: true,
    provider: env.ARK_API_KEY ? "ark" : env.OPENAI_API_KEY ? "openai" : "local",
    model: env.ARK_API_KEY ? env.ARK_MODEL || "deepseek-v3-2-251201" : env.OPENAI_MODEL || "",
    transcribe: Boolean(env.OPENAI_API_KEY),
    transcribeModel: env.OPENAI_API_KEY ? env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe" : "",
    openaiBaseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    pwa: true,
    runtime: "cloudflare-pages"
  });
}

export function onRequestGet({ env }) {
  return Response.json({
    ok: true,
    provider: env.ARK_API_KEY ? "ark" : env.OPENAI_API_KEY ? "openai" : "local",
    model: env.ARK_API_KEY ? env.ARK_MODEL || "deepseek-v3-2-251201" : env.OPENAI_MODEL || "",
    pwa: true,
    runtime: "cloudflare-pages"
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    if (!env.OPENAI_API_KEY) {
      return Response.json({
        text: "",
        message: "语音转文字还没接密钥；先用键盘输入。"
      });
    }
    const audio = String(body.audio || "");
    const mimeType = String(body.mimeType || "audio/webm");
    if (!audio.startsWith("data:audio/")) {
      return Response.json({ text: "", message: "这段语音没有录到。" });
    }
    const file = dataURLToFile(audio, mimeType);
    const form = new FormData();
    form.append("file", file, `voice.${extensionForMime(mimeType)}`);
    form.append("model", env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
    form.append("language", "zh");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`Transcribe ${response.status}: ${text.slice(0, 300)}`);
      return Response.json({ text: "", message: "语音转文字暂时失败，先用键盘输入。" });
    }
    const data = await response.json();
    return Response.json({ text: String(data.text || "").trim() });
  } catch (error) {
    console.warn(error?.message || "Transcribe request failed");
    return Response.json({ text: "", message: "语音转文字暂时不可用。" });
  }
}

function dataURLToFile(dataURL, mimeType) {
  const base64 = dataURL.split(",")[1] || "";
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new File([bytes], "voice", { type: mimeType });
}

function extensionForMime(mimeType) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

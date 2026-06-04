import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

loadLocalEnv();

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const arkModel = process.env.ARK_MODEL || "deepseek-v3-2-251201";
const arkEndpoint = process.env.ARK_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/responses";
const arkWebSearch = process.env.ARK_WEB_SEARCH === "true";
const root = dirname(fileURLToPath(import.meta.url));

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJson(req);
      let reply;
      try {
        reply = await callAI(body);
      } catch (error) {
        console.warn(error?.message || "AI request failed");
        reply = localFallbackReply(body);
      }
      return sendJson(res, reply);
    }
    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, {
        ok: true,
        provider: process.env.ARK_API_KEY ? "ark" : process.env.OPENAI_API_KEY ? "openai" : "local",
        model: process.env.ARK_API_KEY ? arkModel : process.env.OPENAI_API_KEY ? openaiModel : "",
        pwa: true
      });
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, decodeURIComponent(pathname)));
    if (!filePath.startsWith(root)) throw new Error("Invalid path");
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : 500;
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(port, host, () => {
  const shownHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`知食分子 running at http://${shownHost}:${port}`);
});

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 16 * 1024 * 1024) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(JSON.parse(raw || "{}")));
    req.on("error", reject);
  });
}

function sendJson(res, data) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function loadLocalEnv() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

async function callAI(body) {
  if (body.image && process.env.OPENAI_API_KEY) return callOpenAI(body);
  if (process.env.ARK_API_KEY) return callArk(body);
  if (process.env.OPENAI_API_KEY) return callOpenAI(body);
  return localFallbackReply(body);
}

async function callArk(body) {
  if (body.image) return localFallbackReply(body);
  const prompt = buildPrompt(body);
  const payload = {
    model: arkModel,
    stream: false,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt
          }
        ]
      }
    ]
  };
  if (arkWebSearch && /新闻|热点|今天|最新|发生了什么/.test(body.text || "")) {
    payload.tools = [{ type: "web_search", max_keyword: 3 }];
  }
  const response = await fetch(arkEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ARK_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(`Ark ${response.status}: ${text.slice(0, 300)}`);
    return localFallbackReply(body);
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次 Ark 没有生成明确回复。", aiStatus: "ok" };
}

async function callOpenAI(body) {
  const content = [{ type: "input_text", text: buildPrompt(body) }];
  if (body.image) content.push({ type: "input_image", image_url: body.image, detail: "auto" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: openaiModel,
      input: [{ role: "user", content }]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(`OpenAI ${response.status}: ${text.slice(0, 300)}`);
    return localFallbackReply(body);
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次没有生成明确回复。", aiStatus: body.image ? "vision_ok" : "ok" };
}

function localFallbackReply(body) {
  const text = String(body.text || "").trim();
  const fridge = Array.isArray(body.state?.fridge) ? body.state.fridge : [];
  const fridgeNames = fridge.map((item) => item.name).filter(Boolean);
  const mentionedIngredients = extractIngredientNames(text);
  if (body.image) {
    return {
      reply: "我收到图片了，但现在不能稳定识别图片细节，所以不乱猜热量。\n\n你补一句：这是食物、冰箱还是小票？如果是食物，再告诉我大概几人份，我再给你一个范围。",
      aiStatus: "vision_unavailable",
      needsClarification: true
    };
  }
  if (/吃了|喝了|夜宵|加餐|早餐|午餐|晚餐/.test(text)) {
    return {
      reply: "收到，我先把这顿当作真实记录，不当作考试。\n\n如果要估热量，我需要一个关键信息：大概份量是一小碗、一盘，还是外卖常规份？"
    };
  }
  if (/冰箱|库存|还有|买了/.test(text) && !/怎么|咋|做法|吃什么|做什么|推荐|不知道/.test(text)) {
    const names = mentionedIngredients.length ? mentionedIngredients : fridgeNames;
    return {
      reply: `我先按库存线索记：${names.slice(0, 6).join("、") || text}。\n\n如果你是想问“怎么做”，直接说“用这些给我一个做法”，我会只给一个可执行选项。`
    };
  }
  if (/吃什么|做什么|不知道|推荐|怎么|咋|做法/.test(text)) {
    const names = mentionedIngredients.length ? mentionedIngredients : fridgeNames;
    if (names.some((name) => /西兰花/.test(name))) {
      return {
        reply: "西兰花最省事的做法：水开后焯 60-90 秒，捞出沥干，用蒜末、少量生抽或蚝油拌一下。\n\n如果你想吃热的，就蒜蓉清炒 2 分钟；想更顶饱，加鸡蛋、虾仁或豆腐。只问一句：你现在手边有蒜或鸡蛋吗？"
      };
    }
    if (names.includes("番茄") && names.includes("鸡蛋")) {
      return {
        reply: "番茄和鸡蛋就不用再纠结了：做番茄鸡蛋。\n\n先炒蛋盛出，再炒番茄出汁，把蛋倒回去，盐调味。热量大概 250-320 千卡。想控热量就少油；想顶饱就配半碗饭。"
      };
    }
    const have = names.length ? `你现在有 ${names.slice(0, 5).join("、")}。` : "你还没告诉我冰箱里有什么。";
    return {
      reply: `${have}\n\n我先给一个不纠结的选择：做一个快手蛋白+蔬菜组合，热量大概 250-450 千卡，适合当正餐底盘。\n\n只问一句：你现在是想吃清淡的，还是想解馋一点？`
    };
  }
  if (/西兰花/.test(text)) {
    return {
      reply: "西兰花最省事的做法：水开后焯 60-90 秒，捞出沥干，用蒜末、少量生抽或蚝油拌一下。\n\n如果你想吃热的，就蒜蓉清炒 2 分钟；想更顶饱，加鸡蛋、虾仁或豆腐。只问一句：你现在手边有蒜或鸡蛋吗？"
    };
  }
  return {
    reply: "我先记下。为了不来回打扰，我只问一个：这句话更像是在记录吃了什么、更新冰箱，还是想让我帮你决定吃什么？"
  };
}

function extractIngredientNames(text) {
  const known = ["西兰花", "鸡蛋", "番茄", "青菜", "菠菜", "土豆", "洋葱", "胡萝卜", "黄瓜", "蘑菇", "豆腐", "鸡胸", "牛肉", "猪肉", "三文鱼", "虾仁", "虾", "牛奶", "酸奶", "面条", "米饭", "大米", "香蕉", "苹果", "蓝莓"];
  return [...new Set(known.filter((name) => text.includes(name)))];
}

function buildPrompt(body) {
  return `你是《知食分子》，一个给用户本人使用的生活决策与饮食记忆助手。

语气：自然温和，但别装傻。可以直接指出模式，但不要羞辱用户。
任务：根据用户画像、最近记录和输入，给一个有帮助的回复。尽量只追问一个最关键问题。
如果是图片：先判断是食物、冰箱、购物小票还是看不清；只有看得清食物和份量时才给热量范围。看不清或份量不明时，不要编造，只追问一个最关键问题。
如果是食物：给热量范围时要说明不确定性；判断是饿/累/压力/嘴馋的可能性，并写一句可执行建议。
如果是冰箱/小票：提取库存线索，不要乱猜看不清的内容。
如果是复盘：像 flomo 一样捞出重复模式。

用户画像：
${JSON.stringify(body.profile || {}, null, 2)}

后台记忆：
${(body.memory || []).join("\n")}

最近状态：
${JSON.stringify(body.state || {}, null, 2)}

用户这次输入：
${body.text || "[只有图片]"}

请用中文回答。`;
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content === "string") chunks.push(content);
      if (content.text) chunks.push(content.text);
      if (content.output_text) chunks.push(content.output_text);
    }
    if (typeof item.text === "string") chunks.push(item.text);
    if (item.message?.content) chunks.push(extractNestedText(item.message.content));
  }
  if (Array.isArray(data.choices)) {
    for (const choice of data.choices) chunks.push(extractNestedText(choice.message?.content || choice.text || ""));
  }
  return chunks.join("\n").trim();
}

function extractNestedText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item) => item.text || item.output_text || extractNestedText(item.content)).filter(Boolean).join("\n");
  }
  return value.text || value.output_text || "";
}

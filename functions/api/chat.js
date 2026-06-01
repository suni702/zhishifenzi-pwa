export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const reply = await callAI(body, env);
    return Response.json(reply);
  } catch (error) {
    return Response.json({ error: error.message || "AI request failed" }, { status: 500 });
  }
}

async function callAI(body, env) {
  if (env.ARK_API_KEY) return callArk(body, env);
  if (env.OPENAI_API_KEY) return callOpenAI(body, env);
  return {
    reply: "云端 AI 代理已经启动，但还没有设置 ARK_API_KEY 或 OPENAI_API_KEY。我先用本地逻辑回复；需要真实 AI 时，把密钥放进部署平台环境变量。"
  };
}

async function callArk(body, env) {
  const prompt = buildPrompt(body);
  const imageNote = body.image
    ? "\n\n注意：用户上传了图片，但当前 Ark 文本模型未接入视觉输入。不要编造图片内容，只能说明暂时无法可靠识别，并追问一个关键信息。"
    : "";
  const payload = {
    model: env.ARK_MODEL || "deepseek-v3-2-251201",
    stream: false,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `${prompt}${imageNote}`
          }
        ]
      }
    ]
  };
  if (env.ARK_WEB_SEARCH === "true" && /新闻|热点|今天|最新|发生了什么/.test(body.text || "")) {
    payload.tools = [{ type: "web_search", max_keyword: 3 }];
  }

  const response = await fetch(env.ARK_ENDPOINT || "https://ark.cn-beijing.volces.com/api/v3/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ARK_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ark ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次 Ark 没有生成明确回复。" };
}

async function callOpenAI(body, env) {
  const content = [{ type: "input_text", text: buildPrompt(body) }];
  if (body.image) content.push({ type: "input_image", image_url: body.image, detail: "auto" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{ role: "user", content }]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI ${response.status}: ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次没有生成明确回复。" };
}

function buildPrompt(body) {
  return `你是《知食分子》，一个给用户本人使用的生活决策与饮食记忆助手。

语气：自然温和，但别装傻。可以直接指出模式，但不要羞辱用户。
任务：根据用户画像、最近记录和输入，给一个有帮助的回复。尽量只追问一个最关键问题。
如果是图片：说明你看到了什么、不确定什么、下一步要用户补什么。
如果是食物：给热量范围、判断是饿/累/压力/嘴馋的可能性，并写一句可执行建议。
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

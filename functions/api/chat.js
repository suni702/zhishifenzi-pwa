export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json();
    const reply = await callAI(body, env);
    return Response.json(reply);
  } catch (error) {
    console.warn(error?.message || "AI request failed");
    return Response.json(localFallbackReply(body));
  }
}

async function callAI(body, env) {
  if (body.image && env.OPENAI_API_KEY) return callOpenAI(body, env);
  if (env.ARK_API_KEY) return callArk(body, env);
  if (env.OPENAI_API_KEY) return callOpenAI(body, env);
  return localFallbackReply(body);
}

async function callArk(body, env) {
  if (body.image) return localFallbackReply(body);
  const prompt = buildPrompt(body);
  const payload = {
    model: env.ARK_MODEL || "deepseek-v3-2-251201",
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
    console.warn(`Ark ${response.status}: ${text.slice(0, 300)}`);
    return localFallbackReply(body);
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次 Ark 没有生成明确回复。", aiStatus: "ok" };
}

async function callOpenAI(body, env) {
  const prompt = buildPrompt(body);
  const baseURL = openAIBaseURL(env);
  const reply = await callOpenAIResponses(body, env, prompt, baseURL);
  if (reply) return reply;
  return callOpenAIChatCompletions(body, env, prompt, baseURL);
}

async function callOpenAIResponses(body, env, prompt, baseURL) {
  const content = [{ type: "input_text", text: prompt }];
  if (body.image) content.push({ type: "input_image", image_url: body.image, detail: "auto" });

  const response = await fetch(`${baseURL}/responses`, {
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
    console.warn(`OpenAI ${response.status}: ${text.slice(0, 300)}`);
    return null;
  }

  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次没有生成明确回复。", aiStatus: body.image ? "vision_ok" : "ok" };
}

async function callOpenAIChatCompletions(body, env, prompt, baseURL) {
  const content = body.image
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: body.image } }
      ]
    : prompt;
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [{ role: "user", content }]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.warn(`OpenAI chat ${response.status}: ${text.slice(0, 300)}`);
    return localFallbackReply(body);
  }
  const data = await response.json();
  return { reply: extractText(data) || "我看到了，但这次没有生成明确回复。", aiStatus: body.image ? "vision_ok" : "ok" };
}

function openAIBaseURL(env) {
  return String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function localFallbackReply(body) {
  const text = String(body.text || "").trim();
  const fridge = Array.isArray(body.state?.fridge) ? body.state.fridge : [];
  const fridgeNames = fridge.map((item) => item.name).filter(Boolean);
  const mentionedIngredients = extractIngredientNames(text);
  if (body.image) {
    return {
      reply: "这张图我现在没法稳定看清细节，所以不硬猜。\n\n你补一句就够：这是食物、冰箱，还是小票？如果是食物，再说一下大概是一人份还是多人份，我就按范围估。",
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
    reply: "我有点没接上你的意思。\n\n你直接说我该做哪件事就行：记录这一顿、看图估热量、更新冰箱，还是帮你决定吃什么？"
  };
}

function extractIngredientNames(text) {
  const known = ["西兰花", "鸡蛋", "番茄", "青菜", "菠菜", "土豆", "洋葱", "胡萝卜", "黄瓜", "蘑菇", "豆腐", "鸡胸", "牛肉", "猪肉", "三文鱼", "虾仁", "虾", "牛奶", "酸奶", "面条", "米饭", "大米", "香蕉", "苹果", "蓝莓"];
  return [...new Set(known.filter((name) => text.includes(name)))];
}

function buildPrompt(body) {
  return `你是《知食分子》，一个给用户本人使用的生活决策与饮食记忆助手。

语气：自然温和，但别装傻。可以直接指出模式，但不要羞辱用户。
任务：根据用户画像、最近记录和输入，给一个有帮助的回复。尽量只追问一个最关键问题，不要解释后台分类。
如果是图片：先直接说你看见了什么，判断是食物、冰箱、购物小票还是看不清。看得出菜品但份量不确定时，可以给“低-高范围”并说明不确定来自份量/油量；完全看不清才追问。不要反问“你自己识别觉得呢”。
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

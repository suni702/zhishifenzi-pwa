const STORAGE_KEY = "zhishifenzi-pwa-v3";
const APP_VERSION = "20260604c";
const PUBLIC_APP_URL = "https://zhishifenzi-pwa.pages.dev";
const AUTH_DAYS = 30;
let deferredInstallPrompt = null;
let speechRecognition = null;
let voiceTranscript = "";
let voiceRecorder = null;
let voiceStream = null;
let voiceChunks = [];
let voiceFallbackReason = "";
let lastShakeAt = 0;
let shakeListenerReady = false;
let storageWarningShown = false;
let voiceStartY = 0;

const cuisineOptions = [
  ["🥘", "粤菜"],
  ["🍣", "日料"],
  ["🍜", "东南亚"],
  ["🥗", "地中海"],
  ["🍝", "西式"],
  ["🥩", "韩式"],
  ["🍲", "川菜"],
  ["🥟", "面点"],
  ["🌶️", "湘菜"]
];

const tasteOptions = ["清淡鲜", "辣", "酸辣", "甜", "咸香", "麻", "苦", "酸", "奶香", "蒜香", "酱香", "烟熏"];
const lateNightOptions = ["汤羹", "凉拌", "小吃", "水果", "饮品", "乳制品"];
const restrictionOptions = ["无限制", "低碳水", "低脂", "高蛋白", "素食", "无乳糖"];

const pantryOptions = [
  ["🥚", "鸡蛋", "3个"],
  ["🥬", "青菜", "1把"],
  ["🍅", "番茄", "2个"],
  ["🥔", "土豆", "2个"],
  ["🧅", "洋葱", "1个"],
  ["🍗", "鸡胸", "2块"],
  ["🍤", "虾仁", "1袋"],
  ["◻️", "豆腐", "1盒"],
  ["🥒", "黄瓜", "1根"],
  ["🥛", "牛奶", "1瓶"]
];

const ingredientLibrary = [
  ["🥚", "鸡蛋", "3个"],
  ["🥬", "青菜", "1把"],
  ["🥬", "菠菜", "1把"],
  ["🍅", "番茄", "2个"],
  ["🥔", "土豆", "2个"],
  ["🧅", "洋葱", "1个"],
  ["🥕", "胡萝卜", "1根"],
  ["🥒", "黄瓜", "1根"],
  ["🍆", "茄子", "1根"],
  ["🍄", "蘑菇", "1盒"],
  ["🥦", "西兰花", "1颗"],
  ["🌽", "玉米", "1根"],
  ["🍠", "红薯", "1个"],
  ["◻️", "豆腐", "1盒"],
  ["🍗", "鸡胸", "2块"],
  ["🥩", "牛肉", "1份"],
  ["🥓", "猪肉", "1份"],
  ["🐟", "三文鱼", "1块"],
  ["🍤", "虾仁", "1袋"],
  ["🥛", "牛奶", "1瓶"],
  ["🥣", "酸奶", "1杯"],
  ["🍚", "米饭", "1份"],
  ["🍜", "面条", "1把"],
  ["🍞", "全麦面包", "1袋"],
  ["🍌", "香蕉", "2根"],
  ["🍎", "苹果", "2个"],
  ["🫐", "蓝莓", "1盒"]
];

const recipeSeed = [
  {
    id: "onion-egg-rice",
    emoji: "🥘",
    name: "洋葱炒蛋配米饭",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=640&q=80",
    time: "10分钟",
    calories: 380,
    tags: ["粤菜", "清淡鲜", "早餐", "午餐", "AI推荐", "常吃"],
    need: ["鸡蛋", "洋葱", "大米"],
    steps: ["鸡蛋打散，洋葱切丝。", "热锅少油，先炒洋葱到微甜。", "倒入蛋液推炒成块。", "配一小碗米饭，盐和酱油轻调味。"]
  },
  {
    id: "shrimp-asparagus",
    emoji: "🍤",
    name: "清炒芦笋虾仁",
    image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=640&q=80",
    time: "15分钟",
    calories: 320,
    tags: ["粤菜", "清淡鲜", "高蛋白", "午餐", "晚餐", "AI推荐", "新灵感"],
    need: ["虾仁", "芦笋", "大蒜"],
    steps: ["虾仁解冻吸干水分。", "芦笋切段，蒜切末。", "热油爆香蒜末，下虾仁至变色。", "加入芦笋翻炒2分钟，盐和黑胡椒调味。"]
  },
  {
    id: "seaweed-egg-soup",
    emoji: "🥣",
    name: "紫菜蛋汤",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=640&q=80",
    time: "5分钟",
    calories: 180,
    tags: ["粤菜", "汤羹", "夜宵友好", "解馋", "AI推荐", "常吃"],
    need: ["鸡蛋", "紫菜"],
    steps: ["水开后放入紫菜。", "淋入蛋液，轻轻搅散。", "用盐调味，想更稳可以加一点豆腐。"]
  },
  {
    id: "teriyaki-salmon",
    emoji: "🐟",
    name: "照烧三文鱼",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=640&q=80",
    time: "20分钟",
    calories: 420,
    tags: ["日料", "高蛋白", "晚餐", "AI推荐", "最近吃过"],
    need: ["三文鱼", "青菜"],
    steps: ["三文鱼擦干，两面小火煎香。", "酱油加少量水调汁。", "收汁后配焯青菜。"]
  },
  {
    id: "cold-cucumber",
    emoji: "🥒",
    name: "辣酱黄瓜",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=640&q=80",
    time: "2分钟",
    calories: 50,
    tags: ["川菜", "解馋专区", "凉拌", "解馋", "我收藏", "新灵感"],
    need: ["黄瓜", "辣酱"],
    steps: ["黄瓜拍散切块。", "少量辣酱拌匀。", "想控热量就别额外加油。"]
  },
  {
    id: "tomato-egg",
    emoji: "🍅",
    name: "番茄鸡蛋汤",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=640&q=80",
    time: "8分钟",
    calories: 220,
    tags: ["粤菜", "清淡鲜", "汤羹", "早餐", "晚餐", "AI推荐", "常吃"],
    need: ["番茄", "鸡蛋"],
    steps: ["番茄切块炒出汁。", "加水煮开，淋蛋液。", "盐调味，留一点酸甜感。"]
  },
  {
    id: "chicken-broccoli",
    emoji: "🥦",
    name: "西兰花鸡胸碗",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=640&q=80",
    time: "18分钟",
    calories: 390,
    tags: ["西式", "高蛋白", "午餐", "晚餐", "AI推荐", "新灵感"],
    need: ["鸡胸", "西兰花", "米饭"],
    steps: ["鸡胸切片，用盐和黑胡椒腌5分钟。", "西兰花焯水后沥干。", "少油煎熟鸡胸，和西兰花、半碗米饭装碗。"]
  },
  {
    id: "tofu-mushroom",
    emoji: "🍄",
    name: "蘑菇豆腐煲",
    image: "https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=640&q=80",
    time: "16分钟",
    calories: 260,
    tags: ["粤菜", "清淡鲜", "素食", "晚餐", "AI推荐", "新灵感"],
    need: ["豆腐", "蘑菇", "青菜"],
    steps: ["蘑菇切片，豆腐切块。", "锅里加水或高汤，放蘑菇和豆腐煮开。", "加青菜，盐和少量生抽调味。"]
  },
  {
    id: "korean-beef-rice",
    emoji: "🥩",
    name: "韩式牛肉拌饭",
    image: "https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=640&q=80",
    time: "20分钟",
    calories: 520,
    tags: ["韩式", "午餐", "晚餐", "AI推荐", "最近吃过"],
    need: ["牛肉", "米饭", "青菜"],
    steps: ["牛肉薄片快炒。", "青菜焯水或清炒。", "米饭铺底，加牛肉青菜，少量辣酱拌匀。"]
  },
  {
    id: "mediterranean-tuna-salad",
    emoji: "🥗",
    name: "金枪鱼地中海沙拉",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=80",
    time: "8分钟",
    calories: 310,
    tags: ["地中海", "高蛋白", "午餐", "解馋", "我收藏", "新灵感"],
    need: ["青菜", "番茄", "鸡蛋"],
    steps: ["青菜洗净，番茄切块。", "鸡蛋煮熟切开。", "用少量橄榄油、黑胡椒和盐拌匀。"]
  },
  {
    id: "sichuan-eggplant",
    emoji: "🍆",
    name: "少油鱼香茄子",
    image: "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=640&q=80",
    time: "22分钟",
    calories: 360,
    tags: ["川菜", "晚餐", "解馋专区", "AI推荐", "新灵感"],
    need: ["茄子", "猪肉", "大蒜"],
    steps: ["茄子切条，用微波或蒸锅先软化。", "少油炒蒜末和肉末。", "下茄子，用生抽、醋和一点糖调味。"]
  },
  {
    id: "banana-yogurt-bowl",
    emoji: "🍌",
    name: "香蕉酸奶碗",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=640&q=80",
    time: "3分钟",
    calories: 240,
    tags: ["西式", "早餐", "解馋", "夜宵友好", "我收藏", "新灵感"],
    need: ["香蕉", "酸奶", "蓝莓"],
    steps: ["酸奶倒入碗中。", "香蕉切片，蓝莓洗净。", "想更顶饱可以加一点燕麦。"]
  },
  {
    id: "sweet-potato-milk",
    emoji: "🍠",
    name: "红薯牛奶热饮",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=640&q=80",
    time: "12分钟",
    calories: 210,
    tags: ["早餐", "解馋", "夜宵友好", "汤羹", "AI推荐", "新灵感"],
    need: ["红薯", "牛奶"],
    steps: ["红薯蒸熟或微波加热。", "压成泥后加热牛奶。", "搅匀即可，甜味不够再加一点点蜂蜜。"]
  }
];

const indulgenceSeed = [
  {
    id: "sample-burger",
    emoji: "🍔",
    name: "芝士汉堡",
    estimatedCalories: 850,
    location: "收藏示例",
    tags: ["汉堡", "芝士", "牛肉"],
    description: "面包松软，肉饼多汁。留给想认真犒劳自己的那天。",
    image: "",
    createdAt: 0
  },
  {
    id: "sample-tiramisu",
    emoji: "🍰",
    name: "提拉米苏",
    estimatedCalories: 420,
    location: "收藏示例",
    tags: ["甜品", "咖啡", "奶油"],
    description: "入口即化，不太甜。它不参与日常推荐，但值得被记住。",
    image: "",
    createdAt: 0
  }
];

const fallbackState = {
  phase: "welcome",
  onboardingStep: 1,
  activeTab: "assistant",
  recipeFilter: "全部菜谱",
  recipeFilters: {
    cuisine: "全部",
    scene: "不限",
    time: "不限",
    calories: "不限",
    frequency: "不限",
    source: "不限",
    match: "不限",
    crave: false
  },
  recipeShuffle: 0,
  recentlyShownRecipeIds: [],
  voiceMode: false,
  voiceRecording: false,
  shakeEnabled: true,
  shakeHintSeen: false,
  motionPermissionAsked: false,
  tempRecipes: [],
  archiveOpen: {
    fridge: false,
    inspirations: false,
    indulgence: false,
    dna: false
  },
  manageFridge: false,
  selectedFridgeIds: [],
  modal: null,
  toast: "",
  auth: {
    username: "",
    passwordHash: "",
    displayName: "",
    loggedInUntil: 0,
    createdAt: 0
  },
  profile: {
    name: "用户昵称",
    email: "user@email.com",
    gender: "",
    birthYear: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    goal: "",
    calorieGoal: 1500,
    cuisines: [],
    tastes: [],
    cooking: "",
    mealTime: "",
    lateNight: "",
    lateNightPrefs: [],
    restrictions: [],
    allergies: "",
    notes: []
  },
  onboarding: {
    gender: "",
    birthYear: "",
    height: "",
    currentWeight: "",
    targetWeight: "",
    goal: "",
    cuisines: [],
    tastes: [],
    cuisineOther: "",
    tasteOther: "",
    cooking: "",
    mealTime: "",
    lateNight: "",
    lateNightPrefs: [],
    lateNightOther: "",
    restrictions: [],
    restrictionOther: "",
    allergies: "",
    pantry: [],
    manualPantry: "",
    uploadedOrders: []
  },
  fridge: [],
  meals: [],
  chat: [],
  scans: [],
  inspirations: [],
  indulgences: [],
  memory: [],
  feedbackLog: [],
  lastRecipeId: "onion-egg-rice",
  subPage: ""
  ,
  appVersion: APP_VERSION,
  updateReady: false
};

let state = loadState();

const app = document.querySelector("#app");

document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
document.addEventListener("submit", handleSubmit);
document.addEventListener("change", handleFileChange);
document.addEventListener("pointerdown", handlePointerDown);
document.addEventListener("pointerup", handlePointerUp);
document.addEventListener("pointercancel", handlePointerUp);
document.addEventListener("visibilitychange", stopVoiceRecognition);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.voiceRecording) finishVoiceHold(true);
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  render();
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  showToast("已安装到桌面");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            state.updateReady = true;
            showToast("新版已就绪，点这里刷新");
            saveState();
            render();
          }
        });
      });
    }).catch(() => {});
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (state.updateReady) window.location.reload();
  });
}

render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(fallbackState);
    return normalizeState(JSON.parse(raw));
  } catch {
    return clone(fallbackState);
  }
}

function normalizeState(raw) {
  const base = clone(fallbackState);
  const merged = { ...base, ...raw };
  const previousVersion = raw.appVersion || "legacy";
  merged.appVersion = APP_VERSION;
  merged.profile = { ...base.profile, ...(raw.profile || {}) };
  merged.auth = { ...base.auth, ...(raw.auth || {}) };
  if (!merged.auth.username && raw.auth?.phone) {
    merged.auth.username = raw.auth.phone;
    merged.auth.displayName = raw.auth.phone;
  }
  merged.onboarding = { ...base.onboarding, ...(raw.onboarding || {}) };
  merged.recipeFilters = { ...base.recipeFilters, ...(raw.recipeFilters || {}) };
  merged.archiveOpen = { ...base.archiveOpen, ...(raw.archiveOpen || {}) };
  for (const key of ["fridge", "meals", "chat", "scans", "inspirations", "indulgences", "memory", "selectedFridgeIds", "feedbackLog", "tempRecipes", "recentlyShownRecipeIds"]) {
    merged[key] = Array.isArray(raw[key]) ? raw[key] : base[key];
  }
  if (!["welcome", "onboarding", "journey", "app"].includes(merged.phase)) merged.phase = "welcome";
  if (!["assistant", "archive", "profile"].includes(merged.activeTab)) merged.activeTab = "assistant";
  if (previousVersion !== APP_VERSION && raw.phase === "app") {
    merged.toast = "知食分子已更新到新版";
  }
  return merged;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactStateForStorage(state)));
      if (!storageWarningShown) {
        storageWarningShown = true;
        state.toast = "本地空间有点紧，已优先保留文字记录";
      }
    } catch {}
  }
}

function compactStateForStorage(source) {
  const compact = clone(source);
  compact.chat = (compact.chat || []).slice(-80).map((item) => item.image ? { ...item, image: "" } : item);
  compact.scans = (compact.scans || []).slice(0, 12).map((item) => item.image ? { ...item, image: "" } : item);
  compact.indulgences = (compact.indulgences || []).map((item) => item.image ? { ...item, image: "" } : item);
  compact.onboarding = { ...compact.onboarding, uploadedOrders: [] };
  return compact;
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attr(value = "") {
  return escapeHTML(value);
}

function formatMessageText(value = "") {
  return escapeHTML(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n/g, "<br />");
}

function render() {
  document.body.classList.toggle("voice-recording-active", Boolean(state.voiceRecording));
  if (state.phase === "welcome") {
    app.innerHTML = renderWelcome();
    return;
  }
  if (state.phase === "onboarding") {
    app.innerHTML = renderOnboarding();
    updateBasicPreview();
    return;
  }
  if (state.phase === "journey") {
    app.innerHTML = renderJourney();
    return;
  }
  const shouldStickToChat = state.phase === "app" && !state.subPage && state.activeTab === "assistant";
  app.innerHTML = state.subPage ? renderSubPage(state.subPage) : renderApp();
  if (shouldStickToChat) {
    requestAnimationFrame(() => {
      const view = document.querySelector(".app-view");
      if (view) view.scrollTop = view.scrollHeight;
    });
  }
  setupShakeListener();
}

function renderWelcome() {
  const loggedIn = isLoggedIn();
  return `
    <section class="welcome-screen">
      <div class="welcome-logo">🥗</div>
      <h1>知食分子</h1>
      <div class="welcome-slogan">少一点决策<br />多一点了解</div>
      <p class="welcome-copy">冰箱告诉你有什么<br />灵感告诉你吃什么<br />AI越用越懂你</p>
      <div class="welcome-actions">
        <button class="primary-button start-button" type="button" data-action="start-onboarding">开始</button>
        ${isStandalonePWA() ? "" : `<button class="secondary-button install-button" type="button" data-action="install-pwa">安装到桌面</button>`}
        <button class="login-link" type="button" data-action="open-login">${loggedIn ? `${escapeHTML(accountLabel())} 已登录` : "已有账号？登录"}</button>
      </div>
      ${renderModal()}
    </section>
  `;
}

function renderOnboarding() {
  const step = state.onboardingStep;
  const titles = {
    1: "基础信息",
    2: "饮食偏好",
    3: "饮食习惯",
    4: "初始化冰箱"
  };
  return `
    <section class="onboarding-shell">
      <div class="progress-track"><div class="progress-fill" style="width:${step * 25}%"></div></div>
      <header class="screen-header">
        <button class="back-button" type="button" data-action="back-onboarding" aria-label="返回">←</button>
        <h1>${titles[step]}</h1>
        <span class="header-meta">${step}/4</span>
      </header>
      <div class="onboarding-body">
        ${step === 1 ? renderBasicStep() : ""}
        ${step === 2 ? renderPreferenceStep() : ""}
        ${step === 3 ? renderHabitStep() : ""}
        ${step === 4 ? renderFridgeStep() : ""}
      </div>
    </section>
  `;
}

function renderBasicStep() {
  const o = state.onboarding;
  return `
    <section>
      <h2 class="step-title">告诉我们关于你，<br />这有助于计算你的热量预算。</h2>
      <p class="step-copy">这些信息只服务于你自己的推荐和记录，不会把你变成一张表。</p>
      <div class="form-stack">
        <div class="field">
          <span>性别</span>
          <div class="option-row">
            ${optionButton("gender", "男", "男", o.gender)}
            ${optionButton("gender", "女", "女", o.gender)}
            ${optionButton("gender", "不透露", "不透露", o.gender)}
          </div>
        </div>
        <label class="field">
          出生年份
          <select data-bind="birthYear">
            <option value="">请选择年份</option>
            ${yearOptions(o.birthYear)}
          </select>
        </label>
        <label class="field">
          身高 (cm)
          <input data-bind="height" inputmode="decimal" placeholder="输入身高" value="${attr(o.height)}" />
        </label>
        <label class="field">
          当前体重 (kg)
          <input data-bind="currentWeight" inputmode="decimal" placeholder="输入体重" value="${attr(o.currentWeight)}" />
        </label>
        <label class="field">
          目标体重 (kg)
          <input data-bind="targetWeight" inputmode="decimal" placeholder="输入目标体重" value="${attr(o.targetWeight)}" />
        </label>
        <div class="field">
          <span>你的目标</span>
          <div class="option-row">
            ${optionButton("goal", "减重", "减重", o.goal)}
            ${optionButton("goal", "维持", "维持", o.goal)}
            ${optionButton("goal", "增重", "增重", o.goal)}
          </div>
        </div>
        <div class="habit-card" id="caloriePreview">预算预估：${calculateCalorieBudget(o)} 千卡/天</div>
      </div>
      ${stepActions("下一步", !isBasicComplete())}
    </section>
  `;
}

function renderPreferenceStep() {
  const o = state.onboarding;
  return `
    <section>
      <h2 class="step-title">你喜欢哪些菜系？</h2>
      <p class="step-copy">可多选，AI 会把它们作为口味 DNA 的初始标签。</p>
      <div class="form-stack">
        <div class="food-grid">
          ${cuisineOptions.map(([emoji, label]) => foodOption("cuisines", label, emoji, o.cuisines)).join("")}
        </div>
        <label class="field">
          其他菜系
          <input data-bind="cuisineOther" placeholder="例如：潮汕、云南菜、轻食" value="${attr(o.cuisineOther)}" />
        </label>
        <div class="field">
          <span>你的口味偏好？</span>
          <div class="chip-cloud">
            ${tasteOptions.map((tag) => chipOption("tastes", tag, o.tastes)).join("")}
          </div>
        </div>
        <label class="field">
          其他口味
          <input data-bind="tasteOther" placeholder="例如：茶香、发酵味、锅气" value="${attr(o.tasteOther)}" />
        </label>
      </div>
      ${stepActions("下一步", false)}
    </section>
  `;
}

function renderHabitStep() {
  const o = state.onboarding;
  return `
    <section>
      <h2 class="step-title">你的日常饮食方式，<br />帮助 AI 更精准推荐。</h2>
      <p class="step-copy">这里会影响推荐的复杂度、夜宵建议和忌口提醒。</p>
      <div class="form-stack">
        <div class="field">
          <span>烹饪条件</span>
          <div class="option-row">
            ${optionButton("cooking", "有厨房", "有厨房<br><small>可炒菜</small>", o.cooking)}
            ${optionButton("cooking", "简单灶", "简单灶<br><small>可煮面</small>", o.cooking)}
            ${optionButton("cooking", "无厨房", "无厨房<br><small>靠外卖</small>", o.cooking)}
          </div>
        </div>
        <div class="field">
          <span>每餐可用时间</span>
          <div class="option-row">
            ${optionButton("mealTime", "<15分", "&lt;15分<br><small>快手</small>", o.mealTime)}
            ${optionButton("mealTime", "15-30分钟", "15-30<br><small>分钟</small>", o.mealTime)}
            ${optionButton("mealTime", ">30分钟", "&gt;30分<br><small>享受</small>", o.mealTime)}
          </div>
        </div>
        <div class="field">
          <span>深夜会馋吗？</span>
          <div class="option-row">
            ${optionButton("lateNight", "经常", "经常", o.lateNight)}
            ${optionButton("lateNight", "偶尔", "偶尔", o.lateNight)}
            ${optionButton("lateNight", "从不", "从不", o.lateNight)}
          </div>
        </div>
        <div class="field">
          <span>深夜解馋偏好？</span>
          <div class="option-grid">
            ${lateNightOptions.map((tag) => foodOption("lateNightPrefs", tag, "", o.lateNightPrefs)).join("")}
          </div>
        </div>
        <label class="field">
          其他解馋方式
          <input data-bind="lateNightOther" placeholder="例如：热牛奶、关东煮、酸奶碗" value="${attr(o.lateNightOther)}" />
        </label>
        <div class="field">
          <span>饮食限制？</span>
          <div class="option-grid">
            ${restrictionOptions.map((tag) => foodOption("restrictions", tag, "", o.restrictions)).join("")}
          </div>
        </div>
        <label class="field">
          其他饮食限制
          <input data-bind="restrictionOther" placeholder="例如：少油、少盐、控糖" value="${attr(o.restrictionOther)}" />
        </label>
        <label class="field">
          过敏/忌口食材？
          <input data-bind="allergies" placeholder="例如：花生、海鲜" value="${attr(o.allergies)}" />
        </label>
      </div>
      ${stepActions("下一步", false)}
    </section>
  `;
}

function renderFridgeStep() {
  const o = state.onboarding;
  const selected = getOnboardingPantry();
  const suggestions = ingredientSuggestions(o.manualPantry);
  return `
    <section>
      <h2 class="step-title">冰箱里有什么？</h2>
      <p class="step-copy">告诉小知，它才能把“吃什么”从空想变成可执行。</p>
      <div class="form-stack">
        <div class="field">
          <span>快捷添加常备食材</span>
          <div class="food-grid">
            ${pantryOptions.map(([emoji, name]) => foodOption("pantry", name, emoji, o.pantry)).join("")}
          </div>
        </div>
        <div class="field">
          <span>已选</span>
          <div class="selected-list">
            ${selected.length ? selected.map((item) => `<span class="tag-chip">${item.emoji || "•"}${escapeHTML(item.name)}</span>`).join("") : `<span class="hint-line">还没选，跳过也可以。</span>`}
          </div>
        </div>
        <div class="field">
          <span>手动搜索添加</span>
          <div class="other-row">
            <input id="manualIngredient" data-bind="manualPantry" placeholder="搜索或输入食材..." value="${attr(o.manualPantry)}" />
            <button class="secondary-button" type="button" data-action="add-manual-pantry">添加</button>
          </div>
          <div class="chip-cloud ingredient-suggestions">
            ${suggestions.map((item) => `<button class="choice-chip" type="button" data-action="add-library-ingredient" data-value="${attr(item.name)}">${item.emoji}${escapeHTML(item.name)}</button>`).join("")}
          </div>
        </div>
        <div class="field">
          <span>导入采购记录</span>
          <button class="secondary-button" type="button" data-action="open-order-upload">🖼️ 上传订单截图</button>
          <button class="secondary-button" type="button" data-action="open-fridge-photo">📷 拍照冰箱/小票</button>
          <div class="hint-line">${o.uploadedOrders.length ? `已保存 ${o.uploadedOrders.length} 张图片。看不清时小知会追问，不会硬猜。` : "图片只作为导入线索；识别不确定时会先问你。"}</div>
        </div>
      </div>
      <div class="step-actions">
        <button class="primary-button" type="button" data-action="finish-onboarding">进入知食分子</button>
        <button class="skip-link" type="button" data-action="finish-onboarding">先跳过，以后再说</button>
      </div>
    </section>
  `;
}

function optionButton(key, value, label, current) {
  return `<button class="option-card ${current === value ? "selected" : ""}" type="button" data-action="select-single" data-key="${attr(key)}" data-value="${attr(value)}">${label}</button>`;
}

function foodOption(key, value, emoji, current = []) {
  const isSelected = current.includes(value);
  return `
    <button class="food-card ${isSelected ? "selected" : ""}" type="button" data-action="toggle-multi" data-key="${attr(key)}" data-value="${attr(value)}">
      ${emoji ? `<span class="emoji">${emoji}</span>` : ""}
      <span>${escapeHTML(value)}</span>
    </button>
  `;
}

function chipOption(key, value, current = []) {
  return `<button class="choice-chip ${current.includes(value) ? "selected" : ""}" type="button" data-action="toggle-multi" data-key="${attr(key)}" data-value="${attr(value)}">${escapeHTML(value)}</button>`;
}

function stepActions(label, disabled) {
  return `
    <div class="step-actions">
      <button class="primary-button" type="button" data-action="next-step" ${disabled ? "disabled" : ""}>${label}</button>
      <button class="skip-link" type="button" data-action="skip-step">跳过</button>
    </div>
  `;
}

function yearOptions(selected) {
  const thisYear = new Date().getFullYear();
  let html = "";
  for (let year = thisYear - 12; year >= thisYear - 90; year -= 1) {
    html += `<option value="${year}" ${String(selected) === String(year) ? "selected" : ""}>${year}</option>`;
  }
  return html;
}

function renderJourney() {
  return `
    <section class="journey-shell">
      <div class="journey-card">
        <div class="journey-logo">🥗</div>
        <h1>开始你的旅程</h1>
        <p>小知已经准备好了解你。<br />随时可以在“我的”中修改以上所有设置。</p>
        <button class="primary-button start-button" type="button" data-action="enter-app">好的</button>
      </div>
    </section>
  `;
}

function renderApp() {
  const title = state.activeTab === "assistant" ? "小知" : state.activeTab === "archive" ? "我的记忆" : "我的";
  const meta = state.activeTab === "archive" ? `今日热量剩余 ${remainingCalories()}/${state.profile.calorieGoal}` : "";
  const titleAction = state.activeTab === "archive" ? "toggle-all-archive" : state.activeTab === "profile" ? "edit-profile" : "open-insight";
  return `
    <section class="app-shell">
      <header class="screen-header">
        <button class="header-title-button" type="button" data-action="${attr(titleAction)}">
          <h1>${title}</h1>
        </button>
        <span class="header-meta">${meta}</span>
      </header>
      <div class="app-view">
        ${state.activeTab === "assistant" ? renderAssistantTab() : ""}
        ${state.activeTab === "archive" ? renderArchiveTab() : ""}
        ${state.activeTab === "profile" ? renderProfileTab() : ""}
      </div>
      ${state.activeTab === "assistant" ? renderComposer() : ""}
      ${renderBottomTabs()}
      ${renderModal()}
      ${state.updateReady ? `<button class="update-banner" type="button" data-action="reload-app">新版已就绪，点击刷新</button>` : ""}
      ${state.toast ? `<div class="toast">${escapeHTML(state.toast)}</div>` : ""}
    </section>
  `;
}

function renderAssistantTab() {
  const messages = ensureChat();
  return `
    <section class="tab-panel active">
      <div class="sticky-insight">
        <button class="insight-bar" type="button" data-action="open-insight">
          <span>💡 洞察 · ${escapeHTML(compactInsight())}</span>
          <strong>&gt;</strong>
        </button>
      </div>
      <div class="chat-feed">
        <div class="time-divider">今天 ${formatClock(new Date())}</div>
        ${messages.map(renderMessage).join("")}
      </div>
    </section>
  `;
}

function renderMessage(message) {
  const textHtml = message.text ? `<div class="message-text">${formatMessageText(message.text)}</div>` : "";
  return `
    <div class="message-row ${message.role}">
      <div class="bubble">
        ${message.image ? `<img class="message-image" alt="用户上传的图片" src="${attr(message.image)}" />` : ""}
        ${textHtml}
        ${message.recommendation ? renderRecommendCard(message.recommendation) : ""}
        ${message.feedbackPrompt ? renderFeedbackPrompt(message.feedbackPrompt) : ""}
        ${message.undoMealId ? `<div class="card-actions"><button class="secondary-button" type="button" data-action="undo-meal" data-id="${attr(message.undoMealId)}">撤销</button></div>` : ""}
      </div>
    </div>
  `;
}

function renderRecommendCard(recipe) {
  return `
    <div class="recommend-card">
      <p class="recommend-title">${recipe.emoji || "🥘"} ${escapeHTML(recipe.name)}</p>
      <div class="recommend-meta">
        <span>${recipe.status || "✓ 食材齐全"}</span>
        <span>⏱ ${escapeHTML(recipe.time || "10分钟")}</span>
        <span>🔥 ${Number(recipe.calories || 300)} 千卡</span>
      </div>
      <div class="card-actions">
        <button class="primary-button" type="button" data-action="do-recipe" data-id="${attr(recipe.id)}">做这个</button>
        <button class="secondary-button" type="button" data-action="swap-recipe">换一个</button>
      </div>
    </div>
  `;
}

function renderFeedbackPrompt(prompt) {
  const options = prompt.stage === "craving"
    ? ["是，解馋了", "有点腻", "太清淡", "不用了"]
    : ["😋很饱", "🙂刚好", "😐还行", "😕没饱"];
  return `
    <div class="bubble-card">
      <div class="chip-cloud">
        ${options.map((label) => `<button class="choice-chip" type="button" data-action="answer-feedback" data-stage="${attr(prompt.stage)}" data-meal-id="${attr(prompt.mealId)}" data-value="${attr(label)}">${escapeHTML(label)}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderComposer() {
  if (state.voiceMode) {
    return `
      <form class="assistant-composer voice-composer" id="textComposer">
        <button class="tool-icon" type="button" data-action="toggle-voice-mode" aria-label="切换到键盘">⌨️</button>
        <button class="hold-voice-button ${state.voiceRecording ? "recording" : ""}" type="button" data-action="hold-voice" aria-label="按住说话">
          ${state.voiceRecording ? "松开发送" : "按住说话"}
        </button>
        <button class="tool-icon" type="button" data-action="open-image" aria-label="图片上传">🖼️</button>
      </form>
      ${state.voiceRecording ? `<div class="recording-tip">正在听，松开发送</div>` : ""}
    `;
  }
  return `
    <form class="assistant-composer" id="textComposer">
      <button class="tool-icon" type="button" data-action="toggle-voice-mode" aria-label="切换到语音">🎤</button>
      <input class="text-composer-input" name="message" autocomplete="off" placeholder="和小知说点什么..." />
      <button class="tool-icon" type="button" data-action="open-image" aria-label="图片上传">🖼️</button>
      <button class="send-mini-button" type="submit" aria-label="发送">发送</button>
    </form>
  `;
}

function renderBottomTabs() {
  const tabs = [
    ["assistant", "🤖", "助手", "小知"],
    ["archive", "🧠", "档案", "我的记忆"],
    ["profile", "👤", "我的", "个人中心"]
  ];
  return `
    <nav class="bottom-tabs" aria-label="底部导航">
      ${tabs.map(([id, icon, title, subtitle]) => `
        <button class="tab-button ${state.activeTab === id ? "active" : ""}" type="button" data-action="switch-tab" data-tab="${id}">
          <span class="tab-icon">${icon}</span>
          <span class="tab-title">${title}</span>
          <span>${subtitle}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderArchiveTab() {
  return `
    <section class="tab-panel active">
      ${renderArchiveRoom("fridge", "🧊", "我的冰箱", fridgeSummary(), renderFridgeRoom())}
      ${renderArchiveRoom("inspirations", "💡", "方案灵感库", `${filteredRecipes().length} 个可选 · ${filterSummary()}`, renderInspirationRoom())}
      ${renderArchiveRoom("indulgence", "💝", "口腹之欲", `${indulgences().length} 个收藏 · 不参与日常推荐`, renderIndulgenceRoom())}
      ${renderArchiveRoom("dna", "🧬", "口味DNA", dnaSummary(), renderDnaRoom())}
    </section>
  `;
}

function renderArchiveRoom(key, icon, title, summary, content) {
  const open = Boolean(state.archiveOpen?.[key]);
  const page = archiveRoomPage(key);
  return `
    <section class="archive-room ${open ? "open" : ""}">
      <button class="archive-room-head" type="button" data-action="toggle-archive-room" data-room="${attr(key)}">
        <span class="room-icon">${icon}</span>
        <span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(summary)}</small></span>
        <span class="room-chevron">${open ? "⌃" : "⌄"}</span>
      </button>
      ${open ? `<div class="archive-room-body">
        ${page ? `<button class="room-open-page" type="button" data-action="open-subpage" data-page="${attr(page)}">进入完整页面</button>` : ""}
        ${content}
      </div>` : ""}
    </section>
  `;
}

function archiveRoomPage(key) {
  return {
    fridge: "fridge",
    inspirations: "recipes",
    indulgence: "indulgence",
    dna: "report"
  }[key] || "";
}

function renderFridgeRoom() {
  return `
    <div class="section-title compact-title">
      <span></span>
      <button class="text-button" type="button" data-action="toggle-fridge-manage">${state.manageFridge ? "完成" : "管理"}</button>
    </div>
    <div class="fridge-strip">
      ${state.fridge.length ? state.fridge.map(renderIngredientCard).join("") : `<div class="empty-state compact">冰箱还空着。拍照、上传小票，或直接说“冰箱有鸡蛋 3 个”。</div>`}
    </div>
    <div class="inline-actions">
      <button class="primary-button" type="button" data-action="open-fridge-photo">📷 拍照入库</button>
      <button class="primary-button" type="button" data-action="open-order-upload">🖼️ 图片入库</button>
    </div>
    ${state.manageFridge ? `<button class="danger-button" type="button" data-action="delete-selected-fridge" style="width:100%;margin-top:10px;">删除选中</button>` : ""}
  `;
}

function renderInspirationRoom() {
  return `
    <p class="room-tip">${state.shakeHintSeen ? "筛选、换一批，或者交给小知。" : "拿不准？手机上摇一摇帮你决定。"}</p>
    ${needsMotionPermission() ? `<button class="motion-permission" type="button" data-action="enable-motion">开启摇一摇</button>` : ""}
    <div class="inspiration-toolbar">
      <button class="filter-summary" type="button" data-action="open-filter">🔍 ${escapeHTML(filterSummary())}</button>
      <button class="round-tool ${state.recipeFilters.crave ? "active" : ""}" type="button" data-action="toggle-crave" aria-label="一键解馋">🌙</button>
      <button class="round-tool" type="button" data-action="shuffle-recipes" aria-label="换一批">🔀</button>
    </div>
    ${filteredRecipes().length ? `
      <div class="recipe-grid recipe-grid-animated" style="margin-top:12px;">
        ${visibleRecipes().map(renderRecipeCard).join("")}
      </div>
    ` : `
      <div class="empty-state compact">😕 没有符合条件的灵感
        <div class="card-actions">
          <button class="secondary-button" type="button" data-action="reset-filter">重置筛选</button>
          <button class="primary-button" type="button" data-action="ask-xiaozhi">去问小知</button>
        </div>
      </div>
    `}
  `;
}

function renderIndulgenceRoom() {
  const items = indulgences();
  return `
    <div class="section-title compact-title">
      <span></span>
      <button class="text-button" type="button" data-action="open-subpage" data-page="indulgence">查看全部</button>
    </div>
    <div class="indulgence-strip">
      ${items.slice(0, 6).map(renderIndulgenceMiniCard).join("")}
    </div>
    <div class="inline-actions">
      <button class="secondary-button" type="button" data-action="open-indulgence-form">✍️ 手动添加</button>
      <button class="primary-button" type="button" data-action="open-indulgence-camera">📷 拍照收藏</button>
    </div>
  `;
}

function renderDnaRoom() {
  return `
    <div class="section-title compact-title">
      <span></span>
      <button class="text-button" type="button" data-action="edit-profile">调整偏好</button>
    </div>
    <div class="panel-card flat-card">
      ${renderCuisineBars()}
      <div style="height:14px;"></div>
      <strong>口味标签</strong>
      <div class="chip-cloud" style="margin-top:8px;">
        ${profileTastes().map((tag) => `<button class="tag-chip" type="button" data-action="remove-taste" data-value="${attr(tag)}">${escapeHTML(tag)} ×</button>`).join("")}
        <button class="tag-chip ghost-button" type="button" data-action="edit-profile">+ 添加</button>
      </div>
      <div style="height:16px;"></div>
      <strong>高频食材</strong>
      <div class="word-cloud">${frequentIngredients().map((word) => `<span>${escapeHTML(word)}</span>`).join("")}</div>
      <div class="habit-card">
        <strong>🕐 深夜饮食习惯</strong>
        <p>偏好热量：&lt;150千卡<br />偏好类型：${escapeHTML((state.profile.lateNightPrefs || []).join("、") || "汤羹、凉拌")}<br />频率：${escapeHTML(state.profile.lateNight || "还在观察")}</p>
        <br />
        <strong>饱腹感档案</strong>
        ${renderSatietyProfile()}
      </div>
    </div>
  `;
}

function renderIngredientCard(item) {
  const stateClass = item.freshness === "临期" ? "warning" : item.freshness === "过期" ? "expired" : "";
  const dot = item.freshness === "临期" ? "🟡" : item.freshness === "过期" ? "🔴" : "🟢";
  const checked = state.selectedFridgeIds.includes(item.id) ? "checked" : "";
  return `
    <div class="ingredient-card ${stateClass}">
      ${state.manageFridge ? `<input class="check" type="checkbox" data-action="select-fridge" data-id="${attr(item.id)}" ${checked} />` : ""}
      <div class="ingredient-emoji">${item.emoji || "🥬"}</div>
      <div class="ingredient-name">${escapeHTML(item.name)}</div>
      <div class="ingredient-qty">${escapeHTML(item.qty || "1份")}</div>
      <div class="fresh-label">${dot}${escapeHTML(item.freshness || "新鲜")}</div>
    </div>
  `;
}

function renderRecipeCard(recipe) {
  const status = recipeStatus(recipe);
  const frequency = recipeFrequency(recipe);
  return `
    <button class="recipe-card" type="button" data-action="open-recipe" data-id="${attr(recipe.id)}">
      ${renderRecipeImage(recipe, "recipe-cover")}
      <h3>${escapeHTML(recipe.name)}</h3>
      <p>${escapeHTML(recipeScene(recipe))} · ${escapeHTML(recipe.time)}</p>
      <p class="${status.ready ? "ready" : "missing"}">${escapeHTML(status.label)}</p>
      <p>🔥 ${recipe.calories}千卡</p>
      <span class="frequency-tag ${frequency.className}">${escapeHTML(frequency.label)}</span>
    </button>
  `;
}

function renderRecipeImage(recipe, className) {
  if (!recipe.image) return `<div class="${className} emoji-fallback">${recipe.emoji}</div>`;
  return `
    <div class="${className}">
      <img src="${attr(recipe.image)}" alt="${attr(recipe.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" />
      <span>${recipe.emoji}</span>
    </div>
  `;
}

function renderIndulgenceMiniCard(item) {
  return `
    <button class="indulgence-card mini" type="button" data-action="open-indulgence" data-id="${attr(item.id)}">
      ${item.image ? `<img alt="${attr(item.name)}" src="${attr(item.image)}" />` : `<span class="indulgence-emoji">${item.emoji || "💝"}</span>`}
      <strong>${escapeHTML(item.name)}</strong>
      <small>🔥 ~${Number(item.estimatedCalories || 0) || "?"}千卡</small>
      <small>📍 ${escapeHTML(item.location || "未记录")}</small>
    </button>
  `;
}

function renderIndulgenceListCard(item) {
  return `
    <button class="indulgence-card list" type="button" data-action="open-indulgence" data-id="${attr(item.id)}">
      ${item.image ? `<img alt="${attr(item.name)}" src="${attr(item.image)}" />` : `<span class="indulgence-emoji">${item.emoji || "💝"}</span>`}
      <span>
        <strong>${escapeHTML(item.name)}</strong>
        <small>🔥 ~${Number(item.estimatedCalories || 0) || "?"}千卡</small>
        <small>📍 ${escapeHTML(item.location || "未记录")}</small>
        <small>🏷 ${escapeHTML((item.tags || []).join(" ") || "未加标签")}</small>
        <small>💬 ${escapeHTML(item.description || "还没有描述")}</small>
      </span>
    </button>
  `;
}

function renderCuisineBars() {
  const cuisines = profileCuisines();
  const rows = cuisines.length ? cuisines.slice(0, 4) : ["粤菜", "日料", "东南亚"];
  return rows.map((name, index) => {
    const percent = Math.max(36, 80 - index * 18);
    return `
      <div class="dna-row">
        <span>${escapeHTML(name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
        <span class="header-meta">${percent}%</span>
      </div>
    `;
  }).join("");
}

function renderSatietyProfile() {
  const feedbackMeals = state.meals.filter((meal) => meal.feedback);
  const ideal = feedbackMeals.find((meal) => meal.feedback?.satiety?.includes("刚好"));
  const craving = feedbackMeals.find((meal) => meal.feedback?.craving?.includes("解馋"));
  const notFull = feedbackMeals.find((meal) => meal.feedback?.satiety?.includes("没饱"));
  return `
    <strong>你的理想份量</strong>
    <p>· 早餐：~300千卡 ${ideal?.type === "早餐" ? "刚好" : "刚好"}<br />
    · 午餐：~400千卡 ${ideal?.type === "午餐" ? "刚好" : "刚好"}<br />
    · 晚餐：~450千卡 略多</p>
    <br />
    <strong>最解馋的搭配</strong>
    <p>· 深夜：${escapeHTML((state.profile.lateNightPrefs || []).join(" + ") || "汤羹 + 凉拌")}<br />
    · 周末：${escapeHTML(profileCuisines().slice(0, 2).join(" · ") || "日料 · 粤菜")}</p>
    <br />
    <strong>容易没饱的情况</strong>
    <p>· ${escapeHTML(notFull?.name || craving?.name || "纯蔬菜沙拉")} → 建议加蛋白</p>
  `;
}

function renderProfileTab() {
  const loggedIn = isLoggedIn();
  return `
    <section class="tab-panel active">
      <section class="section">
        <div class="profile-card">
          <div class="avatar">👤</div>
          <h2>${escapeHTML(state.profile.name)}</h2>
          <p>${loggedIn ? `${escapeHTML(accountLabel())} · 30天免登录` : "未登录 · 本地数据可继续使用"}</p>
          <button class="text-button" type="button" data-action="open-login">${loggedIn ? "切换账号" : "账号登录"}</button>
          <button class="text-button" type="button" data-action="edit-profile">编辑个人资料 &gt;</button>
          <button class="install-row" type="button" data-action="install-pwa">
            <span>${isStandalonePWA() ? "已作为 App 打开" : "安装到桌面"}</span>
            <small>${installHint()}</small>
          </button>
          <p class="install-note">${installDetail()}</p>
        </div>
      </section>
      <section class="section">
        <h2 style="font-size:18px;margin:0 0 12px;">本周数据概览</h2>
        <div class="stats-card">
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-icon">📊</span>
              <span class="stat-label">日均摄入</span>
              <span class="stat-value">${averageCalories()}</span>
              <span class="stat-change">↓ 比上周 -80</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🥚</span>
              <span class="stat-label">最常吃</span>
              <span class="stat-value">${escapeHTML(frequentIngredients()[0] || "鸡蛋")}</span>
              <span class="stat-change">${state.meals.length || 14}次</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🍳</span>
              <span class="stat-label">最常做</span>
              <span class="stat-value">${escapeHTML(topRecipeName())}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📈</span>
              <span class="stat-label">热量趋势</span>
              <span class="stat-value">稳步</span>
              <span class="stat-change">按目标靠近</span>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <h2 style="font-size:18px;margin:0 0 12px;">我的数据</h2>
        <div class="list-card">
          ${listRow("📋", "饮食日志", "", "logs")}
          ${listRow("🥘", "我的菜谱", "", "recipes")}
          ${listRow("🧊", "冰箱管理", "", "fridge")}
          ${listRow("📊", "营养报告", "", "report")}
        </div>
      </section>
      <section class="section">
        <h2 style="font-size:18px;margin:0 0 12px;">设置</h2>
        <div class="list-card">
          ${listRow("🎯", "每日热量目标", `当前：${state.profile.calorieGoal}千卡`, "calorie")}
          ${listRow("🔔", "提醒设置", "餐点提醒、临期提醒", "reminders")}
          <button class="list-row" type="button" data-action="toggle-shake-setting">
            <span>📳</span><strong>摇一摇推荐<small>选择困难时随机决定</small></strong><span class="list-arrow">${state.shakeEnabled ? "开" : "关"}</span>
          </button>
          <button class="list-row" type="button" data-action="show-local-data-note">
            <span>💾</span><strong>数据保存<small>当前保存在本机浏览器</small></strong><span class="list-arrow">说明</span>
          </button>
          ${listRow("📤", "导出数据", "导出饮食日志为 JSON", "export")}
          ${listRow("ℹ️", "关于知食分子", "版本 1.0.0", "about")}
          <button class="list-row" type="button" data-action="reset-demo">
            <span>🚪</span><strong style="color:var(--expired);text-align:center;grid-column:2;">退出登录</strong><span></span>
          </button>
        </div>
      </section>
    </section>
  `;
}

function listRow(icon, title, sub, page) {
  return `
    <button class="list-row" type="button" data-action="open-subpage" data-page="${attr(page)}">
      <span>${icon}</span>
      <strong>${escapeHTML(title)}${sub ? `<small>${escapeHTML(sub)}</small>` : ""}</strong>
      <span class="list-arrow">&gt;</span>
    </button>
  `;
}

function renderSubPage(page) {
  const titleMap = {
    logs: "饮食日志",
    recipes: "我的菜谱",
    fridge: "冰箱管理",
    indulgence: "口腹之欲",
    report: "营养报告",
    calorie: "每日热量目标",
    reminders: "提醒设置",
    export: "导出数据",
    about: "关于知食分子"
  };
  return `
    <section class="data-page app-shell">
      <header class="screen-header">
        <button class="back-button" type="button" data-action="close-subpage">←</button>
        <h1>${titleMap[page] || "我的数据"}</h1>
        <span></span>
      </header>
      <div class="app-view">
        ${page === "logs" ? renderLogsPage() : ""}
        ${page === "recipes" ? `<section class="section"><div class="recipe-grid">${recipeSeed.map(renderRecipeCard).join("")}</div></section>` : ""}
        ${page === "fridge" ? `<section class="section"><div class="fridge-strip">${state.fridge.map(renderIngredientCard).join("")}</div><div class="inline-actions"><button class="primary-button" type="button" data-action="open-fridge-photo">📷拍照入库</button><button class="primary-button" type="button" data-action="open-order-upload">🖼️上传订单截图</button></div></section>` : ""}
        ${page === "indulgence" ? renderIndulgencePage() : ""}
        ${page === "report" ? renderReportPage() : ""}
        ${page === "calorie" ? renderCaloriePage() : ""}
        ${page === "reminders" ? renderRemindersPage() : ""}
        ${page === "export" ? renderExportPage() : ""}
        ${page === "about" ? renderAboutPage() : ""}
      </div>
      ${renderModal()}
      ${state.toast ? `<div class="toast">${escapeHTML(state.toast)}</div>` : ""}
    </section>
  `;
}

function renderLogsPage() {
  const filters = ["全部", "早餐", "午餐", "晚餐", "加餐", "解馋"];
  return `
    <section class="section">
      <div class="filter-row">${filters.map((f, i) => `<button class="${i === 0 ? "active" : ""}" type="button">${f}</button>`).join("")}</div>
      <div class="time-divider">6月1日 周一</div>
      ${state.meals.length ? state.meals.map((meal) => `
        <div class="log-card">
          <h3>${meal.icon || "🍽️"} ${escapeHTML(meal.type || "饮食")} · ${escapeHTML(meal.time || formatClock(new Date(meal.createdAt)))}</h3>
          <p><strong>${escapeHTML(meal.name)}</strong></p>
          <p>${meal.calories}千卡</p>
          <p>${escapeHTML((meal.ingredients || []).join(" "))}</p>
          ${meal.feedback ? `<p>感受：${escapeHTML([meal.feedback.satiety, ...(meal.feedback.tags || [])].filter(Boolean).join(" · "))}</p>` : `<div class="card-actions"><button class="secondary-button" type="button" data-action="open-feeling" data-id="${attr(meal.id)}">点击补充感受</button></div>`}
          <div class="card-actions"><button class="secondary-button" type="button" data-action="undo-meal" data-id="${attr(meal.id)}">撤销</button></div>
        </div>
      `).join("") : `<div class="empty-state">今天还没有饮食日志。你可以在助手里直接说“我吃了……”或点“做这个”。</div>`}
    </section>
  `;
}

function renderIndulgencePage() {
  return `
    <section class="section">
      <div class="section-title">
        <h2>想放纵一下时再来</h2>
        <button class="text-button" type="button" data-action="open-indulgence-form">+ 添加</button>
      </div>
      <div class="indulgence-list">
        ${indulgences().map(renderIndulgenceListCard).join("")}
      </div>
    </section>
  `;
}

function renderReportPage() {
  return `
    <section class="section">
      <div class="insight-panel" style="width:100%;max-height:none;">
        ${renderInsightContent()}
      </div>
    </section>
  `;
}

function renderCaloriePage() {
  return `
    <section class="section">
      <div class="panel-card">
        <label class="field">
          每日热量目标 (千卡)
          <input id="calorieGoalInput" inputmode="numeric" value="${attr(state.profile.calorieGoal)}" />
        </label>
        <button class="primary-button" style="width:100%;margin-top:14px;" type="button" data-action="save-calorie-goal">保存</button>
      </div>
    </section>
  `;
}

function renderRemindersPage() {
  return `
    <section class="section">
      <div class="list-card">
        <button class="list-row" type="button"><span>🍽️</span><strong>餐点提醒<small>先在本地展示，后续可接系统通知</small></strong><span class="list-arrow">开</span></button>
        <button class="list-row" type="button"><span>🧊</span><strong>临期提醒<small>库存临期时提醒你先处理</small></strong><span class="list-arrow">开</span></button>
      </div>
    </section>
  `;
}

function renderExportPage() {
  return `
    <section class="section">
      <div class="panel-card">
        <p class="step-copy" style="margin-top:0;">导出会包含画像、冰箱、饮食日志和灵感库。数据仍然在你本地。</p>
        <button class="primary-button" style="width:100%;" type="button" data-action="export-data">导出 JSON</button>
      </div>
    </section>
  `;
}

function renderAboutPage() {
  return `
    <section class="section">
      <div class="profile-card">
        <div class="welcome-logo" style="font-size:52px;">🥗</div>
        <h2>知食分子</h2>
        <p>少一点决策，多一点了解。</p>
        <p>版本 1.0.0</p>
      </div>
    </section>
  `;
}

function renderModal() {
  if (!state.modal) return "";
  if (state.modal.type === "login") return renderLoginSheet();
  if (state.modal.type === "insight") return renderInsightOverlay();
  if (state.modal.type === "profile") return renderProfileSheet();
  if (state.modal.type === "recipe") return renderRecipeDetail();
  if (state.modal.type === "filter") return renderFilterSheet();
  if (state.modal.type === "feeling") return renderFeelingSheet();
  if (state.modal.type === "imageChoice") return renderImageChoiceSheet();
  if (state.modal.type === "installGuide") return renderInstallGuide();
  if (state.modal.type === "indulgenceForm") return renderIndulgenceForm();
  if (state.modal.type === "indulgenceDetail") return renderIndulgenceDetail();
  if (state.modal.type === "shake") return renderShakeModal();
  return "";
}

function renderLoginSheet() {
  const username = state.modal.username || state.auth.username || "";
  return `
    <div class="overlay" data-action="close-modal">
      <form class="sheet" id="loginForm" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>账号登录</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        <p class="step-copy" style="margin-top:0;">第一次输入账号和密码会自动注册在这台设备上；以后用同一组账号密码登录，30 天内不反复打扰你。</p>
        <label class="field">
          账号
          <input name="username" autocomplete="username" placeholder="例如：suni 或邮箱" value="${attr(username)}" />
        </label>
        <label class="field" style="margin-top:12px;">
          密码
          <input name="password" type="password" autocomplete="current-password" placeholder="至少 6 位" />
        </label>
        <button class="primary-button" style="width:100%;margin-top:16px;" type="submit">登录</button>
        <div class="hint-line" style="margin-top:10px;">当前是本机账号，不会上传到云端。朋友打开链接会拥有自己的本地账号和数据。</div>
      </form>
    </div>
  `;
}

function renderFeelingSheet() {
  const meal = state.meals.find((item) => item.id === state.modal.mealId);
  const selected = state.modal.tags || [];
  const satiety = state.modal.satiety || "";
  const tags = ["解馋了", "有点腻", "太清淡", "太辣", "吃完犯困", "很有精神", "太费时间", "刚刚好"];
  return `
    <div class="overlay" data-action="close-modal">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>补充感受</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        <p class="step-copy" style="margin-top:0;">${escapeHTML(meal?.name || "这顿饭")} 吃完感觉怎么样？</p>
        <strong>饱腹感</strong>
        <div class="chip-cloud" style="margin:8px 0 14px;">
          ${["😋很饱", "🙂刚好", "😐还行", "😕没饱"].map((label) => `<button class="choice-chip ${satiety === label ? "selected" : ""}" type="button" data-action="set-feeling-satiety" data-value="${attr(label)}">${escapeHTML(label)}</button>`).join("")}
        </div>
        <strong>补充标签</strong>
        <div class="chip-cloud" style="margin:8px 0 14px;">
          ${tags.map((label) => `<button class="choice-chip ${selected.includes(label) ? "selected" : ""}" type="button" data-action="toggle-feeling-tag" data-value="${attr(label)}">${escapeHTML(label)}</button>`).join("")}
        </div>
        <label class="field">自定义输入<input id="feelingCustom" value="${attr(state.modal.custom || "")}" placeholder="例如：口味刚好，但有点撑" /></label>
        <div class="inline-actions">
          <button class="secondary-button" type="button" data-action="skip-feeling">跳过</button>
          <button class="primary-button" type="button" data-action="save-feeling">保存</button>
        </div>
      </div>
    </div>
  `;
}

function renderImageChoiceSheet() {
  return `
    <div class="overlay" data-action="close-modal">
      <div class="sheet compact-sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>发送图片</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        <p class="step-copy" style="margin-top:0;">发图片后，小知会先看图；如果当前没有接入视觉模型，或图片看不清，会直接问你补充信息，不会硬猜热量。</p>
        <div class="attachment-menu">
          <button class="menu-item" type="button" data-action="open-camera">📷 拍照</button>
          <button class="menu-item" type="button" data-action="open-image-picker">🖼️ 从相册选</button>
        </div>
      </div>
    </div>
  `;
}

function renderInstallGuide() {
  return `
    <div class="overlay" data-action="close-modal">
      <div class="sheet compact-sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>添加到桌面</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        <div class="install-guide">
          <strong>${escapeHTML(installGuideTitle())}</strong>
          <p>${escapeHTML(installDetail())}</p>
          <div class="install-url">${escapeHTML(PUBLIC_APP_URL)}</div>
          <button class="secondary-button" type="button" data-action="copy-public-url">复制公网链接</button>
        </div>
      </div>
    </div>
  `;
}

function renderIndulgenceForm() {
  const draft = state.modal.draft || {};
  return `
    <div class="overlay" data-action="close-modal">
      <form class="sheet" id="indulgenceForm" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>${state.modal.id ? "编辑口腹之欲" : "添加口腹之欲"}</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        ${draft.image ? `<img class="form-preview-image" alt="已选图片" src="${attr(draft.image)}" />` : ""}
        <label class="field">美食名称<input name="name" value="${attr(draft.name || "")}" placeholder="例如：芝士汉堡" /></label>
        <label class="field">估算热量（可选）<input name="estimatedCalories" inputmode="numeric" value="${attr(draft.estimatedCalories || "")}" placeholder="千卡" /></label>
        <label class="field">在哪吃的/买的<input name="location" value="${attr(draft.location || "")}" placeholder="例如：XX餐厅" /></label>
        <label class="field">标签（可选）<input name="tags" value="${attr((draft.tags || []).join(" "))}" placeholder="汉堡 芝士 牛肉" /></label>
        <label class="field">一句话描述（可选）<textarea name="description" rows="3" placeholder="为什么觉得好吃">${escapeHTML(draft.description || "")}</textarea></label>
        <div class="inline-actions">
          <button class="secondary-button" type="button" data-action="open-indulgence-camera">📷 拍照</button>
          <button class="secondary-button" type="button" data-action="open-indulgence-upload">🖼️ 上传</button>
        </div>
        <button class="primary-button" style="width:100%;margin-top:14px;" type="submit">保存</button>
      </form>
    </div>
  `;
}

function renderIndulgenceDetail() {
  const item = indulgences().find((entry) => entry.id === state.modal.id) || indulgences()[0];
  if (!item) return "";
  return `
    <div class="overlay" data-action="close-modal">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>${escapeHTML(item.name)}</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        ${item.image ? `<img class="form-preview-image" alt="${attr(item.name)}" src="${attr(item.image)}" />` : `<div class="indulgence-detail-emoji">${item.emoji || "💝"}</div>`}
        <div class="habit-card">
          <p>🔥 ~${Number(item.estimatedCalories || 0) || "?"}千卡</p>
          <p>📍 ${escapeHTML(item.location || "未记录")}</p>
          <p>🏷 ${escapeHTML((item.tags || []).join(" ") || "未加标签")}</p>
          <p>💬 ${escapeHTML(item.description || "还没有描述")}</p>
        </div>
        <div class="inline-actions">
          <button class="secondary-button" type="button" data-action="delete-indulgence" data-id="${attr(item.id)}">删除</button>
          <button class="primary-button" type="button" data-action="edit-indulgence" data-id="${attr(item.id)}">编辑</button>
        </div>
      </div>
    </div>
  `;
}

function renderShakeModal() {
  const recipe = recipeSeed.find((item) => item.id === state.modal.recipeId) || filteredRecipes()[0];
  const empty = state.modal.empty;
  return `
    <div class="overlay center" data-action="close-modal">
      <div class="shake-panel" role="dialog" aria-modal="true">
        ${empty ? `
          <div class="shake-icon">😕</div>
          <h2>没有符合条件的灵感</h2>
          <p>试试放宽筛选，或者直接问小知。</p>
          <div class="card-actions">
            <button class="secondary-button" type="button" data-action="reset-filter">重置筛选</button>
            <button class="primary-button" type="button" data-action="ask-xiaozhi">去问小知</button>
          </div>
        ` : `
          <div class="shake-icon">📳</div>
          <div class="shake-card">
            <strong>${escapeHTML(recipe?.name || "就它了")}</strong>
            <span>${Number(recipe?.calories || 0)}千卡</span>
          </div>
          <h2>${state.modal.onlyOne ? "只有一道，就它了" : "今天吃这个？"}</h2>
          <div class="card-actions">
            <button class="primary-button" type="button" data-action="accept-shake" data-id="${attr(recipe?.id || "")}">就它了</button>
            <button class="secondary-button" type="button" data-action="shake-again">再摇一次</button>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderFilterSheet() {
  const draft = state.modal.draft || state.recipeFilters;
  return `
    <div class="overlay" data-action="close-modal">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <h2>筛选灵感</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        ${filterGroup("菜系", "cuisine", ["全部", "粤菜", "日料", "东南亚", "地中海", "川菜", "韩式", "西式"], draft)}
        ${filterGroup("场景", "scene", ["不限", "早餐", "午餐", "晚餐", "解馋", "待客"], draft)}
        ${filterGroup("烹饪时间", "time", ["不限", "<15分钟", "15-30分钟", ">30分钟"], draft)}
        ${filterGroup("热量范围", "calories", ["不限", "<200千卡", "200-400", "400-600", ">600千卡"], draft)}
        ${filterGroup("频率", "frequency", ["不限", "🌟常吃", "🕐最近吃过", "🆕还没试过"], draft)}
        ${filterGroup("来源", "source", ["不限", "📷小红书", "🎤我说过的", "🤖AI推荐", "✍️我收藏"], draft)}
        ${filterGroup("食材匹配", "match", ["不限", "✓食材齐全", "⚠️缺1-2样"], draft)}
        <div class="inline-actions" style="position:sticky;bottom:0;background:#fff;padding-top:12px;">
          <button class="secondary-button" type="button" data-action="reset-filter-draft">重置</button>
          <button class="primary-button" type="button" data-action="apply-filter">确认</button>
        </div>
      </div>
    </div>
  `;
}

function filterGroup(title, key, options, draft) {
  return `
    <div class="filter-group">
      <strong>${escapeHTML(title)}</strong>
      <div class="chip-cloud">
        ${options.map((option) => `<button class="choice-chip ${draft[key] === option ? "selected" : ""}" type="button" data-action="set-filter-draft" data-key="${attr(key)}" data-value="${attr(option)}">${escapeHTML(option)}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderInsightOverlay() {
  return `
    <div class="overlay center" data-action="close-modal">
      <div class="insight-panel" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>💡 本周饮食洞察</h2>
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        ${renderInsightContent()}
        <button class="primary-button" style="width:100%;margin-top:16px;" type="button" data-action="open-report">查看完整周报</button>
      </div>
    </div>
  `;
}

function renderInsightContent() {
  const avg = averageCalories();
  const top = frequentIngredients().slice(0, 4).join(" · ") || "鸡蛋 · 豆腐 · 虾 · 菠菜";
  return `
    <div class="insight-block">
      <h3>📊 热量</h3>
      <p>日均摄入：${avg}千卡</p>
      <p>比上周：-80千卡 ↓</p>
    </div>
    <div class="insight-block">
      <h3>🥩 宏量营养</h3>
      <p>蛋白质 ████████░░ 32% ↑</p>
      <p>碳水   ██████░░░░ 25% ↓</p>
      <p>脂肪   █████████░ 43% →</p>
    </div>
    <div class="insight-block">
      <h3>🍳 烹饪习惯</h3>
      <p>最常做：${escapeHTML(topRecipeName())}</p>
      <p>新尝试：${Math.max(3, state.meals.length)}道新菜</p>
    </div>
    <div class="insight-block">
      <h3>🧬 口味变化</h3>
      <p>${escapeHTML(profileCuisines()[0] || "粤菜")}偏好稳定</p>
      <p>${escapeHTML(profileTastes()[0] || "清淡鲜")}标签权重上升</p>
    </div>
    <div class="insight-block">
      <h3>🥘 高频食材</h3>
      <p>${escapeHTML(top)}</p>
    </div>
    <div class="insight-block">
      <h3>💡 小知建议</h3>
      <p>${escapeHTML(compactInsight())}</p>
    </div>
  `;
}

function renderProfileSheet() {
  return `
    <div class="overlay" data-action="close-modal">
      <form class="sheet" id="profileForm" role="dialog" aria-modal="true">
        <div class="sheet-header"><h2>编辑个人资料</h2><button class="close-button" type="button" data-action="close-modal">✕</button></div>
        <label class="field">昵称<input name="name" value="${attr(state.profile.name)}" /></label>
        <label class="field">邮箱<input name="email" value="${attr(state.profile.email)}" /></label>
        <label class="field">性别<select name="gender">${["", "男", "女", "不透露"].map((v) => `<option value="${attr(v)}" ${state.profile.gender === v ? "selected" : ""}>${v || "请选择"}</option>`).join("")}</select></label>
        <label class="field">出生年份<input name="birthYear" inputmode="numeric" value="${attr(state.profile.birthYear)}" /></label>
        <label class="field">身高 (cm)<input name="height" inputmode="decimal" value="${attr(state.profile.height)}" /></label>
        <label class="field">体重 (kg)<input name="currentWeight" inputmode="decimal" value="${attr(state.profile.currentWeight)}" /></label>
        <label class="field">每日热量目标 (千卡)<input name="calorieGoal" inputmode="numeric" value="${attr(state.profile.calorieGoal)}" /></label>
        <label class="field">菜系偏好<input name="cuisines" value="${attr(profileCuisines().join("、"))}" /></label>
        <label class="field">口味标签<input name="tastes" value="${attr(profileTastes().join("、"))}" /></label>
        <button class="primary-button" style="width:100%;position:sticky;bottom:0;" type="submit">保存</button>
      </form>
    </div>
  `;
}

function renderRecipeDetail() {
  const recipe = recipeSeed.find((item) => item.id === state.modal.id) || recipeSeed[0];
  const status = recipeStatus(recipe);
  return `
    <div class="overlay" data-action="close-modal">
      <div class="recipe-detail" role="dialog" aria-modal="true">
        <div class="modal-header" style="padding:10px 12px;margin:0;position:absolute;right:0;z-index:2;">
          <button class="close-button" type="button" data-action="close-modal">✕</button>
        </div>
        ${renderRecipeImage(recipe, "recipe-hero")}
        <div class="detail-body">
          <h2>${escapeHTML(recipe.name)}</h2>
          <p class="header-meta">⏱ ${escapeHTML(recipe.time)}　🔥 ${recipe.calories}千卡</p>
          <h3>📋 所需食材</h3>
          <ul>${recipe.need.map((item) => `<li>${hasIngredient(item) ? "✓" : "⚠️"} ${escapeHTML(item)} ${hasIngredient(item) ? "(冰箱有)" : "(缺少)"}</li>`).join("")}</ul>
          <h3>📝 步骤</h3>
          <ol>${recipe.steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
          <div class="card-actions">
            <button class="primary-button" type="button" data-action="do-recipe" data-id="${attr(recipe.id)}">做这个</button>
            <button class="secondary-button" type="button" data-action="edit-placeholder">编辑</button>
            <button class="secondary-button" type="button" data-action="delete-recipe-placeholder">删除</button>
          </div>
          <p class="hint-line" style="margin-top:12px;">${escapeHTML(status.label)}</p>
        </div>
      </div>
    </div>
  `;
}

function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "close-modal" && target.classList.contains("overlay") && event.target !== target) return;
  event.preventDefault();

  if (action === "start-onboarding") {
    state.phase = "onboarding";
    state.onboardingStep = 1;
  }
  if (action === "install-pwa") {
    installPWA();
    return;
  }
  if (action === "reload-app") {
    applyPendingUpdate();
    return;
  }
  if (action === "open-login") state.modal = { type: "login", username: state.auth.username || "" };
  if (action === "back-onboarding") {
    if (state.onboardingStep > 1) state.onboardingStep -= 1;
    else state.phase = "welcome";
  }
  if (action === "next-step") {
    if (state.onboardingStep < 4) state.onboardingStep += 1;
  }
  if (action === "skip-step") {
    if (state.onboardingStep < 4) state.onboardingStep += 1;
    else finishOnboarding();
  }
  if (action === "select-single") {
    state.onboarding[target.dataset.key] = target.dataset.value;
  }
  if (action === "toggle-multi") toggleArray(state.onboarding[target.dataset.key], target.dataset.value);
  if (action === "add-library-ingredient") addPantryByName(target.dataset.value);
  if (action === "add-manual-pantry") addManualPantry();
  if (action === "open-order-upload") {
    openFileInput("orderImageInput");
    return;
  }
  if (action === "open-fridge-photo") {
    openFileInput("fridgePhotoInput");
    return;
  }
  if (action === "finish-onboarding") finishOnboarding();
  if (action === "enter-app") {
    state.phase = "app";
    state.activeTab = "assistant";
  }
  if (action === "switch-tab") {
    state.activeTab = target.dataset.tab;
    state.modal = null;
    state.subPage = "";
  }
  if (action === "toggle-all-archive") {
    const allOpen = Object.values(state.archiveOpen || {}).every(Boolean);
    Object.keys(state.archiveOpen || {}).forEach((key) => {
      state.archiveOpen[key] = !allOpen;
    });
    showToast(allOpen ? "已收起档案" : "已展开档案");
  }
  if (action === "open-insight") state.modal = { type: "insight" };
  if (action === "toggle-voice-mode") {
    state.voiceMode = !state.voiceMode;
    state.voiceRecording = false;
    stopVoiceRecognition();
  }
  if (action === "close-modal") state.modal = null;
  if (action === "open-image") state.modal = { type: "imageChoice" };
  if (action === "open-image-picker") {
    openFileInput("assistantImageInput");
    return;
  }
  if (action === "open-camera") {
    openFileInput("assistantCameraInput");
    return;
  }
  if (action === "toggle-fridge-manage") {
    state.manageFridge = !state.manageFridge;
    state.selectedFridgeIds = [];
  }
  if (action === "toggle-archive-room") {
    state.archiveOpen[target.dataset.room] = !state.archiveOpen[target.dataset.room];
  }
  if (action === "select-fridge") toggleArray(state.selectedFridgeIds, target.dataset.id);
  if (action === "delete-selected-fridge") deleteSelectedFridge();
  if (action === "open-filter") state.modal = { type: "filter", draft: { ...state.recipeFilters } };
  if (action === "set-filter-draft" && state.modal?.type === "filter") state.modal.draft[target.dataset.key] = target.dataset.value;
  if (action === "reset-filter-draft" && state.modal?.type === "filter") state.modal.draft = { ...fallbackState.recipeFilters };
  if (action === "apply-filter" && state.modal?.type === "filter") {
    state.recipeFilters = { ...state.modal.draft };
    state.modal = null;
    showToast(`✅找到${filteredRecipes().length}个`);
  }
  if (action === "reset-filter") {
    state.recipeFilters = { ...fallbackState.recipeFilters };
    showToast("筛选已重置");
  }
  if (action === "toggle-crave") {
    state.recipeFilters.crave = !state.recipeFilters.crave;
    if (state.recipeFilters.crave) {
      state.recipeFilters.scene = "解馋";
      state.recipeFilters.calories = "<200千卡";
    }
  }
  if (action === "shuffle-recipes") {
    rememberShownRecipes(visibleRecipes().map((recipe) => recipe.id));
    state.recipeShuffle += 1;
    showToast(`换好了，尽量避开刚看过的`);
  }
  if (action === "open-indulgence-form") state.modal = { type: "indulgenceForm", draft: {} };
  if (action === "open-indulgence-camera") {
    openFileInput("indulgencePhotoInput");
    return;
  }
  if (action === "open-indulgence-upload") {
    openFileInput("indulgenceImageInput");
    return;
  }
  if (action === "copy-public-url") {
    copyPublicUrl();
    return;
  }
  if (action === "open-indulgence") state.modal = { type: "indulgenceDetail", id: target.dataset.id };
  if (action === "edit-indulgence") {
    const item = indulgences().find((entry) => entry.id === target.dataset.id);
    if (item) state.modal = { type: "indulgenceForm", id: item.id, draft: { ...item } };
  }
  if (action === "delete-indulgence") deleteIndulgence(target.dataset.id);
  if (action === "accept-shake") {
    state.modal = null;
    state.activeTab = "assistant";
    sendUserText(`做${recipeSeed.find((recipe) => recipe.id === target.dataset.id)?.name || "这个"}`);
    return;
  }
  if (action === "shake-again") triggerShakePick(true);
  if (action === "enable-motion") {
    enableMotionAccess();
    return;
  }
  if (action === "ask-xiaozhi") {
    state.activeTab = "assistant";
    sendUserText("现在没有符合条件的灵感，帮我按现有冰箱想一个");
    return;
  }
  if (action === "open-recipe") state.modal = { type: "recipe", id: target.dataset.id };
  if (action === "do-recipe") doRecipe(target.dataset.id);
  if (action === "swap-recipe") swapRecipe();
  if (action === "undo-meal") undoMeal(target.dataset.id);
  if (action === "answer-feedback") answerFeedback(target.dataset.mealId, target.dataset.stage, target.dataset.value);
  if (action === "open-feeling") state.modal = { type: "feeling", mealId: target.dataset.id, tags: [] };
  if (action === "set-feeling-satiety" && state.modal?.type === "feeling") state.modal.satiety = target.dataset.value;
  if (action === "toggle-feeling-tag" && state.modal?.type === "feeling") toggleArray(state.modal.tags, target.dataset.value);
  if (action === "skip-feeling") state.modal = null;
  if (action === "save-feeling") saveFeeling();
  if (action === "edit-profile") state.modal = { type: "profile" };
  if (action === "remove-taste") removeTaste(target.dataset.value);
  if (action === "open-report") {
    state.modal = null;
    state.subPage = "report";
    state.activeTab = "profile";
  }
  if (action === "open-subpage") state.subPage = target.dataset.page;
  if (action === "close-subpage") state.subPage = "";
  if (action === "save-calorie-goal") saveCalorieGoal();
  if (action === "toggle-shake-setting") {
    state.shakeEnabled = !state.shakeEnabled;
    showToast(state.shakeEnabled ? "摇一摇推荐已开启" : "摇一摇推荐已关闭");
  }
  if (action === "show-local-data-note") {
    addAssistantText("当前数据先保存在这台设备的浏览器里。朋友打开链接会有自己的本地数据，不会看到你的记录。以后要多设备同步，需要再接数据库和正式账号系统。");
    state.activeTab = "assistant";
  }
  if (action === "export-data") exportData();
  if (action === "reset-demo") logout();
  if (action === "edit-placeholder") showToast("编辑菜谱会在下一版开放。");
  if (action === "delete-recipe-placeholder") showToast("系统菜谱先不删除，你可以先收藏/忽略。");

  saveState();
  render();
}

function handleInput(event) {
  const target = event.target;
  if (!target.dataset.bind) return;
  state.onboarding[target.dataset.bind] = target.value;
  saveState();
  if (state.onboardingStep === 1) updateBasicPreview();
}

function handleSubmit(event) {
  event.preventDefault();
  if (event.target.id === "textComposer") {
    const input = event.target.elements.message;
    const text = input?.value.trim();
    if (text) sendUserText(text);
    if (input) input.value = "";
    return;
  }
  if (event.target.id === "loginForm") {
    const form = new FormData(event.target);
    const username = cleanUsername(form.get("username"));
    const password = String(form.get("password") || "");
    if (!username) {
      showToast("先填账号");
      saveState();
      render();
      return;
    }
    if (password.length < 6) {
      showToast("密码至少 6 位");
      saveState();
      render();
      return;
    }
    loginWithPassword(username, password);
    return;
  }
  if (event.target.id === "profileForm") {
    const form = new FormData(event.target);
    state.profile.name = form.get("name")?.trim() || "用户昵称";
    state.profile.email = form.get("email")?.trim() || "user@email.com";
    state.profile.gender = form.get("gender") || "";
    state.profile.birthYear = form.get("birthYear") || "";
    state.profile.height = form.get("height") || "";
    state.profile.currentWeight = form.get("currentWeight") || "";
    state.profile.calorieGoal = Number(form.get("calorieGoal")) || state.profile.calorieGoal;
    state.profile.cuisines = splitList(form.get("cuisines"));
    state.profile.tastes = splitList(form.get("tastes"));
    state.modal = null;
    addMemory("profile", "用户更新了个人资料与口味偏好。");
    saveState();
    render();
  }
  if (event.target.id === "indulgenceForm") {
    const form = new FormData(event.target);
    const draft = state.modal?.draft || {};
    const item = {
      id: state.modal?.id || uid("indulgence"),
      emoji: draft.emoji || inferIndulgenceEmoji(form.get("name")),
      name: form.get("name")?.trim() || "未命名美食",
      estimatedCalories: Number(form.get("estimatedCalories")) || 0,
      location: form.get("location")?.trim() || "",
      tags: splitList(form.get("tags")),
      description: form.get("description")?.trim() || "",
      image: draft.image || "",
      createdAt: draft.createdAt || Date.now()
    };
    const index = state.indulgences.findIndex((entry) => entry.id === item.id);
    if (index >= 0) state.indulgences[index] = item;
    else state.indulgences.unshift(item);
    addMemory("indulgence", `收藏口腹之欲：${item.name}`);
    state.modal = null;
    showToast("已收藏到口腹之欲");
    saveState();
    render();
  }
}

async function handleFileChange(event) {
  const target = event.target;
  if (!["assistantImageInput", "assistantCameraInput", "fridgePhotoInput", "orderImageInput", "indulgencePhotoInput", "indulgenceImageInput"].includes(target.id)) return;
  const images = await readFiles(target.files || [], target.id);
  target.value = "";
  if (!images.length) {
    showToast("图片没读到，换一张或用相册上传");
    saveState();
    render();
    return;
  }

  if (target.id === "assistantImageInput" || target.id === "assistantCameraInput") {
    images.slice(0, 3).forEach((image) => sendUserImage(image));
  } else if (target.id === "indulgencePhotoInput" || target.id === "indulgenceImageInput") {
    const image = images[0];
    state.modal = {
      type: "indulgenceForm",
      draft: {
        image,
        name: "",
        estimatedCalories: "",
        location: "",
        tags: [],
        description: ""
      }
    };
  } else {
    images.forEach((image) => {
      state.scans.unshift({ id: uid("scan"), type: target.id === "orderImageInput" ? "order" : "fridge", image, createdAt: Date.now(), note: "图片导入，等待确认" });
      if (state.phase === "onboarding") state.onboarding.uploadedOrders.push(image);
    });
    addAssistantText("图片已保存。我不会直接硬猜库存；如果看不清，我会问你一个确认问题。你也可以直接说：鸡蛋 3 个、青菜 1 把。");
    showToast("图片已保存");
  }
  saveState();
  render();
}

function readFiles(fileList, inputId = "") {
  const limit = inputId === "assistantImageInput" ? 3 : 1;
  return Promise.all(Array.from(fileList).slice(0, limit).map((file) => compressImageFile(file))).then((items) => items.filter(Boolean));
}

function compressImageFile(file) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith("image/")) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ""));
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function handlePointerDown(event) {
  const target = event.target.closest('[data-action="hold-voice"]');
  if (!target) return;
  event.preventDefault();
  try {
    target.setPointerCapture?.(event.pointerId);
  } catch {}
  voiceStartY = event.clientY || 0;
  startVoiceHold();
}

function handlePointerUp(event) {
  if (!state.voiceRecording) return;
  event.preventDefault();
  const cancelled = event.type === "pointercancel" || isVoiceCancelGesture(event);
  finishVoiceHold(cancelled);
}

function startVoiceHold() {
  state.voiceRecording = true;
  voiceTranscript = "";
  voiceFallbackReason = "";
  startVoiceCapture();
  saveState();
  render();
}

function isVoiceCancelGesture(event) {
  return Boolean(voiceStartY && event.clientY && voiceStartY - event.clientY > 50);
}

async function finishVoiceHold(cancelled = false) {
  const text = voiceTranscript.trim();
  state.voiceRecording = false;
  stopVoiceRecognition();
  const audio = await stopVoiceRecording();
  saveState();
  render();
  if (cancelled) {
    showToast("已取消语音");
    return;
  }
  if (text) {
    sendUserText(text);
  } else if (audio) {
    showToast("正在转文字...");
    transcribeVoice(audio);
  } else {
    showToast(voiceFallbackReason || "这次语音没录到，可以再按一次");
  }
}

function supportsSpeechRecognition() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function startVoiceCapture() {
  const nativeStarted = startVoiceRecognition();
  startVoiceRecording();
  if (!nativeStarted && !supportsMediaRecording()) {
    voiceFallbackReason = "这个浏览器没有开放语音录入，先用键盘输入";
  }
}

function startVoiceRecognition() {
  if (!supportsSpeechRecognition()) return false;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecognition = new Recognition();
  speechRecognition.lang = "zh-CN";
  speechRecognition.interimResults = true;
  speechRecognition.continuous = true;
  speechRecognition.onresult = (event) => {
    voiceTranscript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join("")
      .trim();
  };
  speechRecognition.onerror = () => {};
  try {
    speechRecognition.start();
    return true;
  } catch {
    speechRecognition = null;
    return false;
  }
}

function stopVoiceRecognition() {
  if (!speechRecognition) return;
  try {
    speechRecognition.stop();
  } catch {}
  speechRecognition = null;
}

function supportsMediaRecording() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

async function startVoiceRecording() {
  if (!supportsMediaRecording()) return false;
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks = [];
    const mimeType = pickAudioMimeType();
    voiceRecorder = new MediaRecorder(voiceStream, mimeType ? { mimeType } : undefined);
    voiceRecorder.ondataavailable = (event) => {
      if (event.data?.size) voiceChunks.push(event.data);
    };
    voiceRecorder.start();
    return true;
  } catch {
    voiceFallbackReason = "没拿到麦克风权限，先用键盘输入";
    stopVoiceTracks();
    return false;
  }
}

function pickAudioMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

function stopVoiceRecording() {
  return new Promise((resolve) => {
    if (!voiceRecorder) {
      stopVoiceTracks();
      resolve(null);
      return;
    }
    const recorder = voiceRecorder;
    voiceRecorder = null;
    recorder.onstop = async () => {
      const blob = new Blob(voiceChunks, { type: recorder.mimeType || "audio/webm" });
      voiceChunks = [];
      stopVoiceTracks();
      if (!blob.size) {
        resolve(null);
        return;
      }
      resolve({
        data: await blobToDataURL(blob),
        mimeType: blob.type || "audio/webm"
      });
    };
    try {
      if (recorder.state !== "inactive") recorder.stop();
      else recorder.onstop();
    } catch {
      stopVoiceTracks();
      resolve(null);
    }
  });
}

function stopVoiceTracks() {
  try {
    voiceStream?.getTracks?.().forEach((track) => track.stop());
  } catch {}
  voiceStream = null;
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function transcribeVoice(audio) {
  const remote = await tryTranscribeVoice(audio);
  if (remote?.text) {
    sendUserText(remote.text);
    return;
  }
  showToast(remote?.message || "语音没转成文字，先用键盘输入");
}

async function tryTranscribeVoice(audio) {
  if (!["http:", "https:"].includes(window.location.protocol)) {
    return { message: "本地文件打开不能转语音，请用公网链接" };
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch("./api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: audio.data, mimeType: audio.mimeType }),
      signal: controller.signal
    });
    if (!response.ok) return { message: "语音转文字接口暂时不可用" };
    const data = await response.json();
    return {
      text: String(data.text || "").trim(),
      message: data.message || ""
    };
  } catch {
    return { message: "语音转文字超时了，先用键盘输入" };
  } finally {
    window.clearTimeout(timer);
  }
}

function openFileInput(id) {
  const input = document.querySelector(`#${id}`);
  if (!input) {
    showToast("这个上传入口没找到，我来修。");
    return;
  }
  input.click();
  state.modal = null;
  saveState();
  render();
}

function updateBasicPreview() {
  const preview = document.querySelector("#caloriePreview");
  if (preview) preview.textContent = `预算预估：${calculateCalorieBudget(state.onboarding)} 千卡/天`;
  const next = document.querySelector('[data-action="next-step"]');
  if (next && state.onboardingStep === 1) next.disabled = !isBasicComplete();
}

function isBasicComplete() {
  const o = state.onboarding;
  return Boolean(o.gender && o.birthYear && o.height && o.currentWeight && o.targetWeight && o.goal);
}

function calculateCalorieBudget(source) {
  const gender = source.gender || state.profile.gender;
  const birthYear = Number(source.birthYear || state.profile.birthYear);
  const height = Number(source.height || state.profile.height);
  const weight = Number(source.currentWeight || state.profile.currentWeight);
  const goal = source.goal || state.profile.goal;
  const age = birthYear ? Math.max(12, new Date().getFullYear() - birthYear) : 32;
  if (!height || !weight) return 1500;
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "男") bmr += 5;
  else if (gender === "女") bmr -= 161;
  else bmr -= 78;
  let budget = bmr * 1.28;
  if (goal === "减重") budget -= 280;
  if (goal === "增重") budget += 260;
  return Math.round(Math.min(2400, Math.max(1200, budget)) / 10) * 10;
}

function finishOnboarding() {
  const o = state.onboarding;
  const cuisines = unique([...o.cuisines, ...splitList(o.cuisineOther)]);
  const tastes = unique([...o.tastes, ...splitList(o.tasteOther)]);
  const lateNightPrefs = unique([...o.lateNightPrefs, ...splitList(o.lateNightOther)]);
  const restrictions = unique([...o.restrictions, ...splitList(o.restrictionOther)]);
  state.profile = {
    ...state.profile,
    gender: o.gender,
    birthYear: o.birthYear,
    height: o.height,
    currentWeight: o.currentWeight,
    targetWeight: o.targetWeight,
    goal: o.goal || "维持",
    calorieGoal: calculateCalorieBudget(o),
    cuisines,
    tastes,
    cooking: o.cooking,
    mealTime: o.mealTime,
    lateNight: o.lateNight,
    lateNightPrefs,
    restrictions,
    allergies: o.allergies
  };
  state.fridge = getOnboardingPantry().map((item) => createFridgeItem(item.name, item.qty, item.emoji));
  state.chat = [];
  state.meals = [];
  state.memory = [];
  addMemory("profile", `每日热量预算约 ${state.profile.calorieGoal} 千卡。`);
  profileCuisines().forEach((item) => addMemory("taste", `菜系偏好：${item}`));
  profileTastes().forEach((item) => addMemory("taste", `口味标签：${item}`));
  if (state.profile.lateNight) addMemory("scene", `深夜嘴馋频率：${state.profile.lateNight}`);
  addWelcomeMessage();
  state.phase = "journey";
  state.activeTab = "assistant";
}

function getOnboardingPantry() {
  const selected = state.onboarding.pantry.map((name) => {
    const found = findIngredient(name);
    return { emoji: found?.[0] || "🥬", name, qty: found?.[2] || "1份" };
  });
  return selected;
}

function ingredientSuggestions(query = "") {
  const clean = query.trim();
  const list = clean ? ingredientLibrary.filter((item) => item[1].includes(clean)) : ingredientLibrary.slice(0, 8);
  return list.slice(0, 8).map(([emoji, name, qty]) => ({ emoji, name, qty }));
}

function findIngredient(name) {
  return ingredientLibrary.find((item) => item[1] === name) || pantryOptions.find((item) => item[1] === name);
}

function addPantryByName(name) {
  if (!name) return;
  if (!state.onboarding.pantry.includes(name)) state.onboarding.pantry.push(name);
  state.onboarding.manualPantry = "";
}

function addManualPantry() {
  const value = (document.querySelector("#manualIngredient")?.value || state.onboarding.manualPantry || "").trim();
  if (!value) return;
  addPantryByName(value);
  state.onboarding.manualPantry = "";
}

function addWelcomeMessage() {
  const recipe = pickBestRecipe();
  const fridgeText = state.fridge.length ? `你冰箱里有${state.fridge.slice(0, 5).map((item) => item.name).join("、")}。` : "你的冰箱还没初始化，先拍照或随口告诉我也可以。";
  state.chat.push({
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `你好！我是小知。\n根据你的信息，每日热量预算已设为 ${state.profile.calorieGoal} 千卡。\n\n${fridgeText}\n推荐今天试试：${recipe.name}\n\n你也可以在“档案”里查看冰箱和灵感库，或在“我的”里调整偏好。有任何想吃的，直接告诉我。`,
    recommendation: toRecommendation(recipe)
  });
}

function ensureChat() {
  if (!state.chat.length) addWelcomeMessage();
  return state.chat;
}

function sendUserText(text) {
  state.chat.push({ id: uid("chat"), role: "user", createdAt: Date.now(), text });
  const instantReply = buildLocalReply(text);
  const placeholderId = uid("chat");
  state.chat.push({ ...instantReply, id: placeholderId, fastLocal: true });
  saveState();
  render();
  resolveAssistantReply({ text, image: "" }, placeholderId);
}

function sendUserImage(image) {
  state.chat.push({ id: uid("chat"), role: "user", createdAt: Date.now(), text: "这个能做啥", image });
  const placeholderId = uid("chat");
  state.chat.push({
    id: placeholderId,
    role: "assistant",
    createdAt: Date.now(),
    text: localImageReplyText()
  });
  state.scans.unshift({ id: uid("scan"), type: "image", image, createdAt: Date.now(), note: "待用户确认" });
  saveState();
  render();
  resolveAssistantReply({ text: "这个能做啥", image }, placeholderId);
}

async function resolveAssistantReply(payload, placeholderId) {
  const existingReply = state.chat.find((item) => item.id === placeholderId);
  const localReply = payload.image ? {
    id: placeholderId,
    role: "assistant",
    createdAt: Date.now(),
    text: localImageReplyText()
  } : existingReply || {
    id: placeholderId,
    role: "assistant",
    createdAt: Date.now(),
    text: "我先记下。"
  };
  const remote = await tryRemoteReply(payload);
  if (!remote?.text) return;
  const reply = { ...localReply, id: placeholderId };
  reply.text = decorateRemoteReply(remote, payload);
  reply.aiStatus = remote.aiStatus || "";
  const index = state.chat.findIndex((item) => item.id === placeholderId);
  if (index >= 0) state.chat[index] = reply;
  else state.chat.push(reply);
  saveState();
  render();
}

async function tryRemoteReply(payload) {
  if (!["http:", "https:"].includes(window.location.protocol)) {
    if (payload.image) showToast("本地文件打开不能识别图片，请用公网/本地服务地址");
    return "";
  }
  if (localStorage.getItem("zhishifenzi-ai-enabled") === "false") return "";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch("./api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: payload.text,
        image: payload.image,
        profile: state.profile,
        memory: state.memory.slice(0, 24).map((item) => `${item.kind}: ${item.text}`),
        state: {
          fridge: state.fridge.slice(0, 20),
          meals: state.meals.slice(0, 12),
          inspirations: state.inspirations.slice(0, 12)
        }
      }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const data = await response.json();
    const reply = String(data.reply || data.text || "").trim();
    if (/ARK_API_KEY|OPENAI_API_KEY|还没有设置|没有设置密钥/.test(reply)) return null;
    return {
      text: reply,
      aiStatus: data.aiStatus || "",
      needsClarification: Boolean(data.needsClarification)
    };
  } catch {
    if (payload.image) showToast("图片识别暂时没接上，先按文字补充继续");
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function decorateRemoteReply(remote, payload) {
  if (!payload.image) return remote.text;
  if (remote.aiStatus === "vision_ok") return `已看图：\n${remote.text}`;
  if (remote.aiStatus === "vision_unavailable") return `图片识别未接入视觉模型：\n${remote.text}`;
  return remote.text;
}

function localImageReplyText() {
  if (!["http:", "https:"].includes(window.location.protocol)) {
    return "我收到图片了，但你现在是直接打开本地文件，图片不会送到云端 AI 识别。\n\n你可以用公网链接或本地服务地址打开；现在先告诉我：这是食物、冰箱，还是小票？如果是食物，再补一句大概几人份。";
  }
  return "我收到图片了。现在先不乱猜热量。\n\n如果云端视觉模型能看懂，我会给范围；如果看不清，我只问一个确认问题：这是食物、冰箱，还是订单截图？";
}

function buildLocalReply(text) {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  if (/口腹之欲|放纵|欺骗餐|收藏到口腹/.test(clean)) return indulgenceChatReply(clean);
  if (/吃什么|做什么|推荐|不知道吃|外卖|能做啥/.test(clean)) return decisionReply(clean);
  if (/怎么(弄|做|吃)|做法|咋(弄|做|吃)|能不能做/.test(clean)) return decisionReply(clean);
  if (/吃了|喝了|早餐|午餐|晚餐|夜宵|加餐|做了|好吃/.test(clean)) return mealReply(clean);
  if (/冰箱|库存|还有|买了|入库|删|删除|扣除/.test(clean)) return inventoryReply(clean);
  if (/复盘|总结|洞察|压力|嘴馋|失控/.test(clean)) return reviewReply(clean);
  if (/截图|灵感|收藏|想吃|菜谱|小红书|链接/.test(lower + clean)) return inspirationReply(clean);
  addMemory("chat", clean);
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: "我先把这句话当成生活线索记下。\n\n为了尽量一次问完：它更像饮食记录、冰箱库存、想吃灵感，还是一次复盘？"
  };
}

function inventoryReply(text) {
  const deleted = /删|删除|没有|用完/.test(text);
  const names = extractIngredientNames(text);
  if (deleted && names.length) {
    state.fridge = state.fridge.filter((item) => !names.some((name) => item.name.includes(name) || name.includes(item.name)));
    addMemory("fridge", `用户删除库存：${names.join("、")}`);
    return { id: uid("chat"), role: "assistant", createdAt: Date.now(), text: `收到，已把 ${names.join("、")} 从冰箱里移出。\n\n如果只是少了一部分，下次可以说“鸡蛋删掉两个”，我会按数量扣。` };
  }
  const added = names.length ? names : splitList(text.replace(/冰箱|库存|还有|买了|入库/g, ""));
  added.forEach((name) => {
    if (!state.fridge.some((item) => item.name === name)) state.fridge.unshift(createFridgeItem(name));
  });
  addMemory("fridge", `库存更新：${added.join("、") || text}`);
  return { id: uid("chat"), role: "assistant", createdAt: Date.now(), text: added.length ? `收到，已加入冰箱：${added.join("、")}。\n\n以后你可以用语音直接说“把鸡蛋删掉两个”来维护库存。` : "我听起来这是库存信息，但还差食材名。你直接说“鸡蛋 3 个、番茄 2 个”就行。" };
}

function mealReply(text) {
  const meal = createMeal(text);
  state.meals.unshift(meal);
  addMemory("meal", `${meal.name}，估算 ${meal.calories} 千卡。`);
  const pressureHint = /压力|累|烦|焦虑|夜宵|嘴馋|失控/.test(text);
  const gentle = pressureHint
    ? "这顿不像灾难，更像身体在找一个缓冲。我们先记下来，不急着审判。"
    : "收到，这顿先记上。真实记录比完美记录更有用。";
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `${gentle}\n\n已记录：${meal.name}，约 ${meal.calories} 千卡。\n今日剩余：${remainingCalories()} 千卡。\n\n我只追问一个：这顿更像真饿、嘴馋，还是压力驱动？`,
    undoMealId: meal.id
  };
}

function decisionReply(text) {
  const names = extractIngredientNames(text);
  names.forEach((name) => {
    if (/冰箱|库存|有|还有/.test(text) && !state.fridge.some((item) => item.name === name)) {
      state.fridge.unshift(createFridgeItem(name));
    }
  });
  const direct = directIngredientRecipe(names, text);
  if (direct) {
    rememberTempRecipe(direct);
    state.lastRecipeId = direct.id;
    addMemory("decision", `用户询问做法，推荐 ${direct.name}。`);
    return {
      id: uid("chat"),
      role: "assistant",
      createdAt: Date.now(),
      text: direct.text,
      recommendation: toRecommendation(direct)
    };
  }
  const recipe = pickBestRecipe();
  state.lastRecipeId = recipe.id;
  addMemory("decision", `用户询问吃什么，推荐 ${recipe.name}。`);
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `我给你一个选择，不摊开十个选项。\n\n按你的口味和冰箱，现在适合：${recipe.name}。它不折腾，和你当前的热量预算也比较合拍。`,
    recommendation: toRecommendation(recipe)
  };
}

function directIngredientRecipe(names, text = "") {
  if (names.includes("西兰花")) {
    return {
      id: "direct-broccoli-garlic",
      emoji: "🥦",
      name: "蒜蓉西兰花",
      time: "6分钟",
      calories: /鸡蛋|虾|豆腐/.test(text) ? 260 : 120,
      tags: ["清淡鲜", "快手", "晚餐"],
      need: ["西兰花", "大蒜"],
      steps: ["西兰花掰小朵，水开后焯 60-90 秒。", "热锅少油，下蒜末。", "倒入西兰花翻 1-2 分钟。", "少量盐或生抽调味。"],
      text: "西兰花就别复杂化了。\n\n最稳：水开焯 60-90 秒，捞出；热锅一点油爆蒜末，西兰花回锅 1-2 分钟，加盐或一点生抽。\n\n热量大概 100-150 千卡。想更顶饱，加鸡蛋、虾仁或豆腐。只问一句：你手边有蒜吗？"
    };
  }
  if (names.includes("番茄") && names.includes("鸡蛋")) {
    return {
      id: "direct-tomato-egg",
      emoji: "🍅",
      name: "番茄鸡蛋",
      time: "8分钟",
      calories: 260,
      tags: ["清淡鲜", "快手", "晚餐"],
      need: ["番茄", "鸡蛋"],
      steps: ["番茄切块，鸡蛋打散。", "先炒蛋盛出。", "番茄炒出汁，加蛋回锅。", "盐调味。"],
      text: "番茄鸡蛋就够了，不用再想。\n\n先炒蛋盛出，再炒番茄出汁，把蛋倒回去，盐调味。热量大概 250-320 千卡。想控热量就少油，想顶饱就配半碗饭。"
    };
  }
  return null;
}

function rememberTempRecipe(recipe) {
  state.tempRecipes = [recipe, ...(state.tempRecipes || []).filter((item) => item.id !== recipe.id)].slice(0, 12);
}

function reviewReply(text) {
  const late = state.profile.lateNight || "还在观察";
  const top = frequentIngredients().slice(0, 3).join("、") || "鸡蛋、青菜、米饭";
  addMemory("review", text);
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `我先给你一个复盘角度：最近的关键不在“吃得完不完美”，而在“什么时候最不想做决定”。\n\n目前线索是：常用食材偏 ${top}；深夜状态是 ${late}；如果晚上已经很累，推荐提前准备一个低负担选项，比如汤羹或凉拌。\n\n只问一句：今晚最容易失控的时间点大概是几点？`
  };
}

function inspirationReply(text) {
  state.inspirations.unshift({ id: uid("insp"), text, createdAt: Date.now() });
  addMemory("inspiration", text);
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: "我先把它收进灵感库。它可以先只是“想吃的线索”，不必马上变成行动。\n\n为了以后推荐更准：你心动的是口味、热乎感、仪式感，还是省事？"
  };
}

function indulgenceChatReply(text) {
  if (/想吃|放纵|欺骗餐/.test(text) && !/收藏/.test(text)) {
    const picks = indulgences().slice(0, 3);
    return {
      id: uid("chat"),
      role: "assistant",
      createdAt: Date.now(),
      text: picks.length
        ? `你收藏的口腹之欲里有：\n${picks.map((item) => `${item.emoji || "💝"} ${item.name} · ~${item.estimatedCalories || "?"}千卡`).join("\n")}\n\n今天热量预算还剩 ${remainingCalories()} 千卡。想认真放纵也可以，我们把它记成一次选择，不把它伪装成“健康餐”。`
        : "口腹之欲收藏夹还空着。你可以拍照或手动加一个真的想吃的东西，它不会参与日常推荐。"
    };
  }
  state.modal = { type: "indulgenceForm", draft: { name: text.replace(/收藏到口腹之欲|口腹之欲|收藏/g, "").trim() } };
  return {
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: "可以，我打开收藏表单。它会进入口腹之欲，不参与日常推荐，只在你想犒劳自己的时候出现。"
  };
}

function doRecipe(id) {
  const recipe = findRecipeById(id) || pickBestRecipe();
  const meal = {
    id: uid("meal"),
    name: recipe.name,
    calories: recipe.calories,
    ingredients: recipe.need,
    type: inferMealType(),
    icon: "🍳",
    time: formatClock(new Date()),
    createdAt: Date.now()
  };
  state.meals.unshift(meal);
  recipe.need.forEach((need) => consumeIngredient(need));
  state.modal = null;
  state.chat.push({
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `收到！已记录 ${recipe.name}。\n扣除：${recipe.need.filter(hasIngredientNameLoose).join("、") || "相关食材"}。\n今日剩余：${remainingCalories()} 千卡。\n\n吃完感觉怎么样？`,
    feedbackPrompt: { stage: "satiety", mealId: meal.id },
    undoMealId: meal.id
  });
}

function findRecipeById(id) {
  return recipeSeed.find((item) => item.id === id) || (state.tempRecipes || []).find((item) => item.id === id);
}

function answerFeedback(mealId, stage, value) {
  const meal = state.meals.find((item) => item.id === mealId);
  if (!meal) return;
  meal.feedback = meal.feedback || { tags: [] };
  if (stage === "satiety") {
    meal.feedback.satiety = value;
    state.chat.push({
      id: uid("chat"),
      role: "assistant",
      createdAt: Date.now(),
      text: "收到，我会用这个调整下次份量。\n\n还解馋吗？",
      feedbackPrompt: { stage: "craving", mealId }
    });
  } else {
    meal.feedback.craving = value;
    meal.feedback.tags = unique([...(meal.feedback.tags || []), value.replace(/[，。]/g, "")]);
    addMemory("feeling", `${meal.name}：${meal.feedback.satiety || ""}，${value}`);
    showToast("已记住这次感受");
  }
}

function saveFeeling() {
  const meal = state.meals.find((item) => item.id === state.modal?.mealId);
  if (!meal) return;
  const custom = document.querySelector("#feelingCustom")?.value.trim();
  meal.feedback = {
    satiety: state.modal.satiety || "",
    tags: unique([...(state.modal.tags || []), custom].filter(Boolean)),
    custom: custom || ""
  };
  addMemory("feeling", `${meal.name}：${[meal.feedback.satiety, ...meal.feedback.tags].filter(Boolean).join("、")}`);
  state.modal = null;
  showToast("感受已保存");
}

function swapRecipe() {
  const current = state.lastRecipeId;
  const candidates = filteredRecipes().filter((recipe) => recipe.id !== current);
  const recipe = candidates[0] || recipeSeed.find((item) => item.id !== current) || recipeSeed[0];
  state.lastRecipeId = recipe.id;
  state.chat.push({
    id: uid("chat"),
    role: "assistant",
    createdAt: Date.now(),
    text: `换一个更轻的选择：${recipe.name}。`,
    recommendation: toRecommendation(recipe)
  });
}

function undoMeal(id) {
  const before = state.meals.length;
  state.meals = state.meals.filter((meal) => meal.id !== id);
  if (state.meals.length < before) addAssistantText("已撤销这条饮食记录。");
}

function addAssistantText(text) {
  state.chat.push({ id: uid("chat"), role: "assistant", createdAt: Date.now(), text });
}

function fridgeSummary() {
  if (!state.fridge.length) return "还没有库存，拍照或说一句就能加";
  return state.fridge.slice(0, 3).map((item) => item.name).join("、") + (state.fridge.length > 3 ? ` 等 ${state.fridge.length} 个` : "");
}

function dnaSummary() {
  const cuisines = profileCuisines().slice(0, 2).join("、") || "菜系待补";
  const tastes = profileTastes().slice(0, 2).join("、") || "口味待补";
  return `${cuisines} · ${tastes}`;
}

function indulgences() {
  return [...state.indulgences, ...indulgenceSeed].filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index);
}

function deleteIndulgence(id) {
  state.indulgences = state.indulgences.filter((item) => item.id !== id);
  state.modal = null;
  showToast("已删除收藏");
}

function inferIndulgenceEmoji(name = "") {
  if (/蛋糕|提拉米苏|甜品|奶油|布丁/.test(name)) return "🍰";
  if (/汉堡|牛肉堡/.test(name)) return "🍔";
  if (/奶茶|咖啡|饮/.test(name)) return "🥤";
  if (/面|粉|拉面/.test(name)) return "🍜";
  if (/烧烤|烤|串/.test(name)) return "🍢";
  return "💝";
}

function setupShakeListener() {
  if (shakeListenerReady) return;
  shakeListenerReady = true;
  window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
}

function needsMotionPermission() {
  return Boolean(
    state.shakeEnabled &&
      state.activeTab === "archive" &&
      state.archiveOpen?.inspirations &&
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function" &&
      !state.motionPermissionAsked
  );
}

async function enableMotionAccess() {
  state.motionPermissionAsked = true;
  try {
    const result = await DeviceMotionEvent.requestPermission();
    showToast(result === "granted" ? "摇一摇已开启" : "没有拿到摇一摇权限");
  } catch {
    showToast("这个浏览器不支持摇一摇权限");
  }
  saveState();
  render();
}

function handleDeviceMotion(event) {
  if (!state.shakeEnabled || state.activeTab !== "archive" || !state.archiveOpen?.inspirations || state.modal) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;
  const strength = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
  const now = Date.now();
  if (strength < 32 || now - lastShakeAt < 3000) return;
  lastShakeAt = now;
  triggerShakePick(false);
}

function triggerShakePick(excludeCurrent = false) {
  const recipes = filteredRecipes();
  if (!recipes.length) {
    state.modal = { type: "shake", empty: true };
    saveState();
    render();
    return;
  }
  let pool = recipes.slice(0, 8);
  if (excludeCurrent && state.modal?.recipeId && pool.length > 1) {
    pool = pool.filter((recipe) => recipe.id !== state.modal.recipeId);
  }
  const recipe = pool[Math.floor(Math.random() * pool.length)] || recipes[0];
  state.shakeHintSeen = true;
  state.modal = { type: "shake", recipeId: recipe.id, onlyOne: recipes.length === 1 };
  if (navigator.vibrate) navigator.vibrate(80);
  saveState();
  render();
}

function createMeal(text) {
  const name = text.replace(/我|刚|已经|吃了|喝了|早餐|午餐|晚餐|夜宵|加餐|做了|好吃|，|。/g, "").trim() || "一顿饭";
  const calories = estimateCalories(text);
  return {
    id: uid("meal"),
    name,
    calories,
    ingredients: extractIngredientNames(text),
    type: inferMealType(text),
    icon: mealIcon(text),
    time: formatClock(new Date()),
    createdAt: Date.now()
  };
}

function estimateCalories(text) {
  const match = text.match(/(\d{2,4})\s*(千卡|卡|kcal|大卡)/i);
  if (match) return Number(match[1]);
  if (/汤|凉拌|黄瓜|水果|酸奶/.test(text)) return 150;
  if (/饭|面|粉|烧鹅|汉堡|炸|奶茶/.test(text)) return 650;
  if (/蛋|鱼|虾|鸡胸|豆腐/.test(text)) return 320;
  return 420;
}

function inferMealType(text = "") {
  const hour = new Date().getHours();
  if (/早餐/.test(text) || hour < 10) return "早餐";
  if (/午餐/.test(text) || (hour >= 10 && hour < 15)) return "午餐";
  if (/夜宵|加餐|解馋/.test(text) || hour >= 22) return "解馋";
  return "晚餐";
}

function mealIcon(text = "") {
  const type = inferMealType(text);
  if (type === "早餐") return "🌅";
  if (type === "午餐") return "🌞";
  if (type === "晚餐") return "🌙";
  return "🕐";
}

function extractIngredientNames(text) {
  const known = unique([...ingredientLibrary.map((item) => item[1]), "虾", "芦笋", "紫菜", "辣酱", "大米"]);
  const found = known.filter((name) => text.includes(name));
  if (found.length) return unique(found);
  return [];
}

function createFridgeItem(name, qty = "1份", emoji = "") {
  return {
    id: uid("fridge"),
    name,
    qty,
    emoji: emoji || inferEmoji(name),
    freshness: inferFreshness(name),
    createdAt: Date.now()
  };
}

function inferEmoji(name) {
  const map = {
    鸡蛋: "🥚",
    洋葱: "🧅",
    大蒜: "🧄",
    酱油: "🫘",
    大米: "🍚",
    米饭: "🍚",
    盐: "🧂",
    青菜: "🥬",
    菠菜: "🥬",
    番茄: "🍅",
    土豆: "🥔",
    胡萝卜: "🥕",
    蘑菇: "🍄",
    西兰花: "🥦",
    玉米: "🌽",
    红薯: "🍠",
    茄子: "🍆",
    食用油: "🫒",
    虾仁: "🍤",
    虾: "🍤",
    鸡胸: "🍗",
    牛肉: "🥩",
    猪肉: "🥓",
    豆腐: "◻️",
    三文鱼: "🐟",
    黄瓜: "🥒",
    紫菜: "🥣",
    牛奶: "🥛",
    酸奶: "🥣",
    面条: "🍜",
    全麦面包: "🍞",
    香蕉: "🍌",
    苹果: "🍎",
    蓝莓: "🫐"
  };
  return map[name] || "🥬";
}

function inferFreshness(name) {
  if (/青菜|菠菜|虾|三文鱼/.test(name)) return "临期";
  return "新鲜";
}

function consumeIngredient(name) {
  const item = state.fridge.find((entry) => entry.name.includes(name) || name.includes(entry.name));
  if (!item) return;
  if (/(\d+)/.test(item.qty)) {
    const next = Math.max(0, Number(item.qty.match(/(\d+)/)[1]) - 1);
    item.qty = item.qty.replace(/\d+/, String(next));
    if (next === 0) state.fridge = state.fridge.filter((entry) => entry.id !== item.id);
  }
}

function hasIngredient(name) {
  return state.fridge.some((item) => item.name.includes(name) || name.includes(item.name));
}

function hasIngredientNameLoose(name) {
  return recipeSeed.some((recipe) => recipe.need.includes(name)) || state.fridge.some((item) => item.name.includes(name) || name.includes(item.name));
}

function recipeStatus(recipe) {
  const missing = recipe.need.filter((name) => !hasIngredient(name));
  if (!missing.length) return { ready: true, label: "✓食材齐全" };
  return { ready: false, label: `⚠️缺${missing[0]}` };
}

function filteredRecipes() {
  const filters = state.recipeFilters || fallbackState.recipeFilters;
  let recipes = recipeSeed;
  if (state.recipeFilter === "解馋专区" || filters.crave) recipes = recipes.filter((recipe) => recipe.tags.includes("解馋专区") || recipe.tags.includes("夜宵友好") || recipe.tags.includes("汤羹") || recipe.calories <= 180);
  if (filters.cuisine !== "全部") recipes = recipes.filter((recipe) => recipe.tags.includes(filters.cuisine));
  if (filters.scene !== "不限") recipes = recipes.filter((recipe) => recipe.tags.includes(filters.scene));
  if (filters.time !== "不限") recipes = recipes.filter((recipe) => matchTimeFilter(recipe, filters.time));
  if (filters.calories !== "不限") recipes = recipes.filter((recipe) => matchCalorieFilter(recipe, filters.calories));
  if (filters.frequency !== "不限") recipes = recipes.filter((recipe) => recipeFrequency(recipe).label === filters.frequency.replace(/[🌟🕐🆕]/g, ""));
  if (filters.source !== "不限") recipes = recipes.filter((recipe) => recipe.tags.includes(filters.source.replace(/[📷🎤🤖✍️]/g, "")));
  if (filters.match === "✓食材齐全") recipes = recipes.filter((recipe) => recipeStatus(recipe).ready);
  if (filters.match === "⚠️缺1-2样") recipes = recipes.filter((recipe) => {
    const missing = recipe.need.filter((name) => !hasIngredient(name));
    return missing.length >= 1 && missing.length <= 2;
  });
  if (state.recipeShuffle) {
    recipes = [...recipes].sort((a, b) => ((hashString(a.id) + state.recipeShuffle) % 7) - ((hashString(b.id) + state.recipeShuffle) % 7));
  }
  return [...recipes].sort((a, b) => Number(!recipeStatus(a).ready) - Number(!recipeStatus(b).ready));
}

function visibleRecipes(limit = 6) {
  const recipes = filteredRecipes();
  if (recipes.length <= limit) return recipes;
  const recent = new Set(state.recentlyShownRecipeIds || []);
  const unseen = recipes.filter((recipe) => !recent.has(recipe.id));
  const pool = unseen.length >= limit ? unseen : [...unseen, ...recipes.filter((recipe) => recent.has(recipe.id))];
  const start = (state.recipeShuffle * limit) % Math.max(pool.length, 1);
  const rotated = [...pool.slice(start), ...pool.slice(0, start)];
  return rotated.slice(0, limit);
}

function rememberShownRecipes(ids) {
  state.recentlyShownRecipeIds = unique([...(ids || []), ...(state.recentlyShownRecipeIds || [])]).slice(0, 18);
}

function filterSummary() {
  const filters = state.recipeFilters || fallbackState.recipeFilters;
  const active = [];
  if (filters.cuisine !== "全部") active.push(filters.cuisine);
  if (filters.scene !== "不限") active.push(filters.scene);
  if (filters.time !== "不限") active.push(filters.time);
  if (filters.calories !== "不限") active.push(filters.calories);
  if (filters.frequency !== "不限") active.push(filters.frequency.replace(/[🌟🕐🆕]/g, ""));
  if (filters.source !== "不限") active.push(filters.source.replace(/[📷🎤🤖✍️]/g, ""));
  if (filters.match !== "不限") active.push(filters.match);
  if (!active.length) return "筛选";
  return active.length <= 3 ? active.join(" · ") : `${active.slice(0, 3).join(" · ")} +${active.length - 3}`;
}

function recipeScene(recipe) {
  return ["早餐", "午餐", "晚餐", "解馋", "待客"].find((tag) => recipe.tags.includes(tag)) || "日常";
}

function recipeFrequency(recipe) {
  if (recipe.tags.includes("常吃")) return { label: "常吃", className: "often" };
  if (recipe.tags.includes("最近吃过")) return { label: "最近吃过", className: "recent" };
  return { label: "新灵感", className: "new" };
}

function matchTimeFilter(recipe, filter) {
  const minutes = Number(recipe.time.match(/\d+/)?.[0] || 0);
  if (filter === "<15分钟") return minutes < 15;
  if (filter === "15-30分钟") return minutes >= 15 && minutes <= 30;
  if (filter === ">30分钟") return minutes > 30;
  return true;
}

function matchCalorieFilter(recipe, filter) {
  if (filter === "<200千卡") return recipe.calories < 200;
  if (filter === "200-400") return recipe.calories >= 200 && recipe.calories <= 400;
  if (filter === "400-600") return recipe.calories > 400 && recipe.calories <= 600;
  if (filter === ">600千卡") return recipe.calories > 600;
  return true;
}

function hashString(value) {
  return String(value).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickBestRecipe() {
  const ready = recipeSeed.filter((recipe) => recipeStatus(recipe).ready);
  const preferred = [...ready, ...recipeSeed].find((recipe) => recipe.tags.some((tag) => profileCuisines().includes(tag) || profileTastes().includes(tag)));
  return preferred || ready[0] || recipeSeed[0];
}

function toRecommendation(recipe) {
  return {
    id: recipe.id,
    emoji: recipe.emoji,
    name: recipe.name,
    time: recipe.time,
    calories: recipe.calories,
    status: recipeStatus(recipe).label
  };
}

function deleteSelectedFridge() {
  state.fridge = state.fridge.filter((item) => !state.selectedFridgeIds.includes(item.id));
  state.selectedFridgeIds = [];
  state.manageFridge = false;
}

function removeTaste(value) {
  state.profile.tastes = state.profile.tastes.filter((tag) => tag !== value);
}

function loginWithPassword(username, password) {
  const passwordHash = simpleHash(password);
  if (state.auth.username && state.auth.username !== username) {
    state.auth = clone(fallbackState.auth);
  }
  if (state.auth.passwordHash && state.auth.passwordHash !== passwordHash) {
    showToast("密码不对");
    saveState();
    render();
    return;
  }
  state.auth = {
    username,
    passwordHash,
    displayName: username,
    createdAt: state.auth.createdAt || Date.now(),
    loggedInUntil: Date.now() + AUTH_DAYS * 24 * 60 * 60 * 1000
  };
  if (!state.profile.name || state.profile.name === "用户昵称") state.profile.name = username;
  if (!state.profile.email || state.profile.email === "user@email.com") state.profile.email = username.includes("@") ? username : `${username}@local.account`;
  state.modal = null;
  showToast("已登录，30天内免登录");
  saveState();
  render();
}

function logout() {
  const ok = window.confirm("确定退出登录吗？你的本地记录会保留。");
  if (!ok) return;
  state.auth = clone(fallbackState.auth);
  state.phase = "welcome";
  state.modal = null;
  showToast("已退出登录");
}

function isLoggedIn() {
  return Boolean(state.auth?.username && state.auth.loggedInUntil > Date.now());
}

function cleanUsername(value = "") {
  return String(value).trim().replace(/\s+/g, "").slice(0, 48);
}

function accountLabel() {
  return state.auth?.displayName || state.auth?.username || "本机账号";
}

function simpleHash(value = "") {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function saveCalorieGoal() {
  const input = document.querySelector("#calorieGoalInput");
  const value = Number(input?.value);
  if (value) state.profile.calorieGoal = value;
  showToast("热量目标已保存");
}

function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `知食分子数据-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("已导出数据");
}

function toggleArray(array, value) {
  const index = array.indexOf(value);
  if (index >= 0) array.splice(index, 1);
  else array.push(value);
}

function splitList(value = "") {
  return String(value).split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean);
}

function unique(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function addMemory(kind, text) {
  if (!text) return;
  state.memory.unshift({ id: uid("mem"), kind, text, createdAt: Date.now() });
}

function profileCuisines() {
  return unique(state.profile.cuisines || []);
}

function profileTastes() {
  return unique(state.profile.tastes || []);
}

function frequentIngredients() {
  const names = [];
  state.meals.forEach((meal) => names.push(...(meal.ingredients || [])));
  state.fridge.forEach((item) => names.push(item.name));
  const counts = new Map();
  names.forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name).slice(0, 8);
}

function remainingCalories() {
  const today = new Date().toDateString();
  const used = state.meals
    .filter((meal) => new Date(meal.createdAt).toDateString() === today)
    .reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  return Math.max(0, Number(state.profile.calorieGoal || 1500) - used);
}

function averageCalories() {
  if (!state.meals.length) return 1350;
  const total = state.meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  return Math.round(total / Math.max(1, Math.min(7, state.meals.length)));
}

function averageMealTime() {
  if (state.profile.mealTime === ">30分钟") return "40分钟";
  if (state.profile.mealTime === "15-30分钟") return "22分钟";
  return "12分钟";
}

function topRecipeName() {
  return state.meals[0]?.name || "清炒虾仁";
}

function compactInsight() {
  const proteinHint = frequentIngredients().some((item) => /蛋|鸡|虾|鱼|豆腐/.test(item));
  const late = state.profile.lateNight === "经常";
  if (late) return "夜里想吃不是失败，先准备一个低负担出口。";
  if (proteinHint) return "最近蛋白质线索不错，可以给碳水留一点位置。";
  return "先减少选择成本：今晚只给自己一个可执行选项。";
}

function formatClock(date) {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function showToast(text) {
  state.toast = text;
  window.setTimeout(() => {
    state.toast = "";
    saveState();
    render();
  }, 1800);
}

async function installPWA() {
  if (isStandalonePWA()) {
    showToast("现在已经是 App 模式");
    return;
  }
  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    render();
    return;
  }
  state.modal = { type: "installGuide" };
  saveState();
  render();
}

function applyPendingUpdate() {
  state.updateReady = false;
  saveState();
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
  } else {
    window.location.reload();
  }
}

function isStandalonePWA() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

function installHint() {
  if (isStandalonePWA()) return "离线缓存和本地数据已启用";
  if (deferredInstallPrompt) return "点一下会弹出安装确认";
  if (isIOS()) return "Safari 分享菜单添加到主屏幕";
  return "支持安装的浏览器会显示安装入口";
}

function installGuideTitle() {
  if (isIOS()) return "iPhone：用 Safari 打开后添加";
  return "安卓/电脑：用浏览器菜单安装";
}

function installDetail() {
  if (isStandalonePWA()) return "你现在已经在桌面 App 模式里打开。";
  if (isIOS()) return "iPhone 必须用 Safari：点底部分享按钮，再选“添加到主屏幕”。微信内置浏览器通常不会给安装权限。";
  return "安卓 Chrome 如果按钮没反应，点右上角菜单，选“添加到主屏幕”或“安装应用”。";
}

async function copyPublicUrl() {
  try {
    await navigator.clipboard.writeText(PUBLIC_APP_URL);
    showToast("公网链接已复制");
  } catch {
    showToast(PUBLIC_APP_URL);
  }
  saveState();
  render();
}

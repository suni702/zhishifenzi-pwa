# 知食分子 MVP

本地优先的个人饮食决策 PWA。核心不是机械记录，而是先通过问卷形成用户画像，再让小知围绕“吃什么、冰箱有什么、我怎么吃”持续减少决策成本。

## 当前形态

- 首次进入是完整新用户引导：欢迎页、基础信息、饮食偏好、饮食习惯、冰箱初始化、完成仪式页。
- 主应用是手机优先的三 Tab：`助手 / 小知`、`档案 / 我的记忆`、`我的 / 个人中心`。
- 助手页包含洞察栏、对话气泡、推荐卡片、图片上传/拍照入口和语音输入。
- 登录为本机账号密码，第一次输入即注册，30 天内免登录。
- 图片扫描只走图片上传或拍照。接入视觉模型时可看图估算；看不懂图片、没有视觉模型或份量不明时，小知会先追问关键信息，不会硬估热量。
- 档案页展示冰箱、方案灵感库、口味 DNA 和场景习惯，不暴露“事实/观察/假设”后台标签。
- 个人中心包含资料编辑、周数据概览、饮食日志、冰箱管理、营养报告、热量目标和数据导出。
- 数据先保存在浏览器本地 `localStorage`，可导出 JSON。

## 运行

可以直接打开 `index.html` 使用本地静态版，但真实 AI 对话需要启动 Node 服务。

推荐在这个目录启动 PWA 服务：

```bash
npm run dev
```

然后打开：

```text
http://127.0.0.1:4173
```

生产环境可以用：

```bash
npm start
```

默认端口是 `8787`，也可以用 `PORT=4173 npm start` 指定。
本地默认只监听 `127.0.0.1`；部署到云平台时，如果平台要求外部访问，设置 `HOST=0.0.0.0`。

## AI 接入

不要把密钥写进前端。复制 `.env.example` 为 `.env`，只在本机或部署平台环境变量里填写：

```bash
cp .env.example .env
```

优先使用火山方舟：

```text
ARK_API_KEY=你的方舟密钥
ARK_MODEL=deepseek-v3-2-251201
```

也可以用 OpenAI 作为备用；如果需要上传图片后自动识别食物/热量，建议配置支持视觉输入的 OpenAI 模型：

```text
OPENAI_API_KEY=你的 OpenAI 密钥
OPENAI_MODEL=gpt-4.1-mini
```

启动后可检查：

```text
http://127.0.0.1:4173/api/health
```

返回 `provider: "ark"` 才说明方舟 AI 已接上；没有密钥时会自动用本地规则回复。

## PWA 部署

这是 PWA，不只是静态网页。完整部署需要同时提供：

- 静态文件：`index.html`、`app.js`、`styles.css`、`manifest.webmanifest`、`sw.js`、`assets/icon.svg`
- 后端接口：`server.mjs` 里的 `/api/chat` 和 `/api/health`
- 环境变量：`ARK_API_KEY` 或 `OPENAI_API_KEY`

适合部署到 Render、Railway、Fly.io、VPS 或任何支持 Node 20 的平台。部署命令：

```bash
npm start
```

常用环境变量：

```text
HOST=0.0.0.0
PORT=平台自动提供，或 8787
ARK_API_KEY=你的方舟密钥
ARK_MODEL=deepseek-v3-2-251201
```

安装到手机桌面：

- iPhone：用 Safari 打开网址，在分享菜单里选择“添加到主屏幕”。
- Android / 桌面 Chrome：页面或地址栏出现安装入口时点击安装。

## 参考方向

- `assistant-ui/assistant-ui`：聊天线程、消息气泡、输入体验。
- `Keel-Labs/keel`：local-first、数据属于用户。
- `swarmclawai/swarmvault`：个人知识库和长期记忆。
- `Health-Yang/MineEcho`：记忆分层和个人 AI OS。

当前没有引入重前端框架，先保证手机体验、可直接打开、可继续迭代。

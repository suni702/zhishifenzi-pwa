# 知食分子公网部署

## 推荐：Render

1. 把 `zhishifenzi-mvp` 推到一个 GitHub 仓库。
2. 打开 Render，新建 `Blueprint` 或 `Web Service`。
3. 选择这个仓库。
4. 环境变量填写：

```text
HOST=0.0.0.0
ARK_API_KEY=你的方舟密钥
ARK_MODEL=deepseek-v3-2-251201
ARK_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/responses
ARK_WEB_SEARCH=false
```

5. 部署成功后，打开 Render 给出的 `https://...onrender.com` 地址。
6. 访问 `/api/health`，看到 `provider: "ark"` 表示 AI 已接通。

## Railway / Fly.io / VPS

使用同一套命令：

```bash
npm install
npm start
```

云平台需要：

```text
HOST=0.0.0.0
PORT=平台自动提供的端口
ARK_API_KEY=你的方舟密钥
```

## 手机添加到桌面

- iPhone：Safari 打开公网 HTTPS 链接，分享，添加到主屏幕。
- Android：Chrome 打开公网 HTTPS 链接，安装应用或添加到主屏幕。

## 临时分享

临时公网试用可以用 Cloudflare Tunnel 或 ngrok，把本地 `http://127.0.0.1:8789` 暴露成 HTTPS。
这类工具需要在本机下载或登录第三方服务，适合测试，不适合长期给朋友使用。

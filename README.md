# Loom 多模型工作台

桌面浏览器中的多模型并行对话工作台。支持 1–5 个模型、Markdown、高亮引用、轮次导航、历史对话与可折叠侧边栏。

## 网站与部署

- 前端：GitHub Pages，发布 `main` 分支的 `/docs`。
- 后端：`https://loom-model-workbench.xiang9872.chatgpt.site`，由 Cloudflare Worker 转发模型请求。
- GitHub Pages 不能运行服务端代码，所以聊天和在线模型列表依赖独立 Worker。源码包含 `api.js` 和 `worker/index.js`。
- 浏览器只向指定服务商转发用户提供的 Key；服务端不保存 Key 或对话，也不记录请求内容。
- CORS 允许 `https://xiangjianan.github.io` 和后端同源。CORS 不是身份验证，公开后端请求仍需用户自己的服务商 API Key。不要在源码中配置共享模型密钥。

## 本地开发

```sh
npm ci
npm run build
npm test
node preview.mjs
```

访问 `http://localhost:4173`。在配置中填入自己的 API Key，点击型号下拉按钮获取服务商的在线列表。未提供兼容 `/models` 接口的厂商支持手动输入。在线列表代表账号权限返回的可用模型，并非保证涵盖厂商所有型号。

## 更新

修改 `shell.html`、`style.css`、`app.js` 或 `api.js`，运行 `npm run build` 后提交、推送。`docs/index.html` 是自包含的静态产物，无 CDN 运行时依赖。后端修改需单独发布 Worker；GitHub Pages 只更新前端。

## 本地数据

模型配置（包括 API Key）、草稿、高亮与历史记录保存在当前网站域名的 localStorage。不同域名的数据互相隔离。旧 Sites 域名的数据不会自动出现在 GitHub Pages。清除浏览器网站数据会删除记录。仓库中不包含真实 API Key 或用户对话。

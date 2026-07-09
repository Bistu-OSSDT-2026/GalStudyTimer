# GalStudyTimer 🎮⏱️

> GalGame 风格学习计时器 —— 与你的学习伙伴一起专注

**GalStudyTimer** 是一款受视觉小说 (GalGame) 风格启发的番茄钟学习计时器，将枯燥的计时变成与 AI 角色互动的沉浸式体验。选择一个学习科目，搭配专属角色伙伴，在专注中收获成就与陪伴。

![GalStudyTimer](public/bg.jpg)

---

## ✨ 主要特性

- **🍅 番茄钟计时** — 支持专注 / 短休息 / 长休息模式，可自定义时长与自动启停
- **🎭 GalGame 角色系统** — 每个科目配备专属角色立绘，学习中与你实时互动对话
- **🤖 AI 对话伙伴** — 支持 Ollama（本地）和 OpenAI，角色会鼓励、陪伴、甚至出题考你
- **🎵 背景音乐播放** — 内置多首 BGM，支持本地上传，专注时自动播放
- **🗣️ TTS 语音** — 浏览器内置 TTS 与 Edge TTS 双引擎，角色说出鼓励话语
- **📊 学习统计** — 可视化图表展示每日 / 每周学习时长、科目分布
- **🏆 成就系统** — 首次专注、连续专注、百小时等里程碑成就等你解锁
- **📱 PWA 离线可用** — 支持安装到桌面，无需网络也能计时
- **🌙 暗色主题** — GalGame 风格 UI，丝滑动画，沉浸式体验

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript 6 |
| 构建工具 | Vite 8 |
| 样式方案 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 本地数据库 | Dexie.js (IndexedDB) |
| 路由 | React Router v7 |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 音频播放 | Howler.js |
| AI 接口 | OpenAI SDK / Ollama REST API |
| PWA | vite-plugin-pwa |
| 代码检查 | ESLint + Oxlint |

---

## 📁 目录结构

```
GalStudyTimer/
├── assets/                     # 静态资源
│   ├── audio/                  # 内置 BGM 曲目
│   └── character/              # 角色立绘图
├── public/                     # 公共文件
│   ├── bg.jpg                  # 应用背景图
│   ├── favicon.svg             # 网站图标
│   ├── icons.svg               # PWA 图标
│   └── sprites/                # 默认角色精灵图
├── src/
│   ├── components/             # React 组件
│   │   ├── audio/              # 音频播放相关组件
│   │   ├── character/          # 角色立绘与对话框
│   │   ├── layout/             # 页面布局
│   │   ├── logs/               # 学习记录与成就
│   │   ├── settings/           # 设置页（通用 / AI / TTS）
│   │   ├── subject/            # 科目管理
│   │   ├── timer/              # 计时器核心
│   │   └── ui/                 # 通用 UI 组件
│   ├── stores/                 # Zustand 状态管理
│   │   ├── timerStore.ts       # 计时器状态
│   │   ├── settingsStore.ts    # 设置持久化
│   │   ├── audioStore.ts       # 音频播放状态
│   │   └── uiStore.ts         # UI 交互状态
│   ├── services/               # 业务服务层
│   │   ├── ai/                 # AI 对话与出题服务
│   │   ├── audioService.ts     # 音频管理服务
│   │   ├── edgeTtsService.ts   # Edge TTS 引擎
│   │   └── ttsService.ts       # TTS 语音合成
│   ├── db/                     # Dexie 数据库定义
│   ├── hooks/                  # 自定义 Hook
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数与常量
│   ├── App.tsx                 # 路由配置
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── .github/workflows/          # CI/CD 配置
├── index.html                  # HTML 入口
├── package.json
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
└── eslint.config.js            # ESLint 配置
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **npm** >= 9（推荐使用 pnpm）

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Bistu-OSSDT-2026/GalStudyTimer.git
cd GalStudyTimer

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器访问 `https://bistu-ossdt-2026.github.io/GalStudyTimer/` 即可使用。

### 构建生产版本

```bash
npm run build    # 输出到 dist/ 目录
npm run preview  # 本地预览生产构建
```

---

## ⚙️ AI 功能配置（可选）

### 使用 Ollama（本地部署，免费）

1. 安装 [Ollama](https://ollama.com/) 并拉取模型：

```bash
ollama pull llama3
```

2. 启动 Ollama 服务后，在应用 **设置 → AI 设置** 中选择 Ollama 即可。

> 开发环境下，Vite 已配置 `/api/ollama` 代理到 `http://localhost:11434`，无需额外配置 CORS。

### 使用 OpenAI API

在 **设置 → AI 设置** 中选择 OpenAI，填入你的 API Key 即可。

---

## 🧑‍💻 开发规范

### 代码检查

```bash
npm run lint        # ESLint 检查
npm run lint:fix    # 自动修复
```

项目同时使用 **Oxlint** 和 **ESLint** 进行代码质量检查。

### 提交规范

- 提交前请确保 `npm run lint` 无错误
- 推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写 commit message

### CI / CD

项目配置了 GitHub Actions 自动 Lint 检查（`.github/workflows/ci.yml`），每次推送和 Pull Request 都会触发。

---

## 📝 版本说明

当前版本：**v0.0.0**（早期开发阶段）

主要功能路线图：

- [x] 番茄钟计时（专注 / 休息 / 长休息）
- [x] 科目管理（自定义名称、颜色、立绘）
- [x] 角色立绘 + 对话框互动
- [x] 背景音乐播放器
- [x] TTS 语音合成
- [x] 学习统计图表
- [x] 成就系统
- [x] PWA 离线支持
- [x] AI 对话（Ollama + OpenAI）
- [ ] AI 智能出题
- [ ] 学习数据导出
- [ ] 更多角色动画

---

## 👥 开发者

本项目由 **Bistu-OSSDT-2026/GalStudyTimer** 团队开发维护。

欢迎提交 Issue 和 Pull Request！参与贡献前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">💜 与你的学习伙伴一起，让每一分钟都充满意义 💜</p>

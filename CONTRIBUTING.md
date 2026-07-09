# 🤝 参与贡献 GalStudyTimer

首先，感谢你愿意为 **GalStudyTimer** 贡献力量！💜

无论是修复一个错别字、提出一个新功能想法，还是重构一大块代码，**每一份贡献都同样重要**。本指南会帮助你顺利地完成第一次提交。

> 本项目是 BISTU（北京信息科技大学）OSSDT-2026 课程的开源协作实践项目，我们鼓励同学们在贡献中学习，在学习中贡献。

---

## 📋 目录

- [行为准则](#-行为准则)
- [环境准备](#-环境准备)
- [开发工作流](#-开发工作流)
- [Git 提交规范](#-git-提交规范)
- [代码规范](#-代码规范)
- [提交 Pull Request](#-提交-pull-request)
- [报告问题 / 提出建议](#-报告问题--提出建议)
- [项目结构速览](#-项目结构速览)

---

## 🌟 行为准则

请始终保持友善与尊重。我们希望这里是一个对所有人友好的协作环境：

- ✅ 对新手友好 —— 不轻视任何「简单」的问题
- ✅ 尊重不同的观点、背景和经验
- ✅ 聚焦于「什么对项目最好」，而非「谁是对的」
- ❌ 拒绝人身攻击、歧视性言论或骚扰行为

---

## 🛠️ 环境准备

### 系统要求

| 工具 | 版本 | 说明 |
|------|------|------|
| **Node.js** | `>= 18`（推荐 20 LTS） | CI 使用 Node 20 |
| **npm** | `>= 9` | 仓库以 `npm` 为准，已提交 `package-lock.json` |

### 拉取代码并安装依赖

```bash
# 1. Fork 本仓库到你的 GitHub 账号，然后克隆你的 Fork
git clone https://github.com/<你的用户名>/GalStudyTimer.git
cd GalStudyTimer

# 2. 关联上游仓库（方便后续同步最新代码）
git remote add upstream https://github.com/Bistu-OSSDT-2026/GalStudyTimer.git

# 3. 安装依赖（与 CI 保持一致，使用 --legacy-peer-deps）
npm install --legacy-peer-deps

# 4. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`，确认页面正常加载后即可开始开发。

> 💡 如果安装时报依赖冲突错误，请务必加上 `--legacy-peer-deps` 参数，这也是 CI 采用的方式。

---

## 🧑‍💻 开发工作流

### 1. 同步上游，保持最新

```bash
git checkout main
git pull upstream main
```

### 2. 新建特性分支

**不要直接在 `main` 上开发**。请从 `main` 切出一个语义清晰的分支：

```bash
git checkout -b feat/your-feature-name
```

### 3. 本地开发与自测

```bash
npm run dev          # 启动开发服务器
npm run lint         # 提交前必须通过
npm run build        # 确认能正常构建（会执行 tsc 类型检查）
```

### 4. 提交并推送

```bash
git add .
git commit -m "feat: 你的改动简述"
git push origin feat/your-feature-name
```

---

## 📝 Git 提交规范

我们推荐使用 [**Conventional Commits**](https://www.conventionalcommits.org/) 规范。提交信息**可中文可英文**，但请保持语义清晰。

### 提交格式

```
<type>: <简短描述>
```

### 常用 type

| type | 用于 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加学习数据导出功能` |
| `fix` | Bug 修复 | `fix: 修复计时器后台暂停的问题` |
| `docs` | 文档变更 | `docs: 完善 README 安装说明` |
| `style` | 代码格式（不影响逻辑） | `style: 统一缩进风格` |
| `refactor` | 重构（非新增、非修复） | `refactor: 抽离计时器公共逻辑` |
| `perf` | 性能优化 | `perf: 优化角色立绘加载速度` |
| `test` | 测试相关 | `test: 为 timerStore 添加单测` |
| `chore` | 构建 / 工具 / 依赖 | `chore: 升级 Vite 到 8.1` |
| `ci` | CI/CD 配置 | `ci: 在 workflow 中增加构建步骤` |

### 分支命名

```
<type>/<简短描述>
```

例如：`feat/export-data`、`fix/timer-pause`、`docs/update-contributing`。

> 与历史分支保持一致即可，无需纠结 `feat/` 还是 `feature/`。

---

## 📏 代码规范

项目同时启用 **ESLint** 和 **Oxlint** 进行代码质量检查。请在提交前确保 `npm run lint` 无错误。

### 核心规则

| 规则 | 级别 | 说明 |
|------|------|------|
| `no-console` | ⚠️ warn | 避免遗留调试日志，开发时可临时使用 |
| `@typescript-eslint/no-explicit-any` | ⚠️ warn | 尽量为变量写出明确类型，而非 `any` |
| `@typescript-eslint/no-unused-vars` | ⚠️ warn | 未使用的变量以下划线 `_` 开头可忽略 |
| `react-hooks/rules-of-hooks` | ❌ error | 必须遵守 Hooks 调用规则 |
| `react-hooks/exhaustive-deps` | ⚠️ warn | 注意 `useEffect` 依赖项完整性 |

### 编码约定

- **TypeScript 优先**：新代码使用 `.ts` / `.tsx`，并补充类型定义；`npm run build` 会执行 `tsc`，类型错误会导致构建失败。
- **React 19**：无需在文件顶部 `import React`，直接使用 JSX 即可。
- **样式**：统一使用 **Tailwind CSS** 工具类；需要复用的样式再抽到 `index.css`。
- **状态管理**：全局状态使用 **Zustand**（见 `src/stores/`），不要滥用全局状态，组件内部状态用 `useState`。
- **本地存储**：持久化数据走 **Dexie.js**（IndexedDB），定义在 `src/db/`。
- **命名**：组件用大驼峰（`PascalCase`），函数与变量用小驼峰（`camelCase`），常量用全大写下划线（`UPPER_SNAKE`）。
- **目录归属**：组件放 `src/components/<模块>/`，业务服务放 `src/services/`，工具函数放 `src/utils/`，类型放 `src/types/`。

### 自动修复

```bash
npm run lint:fix    # 让 ESLint 自动修复可修复的问题
```

---

## 🚀 提交 Pull Request

### PR 检查清单

提交前请逐项确认：

- [ ] 从最新的 `main` 切出分支，已合并上游最新代码
- [ ] `npm run lint` 无错误（警告请尽量清理）
- [ ] `npm run build` 构建成功
- [ ] 本地手动验证过功能正常
- [ ] 提交信息符合 [Git 提交规范](#-git提交规范)
- [ ] 没有提交无关的改动（如 `package-lock.json` 的非预期变更）
- [ ] 没有把敏感信息（API Key、密码等）写进代码

### PR 流程

1. 在你的 Fork 分支上完成开发并推送。
2. 在 GitHub 上向 `Bistu-OSSDT-2026/GalStudyTimer` 的 **`main`** 分支发起 PR。
3. 在 PR 描述中说明：
   - **改了什么**（What）
   - **为什么改**（Why，可关联 Issue，如 `Closes #12`）
   - **如何测试**（How to test）
4. CI（GitHub Actions）会自动运行 **Lint + Build** 检查，请确保两项都通过 ✅。
5. 等待 Maintainer 评审（Review），根据反馈调整后再 `git push` 更新同一个 PR 即可。
6. 通过后由 Maintainer 合并到 `main`。

> 🎉 恭喜！合并成功后你就是 GalStudyTimer 的贡献者了。

---

## 🐛 报告问题 / 提出建议

发现 Bug 或有新想法？欢迎提 [Issue](https://github.com/Bistu-OSSDT-2026/GalStudyTimer/issues)：

- **Bug 报告**：请描述复现步骤、预期行为、实际行为，并附上截图或控制台报错。
- **功能建议**：请说明这个功能的使用场景，以及你期望的交互方式。
- 提 Issue 前请先搜索是否已有相同问题，避免重复。

如果想认领某个 Issue，请在下面留言 `我来处理`，避免多人重复劳动。

---

## 📁 项目结构速览

```
src/
├── components/     # React 组件（按功能模块划分）
├── stores/         # Zustand 全局状态
├── services/       # 业务服务层（AI / 音频 / TTS）
├── db/             # Dexie 数据库定义
├── hooks/          # 自定义 Hook
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数与常量
```

更完整的目录说明见 [README.md](./README.md#-目录结构)。

---

## ❓ 还有疑问？

- 查阅 [README.md](./README.md)
- 在 [Issue 区](https://github.com/Bistu-OSSDT-2026/GalStudyTimer/issues) 提问

<p align="center">💜 感谢你的贡献，让 GalStudyTimer 与每一位学习者一同成长 💜</p>

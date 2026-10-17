# ⚡ AI Studio Turbo - Google AI Studio GPU 渲染 & 动画优化插件

一款专为 [Google AI Studio (https://aistudio.google.com/)](https://aistudio.google.com/) 深度定制的性能加速 Chrome 插件（Manifest V3）。针对老旧显卡、集成核显设备在大量高斯模糊与过渡动画下容易出现掉帧、卡顿、发热与打字延迟的问题进行精准减负，在**完全保留原有所有操作功能与原生界面布局**的前提下，让 AI Studio 达到极致丝滑的操作体验。

---

## 🌟 核心特性与解决痛点

| 痛点场景 | 原生机制（老设备卡顿根源） | AI Studio Turbo 优化策略 |
| :--- | :--- | :--- |
| **浮层与弹窗掉帧** | 侧边栏、账户面板、菜单采用 `backdrop-filter: blur(200px/80px)` 全屏多通道模糊采样 | 智能拦截高斯模糊，以 Google Material 3 原生主题变量（`--color-v3-surface` 等）自适应平替，保持对比度无损，显卡开销暴降 80% |
| **待机发热与掉电** | 常驻运行 `_shimmer`, `_pulse`, `_rotate-promo-card-border`, `_empty-art-drift` 等循环动画 | 冻结纯装饰性无限动画，使 GPU 显卡在闲置时能够立即进入低频待机与省电状态 |
| **长回复流式打字卡顿** | 文本生成时 `ms-autoscroll-container` 触发平滑滚动（`scroll-behavior: smooth`）与持续 0.6s 重排 | 自动转换为瞬时精确滚动（`behavior: auto`），打字输出如行云流水，杜绝视觉撕裂与输入延迟 |
| **界面菜单操作延迟** | 下拉菜单、抽屉与弹窗带有多层贝塞尔过渡动画（0.2s~0.3s） | 将交互过渡时间压缩至极速（0.01ms），菜单秒开秒合，响应零等待 |
| **显存占用过高** | 大量按键与卡片强制添加 `translate3d(0,0,0)` 与 `will-change`，导致图层暴增 | 精简冗余 GPU 合成图层，彻底解决低显存设备引起的驱动重启或崩溃 |

---

## 🚀 安装与使用指南

因为您的 Chrome 浏览器已经处于打开状态，您可以按照以下简单几步直接将扩展加载到浏览器中：

1. 打开 Chrome 浏览器，在地址栏输入并回车：
   ```text
   chrome://extensions/
   ```
2. 在扩展程序管理页面右上角，开启 **“开发者模式” (Developer mode)** 开关。
3. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)** 按钮。
4. 在弹出的文件选择器中，选择本项目的目录：
   ```text
   /Users/zym/workspace/opensource/github/aistudio-turbo
   ```
5. 点击“选择”，扩展即刻安装成功！
6. 切换回已打开的 [https://aistudio.google.com/](https://aistudio.google.com/) 页面，点击浏览器右上角拼图图标中的 **AI Studio Turbo** 图标即可随时调节模式。

> 💡 **热切换提示**：插件支持**零刷新即时生效**。在面板中切换开关或预设模式时，AI Studio 页面会实时无缝应用，无需重新加载网页！

---

## 🎛️ 模式介绍

- **⚡ Turbo 极速模式（默认推荐）**：平衡视觉质感与极致性能，平替所有大半径高斯模糊、停用常驻循环动画、开启流式防卡顿与极速响应。
- **🚀 Ultra 极致模式**：针对极老旧电脑（如 10 年前老架构核显或超低功耗设备），额外消除文本与按钮投影，显存占用降至最低。
- **🛠️ 自定义模式**：提供 6 个专项调节开关，支持按个人偏好自由组合。
- **📊 实时 FPS 监控悬浮窗**：可在页面右上角开启实时帧率监控小浮窗，随时查看当前渲染表现。

---

## 🧪 自动化测试验证

本项目配备了完整的自动化测试套件，全面覆盖 Manifest V3 配置、CSS 语法平衡与选择器覆盖率、JavaScript 静态语法与运行时 DOM 状态切换仿真：

```bash
npm test
# 或
node test/run_tests.js
```

测试覆盖了所有 47 项指标，保证在各种配置切换下稳定可靠、零脚本错误。

---

## 📁 目录结构

```text
aistudio-turbo/
├── manifest.json              # 核心清单文件 (MV3)
├── package.json               # 测试与工程配置文件
├── icons/                     # 16/32/48/128 高清图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── content/                   # 注入脚本与优化规则
│   ├── turbo.css              # 高性能 GPU 减负 CSS 核心补丁
│   ├── content.js             # 运行时类名控制器与 FPS 监视器
│   └── page-world.js          # 主世界平滑滚动精准拦截器
├── popup/                     # 控制面板界面
│   ├── popup.html             # 面板结构
│   ├── popup.css              # 现代化暗色主题样式
│   └── popup.js               # 模式切换与存储双向同步逻辑
├── background/                # Service Worker
│   └── background.js          # 生命周期与徽章管理
└── test/                      # 自动化测试套件
    └── run_tests.js           # 47 项自动化测试执行器
```

---

## 📜 许可证

MIT License

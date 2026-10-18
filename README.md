<div align="center">

# AI Studio Turbo

<p align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="AI Studio Turbo Logo">
</p>

<p align="center">
  <b>Google AI Studio 网页界面渲染减负与交互流畅度优化扩展（Manifest V3）</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> &bull; <a href="README_EN.md">English</a>
</p>

<p align="center">
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-4285F4.svg?style=flat-square" alt="Manifest V3"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://aistudio.google.com/"><img src="https://img.shields.io/badge/Target-Google%20AI%20Studio-34A853.svg?style=flat-square" alt="Target Platform"></a>
  <a href="test/run_tests.js"><img src="https://img.shields.io/badge/Tests-71%2F71%20Passing-brightgreen.svg?style=flat-square" alt="Automated Tests"></a>
</p>

</div>

AI Studio Turbo 是一款专为 [Google AI Studio](https://aistudio.google.com/) 深度定制的**前端网页界面渲染减负与操作流畅度优化**浏览器扩展。针对轻薄本集成核显及老旧显卡设备在复杂 Web 应用中因频繁高斯模糊、循环微动动画、过度复合图层以及流式文本自动平滑滚动所导致的浏览器页面掉帧、打字延迟和机身发热问题，在**完全保留原有全部功能与原生界面布局**的前提下，为用户本地显卡与浏览器渲染引擎提供深度的渲染减负，消除操作滞后感。

> **重要澄清说明 (Clarification)**：本项目仅专注于**客户端浏览器前端界面（Web UI）的 DOM 渲染优化与本地显卡/CPU 减负**（消除网页掉帧与打字卡顿）。**本项目不提供、不代理、也不涉及任何后端的 AI 模型推理算力、云端 GPU 算力配额或 API 速率。**

---

## 目录

- [背景与问题分析](#背景与问题分析)
- [核心优化特性](#核心优化特性)
- [运行模式介绍](#运行模式介绍)
- [架构设计与技术实现](#架构设计与技术实现)
- [安装与使用](#安装与使用)
- [工程结构](#工程结构)
- [测试与验证](#测试与验证)
- [隐私与安全性](#隐私与安全性)
- [开源许可证](#开源许可证)

---

## 背景与问题分析

Google AI Studio 采用了高度现代化的 Web UI 体系（Angular Material 3），在提供前沿视觉效果的同时，也对客户端硬件渲染管线提出了较高要求：

1. **多通道高斯模糊重绘开销**：侧边栏、菜单与弹窗广泛采用 `backdrop-filter: blur(80px ~ 200px)`，在页面发生滚动或流式输出时引发全屏重绘，显卡负载居高不下。
2. **装饰性循环微动能耗**：多处卡片与加载元素常驻运行无限 CSS 关键帧动画（如 `_shimmer`、`_pulse`、`_rotate-promo-card-border`），阻碍 GPU 进入低功耗待机状态。
3. **流式输出平滑滚动卡顿**：大模型流式输出过程中，容器持续触发带有贝塞尔过渡的平滑滚动（`scroll-behavior: smooth`）及持续 0.6 秒防抖重排计算，造成视觉撕裂与输入延迟。
4. **复合图层过载与显存溢出**：大量交互按钮与悬浮元素被强制添加 3D 变换（`translate3d`）及 `will-change`，导致 GPU 合成层数量剧增，在小显存核显设备上易造成渲染上下文崩溃。

---

## 核心优化特性

| 痛点场景 | 原生机制（卡顿根因） | AI Studio Turbo 优化策略 | 优化收益 |
| :--- | :--- | :--- | :--- |
| **浮层与遮罩重绘** | 全局大量使用 `backdrop-filter` 模糊采样 | 智能拦截高斯模糊，采用 Material 3 原生自适应表面色变量（`--color-v3-surface` 等）进行高保真平替 | 显卡着色开销降低约 80%，彻底消除展开掉帧 |
| **闲置功耗与发热** | 常驻 `_shimmer`、`_pulse`、`_rotate-border` 等无限动画 | 精准识别并冻结纯装饰性循环动画，保持交互状态动画完备 | 闲置状态 GPU 即刻降频休眠，大幅降低能耗 |
| **流式打字与滚屏** | 文本生成频繁调用平滑滚动（`scroll-behavior: smooth`） | 主世界注入原型代理，将平滑滚动清洗为瞬时精确滚动（`behavior: auto`） | 打字渲染流畅无撕裂，消除逐字跳动卡顿 |
| **菜单与抽屉过渡** | 展开收起普遍附带 200ms ~ 300ms 贝塞尔过渡 | 将交互过渡时间压缩至毫秒级（0.01ms），同时完整保留弹窗原生平滑缩放与圆润过渡 | 菜单与抽屉秒开秒关，无等待感 |
| **合成图层与显存** | 大量 DOM 节点强行提升为独立 GPU 合成层 | 精简冗余的 `will-change` 与无效 3D 变换，抑制图层无序暴增 | 大幅缩减 VRAM 显存占用，杜绝显卡驱动崩溃 |
| **提示词输入框视觉** | 底部提示词输入框默认采用 12px 偏生硬圆角 | 升级为 24px 大圆角设计，四周外框柔和自然，同步适配拖拽高亮层与禁用遮罩 | 视觉更加协调优雅，与整体 Material 3 风格融合 |

---

## 运行模式介绍

扩展提供直观的控制面板，支持根据硬件配置与视觉偏好实时无缝切换：

- **Turbo 极速模式（默认推荐）**：平衡视觉质感与高帧率表现。平替所有大半径高斯模糊、冻结常驻循环动画、开启流式防卡顿与极速响应、开启提示词输入框 24px 圆润大边框美化。
- **Ultra 极致模式**：针对极端老旧硬件、虚拟机或超低功耗设备。在 Turbo 模式基础上额外剥离文本投影与多层阴影，强制将 GPU 显存与重排开销降至极限。
- **自定义配置模式**：支持按需单独控制 7 项专项开关（消除毛玻璃模糊、冻结装饰动画、瞬时流式滚动、零延迟交互过渡、移除点击涟漪、精简渲染图层、输入框圆润边框），随心定制个人专属方案。

> 所有配置切换均采用动态根类名（Root Class）与原型劫持热注入技术，修改即时生效，无需重新加载或刷新页面。

---

## 架构设计与技术实现

### 1. 样式与硬件加速层 (`content/turbo.css`)
- 基于 CSS 特异性分层（`html.aistudio-turbo-enabled.*`）实现零成本切换。
- 精准作用于 Google AI Studio 独有组件（如 `ms-prompt-box`、`ms-autoscroll-container`、`.dialog-backdrop-blur-overlay`、`.cdk-overlay-pane`）。
- 隔离 CDK 直角定位层与弹窗容器，杜绝弹出层方角投影外露伪影，保障原生 Material 3 圆角内裁切。

### 2. 隔离世界运行时管理 (`content/content.js`)
- 监听 `chrome.storage.local` 与 Popup 消息通道，根据状态在 `document.documentElement` 上动态增删标志类名。
- 自动同步页面明暗主题（Dark / Light Theme）状态至插件配置上下文。

### 3. 主世界平滑滚动精准拦截器 (`content/page-world.js`)
- 通过 Manifest V3 `MAIN` 世界执行上下文注入，安全代理 `Element.prototype.scrollTo` 与 `Element.prototype.scrollBy`。
- 在检测到平滑滚动指令（`behavior: "smooth"`）时，透明重写为瞬时滚动（`behavior: "auto"`），从底层 JavaScript 调用链上彻底掐灭打字回弹重排。

### 4. 徽标与生命周期服务 (`background/background.js`)
- 后台服务（Service Worker）负责监听扩展初始化与状态变化。
- 遵循极简免打扰规范：默认开启状态下保持图标纯净（不显示 ON 徽标），仅在用户主动关闭优化时展示低调的灰色 "off" 状态提示。

---

## 安装与使用

### 从源码加载（开发者模式）

1. 克隆本项目代码库至本地环境：
   ```bash
   git clone https://github.com/HogskinKitty/aistudio-turbo.git
   ```
2. 打开 Google Chrome 或基于 Chromium 的现代浏览器，访问扩展程序管理界面：
   ```text
   chrome://extensions/
   ```
3. 在管理页面右上角，开启 **开发者模式 (Developer mode)** 开关。
4. 点击左上角的 **加载已解压的扩展程序 (Load unpacked)**。
5. 在弹出的目录选择器中，选中本项目的根目录。
6. 打开 [Google AI Studio](https://aistudio.google.com/)，点击浏览器工具栏中的 **AI Studio Turbo** 图标即可随时调整优化策略。

---

## 工程结构

```text
aistudio-turbo/
├── manifest.json              # 核心清单文件 (MV3 规范)
├── package.json               # 工程与测试套件配置
├── LICENSE                    # MIT 开源许可证
├── README.md                  # 项目中文说明文档
├── README_EN.md               # English Documentation
├── icons/                     # 多尺寸高清矢量与位图资产
│   ├── Google_AI_Studio_icon.svg
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── content/                   # 注入式核心模块
│   ├── turbo.css              # GPU 减负与渲染降载 CSS 规则集
│   ├── content.js             # 隔离世界类名管理与存储同步逻辑
│   └── page-world.js          # 主世界平滑滚动代理拦截器
├── popup/                     # 控制面板交互界面
│   ├── popup.html             # 面板结构与自适应主题容器
│   ├── popup.css              # 面板样式与暗色/亮色自适应主题
│   └── popup.js               # 模式选择与配置双向绑定控制器
├── background/                # 扩展后台服务
│   └── background.js          # 生命周期状态与徽章提示管理
└── test/                      # 自动化测试与质量保障
    └── run_tests.js           # 自动化测试执行器与仿真套件
```

---

## 测试与验证

项目内置了轻量且严格的自动化测试套件，无需额外安装第三方依赖库即可开箱即用：

```bash
npm test
# 或
node test/run_tests.js
```

### 测试覆盖范围

- **Manifest V3 规范与资源完整性**：验证各平台图标、脚本与样式路径合法性。
- **CSS 语法与选择器覆盖率**：语法闭合校验及关键类名覆盖验证（覆盖率 100%）。
- **JavaScript 静态语法校验**：采用 Node.js `vm.Script` 对所有执行脚本进行预编译语法检查。
- **DOM 动态类名仿真切换**：覆盖 Turbo、Ultra、Custom 及禁用状态下的类名挂载行为。
- **主世界滚动参数重写仿真**：验证 `behavior: "smooth"` 向 `auto` 转换的逻辑正确性。
- **扩展图标徽标规范仿真**：验证状态徽标的显示与隐藏逻辑。

---

## 隐私与安全性

- **零数据收集**：本插件不收集、不存储、不上传任何用户对话内容、Prompt 提示词、Token 或个人账户信息。
- **纯本地运行**：所有逻辑与样式替换均在客户端浏览器本地执行，无外部网络请求或分析脚本注入。
- **最小权限原则**：仅声明了对 `https://aistudio.google.com/*` 站点的定向权限，绝不触碰非目标站点的浏览数据。

---

## 开源许可证

本项目采用 [MIT 许可证](LICENSE) 开源发布。

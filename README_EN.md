<div align="center">

# AI Studio Turbo

<p align="center">
  <img src="icons/Google_AI_Studio_icon.svg" width="96" height="96" alt="AI Studio Turbo Logo">
</p>

<p align="center">
  <b>Web UI Rendering Optimization & Client Hardware Load Reduction Extension for Google AI Studio (Manifest V3)</b>
</p>

<p align="center">
  <a href="README_EN.md">English</a> &bull; <a href="README.md">简体中文</a>
</p>

<p align="center">
  <a href="https://developer.chrome.com/docs/extensions/mv3/intro/"><img src="https://img.shields.io/badge/Manifest-V3-4285F4.svg?style=flat-square" alt="Manifest V3"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://aistudio.google.com/"><img src="https://img.shields.io/badge/Target-Google%20AI%20Studio-34A853.svg?style=flat-square" alt="Target Platform"></a>
  <a href="test/run_tests.js"><img src="https://img.shields.io/badge/Tests-73%2F73%20Passing-brightgreen.svg?style=flat-square" alt="Automated Tests"></a>
</p>

</div>

AI Studio Turbo is a browser extension deeply customized for [Google AI Studio](https://aistudio.google.com/) focusing on **client-side Web UI rendering optimization and interface fluidity**. Designed specifically to resolve page frame drops, typing stutter, local device heat, and video memory pressure caused by heavy web Gaussian blurs, continuous CSS keyframe animations, redundant composite layers, and automatic smooth scrolling during streaming responses—especially on laptops and integrated GPUs—while strictly preserving all native functions and original interface layouts.

> **Important Scope Clarification**: This project is strictly a **client-side browser UI rendering and performance optimization tool** designed to reduce local device hardware load and eliminate web interface lag. **It does NOT provide, proxy, or alter cloud AI model inference compute, remote GPU server quotas, or API token generation speeds.**

---

## Table of Contents

- [Background & Problem Analysis](#background--problem-analysis)
- [Core Optimization Strategies](#core-optimization-strategies)
- [Operation Modes](#operation-modes)
- [Architecture & Technical Implementation](#architecture--technical-implementation)
- [Installation & Usage](#installation--usage)
- [Project Structure](#project-structure)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Privacy & Security](#privacy--security)
- [License](#license)

---

## Background & Problem Analysis

Google AI Studio employs a modern Web UI architecture (Angular Material 3). While visually polished, its rendering pipeline places significant demands on client-side GPU hardware:

1. **Multi-Pass Gaussian Blur Overhead**: Sidebars, menus, and modal dialogs rely heavily on `backdrop-filter: blur(80px ~ 200px)`. During scrolling or live token generation, this triggers continuous full-screen repaints, driving GPU utilization high.
2. **Idle Energy Consumption from Looping Animations**: Elements such as promotional cards and skeleton loaders run infinite CSS animations (e.g., `_shimmer`, `_pulse`, `_rotate-promo-card-border`), preventing the GPU from entering low-power idle states.
3. **Smooth Scroll Stutter During Streaming**: As the language model streams responses, the output container repeatedly triggers smooth scrolling (`scroll-behavior: smooth`) alongside 0.6s debounced layout reflows, causing visual tearing and typing stutter.
4. **Compositing Layer Bloat & VRAM Exhaustion**: Numerous interactive buttons and floating elements are forced into GPU composite layers via `translate3d` and `will-change`, resulting in massive layer proliferation and GPU context resets on systems with limited video memory.

---

## Core Optimization Strategies

| Scenario | Native Mechanism (Root Cause) | AI Studio Turbo Strategy | Performance Gain |
| :--- | :--- | :--- | :--- |
| **Overlays & Backdrops** | Global multi-pass `backdrop-filter` sampling | Seamlessly bypasses Gaussian blurs using native Material 3 adaptive surface tokens (`--color-v3-surface`, etc.) | ~80% reduction in GPU fragment shading; zero expansion lag |
| **Idle Power & Thermal** | Perpetual `_shimmer`, `_pulse`, `_rotate-border` keyframes | Selectively halts purely decorative infinite animations while preserving interactive feedback | Immediate GPU frequency drop to idle; cooler running temperatures |
| **Stream Typing & Scrolling** | Frequent invocation of `scroll-behavior: smooth` during generation | Injects a Main World prototype proxy converting smooth scrolling into instantaneous scrolling (`behavior: auto`) | Butter-smooth token rendering without jitter or input delay |
| **Menus & Flyouts** | 200ms ~ 300ms bezier transition animations on menus and drawers | Compresses transition durations to instant execution (0.01ms) while preserving native dialog animations | Menus open and close with zero perceived latency |
| **Layer Compositing & VRAM** | Unconstrained promotion of DOM nodes into composite layers | Strips redundant `will-change` hints and unnecessary 3D transforms | Drastically decreases VRAM usage and driver reset risks |
| **Prompt Box Rounded Corners** | Rigid 12px outer border radius on prompt input container | Elevates to an elegant 24px rounded border, synchronized with drag-and-drop overlays and disabled states | Soft, balanced visual contour in harmony with Material 3 |

---

## Operation Modes

The extension provides a clean, bilingual popup control panel allowing instant, zero-refresh mode switching:

- **Turbo Mode (Default & Recommended)**: The optimal balance of visual fidelity and high-framerate responsiveness. Bypasses large-radius Gaussian blurs, freezes perpetual decorative animations, enables instant stream scrolling, and activates the 24px prompt box styling.
- **Ultra Mode**: Engineered for legacy graphics hardware, virtual machines, or power-constrained laptops. In addition to Turbo mode features, it removes text and box shadows to minimize GPU compositing to the bare minimum.
- **Custom Mode**: Allows granular control over 7 dedicated toggles (Disable Backdrop Blur, Freeze Decorative Animations, Instant Stream Scrolling, Zero-Delay Transitions, Disable Click Ripples, Reduce Render Layers, and Rounded Prompt Box).

> All mode and toggle updates apply instantaneously via dynamic root class toggling (`html.aistudio-turbo-enabled.*`) and prototype hijacking without requiring a page reload.

---

## Architecture & Technical Implementation

### 1. Hardware-Accelerated Stylesheet (`content/turbo.css`)
- Zero-runtime-cost CSS rule overrides keyed by specific scoped classes (`html.aistudio-turbo-enabled.*`).
- Targets Google AI Studio's proprietary selectors (such as `ms-prompt-box`, `ms-autoscroll-container`, `.dialog-backdrop-blur-overlay`, `.cdk-overlay-pane`).
- Decouples Angular CDK's rectangular overlay wrapper from inner dialog containers, eliminating square shadow box artifacts and preserving native rounded corners.

### 2. Isolated World Runtime Controller (`content/content.js`)
- Subscribes to `chrome.storage.local` changes and popup messages to dynamically update state classes on `document.documentElement`.
- Automatically synchronizes dark and light theme states from the target web app to the popup interface.

### 3. Main World Prototype Proxy (`content/page-world.js`)
- Injected into the browser's `MAIN` execution world under Manifest V3 rules to safely intercept `Element.prototype.scrollTo` and `Element.prototype.scrollBy`.
- Transparently normalizes `{ behavior: "smooth" }` calls to `{ behavior: "auto" }`, eliminating stream reflow stutter at the engine level.

### 4. Background Service Worker (`background/background.js`)
- Manages extension lifecycle events and icon badge states.
- Follows an unobtrusive design principle: leaves the toolbar icon clean (no badge) when active, and displays a subtle neutral "off" badge only when explicitly disabled.

### 5. Automatic Bilingual Localization (`popup/popup.js`)
- Automatically detects the browser's UI language (`navigator.language` / `chrome.i18n.getUILanguage`) to render in Chinese or English.
- Features a header toggle button (`EN` / `中`) for one-click manual language switching with persistent storage.

### 6. Visual Brand Identity & Iconography (`icons/`)
- Faithfully adheres to the classic dual-capsule geometry of the official Google AI Studio brand icon (`Google_AI_Studio_icon_oragin.svg`), directly utilizing the pure green (`#00B95C`) official vector icon (`Google_AI_Studio_icon.svg`).
- Features a fully transparent background across all asset sizes, seamlessly adapting to both dark and light browser toolbars, extensions management pages, and control panel headers without white-box artifacts, embodying Google's design heritage with agile Turbo performance.

---

## Installation & Usage

### Load Unpacked Extension (Developer Mode)

1. Clone this repository to your local system:
   ```bash
   git clone https://github.com/HogskinKitty/aistudio-turbo.git
   ```
2. Open Google Chrome or any Chromium-based browser and navigate to the extensions page:
   ```text
   chrome://extensions/
   ```
3. Enable the **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. In the file dialog, select the cloned `aistudio-turbo` project directory.
6. Open [Google AI Studio](https://aistudio.google.com/) and click the **AI Studio Turbo** icon in the extensions menu to adjust optimization modes.

---

## Project Structure

```text
aistudio-turbo/
├── manifest.json              # Core Extension Manifest (MV3 specification)
├── package.json               # Project configuration and test scripts
├── LICENSE                    # MIT Open Source License
├── README.md                  # Project Documentation (Simplified Chinese)
├── README_EN.md               # Project Documentation (English)
├── icons/                     # Vector and transparent raster application icons
│   ├── Google_AI_Studio_icon.svg       # Official vector master (Pure green Turbo edition, transparent background)
│   ├── Google_AI_Studio_icon_oragin.svg # Official original vector archive
│   ├── icon16.png             # 16x16 browser toolbar and favicon icon (Transparent)
│   ├── icon32.png             # 32x32 Retina toolbar icon (Transparent)
│   ├── icon48.png             # 48x48 extensions management page icon (Transparent)
│   └── icon128.png            # 128x128 high-res web store and documentation icon (Transparent)
├── content/                   # Injected client-side logic
│   ├── turbo.css              # Performance CSS optimization stylesheet
│   ├── content.js             # Isolated world runtime class coordinator
│   └── page-world.js          # Main world scroll prototype interceptor
├── popup/                     # Extension settings interface
│   ├── popup.html             # UI structure with localization hooks
│   ├── popup.css              # Adaptive dark/light theme stylesheet
│   └── popup.js               # Dual-language controller and config synchronization
├── background/                # Background service worker
│   └── background.js          # Lifecycle and badge management
└── test/                      # Automated quality assurance
    └── run_tests.js           # Lightweight standalone test runner
```

---

## Testing & Quality Assurance

The repository includes a lightweight, dependency-free automated test suite:

```bash
npm test
# or
node test/run_tests.js
```

### Test Coverage

- **Manifest V3 Specification**: Validates manifest schema, permission scopes, and declared assets.
- **CSS Selector Coverage**: Confirms 100% bracket balance and coverage of critical AI Studio selectors.
- **JavaScript Syntax Analysis**: Uses Node.js `vm.Script` to perform compilation checks on all runtime scripts.
- **DOM State Simulation**: Verifies dynamic class mounting and unmounting across Turbo, Ultra, Custom, and disabled states.
- **Scroll Prototype Cleansing**: Validates transparent rewriting of smooth scrolling arguments.
- **Badge Indicator Compliance**: Ensures accurate badge display and quiet defaults.

---

## Privacy & Security

- **Zero Data Collection**: AI Studio Turbo does not collect, record, or transmit any user conversation data, prompts, tokens, or account credentials.
- **Client-Side Execution**: All visual patches and script overrides execute strictly within your local browser environment without external network requests.
- **Principle of Least Privilege**: Declares host permissions strictly for `https://aistudio.google.com/*`, never accessing browsing data on other domains.

---

## License

This project is licensed under the [MIT License](LICENSE).

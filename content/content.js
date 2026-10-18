/**
 * AI Studio Turbo - Content Script
 * 负责与扩展存储同步、动态向 DOM 根节点施加优化类名
 */

(function () {
  'use strict';

  const DEFAULT_CONFIG = {
    enabled: true,
    mode: 'turbo', // 'turbo' | 'ultra' | 'custom'
    noBlur: true,
    noAnim: true,
    fastScroll: true,
    fastTransition: true,
    noRipple: true,
    flatShadow: true,
    reduceLayers: true,
    roundedPrompt: true
  };

  let activeConfig = Object.assign({}, DEFAULT_CONFIG);

  // 1. 从存储中读取配置并应用
  function loadAndApplyConfig() {
    const storageArea = (chrome.storage && chrome.storage.sync) || (chrome.storage && chrome.storage.local);
    if (!storageArea) {
      applyConfigToDOM(DEFAULT_CONFIG);
      return;
    }

    storageArea.get(['aistudio_turbo_config'], (result) => {
      if (result && result.aistudio_turbo_config) {
        activeConfig = Object.assign({}, DEFAULT_CONFIG, result.aistudio_turbo_config);
      } else {
        activeConfig = Object.assign({}, DEFAULT_CONFIG);
      }
      applyConfigToDOM(activeConfig);
      notifyPageWorld(activeConfig);
    });
  }

  // 2. 将配置转化为 <html> 节点的 class 属性
  function applyConfigToDOM(config) {
    const root = document.documentElement;
    if (!root) return;

    if (!config.enabled) {
      root.classList.remove(
        'aistudio-turbo-enabled',
        'turbo-ultra',
        'turbo-no-blur',
        'turbo-no-anim',
        'turbo-fast-scroll',
        'turbo-fast-transition',
        'turbo-no-ripple',
        'turbo-flat-shadow',
        'turbo-reduce-layers',
        'turbo-rounded-prompt'
      );
      return;
    }

    root.classList.add('aistudio-turbo-enabled');

    // 模式预设分支
    if (config.mode === 'ultra') {
      root.classList.add(
        'turbo-ultra',
        'turbo-no-blur',
        'turbo-no-anim',
        'turbo-fast-scroll',
        'turbo-fast-transition',
        'turbo-no-ripple',
        'turbo-flat-shadow',
        'turbo-reduce-layers',
        'turbo-rounded-prompt'
      );
    } else if (config.mode === 'turbo') {
      root.classList.remove('turbo-ultra');
      root.classList.toggle('turbo-no-blur', true);
      root.classList.toggle('turbo-no-anim', true);
      root.classList.toggle('turbo-fast-scroll', true);
      root.classList.toggle('turbo-fast-transition', true);
      root.classList.toggle('turbo-no-ripple', true);
      root.classList.toggle('turbo-flat-shadow', true);
      root.classList.toggle('turbo-reduce-layers', true);
      root.classList.toggle('turbo-rounded-prompt', true);
    } else {
      // 自定义模式
      root.classList.remove('turbo-ultra');
      root.classList.toggle('turbo-no-blur', Boolean(config.noBlur));
      root.classList.toggle('turbo-no-anim', Boolean(config.noAnim));
      root.classList.toggle('turbo-fast-scroll', Boolean(config.fastScroll));
      root.classList.toggle('turbo-fast-transition', Boolean(config.fastTransition));
      root.classList.toggle('turbo-no-ripple', Boolean(config.noRipple));
      root.classList.toggle('turbo-flat-shadow', Boolean(config.flatShadow));
      root.classList.toggle('turbo-reduce-layers', Boolean(config.reduceLayers));
      root.classList.toggle('turbo-rounded-prompt', Boolean(config.roundedPrompt !== false));
    }
  }

  // 3. 通知主世界脚本同步配置
  function notifyPageWorld(config) {
    window.postMessage(
      {
        type: 'AI_STUDIO_TURBO_CONFIG_UPDATE',
        config: {
          enabled: config.enabled,
          fastScroll: config.mode === 'custom' ? config.fastScroll : true,
          mode: config.mode
        }
      },
      '*'
    );
  }

  // 4. 监听外部配置变动 (如来自 Popup 面板的即时切换)
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (changes.aistudio_turbo_config) {
        activeConfig = Object.assign({}, DEFAULT_CONFIG, changes.aistudio_turbo_config.newValue);
        applyConfigToDOM(activeConfig);
        notifyPageWorld(activeConfig);
      }
    });
  }

  // 5. 注入主世界 page-world.js 脚本
  function injectPageScript() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('content/page-world.js');
      script.onload = function () {
        this.remove();
        notifyPageWorld(activeConfig);
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      // 容错处理
    }
  }

  // 6. 检测并同步 AI Studio 页面实际主题明暗状态
  function detectAndSyncTheme() {
    try {
      let isLight = false;
      const root = document.documentElement;
      const body = document.body;
      if (root.classList.contains('light-theme') || (body && body.classList.contains('light-theme'))) {
        isLight = true;
      } else if (root.dataset.theme === 'light' || (body && body.dataset.theme === 'light')) {
        isLight = true;
      } else if (body) {
        const bg = window.getComputedStyle(body).backgroundColor;
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance > 128) {
            isLight = true;
          }
        }
      }
      const detectedTheme = isLight ? 'light' : 'dark';
      const storageArea = (chrome.storage && chrome.storage.local) || (chrome.storage && chrome.storage.sync);
      if (storageArea) {
        storageArea.set({ aistudio_page_theme: detectedTheme });
      }
    } catch (e) {
      // 容错处理
    }
  }

  // 立即执行配置初始化与脚本注入
  loadAndApplyConfig();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPageScript();
      detectAndSyncTheme();
    });
  } else {
    injectPageScript();
    detectAndSyncTheme();
  }

  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const themeObserver = new MutationObserver(() => {
      detectAndSyncTheme();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  }
})();

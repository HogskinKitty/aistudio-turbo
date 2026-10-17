/**
 * AI Studio Turbo - Content Script
 * 负责与扩展存储同步、动态向 DOM 根节点施加优化类名，并管理性能监控 HUD
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
    roundedPrompt: true,
    showHud: false
  };

  let activeConfig = Object.assign({}, DEFAULT_CONFIG);
  let hudElement = null;
  let fpsTimer = null;
  let frameCount = 0;
  let lastTime = performance.now();
  let currentFps = 60;

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
      destroyHud();
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

    // 监控 HUD 控制
    if (config.showHud) {
      setupHud();
    } else {
      destroyHud();
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

  // 6. 性能监测 HUD 逻辑
  function setupHud() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'aistudio-turbo-hud';
      hudElement.innerHTML = `
        <div class="hud-header">
          <span>⚡ AI Studio Turbo</span>
        </div>
        <div class="hud-row">
          <span>实时 FPS:</span>
          <span class="hud-val fps-high" id="hud-fps-val">--</span>
        </div>
        <div class="hud-row">
          <span>运行模式:</span>
          <span class="hud-val" id="hud-mode-val">${activeConfig.mode.toUpperCase()}</span>
        </div>
        <div class="hud-row">
          <span>状态:</span>
          <span class="hud-val" style="color:#81c995">已优化</span>
        </div>
      `;
      (document.body || document.documentElement).appendChild(hudElement);
    }

    if (!fpsTimer) {
      startFpsMeter();
    }
  }

  function destroyHud() {
    if (fpsTimer) {
      cancelAnimationFrame(fpsTimer);
      fpsTimer = null;
    }
    if (hudElement) {
      hudElement.remove();
      hudElement = null;
    }
  }

  function startFpsMeter() {
    function measure(now) {
      frameCount++;
      const delta = now - lastTime;
      if (delta >= 1000) {
        currentFps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
        lastTime = now;
        updateHudDisplay();
      }
      if (activeConfig.showHud && activeConfig.enabled) {
        fpsTimer = requestAnimationFrame(measure);
      } else {
        fpsTimer = null;
      }
    }
    fpsTimer = requestAnimationFrame(measure);
  }

  function updateHudDisplay() {
    if (!hudElement) return;
    const fpsVal = hudElement.querySelector('#hud-fps-val');
    const modeVal = hudElement.querySelector('#hud-mode-val');
    if (fpsVal) {
      fpsVal.textContent = currentFps;
      fpsVal.className = 'hud-val ' + (currentFps >= 50 ? 'fps-high' : currentFps >= 30 ? 'fps-mid' : 'fps-low');
    }
    if (modeVal) {
      modeVal.textContent = activeConfig.mode.toUpperCase();
    }
  }

  // 立即执行配置初始化与脚本注入
  loadAndApplyConfig();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPageScript();
      if (activeConfig.showHud && activeConfig.enabled) {
        setupHud();
      }
    });
  } else {
    injectPageScript();
    if (activeConfig.showHud && activeConfig.enabled) {
      setupHud();
    }
  }
})();

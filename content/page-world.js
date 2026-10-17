/**
 * AI Studio Turbo - Page World Injected Script
 * 运行在网页主世界 (MAIN world) 上下文中，针对 JS 层的平滑滚动与 Canvas/动画进行非侵入式轻量优化
 */

(function () {
  'use strict';

  if (window.__AI_STUDIO_TURBO_PAGE_WORLD__) return;
  window.__AI_STUDIO_TURBO_PAGE_WORLD__ = true;

  let currentConfig = {
    enabled: true,
    fastScroll: true,
    mode: 'turbo'
  };

  // 1. 拦截 smooth scroll，消除长对话与流式输出时的平滑滚动卡顿
  const originalScrollTo = Element.prototype.scrollTo;
  const originalScrollBy = Element.prototype.scrollBy;
  const originalWindowScrollTo = window.scrollTo;
  const originalWindowScrollBy = window.scrollBy;

  function sanitizeScrollArgs(args) {
    if (!currentConfig.enabled || !currentConfig.fastScroll) {
      return args;
    }
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      if (args[0].behavior === 'smooth') {
        const copy = Object.assign({}, args[0]);
        copy.behavior = 'auto';
        return [copy];
      }
    }
    return args;
  }

  Element.prototype.scrollTo = function (...args) {
    return originalScrollTo.apply(this, sanitizeScrollArgs(args));
  };

  Element.prototype.scrollBy = function (...args) {
    return originalScrollBy.apply(this, sanitizeScrollArgs(args));
  };

  window.scrollTo = function (...args) {
    return originalWindowScrollTo.apply(this, sanitizeScrollArgs(args));
  };

  window.scrollBy = function (...args) {
    return originalWindowScrollBy.apply(this, sanitizeScrollArgs(args));
  };

  // 2. 接收来自 Content Script 的配置更新
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'AI_STUDIO_TURBO_CONFIG_UPDATE') {
      return;
    }
    currentConfig = Object.assign(currentConfig, event.data.config);
  });
})();

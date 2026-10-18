/**
 * AI Studio Turbo - Background Service Worker
 * 管理扩展生命周期、初始化默认存储配置与徽标状态
 */

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

function updateBadge(enabled) {
  if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
    if (enabled) {
      // 开启状态下保持图标干净，不显示 ON 徽标
      chrome.action.setBadgeText({ text: '' });
    } else {
      // 仅在明确关闭优化时，显示低调小巧的 off 徽标
      chrome.action.setBadgeText({ text: 'off' });
      chrome.action.setBadgeBackgroundColor({ color: '#5f6368' });
      if (chrome.action.setBadgeTextColor) {
        chrome.action.setBadgeTextColor({ color: '#ffffff' });
      }
    }
  }
}

function initBadge() {
  const storageArea = (typeof chrome !== 'undefined' && chrome.storage && (chrome.storage.sync || chrome.storage.local)) || null;
  if (!storageArea) {
    updateBadge(true);
    return;
  }

  storageArea.get(['aistudio_turbo_config'], (result) => {
    if (!result || !result.aistudio_turbo_config) {
      storageArea.set({ aistudio_turbo_config: DEFAULT_CONFIG }, () => {
        updateBadge(true);
      });
    } else {
      updateBadge(Boolean(result.aistudio_turbo_config.enabled));
    }
  });
}

// 扩展安装或更新时的生命周期监听
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    initBadge();
  });
}

// 扩展启动或后台线程唤醒时立即同步徽标
initBadge();

// 监听存储配置变动并实时刷新徽标
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.aistudio_turbo_config) {
      const newConf = changes.aistudio_turbo_config.newValue;
      if (newConf) {
        updateBadge(Boolean(newConf.enabled));
      }
    }
  });
}

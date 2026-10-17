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
  showHud: false
};

function updateBadge(enabled) {
  if (chrome.action && chrome.action.setBadgeText) {
    if (enabled) {
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' });
    } else {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#5f6368' });
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  const storageArea = (chrome.storage && chrome.storage.sync) || (chrome.storage && chrome.storage.local);
  if (!storageArea) return;

  storageArea.get(['aistudio_turbo_config'], (result) => {
    if (!result || !result.aistudio_turbo_config) {
      storageArea.set({ aistudio_turbo_config: DEFAULT_CONFIG }, () => {
        updateBadge(true);
      });
    } else {
      updateBadge(Boolean(result.aistudio_turbo_config.enabled));
    }
  });
});

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.aistudio_turbo_config) {
      const newConf = changes.aistudio_turbo_config.newValue;
      if (newConf) {
        updateBadge(Boolean(newConf.enabled));
      }
    }
  });
}

/**
 * AI Studio Turbo - Popup Controller
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

const I18N = {
  zh: {
    subtitle: 'GPU 减负 & 流畅度优化',
    masterTitle: '开启/关闭优化',
    langBtn: 'EN',
    langTitle: '切换至英文 (English)',
    badgeRec: '推荐',
    turboName: 'Turbo 极速',
    turboDesc: '均衡流畅',
    ultraName: 'Ultra 极致',
    ultraDesc: '极致降耗',
    customName: '自定义',
    customDesc: '自由配置',
    noBlurTitle: '消除毛玻璃模糊',
    noBlurDesc: '平替高斯模糊，杜绝界面重绘掉帧',
    noAnimTitle: '冻结装饰动画',
    noAnimDesc: '停止循环光效微动，闲置零功耗',
    fastScrollTitle: '瞬时流式滚动',
    fastScrollDesc: '禁用平滑滚动，消除逐字打字卡顿',
    fastTransitionTitle: '零延迟交互过渡',
    fastTransitionDesc: '菜单抽屉秒开秒合，保留弹窗原生质感',
    noRippleTitle: '移除点击涟漪',
    noRippleDesc: '停用 Material 涟漪，按键更轻快',
    reduceLayersTitle: '精简渲染图层',
    reduceLayersDesc: '减少 GPU 合成层，降低显存占用',
    roundedPromptTitle: '输入框圆润边框',
    roundedPromptDesc: '升级 24px 优雅大圆角，柔和美观',
    resetBtn: '恢复默认预设',
    footerTip: 'v1.0.0 · 修改即时生效'
  },
  en: {
    subtitle: 'GPU Optimization & Fluidity',
    masterTitle: 'Enable / Disable Optimization',
    langBtn: '中',
    langTitle: '切换至中文 (Chinese)',
    badgeRec: 'REC',
    turboName: 'Turbo',
    turboDesc: 'Balanced',
    ultraName: 'Ultra',
    ultraDesc: 'Max Eco',
    customName: 'Custom',
    customDesc: 'Tailored',
    noBlurTitle: 'Disable Backdrop Blur',
    noBlurDesc: 'Replace Gaussian blur to eliminate repaint drops',
    noAnimTitle: 'Freeze Decorative Animations',
    noAnimDesc: 'Stop looping effects for zero idle power',
    fastScrollTitle: 'Instant Stream Scrolling',
    fastScrollDesc: 'Disable smooth scrolling to eliminate stream stutter',
    fastTransitionTitle: 'Zero-Delay Transitions',
    fastTransitionDesc: 'Instant menus & drawers while preserving native dialogs',
    noRippleTitle: 'Disable Click Ripples',
    noRippleDesc: 'Remove Material ripple bloat for snappier clicks',
    reduceLayersTitle: 'Reduce Render Layers',
    reduceLayersDesc: 'Minimize GPU compositing layers and VRAM usage',
    roundedPromptTitle: 'Rounded Prompt Box',
    roundedPromptDesc: '24px smooth outer corners for refined aesthetics',
    resetBtn: 'Reset to Default',
    footerTip: 'v1.0.0 · Changes apply instantly'
  }
};

const storageArea = (typeof chrome !== 'undefined' && chrome.storage && (chrome.storage.sync || chrome.storage.local)) || null;

let currentConfig = Object.assign({}, DEFAULT_CONFIG);
let currentLang = 'zh';

// DOM 元素引用
const masterToggle = document.getElementById('master-toggle');
const masterToggleLabel = document.getElementById('master-toggle-label');
const btnLang = document.getElementById('btn-lang');
const customOptions = document.getElementById('custom-options');

const modeButtons = {
  turbo: document.getElementById('btn-mode-turbo'),
  ultra: document.getElementById('btn-mode-ultra'),
  custom: document.getElementById('btn-mode-custom')
};

const optionInputs = {
  noBlur: document.getElementById('opt-no-blur'),
  noAnim: document.getElementById('opt-no-anim'),
  fastScroll: document.getElementById('opt-fast-scroll'),
  fastTransition: document.getElementById('opt-fast-transition'),
  noRipple: document.getElementById('opt-no-ripple'),
  reduceLayers: document.getElementById('opt-reduce-layers'),
  roundedPrompt: document.getElementById('opt-rounded-prompt')
};

const btnReset = document.getElementById('btn-reset');

function detectLanguage() {
  const browserLang = (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) ||
                      (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) ||
                      'zh';
  return browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function applyLanguage(lang) {
  currentLang = (lang === 'zh' || lang === 'en') ? lang : 'zh';
  const dict = I18N[currentLang] || I18N.zh;

  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

  // 绑定文案
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // 绑定 title
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) {
      el.setAttribute('title', dict[key]);
    }
  });

  // 语言切换按钮文案与提示
  if (btnLang) {
    btnLang.textContent = dict.langBtn;
    btnLang.setAttribute('title', dict.langTitle);
  }
}

function getStorage(callback) {
  if (!storageArea) {
    callback(DEFAULT_CONFIG, detectLanguage());
    return;
  }
  storageArea.get(['aistudio_turbo_config', 'aistudio_language'], (result) => {
    const conf = (result && result.aistudio_turbo_config)
      ? Object.assign({}, DEFAULT_CONFIG, result.aistudio_turbo_config)
      : Object.assign({}, DEFAULT_CONFIG);
    const lang = (result && result.aistudio_language)
      ? result.aistudio_language
      : detectLanguage();
    callback(conf, lang);
  });
}

function updateBadge(enabled) {
  if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
    if (enabled) {
      chrome.action.setBadgeText({ text: '' });
    } else {
      chrome.action.setBadgeText({ text: 'off' });
      chrome.action.setBadgeBackgroundColor({ color: '#5f6368' });
      if (chrome.action.setBadgeTextColor) {
        chrome.action.setBadgeTextColor({ color: '#ffffff' });
      }
    }
  }
}

function saveStorage(config) {
  currentConfig = Object.assign({}, config);
  if (storageArea) {
    storageArea.set({ aistudio_turbo_config: currentConfig });
  }
  updateBadge(Boolean(currentConfig.enabled));
  updateUI();
}

function saveLanguage(lang) {
  currentLang = lang;
  if (storageArea) {
    storageArea.set({ aistudio_language: currentLang });
  }
  applyLanguage(currentLang);
}

function updateUI() {
  const isEnabled = Boolean(currentConfig.enabled);
  masterToggle.checked = isEnabled;

  // 模式按钮激活状态
  Object.keys(modeButtons).forEach((modeKey) => {
    const btn = modeButtons[modeKey];
    if (btn) {
      btn.classList.toggle('active', currentConfig.mode === modeKey);
      btn.disabled = !isEnabled;
      btn.style.opacity = isEnabled ? '1' : '0.5';
    }
  });

  // 自定义面板展开与联动
  const isCustom = currentConfig.mode === 'custom';
  if (customOptions) {
    customOptions.style.display = isCustom ? 'flex' : 'none';
  }

  // 子选项勾选状态同步
  Object.keys(optionInputs).forEach((optKey) => {
    const input = optionInputs[optKey];
    if (input) {
      if (isCustom) {
        input.checked = Boolean(currentConfig[optKey]);
      } else {
        // 在 Turbo / Ultra 模式下，底层选项默认均为生效
        input.checked = true;
      }
      input.disabled = !isEnabled || !isCustom;
    }
  });
}

// 事件绑定
function initEvents() {
  // 语言切换
  if (btnLang) {
    btnLang.addEventListener('click', () => {
      const targetLang = currentLang === 'zh' ? 'en' : 'zh';
      saveLanguage(targetLang);
    });
  }

  // 总开关
  masterToggle.addEventListener('change', () => {
    currentConfig.enabled = masterToggle.checked;
    saveStorage(currentConfig);
  });

  // 模式切换
  Object.keys(modeButtons).forEach((modeKey) => {
    const btn = modeButtons[modeKey];
    if (btn) {
      btn.addEventListener('click', () => {
        if (!currentConfig.enabled) return;
        currentConfig.mode = modeKey;
        saveStorage(currentConfig);
      });
    }
  });

  // 自定义各子项开关
  Object.keys(optionInputs).forEach((optKey) => {
    const input = optionInputs[optKey];
    if (input) {
      input.addEventListener('change', () => {
        currentConfig[optKey] = input.checked;
        saveStorage(currentConfig);
      });
    }
  });

  // 恢复默认预设
  btnReset.addEventListener('click', () => {
    saveStorage(DEFAULT_CONFIG);
  });
}

// 自动明暗主题同步
function initThemeSync() {
  if (!storageArea) return;
  storageArea.get(['aistudio_page_theme'], (result) => {
    if (result && result.aistudio_page_theme) {
      document.documentElement.setAttribute('data-theme', result.aistudio_page_theme);
    }
  });

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.aistudio_page_theme && changes.aistudio_page_theme.newValue) {
        document.documentElement.setAttribute('data-theme', changes.aistudio_page_theme.newValue);
      }
    });
  }
}

// 启动执行
document.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  getStorage((conf, lang) => {
    currentConfig = conf;
    currentLang = lang;
    applyLanguage(currentLang);
    initEvents();
    updateUI();
  });
});

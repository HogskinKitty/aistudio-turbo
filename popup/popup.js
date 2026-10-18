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

const storageArea = (typeof chrome !== 'undefined' && chrome.storage && (chrome.storage.sync || chrome.storage.local)) || null;

let currentConfig = Object.assign({}, DEFAULT_CONFIG);

// DOM 元素引用
const masterToggle = document.getElementById('master-toggle');
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

function getStorage(callback) {
  if (!storageArea) {
    callback(DEFAULT_CONFIG);
    return;
  }
  storageArea.get(['aistudio_turbo_config'], (result) => {
    if (result && result.aistudio_turbo_config) {
      callback(Object.assign({}, DEFAULT_CONFIG, result.aistudio_turbo_config));
    } else {
      callback(Object.assign({}, DEFAULT_CONFIG));
    }
  });
}

function saveStorage(config) {
  currentConfig = Object.assign({}, config);
  if (storageArea) {
    storageArea.set({ aistudio_turbo_config: currentConfig });
  }
  updateUI();
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

// 启动执行
document.addEventListener('DOMContentLoaded', () => {
  getStorage((conf) => {
    currentConfig = conf;
    initEvents();
    updateUI();
  });
});

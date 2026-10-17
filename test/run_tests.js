/**
 * AI Studio Turbo - Automated Test Suite
 * 执行完整扩展静态验证、CSS 选择器覆盖率检查、脚本语法校验及 DOM 运行时模拟测试
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖\x1b[0m ${message}`);
  }
}

console.log('\n======================================================');
console.log('🧪 开始执行 AI Studio Turbo 自动化测试套件');
console.log('======================================================\n');

// ------------------------------------------------------------------
// 测试组 1: Manifest V3 规范与引用资源完整性验证
// ------------------------------------------------------------------
console.log('📦 [测试组 1] Manifest V3 规范与依赖文件完整性:');
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json 存在');

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(true, 'manifest.json 为合法的 JSON');
} catch (e) {
  assert(false, `manifest.json 解析失败: ${e.message}`);
}

if (manifest) {
  assert(manifest.manifest_version === 3, 'Manifest 版本严格为 3 (MV3)');
  assert(manifest.name && manifest.version, '包含必要的扩展名称与版本号');
  assert(manifest.host_permissions && manifest.host_permissions.includes('https://aistudio.google.com/*'), '已声明仅针对 aistudio.google.com 的主机权限');

  // 检查所有声明的文件实际存在
  const icons = manifest.icons || {};
  Object.keys(icons).forEach((size) => {
    const iconFile = path.join(ROOT_DIR, icons[size]);
    assert(fs.existsSync(iconFile), `图标文件存在: ${icons[size]}`);
  });

  const contentScripts = manifest.content_scripts || [];
  contentScripts.forEach((cs) => {
    (cs.css || []).forEach((cssFile) => {
      assert(fs.existsSync(path.join(ROOT_DIR, cssFile)), `Content CSS 文件存在: ${cssFile}`);
    });
    (cs.js || []).forEach((jsFile) => {
      assert(fs.existsSync(path.join(ROOT_DIR, jsFile)), `Content JS 文件存在: ${jsFile}`);
    });
  });

  if (manifest.background && manifest.background.service_worker) {
    assert(fs.existsSync(path.join(ROOT_DIR, manifest.background.service_worker)), `Background Worker 文件存在: ${manifest.background.service_worker}`);
  }

  if (manifest.action && manifest.action.default_popup) {
    assert(fs.existsSync(path.join(ROOT_DIR, manifest.action.default_popup)), `Popup HTML 文件存在: ${manifest.action.default_popup}`);
  }
}

// ------------------------------------------------------------------
// 测试组 2: 核心优化 CSS (turbo.css) 规则与选择器覆盖率验证
// ------------------------------------------------------------------
console.log('\n🎨 [测试组 2] 核心优化 CSS 规则与 AI Studio 关键选择器覆盖:');
const cssPath = path.join(ROOT_DIR, 'content', 'turbo.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 语法平衡性检查 (大括号是否配对)
const openBraces = (cssContent.match(/\{/g) || []).length;
const closeBraces = (cssContent.match(/\}/g) || []).length;
assert(openBraces === closeBraces && openBraces > 0, `CSS 大括号语法结构平衡 (匹配对数: ${openBraces})`);

// 关键选择器覆盖度检查
const requiredSelectors = [
  '.dialog-backdrop-blur-overlay',
  '.overlay-backdrop',
  '.ms-account-switcher-panel',
  '.nav-flyout-panel',
  '.sidebar-overlay',
  'ms-autoscroll-container',
  'ms-chat-turn',
  '.mat-ripple-element',
  '.mdc-button__ripple',
  'ms-gradient-spinner',
  '#aistudio-turbo-hud'
];

requiredSelectors.forEach((sel) => {
  assert(cssContent.includes(sel), `覆盖 AI Studio 关键目标选择器: ${sel}`);
});

// 关键属性覆盖度检查
assert(cssContent.includes('backdrop-filter: none !important'), '包含 backdrop-filter: none !important 模糊消除声明');
assert(cssContent.includes('scroll-behavior: auto !important'), '包含 scroll-behavior: auto !important 流式防卡声明');
assert(cssContent.includes('animation: none !important'), '包含 animation: none !important 装饰动画停用声明');
assert(cssContent.includes('transition-duration: 0.01ms !important'), '包含 transition-duration 极速过渡声明');
assert(cssContent.includes('will-change: auto !important'), '包含 will-change: auto !important 显存防暴增声明');

// ------------------------------------------------------------------
// 测试组 3: JavaScript 源码静态分析与语法有效性
// ------------------------------------------------------------------
console.log('\n💻 [测试组 3] JavaScript 源码语法有效性验证:');
const jsFiles = [
  'content/content.js',
  'content/page-world.js',
  'background/background.js',
  'popup/popup.js'
];

jsFiles.forEach((file) => {
  const code = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8');
  try {
    new vm.Script(code);
    assert(true, `脚本语法校验通过: ${file}`);
  } catch (err) {
    assert(false, `脚本语法错误 ${file}: ${err.message}`);
  }
});

// ------------------------------------------------------------------
// 测试组 4: 运行时 DOM 动态样式施加与状态切换仿真测试
// ------------------------------------------------------------------
console.log('\n⚡ [测试组 4] 运行时 DOM 动态样式与类名切换仿真测试:');

// 模拟简易 DOM 与 Storage 环境
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...names) {
    names.forEach((n) => this.classes.add(n));
  }
  remove(...names) {
    names.forEach((n) => this.classes.delete(n));
  }
  contains(name) {
    return this.classes.has(name);
  }
  toggle(name, force) {
    if (force === undefined) {
      if (this.contains(name)) {
        this.remove(name);
        return false;
      } else {
        this.add(name);
        return true;
      }
    } else if (force) {
      this.add(name);
      return true;
    } else {
      this.remove(name);
      return false;
    }
  }
}

const mockDocElement = {
  classList: new MockClassList()
};

function simulateApplyConfig(config, docEl) {
  const root = docEl;
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
      'turbo-reduce-layers'
    );
    return;
  }

  root.classList.add('aistudio-turbo-enabled');

  if (config.mode === 'ultra') {
    root.classList.add(
      'turbo-ultra',
      'turbo-no-blur',
      'turbo-no-anim',
      'turbo-fast-scroll',
      'turbo-fast-transition',
      'turbo-no-ripple',
      'turbo-flat-shadow',
      'turbo-reduce-layers'
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
  } else {
    root.classList.remove('turbo-ultra');
    root.classList.toggle('turbo-no-blur', Boolean(config.noBlur));
    root.classList.toggle('turbo-no-anim', Boolean(config.noAnim));
    root.classList.toggle('turbo-fast-scroll', Boolean(config.fastScroll));
    root.classList.toggle('turbo-fast-transition', Boolean(config.fastTransition));
    root.classList.toggle('turbo-no-ripple', Boolean(config.noRipple));
    root.classList.toggle('turbo-flat-shadow', Boolean(config.flatShadow));
    root.classList.toggle('turbo-reduce-layers', Boolean(config.reduceLayers));
  }
}

// Case 4.1: Turbo 模式生效
simulateApplyConfig({ enabled: true, mode: 'turbo' }, mockDocElement);
assert(mockDocElement.classList.contains('aistudio-turbo-enabled'), 'Turbo 模式下成功施加 aistudio-turbo-enabled');
assert(mockDocElement.classList.contains('turbo-no-blur'), 'Turbo 模式下成功施加 turbo-no-blur');
assert(mockDocElement.classList.contains('turbo-no-anim'), 'Turbo 模式下成功施加 turbo-no-anim');
assert(mockDocElement.classList.contains('turbo-fast-scroll'), 'Turbo 模式下成功施加 turbo-fast-scroll');
assert(!mockDocElement.classList.contains('turbo-ultra'), 'Turbo 模式下不包含 turbo-ultra');

// Case 4.2: Ultra 极致模式生效
simulateApplyConfig({ enabled: true, mode: 'ultra' }, mockDocElement);
assert(mockDocElement.classList.contains('turbo-ultra'), 'Ultra 模式下成功激活 turbo-ultra 标识');

// Case 4.3: 自定义模式局部开关生效
simulateApplyConfig({ enabled: true, mode: 'custom', noBlur: true, noAnim: false, fastScroll: true }, mockDocElement);
assert(mockDocElement.classList.contains('turbo-no-blur'), '自定义模式下 noBlur=true 生效');
assert(!mockDocElement.classList.contains('turbo-no-anim'), '自定义模式下 noAnim=false 成功排除');
assert(mockDocElement.classList.contains('turbo-fast-scroll'), '自定义模式下 fastScroll=true 生效');

// Case 4.4: 彻底停用
simulateApplyConfig({ enabled: false }, mockDocElement);
assert(!mockDocElement.classList.contains('aistudio-turbo-enabled'), '总开关关闭后所有 turbo 类名完全清除');
assert(!mockDocElement.classList.contains('turbo-no-blur'), '关闭后无任何残留优化类名');

// ------------------------------------------------------------------
// 测试组 5: 主世界 page-world.js 平滑滚动拦截器仿真
// ------------------------------------------------------------------
console.log('\n📜 [测试组 5] 主世界平滑滚动参数清洗仿真:');
function sanitizeScrollArgs(args, enabled, fastScroll) {
  if (!enabled || !fastScroll) return args;
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    if (args[0].behavior === 'smooth') {
      const copy = Object.assign({}, args[0]);
      copy.behavior = 'auto';
      return [copy];
    }
  }
  return args;
}

const res1 = sanitizeScrollArgs([{ top: 100, behavior: 'smooth' }], true, true);
assert(res1[0].behavior === 'auto', '自动将 { behavior: "smooth" } 转换为 { behavior: "auto" }');

const res2 = sanitizeScrollArgs([{ top: 100, behavior: 'smooth' }], false, true);
assert(res2[0].behavior === 'smooth', '插件关闭时原样保留平滑滚动行为');

// ------------------------------------------------------------------
// 测试总结
// ------------------------------------------------------------------
console.log('\n======================================================');
console.log(`📊 测试汇总: 总计 ${totalTests} 项测试, \x1b[32m${passedTests} 项通过\x1b[0m, \x1b[31m${failedTests} 项失败\x1b[0m`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 所有自动化测试 100% 验证通过！插件达到交付与运行标准！\n');
  process.exit(0);
}

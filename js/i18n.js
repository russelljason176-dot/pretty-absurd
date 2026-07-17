const I18N = (() => {
  const SUPPORTED = ['en', 'fr', 'it', 'es', 'de', 'pt'];
  const DEFAULT   = 'en';
  let lang         = DEFAULT;
  let t            = {};

  function detect() {
    const stored = localStorage.getItem('pa_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(browser) ? browser : DEFAULT;
  }

  async function load(l) {
    const res = await fetch(`i18n/${l}.json`);
    return res.json();
  }

  function get(key) {
    return key.split('.').reduce((obj, k) => (obj != null ? obj[k] : null), t) ?? key;
  }

  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = get(el.dataset.i18n);
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = get(el.dataset.i18nHtml);
      if (typeof val === 'string') el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = get(el.dataset.i18nPlaceholder);
      if (typeof val === 'string') el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      const val = get(el.dataset.i18nLabel);
      if (typeof val === 'string') el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('.nav__lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });
  }

  async function setLang(l) {
    if (!SUPPORTED.includes(l)) return;
    lang = l;
    localStorage.setItem('pa_lang', l);
    t = await load(l);
    apply();
  }

  async function init() {
    lang = detect();
    t    = await load(lang);
    apply();
    document.querySelectorAll('.nav__lang-btn').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
  }

  return { init, setLang, get, current: () => lang };
})();

document.addEventListener('DOMContentLoaded', () => I18N.init());

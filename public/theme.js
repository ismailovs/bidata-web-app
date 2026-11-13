// Apply saved appearance before styles render; storage may be unavailable in private mode.
(() => {
  const key = 'bidataTheme';
  const root = document.documentElement;
  function refreshButton() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const dark = root.dataset.theme === 'dark';
    const ru = root.lang === 'ru';
    const action = ru ? (dark ? 'Включить светлую тему' : 'Включить тёмную тему') : (dark ? 'Ёруғ мавзуга ўтиш' : 'Қоронғи мавзуга ўтиш');
    button.setAttribute('aria-label', action);
    button.setAttribute('title', action);
    button.setAttribute('aria-pressed', String(dark));
    button.querySelector('.theme-icon').textContent = dark ? '☾' : '☀';
  }
  function apply(value) {
    root.dataset.theme = value === 'dark' ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = root.dataset.theme === 'dark' ? '#101826' : '#ffffff';
    refreshButton();
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  apply(saved);
  document.addEventListener('DOMContentLoaded', () => {
    refreshButton();
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const value = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(value);
      try { localStorage.setItem(key, value); } catch {}
    });
  });
  document.addEventListener('bidata:language', refreshButton);
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) apply(event.newValue); });
})();

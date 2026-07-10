const Lookbook = (() => {
  let current    = 0;
  let animating  = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let spreads    = [];
  let dots       = [];
  let total      = 0;

  const TRANSITION_MS = 950;
  const WHEEL_LOCK_MS = 1100;
  let wheelLocked = false;

  /* ── Navigate ── */
  function goTo(index) {
    if (animating || index === current) return;
    if (index < 0 || index >= total) return;

    animating = true;

    const dir = index > current ? 1 : -1;

    spreads[current].classList.remove('is-current');
    spreads[current].classList.add(dir > 0 ? 'is-past' : 'is-future');

    spreads[index].classList.remove(dir > 0 ? 'is-future' : 'is-past');
    spreads[index].classList.add('is-current');

    current = index;
    updateUI();

    setTimeout(() => { animating = false; }, TRANSITION_MS);
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* ── UI sync ── */
  function updateUI() {
    const counterEl = document.querySelector('.lb-counter');
    if (counterEl) {
      counterEl.textContent =
        String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    }

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });

    const prevBtn = document.querySelector('.lb-prev');
    const nextBtn = document.querySelector('.lb-next');
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
  }

  /* ── Wheel (desktop scroll-to-turn) ── */
  function initWheel() {
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (wheelLocked || animating) return;
      wheelLocked = true;
      e.deltaY > 0 ? next() : prev();
      setTimeout(() => { wheelLocked = false; }, WHEEL_LOCK_MS);
    }, { passive: false });
  }

  /* ── Touch (mobile swipe) ── */
  function initTouch() {
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      const dx = touchStartX - e.changedTouches[0].clientX;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
        dx > 0 ? next() : prev();
      }
    }, { passive: true });
  }

  /* ── Keyboard ── */
  function initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
    });
  }

  /* ── Init ── */
  function init() {
    const stageEl = document.getElementById('lookbook-stage');
    if (!stageEl) return;

    const els = stageEl.querySelectorAll('.spread');
    if (!els.length) return;

    spreads = Array.from(els);
    total   = spreads.length;

    spreads[0].classList.add('is-current');
    spreads.slice(1).forEach(s => s.classList.add('is-future'));

    dots = Array.from(document.querySelectorAll('.lb-dot'));

    document.querySelector('.lb-prev')?.addEventListener('click', prev);
    document.querySelector('.lb-next')?.addEventListener('click', next);
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    document.querySelectorAll('.lb-next-btn').forEach(btn => {
      btn.addEventListener('click', next);
    });

    initWheel();
    initTouch();
    initKeyboard();
    updateUI();

    if (window._lenis) window._lenis.stop();
  }

  return { init, goTo, next, prev, current: () => current };
})();

document.addEventListener('DOMContentLoaded', () => Lookbook.init());

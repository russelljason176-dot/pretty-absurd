/* === Lenis smooth scroll === */
let lenis;

function initLenis() {
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });
  window._lenis = lenis;
  (function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  })(0);
}

/* === Nav: hero colour switch === */
function initNavScroll() {
  const nav  = document.querySelector('.site-nav');
  const hero = document.querySelector('.home-hero');
  if (!nav) return;

  if (hero) {
    nav.classList.add('nav--on-hero');
    const io = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('nav--on-hero', entry.isIntersecting);
    }, { threshold: 0 });
    io.observe(hero);
  }
}

/* === Nav: mobile toggle === */
function initMobileNav() {
  const nav    = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav__toggle');
  if (!nav || !toggle) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('nav--open');
    toggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    lenis ? (open ? lenis.stop() : lenis.start()) : null;
  });

  document.querySelectorAll('.nav__overlay-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      lenis?.start();
    });
  });
}

/* === Nav: mark active page link === */
function initActiveNav() {
  const page = document.body.dataset.page || '';
  const map = {
    home:          ['index.html', './'],
    lookbook:      ['lookbook.html'],
    collection:    ['collection.html'],
    about:         ['about.html'],
    contact:       ['contact.html'],
  };
  const targets = map[page] || [];
  document.querySelectorAll('.nav__link, .nav__overlay-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (targets.some(t => href.includes(t))) a.classList.add('is-active');
  });
}

/* === Currency detection (stub — used in Phase 5) === */
const CURRENCY = (() => {
  const RATES = {
    ZAR: { code: 'ZAR', rate: 1,     locale: 'en-ZA' },
    GBP: { code: 'GBP', rate: 0.043, locale: 'en-GB' },
    EUR: { code: 'EUR', rate: 0.051, locale: 'fr-FR' },
    USD: { code: 'USD', rate: 0.055, locale: 'en-US' },
  };

  function detect() {
    const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = navigator.language || 'en';
    if (tz === 'Africa/Johannesburg' || lang === 'en-ZA' || lang.startsWith('af')) return RATES.ZAR;
    if (tz === 'Europe/London'        || lang === 'en-GB')                           return RATES.GBP;
    if (tz.startsWith('Europe/')      || ['fr','de','it','es','nl','pt'].some(l => lang.startsWith(l))) return RATES.EUR;
    return RATES.USD;
  }

  function format(zarAmount) {
    const c = detect();
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      maximumFractionDigits: 0,
    }).format(Math.round(zarAmount * c.rate));
  }

  return { detect, format };
})();

/* === Parallax (scroll-position-based, not getBoundingClientRect) === */
function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;
  els.forEach(el => { el.style.willChange = 'transform'; });

  let items = [];

  function measure() {
    items = Array.from(els).map(el => ({
      el,
      speed:   parseFloat(el.dataset.parallax) || 0.15,
      centerY: el.getBoundingClientRect().top + window.scrollY + el.offsetHeight * 0.5,
    }));
  }

  function tick() {
    const scrollY = window.scrollY;
    const vh      = window.innerHeight;
    items.forEach(({ el, speed, centerY }) => {
      const delta = (centerY - scrollY - vh * 0.5) * -speed;
      el.style.transform = `translateY(${delta.toFixed(2)}px)`;
    });
  }

  measure();
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', () => { measure(); tick(); }, { passive: true });
  if (lenis) lenis.on('scroll', tick);
  tick();
}

/* === Intersection observer helper (Phase 3+) === */
function observeReveal(selector, options = {}) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, ...options });
  els.forEach(el => io.observe(el));
}

/* === Price display — auto-detected currency === */
function initPrices() {
  document.querySelectorAll('[data-price]').forEach(el => {
    const zar = parseFloat(el.dataset.price);
    if (!isNaN(zar)) el.textContent = CURRENCY.format(zar);
  });
}

/* === Reveal on scroll === */
function initReveal() {
  observeReveal('.reveal-item', { threshold: 0.1 });
}

/* === Receipt "prints out" once scrolled into view === */
function initReceiptPrint() {
  const el = document.querySelector('.pa-receipt-print');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('is-printed');
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-printed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  io.observe(el);
}

/* === Zine / magazine flip-through === */
function initMagazine() {
  const book  = document.getElementById('pa-zine-book');
  const wrap  = document.getElementById('pa-zine-pages');
  const dotsEl = document.getElementById('pa-zine-dots');
  if (!book || !wrap) return;

  const pages = Array.from(wrap.querySelectorAll('.pa-zine__page'));
  const dots  = dotsEl ? Array.from(dotsEl.querySelectorAll('.pa-zine__dot')) : [];
  const total = pages.length;
  let current = 0;
  let flipping = false;
  let timer    = null;

  function stackPages() {
    pages.forEach((p, i) => {
      const offset = (i - current + total) % total;
      p.style.zIndex = total - offset;
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  }
  stackPages();

  function advance() {
    if (flipping) return;
    flipping = true;
    clearAuto();

    const top = pages[current];
    top.classList.add('pa-zine__page--flipping');

    setTimeout(() => {
      top.classList.remove('pa-zine__page--flipping');
      top.style.zIndex = 0;
      current = (current + 1) % total;
      stackPages();
      flipping = false;
      scheduleAuto();
    }, 750);
  }

  function scheduleAuto() {
    clearAuto();
    timer = setTimeout(advance, 3800);
  }
  function clearAuto() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  scheduleAuto();
  book.addEventListener('click', advance);
  book.addEventListener('mouseenter', clearAuto);
  book.addEventListener('mouseleave', scheduleAuto);
}

/* === Magnetic button (hero ghost CTA) === */
function initMagneticButton() {
  const hero       = document.querySelector('.home-hero');
  const btn        = document.querySelector('.home-hero__cta--ghost');
  const primaryBtn = document.querySelector('.home-hero__cta--primary');
  if (!hero || !btn) return;

  const RADIUS   = 450;
  const STRENGTH = 0.85;
  const GAP_MIN  = 12; // px to always keep between the two buttons
  let heroVisible = true;

  const io = new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    if (!heroVisible) btn.style.transform = '';
  }, { threshold: 0 });
  io.observe(hero);

  window.addEventListener('mousemove', (e) => {
    if (!heroVisible) return;
    const rect = btn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < RADIUS) {
      const pull = (1 - dist / RADIUS) * STRENGTH;
      let moveX  = dx * pull;
      let moveY  = dy * pull;

      // Clamp leftward movement so btn never overlaps primaryBtn
      if (primaryBtn && moveX < 0) {
        const pRect   = primaryBtn.getBoundingClientRect();
        const maxLeft = -(rect.left - pRect.right - GAP_MIN);
        if (moveX < maxLeft) moveX = maxLeft;
      }

      // Clamp downward movement so btn never overlaps the prelaunch strip
      if (moveY > 0) {
        const prelaunch = document.querySelector('.home-prelaunch');
        if (prelaunch) {
          const plRect = prelaunch.getBoundingClientRect();
          const maxDown = plRect.top - (rect.bottom) - GAP_MIN;
          if (moveY > maxDown) moveY = Math.max(0, maxDown);
        }
      }

      btn.style.transform = `translate(${moveX.toFixed(2)}px,${moveY.toFixed(2)}px)`;
    } else {
      btn.style.transform = '';
    }
  }, { passive: true });
}

/* === Ghost cursor (tholman/cursor-effects — ghostCursor, exact port) === */
function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lifeSpan  = 40;
  const particles = [];

  const baseImage = new Image();
  baseImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAATCAYAAACk9eypAAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAAEwAAAAAChpcNAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAABqElEQVQoFY3SPUvDQBgH8BREpRHExYiDgmLFl6WC+AYmWeyLg4i7buJX8DMpOujgyxGvUYeCgzhUQUSKKLUS0+ZyptXh8Z5Ti621ekPyJHl+uftfomhaf9Ei5JyxXKfynyEA6EYcLHpwyflT958GAQ7DTABNHd8EbtDbEH2BD5QEQmi2mM8P/Iq+A0SzszEg+3sPjDnDdVEtQKQbMUidHD3xVzf6A9UDEmEm+8h9KTqTVUjT+vB53aHrCbAPiceYq1dQI1Aqv4EhMll0jzv+Y0yiRgCnLRSYyDQHVoqUXe4uKL9l+L7GXC4vkMhE6eW/AOJs9k583ORDUyXMZ8F5SVHVVnllmPNKSFagAJ5DofaqGXw/gHBYg51dIldkmknY3tguv3jOtHR4+MqAzaraJXbEhqHhcQlwGSOi5pytVQHZLN5s0WNe8HPrLYlFsO20RPHkImxsbmHdLJFI76th7Z4SeuF53hTeFLvhRCJRCTKZKxgdnRDbW+iozFJbBMw14/ElwGYc0egMBMFzT21f5Rog33Z7dX02GBm7WV5ZfT5Nn5bE3zuCDe9UxdTpNvK+5AAAAABJRU5ErkJggg==';

  const canvas  = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:99999999;';
  document.body.appendChild(canvas);

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('mousemove', e => {
    particles.push({ x: e.clientX, y: e.clientY, life: lifeSpan });
  }, { passive: true });

  (function loop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life < 0) { particles.splice(i, 1); continue; }
      context.globalAlpha = Math.max(p.life / lifeSpan, 0);
      context.drawImage(baseImage, p.x, p.y);
    }
    requestAnimationFrame(loop);
  })();
}

/* === Sticker parallax — preserves CSS rotation via --py custom property === */
function initStickerParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stickers = document.querySelectorAll('[data-sparallax]');
  if (!stickers.length) return;

  let items = [];

  function measure() {
    items = Array.from(stickers).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        speed: parseFloat(el.dataset.sparallax) || 0.12,
        centerY: rect.top + window.scrollY + rect.height * 0.5,
      };
    });
  }

  function tick() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    items.forEach(({ el, speed, centerY }) => {
      const delta = (centerY - scrollY - vh * 0.5) * -speed;
      el.style.setProperty('--py', `${delta.toFixed(2)}px`);
    });
  }

  measure();
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', () => { measure(); tick(); }, { passive: true });
  if (lenis) lenis.on('scroll', tick);
  tick();
}

/* === Lookbook overlay trigger === */
function initLookbookOverlay() {
  if (!window.PA_LOOKBOOK) return;
  const triggers = [
    document.getElementById('pa-lookbook-open'),
    document.getElementById('pa-hero-lookbook-btn'),
  ];
  triggers.forEach(trigger => {
    if (!trigger) return;
    trigger.addEventListener('click', (e) => { e.preventDefault(); PA_LOOKBOOK.open(); });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); PA_LOOKBOOK.open(); }
    });
  });
}

/* === Init === */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initNavScroll();
  initMobileNav();
  initActiveNav();
  initParallax();
  initStickerParallax();
  initPrices();
  initReveal();
  initReceiptPrint();
  initMagneticButton();
  initCursor();
  initLookbookOverlay();
});

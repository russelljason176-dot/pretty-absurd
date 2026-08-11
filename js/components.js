/* === Sticky mobile CTA — reveal after hero scrolled past === */
(function stickyCta() {
  const bar = document.querySelector('.sticky-cta');
  if (!bar) return;
  const io = new IntersectionObserver(([entry]) => {
    bar.classList.toggle('is-visible', !entry.isIntersecting);
  }, { rootMargin: '-240px 0px 0px 0px' });
  io.observe(document.querySelector('.nav-spacer') || document.body);
})();

/* === FAQ accordion === */
(function faqAccordion() {
  document.querySelectorAll('.faq-item__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq-item.is-open').forEach((el) => {
        el.classList.remove('is-open');
        el.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

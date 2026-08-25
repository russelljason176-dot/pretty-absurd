/* ============================================================
   Pretty Absurd — cart (localStorage, client-side only)
   ============================================================ */

const PA_CART_KEY = 'pa-cart-v1';

const PaCart = (() => {
  function read() {
    try {
      const raw = localStorage.getItem(PA_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(PA_CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('pa-cart-change', { detail: { items } }));
  }

  function items() {
    return read();
  }

  function count() {
    return read().reduce((n, i) => n + i.qty, 0);
  }

  function total() {
    return read().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function add(product, size, qty = 1) {
    const items = read();
    const id = `${product.id}-${size}`;
    const existing = items.find(i => i.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ id, productId: product.id, name: product.name, size, price: product.price, img: product.img, qty });
    }
    write(items);
  }

  function setQty(id, qty) {
    let items = read();
    if (qty <= 0) {
      items = items.filter(i => i.id !== id);
    } else {
      const item = items.find(i => i.id === id);
      if (item) item.qty = qty;
    }
    write(items);
  }

  function remove(id) {
    write(read().filter(i => i.id !== id));
  }

  function clear() {
    write([]);
  }

  return { items, count, total, add, setQty, remove, clear };
})();

/* ============================================================
   Cart drawer — shared markup injected on every page
   ============================================================ */

function paCartFormatZAR(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(amount);
}

function paCartRenderBadge() {
  document.querySelectorAll('.pa-cart-toggle__count').forEach(el => {
    const n = PaCart.count();
    el.textContent = n;
    el.hidden = n === 0;
  });
}

function paCartRenderDrawer() {
  const list = document.getElementById('pa-cart-items');
  const empty = document.getElementById('pa-cart-empty');
  const totalEl = document.getElementById('pa-cart-total');
  const checkoutBtn = document.getElementById('pa-cart-checkout');
  if (!list) return;

  const items = PaCart.items();
  list.innerHTML = '';

  if (!items.length) {
    empty.hidden = false;
    checkoutBtn.setAttribute('aria-disabled', 'true');
  } else {
    empty.hidden = true;
    checkoutBtn.removeAttribute('aria-disabled');
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'pa-cart-item';
      row.innerHTML = `
        <img class="pa-cart-item__img" src="${item.img}" alt="" loading="lazy">
        <div class="pa-cart-item__info">
          <span class="pa-cart-item__name">${item.name}</span>
          <span class="pa-cart-item__size">SIZE ${item.size}</span>
          <div class="pa-cart-item__qty">
            <button type="button" class="pa-cart-item__qtybtn" data-action="dec" aria-label="Decrease quantity">&minus;</button>
            <span>${item.qty}</span>
            <button type="button" class="pa-cart-item__qtybtn" data-action="inc" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="pa-cart-item__right">
          <span class="pa-cart-item__price">${paCartFormatZAR(item.price * item.qty)}</span>
          <button type="button" class="pa-cart-item__remove" data-action="remove" aria-label="Remove ${item.name}">remove</button>
        </div>
      `;
      row.querySelector('[data-action="inc"]').addEventListener('click', () => PaCart.setQty(item.id, item.qty + 1));
      row.querySelector('[data-action="dec"]').addEventListener('click', () => PaCart.setQty(item.id, item.qty - 1));
      row.querySelector('[data-action="remove"]').addEventListener('click', () => PaCart.remove(item.id));
      list.appendChild(row);
    });
  }

  totalEl.textContent = paCartFormatZAR(PaCart.total());
}

function paCartOpen() {
  const drawer = document.getElementById('pa-cart-drawer');
  if (!drawer) return;
  drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  if (window._lenis) window._lenis.stop();
}

function paCartClose() {
  const drawer = document.getElementById('pa-cart-drawer');
  if (!drawer) return;
  drawer.classList.remove('is-open');
  document.body.style.overflow = '';
  if (window._lenis) window._lenis.start();
}

function initPaCart() {
  paCartRenderBadge();
  paCartRenderDrawer();

  /* Capture a ?promo=CODE link param on any page so a shared waitlist
     link (e.g. collection.html?promo=ABSURDVIP1) pre-fills at checkout,
     without needing the visitor to land on checkout.html directly. */
  const promoParam = new URLSearchParams(window.location.search).get('promo');
  if (promoParam) localStorage.setItem('pa-promo-code', promoParam.trim().toUpperCase());

  document.addEventListener('pa-cart-change', () => {
    paCartRenderBadge();
    paCartRenderDrawer();
  });

  document.querySelectorAll('.pa-cart-toggle').forEach(btn => {
    btn.addEventListener('click', paCartOpen);
  });
  document.getElementById('pa-cart-close')?.addEventListener('click', paCartClose);
  document.getElementById('pa-cart-scrim')?.addEventListener('click', paCartClose);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') paCartClose();
  });

  const checkoutBtn = document.getElementById('pa-cart-checkout');
  checkoutBtn?.addEventListener('click', () => {
    if (!PaCart.items().length) return;
    window.location.href = 'checkout.html';
  });

  /* Add-to-cart buttons (product pages) */
  document.querySelectorAll('.pa-add-to-cart').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sizeInput = form.querySelector('input[name="size"]:checked');
      if (!sizeInput) {
        const note = form.querySelector('.pa-add-to-cart__note');
        if (note) { note.hidden = false; note.textContent = 'Pick a size first'; }
        return;
      }
      const product = {
        id: form.dataset.productId,
        name: form.dataset.productName,
        price: parseFloat(form.dataset.productPrice),
        img: form.dataset.productImg,
      };
      PaCart.add(product, sizeInput.value, 1);
      paCartOpen();
      const note = form.querySelector('.pa-add-to-cart__note');
      if (note) note.hidden = true;
    });
  });
}

document.addEventListener('DOMContentLoaded', initPaCart);

/* ============================================================
   The Bags — renders frame grid + product features from PA_PRODUCTS
   Must load before cart.js so add-to-cart forms exist on init.
   ============================================================ */

(() => {
  const grid = document.getElementById('bag-grid');
  const features = document.getElementById('bag-features');
  if (!grid || !features || typeof PA_PRODUCTS === 'undefined') return;

  const zar = (n) => 'R' + n.toLocaleString('en-ZA');
  const total = String(PA_PRODUCTS.length).padStart(2, '0');

  /* Real frame artwork dimensions (assets/images/frames/, see tools/frames-meta.json) */
  const FRAME_DIMS = {
    'pink-gilt': { w: 735, h: 933 },
    'mint-oval': { w: 473, h: 644 },
    'pink-carved': { w: 736, h: 902 },
    'teal-gilt': { w: 427, h: 640 },
    'lapis-gilt': { w: 667, h: 1000 },
  };

  PA_PRODUCTS.forEach((p, i) => {
    const firstAvailable = p.colours.find(c => !c.soldOut) || p.colours[0];
    const allSoldOut = p.colours.every(c => c.soldOut);

    /* Frame card — real carved-frame artwork (see css/gallery-wall.css) */
    const dims = FRAME_DIMS[p.frame] || { w: 736, h: 933 };
    grid.insertAdjacentHTML('beforeend', `
      <a href="#${p.id}" class="bag-frame">
        <div class="pf pf--${p.frame} pf--lg">
          <span class="pf__photo"><img src="${PA_BAG_IMG(firstAvailable.imgs[0], 'sm')}" alt="${p.name} in ${firstAvailable.name}" loading="${i === 0 ? 'eager' : 'lazy'}"></span>
          <img class="pf__frame" src="assets/images/frames/${p.frame}.webp" alt="" width="${dims.w}" height="${dims.h}" loading="${i === 0 ? 'eager' : 'lazy'}">
        </div>
        <div class="bag-frame__info">
          <h2 class="bag-frame__name">${p.name}</h2>
          <span class="bag-frame__descriptor" data-bag-descriptor="${p.id}">${p.descriptor}</span>
          <span class="bag-frame__price">${allSoldOut ? 'Sold out' : zar(p.price)}</span>
          <span class="bag-frame__dots" aria-label="${p.colours.length} colours">
            ${p.colours.map(c => `<span style="background:${c.swatch}" title="${c.name}"></span>`).join('')}
          </span>
          <span class="bag-frame__cta">View bag</span>
        </div>
      </a>`);

    /* Product feature */
    features.insertAdjacentHTML('beforeend', `
      <article class="bag-feature" id="${p.id}" aria-label="${p.name}">
        <div class="bag-feature__grid">
          <div class="bag-feature__media">
            <div class="pf pf--${p.frame} pf--lg bag-feature__frame">
              <span class="pf__photo"><img class="bag-feature__stage" src="${PA_BAG_IMG(firstAvailable.imgs[0])}" alt="${p.name} in ${firstAvailable.name}" loading="lazy"></span>
              <img class="pf__frame" src="assets/images/frames/${p.frame}.webp" alt="" width="${dims.w}" height="${dims.h}" loading="lazy">
            </div>
            <div class="bag-feature__strip" role="group" aria-label="More photos"></div>
          </div>
          <div class="bag-feature__info">
            <span class="bag-feature__num">${String(i + 1).padStart(2, '0')} &mdash; ${total}</span>
            <h2 class="bag-feature__name">${p.name}</h2>
            <p class="bag-feature__descriptor" data-bag-descriptor="${p.id}">${p.descriptor}</p>
            <p class="bag-feature__price">${zar(p.price)}</p>
            <p class="bag-feature__desc" data-bag-desc="${p.id}">${p.desc}</p>
            <form class="pa-add-to-cart" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}">
              <span class="bag-feature__label">Colour: <strong class="bag-feature__colour-name">${firstAvailable.name}</strong></span>
              <div class="bag-swatches" role="radiogroup" aria-label="Colour">
                ${p.colours.map(c => `
                  <label class="bag-swatch" title="${c.name}${c.soldOut ? ' (sold out)' : ''}">
                    <input type="radio" name="colour" value="${c.name}" data-colour-id="${c.id}" ${c === firstAvailable && !c.soldOut ? 'checked' : ''} ${c.soldOut ? 'disabled' : ''} aria-label="${c.name}${c.soldOut ? ', sold out' : ''}">
                    <span style="background-color:${c.swatch}"></span>
                  </label>`).join('')}
              </div>
              <button type="submit" class="pa-add-to-cart__submit" ${allSoldOut ? 'disabled' : ''}>${allSoldOut ? 'Sold out' : 'Add to bag'}</button>
              <p class="pa-add-to-cart__note" hidden></p>
            </form>
            <p class="bag-feature__info-block">Delivered across South Africa by The Courier Guy. Tracking sent once your bag ships. <a href="policies.html">Returns &amp; exchanges</a></p>
            <ul class="bag-feature__details">
              ${p.details.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        </div>
      </article>`);

    /* Wire colour switching + thumbnails */
    const art = features.lastElementChild;
    const stage = art.querySelector('.bag-feature__stage');
    const strip = art.querySelector('.bag-feature__strip');
    const nameEl = art.querySelector('.bag-feature__colour-name');
    const form = art.querySelector('form');

    const showColour = (c) => {
      nameEl.textContent = c.name + (c.soldOut ? ' (sold out)' : '');
      form.dataset.productImg = PA_BAG_IMG(c.imgs[0], 'thumb');
      stage.src = PA_BAG_IMG(c.imgs[0]);
      stage.alt = `${p.name} in ${c.name}`;
      strip.innerHTML = c.imgs.length < 2 ? '' : c.imgs.map((k, n) => `
        <button type="button" class="bag-feature__thumb${n === 0 ? ' is-active' : ''}" aria-label="Photo ${n + 1} of ${c.imgs.length}">
          <img src="${PA_BAG_IMG(k, 'thumb')}" alt="" loading="lazy">
        </button>`).join('');
      strip.querySelectorAll('.bag-feature__thumb').forEach((btn, n) => {
        btn.addEventListener('click', () => {
          stage.src = PA_BAG_IMG(c.imgs[n]);
          strip.querySelectorAll('.bag-feature__thumb').forEach(b => b.classList.toggle('is-active', b === btn));
        });
      });
    };

    art.querySelectorAll('input[name="colour"]').forEach(input => {
      input.addEventListener('change', () => showColour(p.colours.find(c => c.id === input.dataset.colourId)));
    });

    /* Deep link from the homepage gallery wall: collection.html?colour=iris#knot */
    const wanted = new URLSearchParams(location.search).get('colour');
    const preset = location.hash === '#' + p.id && p.colours.find(c => c.id === wanted && !c.soldOut);
    if (preset) art.querySelector(`input[data-colour-id="${preset.id}"]`).checked = true;
    showColour(preset || firstAvailable);
  });

  /* Sections are rendered after load, so the browser's own #hash jump misses them. */
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) window.addEventListener('load', () => target.scrollIntoView());

  /* Bag names (Divine/Candy/Edie) stay the same in every language, like any
     brand's product line names — only the descriptor + long description are
     translated, from i18n/<lang>.json under "bags.<id>.*". This patches
     text IN PLACE on the elements already rendered above (English, by
     default) rather than re-rendering the catalogue — re-rendering would
     destroy and recreate the .pa-add-to-cart forms, orphaning the submit
     listeners cart.js already wired to them. Runs on every i18n:apply, so
     switching language does update the bag copy, safely. */
  const applyBagTranslations = () => {
    if (typeof I18N === 'undefined') return;
    PA_PRODUCTS.forEach(p => {
      const descriptor = I18N.get(`bags.${p.id}.descriptor`);
      const desc = I18N.get(`bags.${p.id}.desc`);
      document.querySelectorAll(`[data-bag-descriptor="${p.id}"]`).forEach(el => {
        if (typeof descriptor === 'string' && descriptor !== `bags.${p.id}.descriptor`) el.textContent = descriptor;
      });
      document.querySelectorAll(`[data-bag-desc="${p.id}"]`).forEach(el => {
        if (typeof desc === 'string' && desc !== `bags.${p.id}.desc`) el.textContent = desc;
      });
    });
  };
  document.addEventListener('i18n:apply', applyBagTranslations);
})();

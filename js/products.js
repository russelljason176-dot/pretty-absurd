/* ============================================================
   Pretty Absurd — bag catalogue (single source of truth)

   Rename a bag, change a price or mark a colour sold out HERE.
   collection.html renders straight from this list.

   IMPORTANT: prices are also checked server-side in
   cloudflare-worker/yoco-checkout.js (PRICES) — change both.

   Names/descriptor format from Kaylah (2026-09-30): name on its own as
   the title, descriptor line underneath, price below that — designer-
   house style. Edie's `desc` below is Kaylah's own copy verbatim; Candy
   and Divine are drafted in the same voice using only already-confirmed
   facts (brocade, fringe, colours) — get Kaylah's pass on those two
   before treating them as final, since they're not her own words yet.
   ============================================================ */

const PA_PRODUCTS = [
  {
    id: 'shoulder',
    frame: 'pink-gilt',                 // real carved-frame artwork key (assets/images/frames/)
    name: 'Divine',
    descriptor: 'brocade shoulder bag',
    price: 600,
    desc: 'divine… a soft, rounded shoulder bag in brocade, cut generously and finished with a fringe that moves the moment you do. the boldest piece in the line.',
    details: ['Brocade outer', 'Long fringe', 'Carried on the shoulder', 'Designed by Pretty Absurd'],
    colours: [
      { id: 'lilac', name: 'Lilac Brocade', swatch: '#B89AD8', soldOut: false, imgs: ['shoulder-lilac-1', 'shoulder-lilac-2'] },
      { id: 'rose',  name: 'Rose Brocade',  swatch: '#E39AB4', soldOut: false, imgs: ['shoulder-rose-1'] },
      { id: 'blush', name: 'Blush Brocade', swatch: '#F1D6E4', soldOut: false, imgs: ['shoulder-blush-1', 'shoulder-blush-3', 'shoulder-blush-6', 'shoulder-blush-9'] },
    ],
  },
  {
    id: 'knot-fringe',
    frame: 'teal-gilt',                 // real carved-frame artwork key (assets/images/frames/)
    name: 'Candy',
    descriptor: 'fringed brocade knot bag',
    price: 500,
    desc: 'candy… the japanese-inspired knot bag, tied at the wrist and finished with a long fringe that just won’t sit still.',
    details: ['Brocade outer', 'Japanese-inspired knot handle', 'Long fringe', 'Designed by Pretty Absurd'],
    colours: [
      { id: 'lilac', name: 'Lilac Brocade', swatch: '#B89AD8', soldOut: false, imgs: ['knot-fringe-lilac-3', 'knot-fringe-lilac-1', 'knot-fringe-lilac-5', 'knot-fringe-lilac-7'] },
      { id: 'iris',  name: 'Iris Brocade',  swatch: '#A9B8E0', soldOut: false, imgs: ['knot-fringe-iris-2', 'knot-fringe-iris-1', 'knot-fringe-iris-3', 'knot-fringe-iris-5'] },
    ],
  },
  {
    id: 'knot',
    frame: 'lapis-gilt',                // real carved-frame artwork key (assets/images/frames/)
    name: 'Edie',
    descriptor: 'brocade knot bag',
    price: 400,
    desc: 'edie… a knot bag borrowed from the japanese furoshiki tradition, then taken somewhere she shouldn’t have been. hand-cut brocade, sequin tulle, taffeta lining. made by hand in johannesburg… 15 at a time.',
    details: ['Brocade outer', 'Japanese-inspired knot handle', 'Wrist carry', 'Designed by Pretty Absurd'],
    colours: [
      { id: 'lilac', name: 'Lilac Brocade', swatch: '#B89AD8', soldOut: false, imgs: ['knot-lilac-1', 'knot-lilac-2'] },
      { id: 'blush', name: 'Blush Brocade', swatch: '#F1D6E4', soldOut: false, imgs: ['knot-blush-1'] },
      { id: 'iris',  name: 'Iris Brocade',  swatch: '#A9B8E0', soldOut: false, imgs: ['knot-iris-1', 'knot-iris-2'] },
    ],
  },
];

const PA_BAG_IMG = (key, size) => `assets/images/bags/${size ? size + '/' : ''}${key}.webp`; // size: 'sm' (600w) | 'thumb' (160w) | full (960w)

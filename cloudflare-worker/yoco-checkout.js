/*
 * Yoco Checkout backend for Pretty Absurd.
 *
 * The site itself (prettyabsurd.co.za) is static — GitHub Pages has no
 * server, and Yoco's Checkout API needs a secret key that can never be
 * exposed in browser code. This Worker is the one small server-side
 * piece: it takes the order total from checkout.html, calls Yoco with
 * the secret key, and hands back a redirect URL for the customer to
 * pay on Yoco's hosted checkout page.
 *
 * Also enforces one-time promo codes server-side via a Cloudflare KV
 * namespace (PROMO_CODES binding) — the static site alone can't stop a
 * code being reused, but this Worker can: a code is only marked used
 * once a checkout session is actually created with it, and reused
 * codes are rejected with 409 before that happens.
 *
 * Deploy: Cloudflare dashboard → Workers & Pages → Create → paste this
 * file in the Quick Edit box → Deploy. Then:
 *   - Settings → Variables and Secrets → add YOCO_SECRET_KEY (never
 *     commit it to git).
 *   - Settings → Bindings → add a KV namespace binding named
 *     PROMO_CODES (create the namespace first under Storage & Databases
 *     → KV if it doesn't exist yet).
 * Copy the Worker's *.workers.dev URL and send it back so checkout.html
 * can be pointed at it.
 */

const ALLOWED_ORIGIN = 'https://prettyabsurd.co.za';
const VALID_PROMO_CODES = ['ABSURDVIP1', 'ABSURDVIP2', 'ABSURDVIP3', 'ABSURDVIP4', 'ABSURDVIP5'];
const PROMO_DISCOUNT = 0.10;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === '/promo/check') {
      return handlePromoCheck(request, env);
    }
    return handleCheckout(request, env);
  },
};

function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

async function handlePromoCheck(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const code = normalizeCode(body.code);
  if (!VALID_PROMO_CODES.includes(code)) {
    return json({ valid: false, reason: 'invalid' }, 200);
  }
  const used = await env.PROMO_CODES.get(code);
  if (used) {
    return json({ valid: false, reason: 'used' }, 200);
  }
  return json({ valid: true, discount: PROMO_DISCOUNT }, 200);
}

async function handleCheckout(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const amountCents = Math.round(Number(body.amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return json({ error: 'Invalid amount' }, 400);
  }

  let promoCode = null;
  if (body.promoCode) {
    promoCode = normalizeCode(body.promoCode);
    if (!VALID_PROMO_CODES.includes(promoCode)) {
      return json({ error: 'Invalid promo code' }, 400);
    }
    const used = await env.PROMO_CODES.get(promoCode);
    if (used) {
      return json({ error: 'That promo code has already been used' }, 409);
    }
  }

  const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.YOCO_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: 'ZAR',
      successUrl: `${ALLOWED_ORIGIN}/order-confirmation.html`,
      cancelUrl: `${ALLOWED_ORIGIN}/checkout.html`,
      failureUrl: `${ALLOWED_ORIGIN}/checkout.html`,
      metadata: {
        orderId: body.orderId || '',
        items: (body.items || '').slice(0, 500),
        customerName: body.name || '',
        customerEmail: body.email || '',
        promoCode: promoCode || '',
      },
    }),
  });

  const data = await yocoRes.json();
  if (!yocoRes.ok) {
    return json({ error: data.message || 'Yoco checkout creation failed' }, 502);
  }

  if (promoCode) {
    await env.PROMO_CODES.put(promoCode, JSON.stringify({
      usedAt: new Date().toISOString(),
      checkoutId: data.id,
      orderId: body.orderId || '',
    }));
  }

  return json({ redirectUrl: data.redirectUrl }, 200);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

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
 * Deploy: Cloudflare dashboard → Workers & Pages → Create → paste this
 * file in the Quick Edit box → Deploy. Then Settings → Variables and
 * Secrets → add YOCO_SECRET_KEY (the Yoco secret key, test or live —
 * never commit it to git). Copy the Worker's *.workers.dev URL and
 * send it back so checkout.html can be pointed at it.
 */

const ALLOWED_ORIGIN = 'https://prettyabsurd.co.za';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

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
        },
      }),
    });

    const data = await yocoRes.json();
    if (!yocoRes.ok) {
      return json({ error: data.message || 'Yoco checkout creation failed' }, 502);
    }

    return json({ redirectUrl: data.redirectUrl }, 200);
  },
};

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

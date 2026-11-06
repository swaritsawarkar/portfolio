const digest = '64ca011d59e5e81e2fdc5ef952e547ed4544bdfdf5e8f21e40288b77ac309719';
const owner = 'sawarkarswarit@gmail.com';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const proof = request.headers.get('x-portfolio-setup') ?? '';
  if (!/^[a-f0-9]{64}$/.test(proof)) return new Response(null, { status: 403 });
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proof));
  const received = Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, '0')).join('');
  let mismatch = 0;
  for (let i = 0; i < digest.length; i++) mismatch |= digest.charCodeAt(i) ^ received.charCodeAt(i);
  if (mismatch) return new Response(null, { status: 403 });

  const data = await request.json().catch(() => null);
  const password = data?.password;
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return new Response(null, { status: 400 });
  }
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return new Response(null, { status: 503 });
  const result = await fetch(url + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: owner,
      password,
      email_confirm: true,
      app_metadata: { portfolio_wall_admin: true },
    }),
  });
  if (result.ok) return new Response(null, { status: 201 });
  const error = await result.json().catch(() => ({}));
  return new Response(null, { status: error.error_code === 'email_exists' ? 409 : 502 });
});

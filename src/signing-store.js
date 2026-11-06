// This key is public browser configuration. The database controls what it can do.
const hosted = import.meta.env.PROD ? {
  url: 'https://oxeofwobjucvrgeimkdt.supabase.co',
  key: 'sb_publishable_kQR8388RkScyA365zNw2xw_4O9cyPPC',
} : {};
const origin = (import.meta.env.VITE_SIGNING_SUPABASE_URL ?? hosted.url ?? '').replace(/\/$/, '');
const key = import.meta.env.VITE_SIGNING_SUPABASE_KEY ?? hosted.key;
const collection = '/rest/v1/portfolio_wall_marks';
const fields = '?select=id,name,strokes,bounds';
const ownerEmail = import.meta.env.VITE_SIGNING_OWNER_EMAIL ?? 'sawarkarswarit@gmail.com';

export const signingConfigured = Boolean(origin && key?.startsWith('sb_publishable_'));

async function request(path, { token, ...options } = {}) {
  if (!signingConfigured) throw new Error('The shared wall has not been connected.');
  const response = await fetch(origin + path, {
    ...options,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error('Could not reach the signing wall.');
    error.code = body.code;
    error.status = response.status;
    throw error;
  }
  return body;
}

export const signingStore = {
  async list() {
    const marks = [];
    let after = '';
    for (;;) {
      const page = await request(collection + fields + '&order=id.asc&limit=300' + after);
      marks.push(...page);
      if (page.length < 300) return marks;
      after = '&id=gt.' + encodeURIComponent(page.at(-1).id);
    }
  },
  async sign(name, strokes) {
    const [entry] = await request(collection + fields, {
      method: 'POST', body: JSON.stringify({ name, strokes }),
      headers: { Prefer: 'return=representation' },
    });
    return entry;
  },
  async login(username, password) {
    if (username.trim().toLowerCase() !== 'swaritlol') throw new Error('Owner access required.');
    const result = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email: ownerEmail, password }),
    });
    if (result.user?.app_metadata?.portfolio_wall_admin !== true || !result.access_token) {
      throw new Error('Owner access required.');
    }
    return result.access_token;
  },
  async remove(id, token) {
    const deleted = await request(collection + '?select=id&id=eq.' + encodeURIComponent(id), {
      method: 'DELETE', token, headers: { Prefer: 'return=representation' },
    });
    if (!deleted.length) throw new Error('Signature already removed or owner access expired.');
  },
};

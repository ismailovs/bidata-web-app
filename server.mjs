import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const scrypt = promisify(scryptCallback);
const root = dirname(fileURLToPath(import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (code, message) => { throw new ApiError(code, message); };
const emailOK = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const httpsURL = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };

export async function createApp(env = process.env, stripeFetch = fetch) {
  const origin = new URL(env.PUBLIC_ORIGIN || 'http://localhost:8080').origin;
  const secure = origin.startsWith('https:');
  if (!secure && !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Public origin must use HTTPS');
  const dbPath = env.DATABASE_PATH || resolve(root, 'data/bidata.sqlite');
  if (dbPath !== ':memory:') await mkdir(dirname(resolve(dbPath)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,customer TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER);
    CREATE TABLE IF NOT EXISTS bookmarks(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,tender_id TEXT,PRIMARY KEY(user_id,tender_id));
    CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,keywords TEXT NOT NULL DEFAULT '',region TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS workflow(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,tender_id TEXT,stage TEXT NOT NULL,PRIMARY KEY(user_id,tender_id));
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER,reset INTEGER);`);
  const cookieName = secure ? '__Host-bidata' : 'bidata';
  const priceIDs = { monthly: env.STRIPE_PRICE_MONTHLY, yearly: env.STRIPE_PRICE_YEARLY };
  const billingMode = ['test','live'].includes(env.BILLING_MODE) ? env.BILLING_MODE : 'off';
  const keyMatchesMode = billingMode !== 'off' && (env.STRIPE_SECRET_KEY || '').startsWith(billingMode === 'test' ? 'sk_test_' : 'sk_live_');
  const legalConfigured = httpsURL(env.PRIVACY_URL) && httpsURL(env.TERMS_URL) && emailOK(env.SUPPORT_EMAIL);
  const billingConfigured = env.PAYMENTS_ENABLED === 'true' && keyMatchesMode &&
    Object.values(priceIDs).every(p => /^price_[A-Za-z0-9]+$/.test(p || '')) &&
    (billingMode === 'test' || (env.DATA_MODE === 'live' && legalConfigured));
  const locks = new Map();
  async function locked(id, fn) {
    if (locks.has(id)) fail(409, 'Another billing request is in progress.');
    locks.set(id, true);
    try { return await fn(); } finally { locks.delete(id); }
  }
  async function stripe(path, method = 'GET', params = {}, idempotency) {
    if (!keyMatchesMode) fail(503, 'Billing mode and API key must match.');
    const query = new URLSearchParams(params);
    const response = await stripeFetch(`https://api.stripe.com/v1/${path}${method === 'GET' ? '?' + query : ''}`, {
      method, signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2026-10-28.endive',
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        ...(idempotency ? { 'Idempotency-Key': idempotency } : {}) },
      ...(method === 'POST' ? { body: query } : {})
    });
    if (!response.ok) fail(502, 'Billing provider is temporarily unavailable.');
    return response.json();
  }
  async function entitlement(user) {
    if (!user?.customer || !keyMatchesMode) return false;
    let after;
    for (let page = 0; page < 10; page++) {
      const result = await stripe('subscriptions', 'GET', { customer: user.customer, status: 'all', limit: '100', ...(after ? { starting_after: after } : {}) });
      if (result.data.some(s => ['active', 'trialing'].includes(s.status) && s.livemode === (billingMode === 'live') && !s.pause_collection &&
        s.items.data.some(i => Object.values(priceIDs).includes(i.price.id)))) return true;
      if (!result.has_more) return false;
      after = result.data.at(-1)?.id;
      if (!after) break;
    }
    fail(503, 'Subscription status could not be verified.');
  }
  async function feed() {
    if (env.DATA_MODE !== 'live') return { mode: 'sample', updatedAt: null, tenders: JSON.parse(await readFile(resolve(root, 'data/sample-tenders.json'), 'utf8')) };
    let data;
    try { data = JSON.parse(await readFile(env.TENDERS_FILE || resolve(root, 'data/tenders.json'), 'utf8')); }
    catch { fail(503, 'Live tender feed is not connected.'); }
    const stamp = Date.parse(data.updatedAt);
    const maxAge = Number(env.FEED_MAX_AGE_HOURS || 24) * 3600000;
    if (!Number.isFinite(stamp) || stamp > Date.now() + 300000 || Date.now() - stamp > maxAge || !Array.isArray(data.tenders)) fail(503, 'Tender feed is stale or invalid.');
    const seen = new Set();
    for (const t of data.tenders) {
      if (!t || typeof t.id !== 'string' || !/^[\w-]{1,100}$/.test(t.id) || seen.has(t.id) ||
        !['title','buyer','region','category','source'].every(k => typeof t[k] === 'string' && t[k].length > 0 && t[k].length <= 1000) ||
        !Number.isFinite(t.amount) || t.amount < 0 || t.currency !== 'UZS' || !Number.isFinite(Date.parse(t.deadline)) || !httpsURL(t.sourceUrl)) fail(503, 'Tender feed failed validation.');
      seen.add(t.id);
    }
    return { mode: 'live', updatedAt: data.updatedAt, tenders: data.tenders };
  }
  function rate(key, max = 15, seconds = 900) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare('DELETE FROM limits WHERE reset <= ?').run(now);
    const item = db.prepare('SELECT * FROM limits WHERE key=?').get(key);
    if (item?.count >= max) fail(429, 'Too many attempts. Please try again later.');
    db.prepare('INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now + seconds);
  }
  function session(req) {
    const value = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    return value ? db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?').get(hash(value), Date.now()) : null;
  }
  const requireUser = req => session(req) || fail(401, 'Please sign in first.');
  function setSession(res, user) {
    const token = randomBytes(32).toString('base64url');
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), user.id, Date.now() + 7 * 86400000);
    res.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure ? '; Secure' : ''}`);
  }
  async function body(req) {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) fail(415, 'JSON required.');
    const chunks = []; let length = 0;
    for await (const chunk of req) { length += chunk.length; if (length > 8192) fail(413, 'Request too large.'); chunks.push(chunk); }
    try { const b = JSON.parse(Buffer.concat(chunks).toString()); if (!b || Array.isArray(b) || typeof b !== 'object') throw Error(); return b; }
    catch { fail(400, 'Invalid JSON.'); }
  }
  const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const url = new URL(req.url, origin); const path = url.pathname;
      if (path.startsWith('/api/') && !['GET','HEAD'].includes(req.method)) {
        if (req.headers.origin !== origin) fail(403, 'Origin not allowed.');
        rate('write:' + req.socket.remoteAddress, 120, 60);
      }
      if (path === '/api/config' && req.method === 'GET') return json(res, 200, { dataMode: env.DATA_MODE === 'live' ? 'live' : 'sample', paymentsEnabled: billingConfigured, billingMode, privacyUrl: httpsURL(env.PRIVACY_URL) ? env.PRIVACY_URL : null, termsUrl: httpsURL(env.TERMS_URL) ? env.TERMS_URL : null, supportEmail: emailOK(env.SUPPORT_EMAIL) ? env.SUPPORT_EMAIL : null });
      if (path === '/api/tenders' && req.method === 'GET') {
        const data = await feed(); const q = (url.searchParams.get('q') || '').slice(0, 200).toLocaleLowerCase();
        data.tenders = data.tenders.filter(t => !q || `${t.title} ${t.buyer} ${t.region}`.toLocaleLowerCase().includes(q));
        return json(res, 200, data);
      }
      if (['/api/register','/api/login'].includes(path) && req.method === 'POST') {
        rate('auth-ip:' + req.socket.remoteAddress, 20);
        const input = await body(req);
        if (!emailOK(input.email) || typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) fail(400, 'Use a valid email and a password of 12–128 characters.');
        const email = input.email.toLowerCase().trim(); rate('auth-email:' + hash(email), 10);
        let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if (path === '/api/register') {
          if (user) fail(409, 'Account cannot be created. Try signing in.');
          const salt = randomBytes(16).toString('hex');
          const digest = (await scrypt(input.password, salt, 64)).toString('hex');
          user = { id: randomBytes(16).toString('hex'), email };
          try { db.prepare('INSERT INTO users(id,email,password) VALUES(?,?,?)').run(user.id, email, salt + ':' + digest); }
          catch { fail(409, 'Account cannot be created. Try signing in.'); }
        } else {
          const [salt, stored] = (user?.password || '00000000000000000000000000000000:' + '00'.repeat(64)).split(':');
          const digest = await scrypt(input.password, salt, 64);
          if (!timingSafeEqual(digest, Buffer.from(stored, 'hex')) || !user) fail(401, 'Email or password is incorrect.');
        }
        setSession(res, user); return json(res, 200, { email: user.email });
      }
      if (path === '/api/logout' && req.method === 'POST') {
        const token = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
        if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
        res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`);
        return json(res, 200, { ok: true });
      }
      if (path === '/api/me' && req.method === 'GET') {
        const user = session(req); return json(res, 200, user ? { email: user.email, pro: await entitlement(user) } : null);
      }
      if (path === '/api/profile') {
        const user = requireUser(req);
        if (req.method === 'GET') return json(res, 200, db.prepare('SELECT keywords,region FROM profiles WHERE user_id=?').get(user.id) || { keywords: '', region: '' });
        if (req.method === 'PUT') {
          const { keywords, region } = await body(req);
          if (typeof keywords !== 'string' || keywords.length > 500 || typeof region !== 'string' || region.length > 100) fail(400, 'Invalid company preferences.');
          db.prepare('INSERT INTO profiles VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET keywords=excluded.keywords,region=excluded.region').run(user.id, keywords, region);
          return json(res, 200, { ok: true });
        }
      }
      if (path === '/api/workflow') {
        const user = requireUser(req);
        if (req.method === 'GET') return json(res, 200, db.prepare('SELECT tender_id,stage FROM workflow WHERE user_id=?').all(user.id));
        if (req.method === 'PUT') {
          const { id, stage } = await body(req);
          if (typeof id !== 'string' || !['review','preparing','submitted','won','lost'].includes(stage) || !db.prepare('SELECT 1 FROM bookmarks WHERE user_id=? AND tender_id=?').get(user.id, id)) fail(400, 'Save the tender before assigning a stage.');
          db.prepare('INSERT INTO workflow VALUES(?,?,?) ON CONFLICT(user_id,tender_id) DO UPDATE SET stage=excluded.stage').run(user.id,id,stage);
          return json(res, 200, { ok: true });
        }
      }
      if (path === '/api/bookmarks') {
        const user = requireUser(req);
        if (req.method === 'GET') return json(res, 200, db.prepare('SELECT tender_id FROM bookmarks WHERE user_id=?').all(user.id).map(x => x.tender_id));
        if (['POST','DELETE'].includes(req.method)) {
          const { id } = await body(req);
          if (typeof id !== 'string' || !(await feed()).tenders.some(t => t.id === id)) fail(400, 'Tender not found.');
          db.prepare(req.method === 'POST' ? 'INSERT OR IGNORE INTO bookmarks VALUES(?,?)' : 'DELETE FROM bookmarks WHERE user_id=? AND tender_id=?').run(user.id, id);
          return json(res, 200, { ok: true });
        }
      }
      if (path === '/api/export' && req.method === 'GET') {
        const user = requireUser(req); if (!await entitlement(user)) fail(403, 'A verified Pro subscription is required.');
        const data = await feed(); if (data.mode !== 'live') fail(503, 'Live feed required.');
        const escape = v => '"' + String(v).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"','""') + '"';
        const csv = [['ID','Title','Buyer','Region','Amount','Currency','Deadline','Source'], ...data.tenders.map(t => [t.id,t.title,t.buyer,t.region,t.amount,t.currency,t.deadline,t.sourceUrl])].map(row => row.map(escape).join(',')).join('\r\n');
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bidata-tenders.csv"', 'Cache-Control': 'no-store' }); return res.end('\uFEFF' + csv);
      }
      if (path === '/api/plans' && req.method === 'GET') {
        if (!billingConfigured) return json(res, 200, []);
        const plans = await Promise.all(Object.entries(priceIDs).map(async ([id, price]) => {
          const p = await stripe('prices/' + price);
          if (p.livemode !== (billingMode === 'live') || !p.active || p.type !== 'recurring' || !Number.isInteger(p.unit_amount) || p.recurring.interval_count !== 1 || p.recurring.interval !== (id === 'monthly' ? 'month' : 'year')) fail(503, 'Subscription prices need configuration.');
          return { id, amount: p.unit_amount, currency: p.currency, interval: p.recurring.interval };
        })); return json(res, 200, plans);
      }
      if (path === '/api/checkout' && req.method === 'POST') {
        const user = requireUser(req);
        if (!billingConfigured) fail(503, 'Payments are not enabled yet.');
        if (billingMode === 'live' && (await feed()).mode !== 'live') fail(503, 'Live feed required for real charges.');
        const { plan } = await body(req); if (!Object.hasOwn(priceIDs, plan)) fail(400, 'Unknown plan.');
        return await locked(user.id, async () => {
          if (await entitlement(user)) fail(409, 'You already have a Pro subscription. Use subscription management.');
          if (!user.customer) {
            const customer = await stripe('customers', 'POST', { email: user.email, 'metadata[bidata_user]': user.id }, 'bidata-customer-' + user.id);
            db.prepare('UPDATE users SET customer=? WHERE id=?').run(customer.id, user.id); user.customer = customer.id;
          }
          const open = await stripe('checkout/sessions', 'GET', { customer: user.customer, status: 'open', limit: '100' });
          if (open.data.length) fail(409, 'An unfinished checkout exists. Complete it or wait for it to expire before starting another plan.');
          const checkout = await stripe('checkout/sessions', 'POST', {
            mode: 'subscription', customer: user.customer, client_reference_id: user.id,
            'line_items[0][price]': priceIDs[plan], 'line_items[0][quantity]': '1',
            success_url: origin + '/?checkout=returned#plans', cancel_url: origin + '/#plans',
            'subscription_data[metadata][bidata_user]': user.id, ...(legalConfigured ? { 'consent_collection[terms_of_service]': 'required' } : {})
          }, 'bidata-checkout-' + user.id + '-' + plan + '-' + Math.floor(Date.now()/1800000));
          if (checkout.livemode !== (billingMode === 'live')) fail(502, 'Checkout billing mode mismatch.');
          return json(res, 200, { url: checkout.url });
        });
      }
      if (path === '/api/portal' && req.method === 'POST') {
        const user = requireUser(req); if (!user.customer) fail(400, 'No billing account found.');
        const portal = await stripe('billing_portal/sessions', 'POST', { customer: user.customer, return_url: origin + '/#account' });
        return json(res, 200, { url: portal.url });
      }
      if (path.startsWith('/api/')) fail(404, 'Endpoint not found.');
      if (!['GET','HEAD'].includes(req.method)) fail(405, 'Method not allowed.');
      const relative = path === '/' ? 'index.html' : decodeURIComponent(path).slice(1);
      const file = resolve(root, 'public', relative);
      if (!file.startsWith(resolve(root, 'public') + '/') || relative.includes('\0')) fail(404, 'Not found.');
      let content; try { content = await readFile(file); } catch { fail(404, 'Not found.'); }
      const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...(path === '/sw.js' ? { 'Service-Worker-Allowed':'/' } : {}) });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      json(res, error.status || 500, { error: error.status ? error.message : 'Service temporarily unavailable. Please try again.' });
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000;
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.indexOf('--port');
  const port = Number(portArg >= 0 ? process.argv[portArg + 1] : process.env.PORT || 8080);
  const server = await createApp();
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log('Bidata listening on port ' + port));
}

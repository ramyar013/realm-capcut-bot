// Shared helpers — storage in Supabase table `ra_kv` (key text primary key, val text)
const SB = process.env.SUPABASE_URL, SK = process.env.SUPABASE_SERVICE_KEY;
const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };
export const TRIAL_MIN = 5;
export async function kvGet(k) {
  const r = await fetch(`${SB}/rest/v1/ra_kv?key=eq.${encodeURIComponent(k)}&select=val`, { headers: H });
  const j = await r.json(); return j[0] ? j[0].val : null;
}
export async function kvSet(k, v) {
  await fetch(`${SB}/rest/v1/ra_kv`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ key: k, val: String(v) }) });
}
export async function kvDel(k) { await fetch(`${SB}/rest/v1/ra_kv?key=eq.${encodeURIComponent(k)}`, { method: 'DELETE', headers: H }); }
export async function kvList(prefix) {
  const r = await fetch(`${SB}/rest/v1/ra_kv?key=like.${encodeURIComponent(prefix)}*&select=key,val`, { headers: H });
  return r.json();
}
export async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
export const PRICE = () => process.env.PRICE || '٢٥,٠٠٠ دینار';
export const send = (chat_id, text, extra = {}) => tg('sendMessage', { chat_id, text, parse_mode: 'HTML', protect_content: true, ...extra });
export const buyKb = () => ({ inline_keyboard: [[{ text: '💬 پەیوەندی بۆ کڕین', url: `https://t.me/${(process.env.CONTACT || '').replace('@', '')}` }]] });

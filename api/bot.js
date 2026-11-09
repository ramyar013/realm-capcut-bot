import { kvGet, kvSet, kvDel, tg, send, buyKb, PRICE, TRIAL_MIN } from './_lib.js';
const MENU = { inline_keyboard: [
  [{ text: '🎁 تاقیکردنەوەی ٥ خولەکی (کۆد)', callback_data: 'trial' }],
  [{ text: '📘 دەربارەی کتێبەکە', callback_data: 'book' }],
  [{ text: '💳 کڕینی کۆرس', callback_data: 'buy' }]] };
const welcome = () => `🎓 <b>بەخێربێیت بۆ کۆرسی کاپکەت پڕۆ | Realm Academy</b>\n\n📚 ٣٠ وانەی ڕێکخراو + وانەی لاوەکی\n🤖 ئامرازەکانی زیرەکی دەستکرد\n📘 کتێبی ٥٧ لاپەڕەیی بە دیاری\n\n💰 نرخ: <b>${PRICE()}</b>\n\nلە خوارەوە هەڵبژێرە 👇`;
function newCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'RA-'; for (const x of crypto.getRandomValues(new Uint8Array(6))) s += c[x % c.length]; return s; }

async function useCode(uid, chatId, code) {
  const kind = await kvGet(`code:${code}`);            // 'normal' | 'vip'
  if (!kind) return send(chatId, '❌ ئەم کۆدە هەڵەیە یان پێشتر بەکارهاتووە.');
  if (kind !== 'vip' && await kvGet(`used:${uid}`))     // user ID never changes, even if username changes
    return send(chatId, '⚠️ تۆ پێشتر تاقیکردنەوەکەت بەکارهێناوە.\n\nبۆ بەشداریکردن پەیوەندیمان پێوە بکە 👇', { reply_markup: buyKb() });
  await kvDel(`code:${code}`);
  const link = await tg('createChatInviteLink', { chat_id: process.env.TRIAL_CHAT_ID, member_limit: 1, expire_date: Math.floor(Date.now() / 1000) + 600, name: `trial ${uid}` });
  if (!link.ok) return send(chatId, 'هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵبدەرەوە.');
  await kvSet(`used:${uid}`, '1');
  return send(chatId, `✅ <b>کۆدەکە دروستە!</b>\n\nکلیک لە دوگمەی خوارەوە بکە.\n⏱ تەنها <b>${TRIAL_MIN} خولەک</b> کاتت هەیە.\n🔗 لینکەکە تەنها یەک جار کار دەکات.`,
    { reply_markup: { inline_keyboard: [[{ text: '🎬 چوونە ناو کۆرسەکە', url: link.result.invite_link }]] } });
}

async function onMessage(msg) {
  const uid = msg.from.id, chatId = msg.chat.id, t = (msg.text || '').trim();
  if (String(uid) === String(process.env.ADMIN_ID)) {
    const [cmd, arg] = t.split(/\s+/);
    if (cmd === '/newcode' || cmd === '/vipcode') {
      const n = Math.min(20, Number(arg || 1)), kind = cmd === '/vipcode' ? 'vip' : 'normal', out = [];
      for (let i = 0; i < n; i++) { const c = newCode(); await kvSet(`code:${c}`, kind); out.push(`<code>${c}</code>`); }
      return send(chatId, `${kind === 'vip' ? '⭐ کۆدی تایبەت (بۆ کەسێک کە پێشتر تاقی کردووەتەوە)' : '🎁 کۆدی ٥ خولەکی'}:\n\n${out.join('\n')}`);
    }
    if (cmd === '/reset' && arg) { await kvDel(`used:${arg}`); return send(chatId, '✅ ئەم کەسە دەتوانێت دووبارە تاقی بکاتەوە.'); }
    if (cmd === '/help') return send(chatId, '/newcode 3 — ٣ کۆدی ئاسایی\n/vipcode 1 — کۆد بۆ کەسێک کە پێشتر تاقی کردووەتەوە\n/reset ID — ڕێگەدان بە کەسێک بۆ جارێکی تر');
  }
  const m = t.toUpperCase().match(/RA-[A-Z0-9]{6}/);
  if (m) return useCode(uid, chatId, m[0]);
  return send(chatId, welcome(), { reply_markup: MENU });
}

async function onCallback(cq) {
  await tg('answerCallbackQuery', { callback_query_id: cq.id });
  const chatId = cq.message.chat.id;
  if (cq.data === 'trial') return send(chatId, '🎁 کۆدەکەت لێرە بنووسە، نموونە: <code>RA-AB12CD</code>\n\nکۆدت نییە؟ داوای لە ئێمە بکە 👇', { reply_markup: buyKb() });
  if (cq.data === 'book') return send(chatId, `📘 <b>باشترین فکرەکان بۆ بەهێزکردنی بزنسەکەت</b>\n\n✨ ٥٧ لاپەڕە، پلانی کاری ٣٠ ڕۆژی، کاریگەری ڕەنگەکان، زیرەکی دەستکرد...\n🎁 بە دیاری لەگەڵ کۆرسەکە وەریدەگریت.`, { reply_markup: buyKb() });
  if (cq.data === 'buy') return send(chatId, `💳 <b>کۆرسی کاپکەت پڕۆ</b>\n\n✅ ٣٠ وانە + وانەی لاوەکی\n✅ کتێبی دیاری\n✅ دەستگەیشتنی هەمیشەیی\n\n💰 <b>${PRICE()}</b>`, { reply_markup: buyKb() });
}

async function onMember(m) {
  if (String(m.chat.id) !== String(process.env.TRIAL_CHAT_ID)) return;
  const inv = m.invite_link && m.invite_link.name || '';
  if (m.new_chat_member.status === 'member' && inv.startsWith('trial')) {
    const uid = m.new_chat_member.user.id;
    await kvSet(`in:${uid}`, Date.now() + TRIAL_MIN * 60000);
    await send(uid, `⏱ تاقیکردنەوەکەت دەستی پێکرد، <b>${TRIAL_MIN} خولەک</b>ت هەیە 🎬`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== process.env.WEBHOOK_SECRET) return res.status(200).send('ok');
  const u = req.body;
  try {
    if (u.message && u.message.chat.type === 'private') await onMessage(u.message);
    else if (u.callback_query) await onCallback(u.callback_query);
    else if (u.chat_member) await onMember(u.chat_member);
  } catch (e) { console.log(e); }
  res.status(200).send('ok');
}

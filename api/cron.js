import { kvList, kvDel, tg, send, buyKb, PRICE } from './_lib.js';
// Called every minute by Supabase pg_cron (pg_net) with ?key=CRON_SECRET
export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.query.key !== process.env.CRON_SECRET) return res.status(403).send('no');
  const now = Date.now(); let n = 0;
  for (const { key, val } of await kvList('in:')) {
    if (now < Number(val)) continue;
    const uid = Number(key.slice(3));
    await tg('banChatMember', { chat_id: process.env.TRIAL_CHAT_ID, user_id: uid, until_date: Math.floor(now / 1000) + 40 });
    await tg('unbanChatMember', { chat_id: process.env.TRIAL_CHAT_ID, user_id: uid, only_if_banned: true });
    await kvDel(key); n++;
    await send(uid, `⌛ <b>کاتی تاقیکردنەوەکەت تەواو بوو.</b>\n\nهیوادارین بەدڵت بووبێت 🌟\nبۆ کۆرسی تەواو (٣٠ وانە + کتێبی دیاری) تەنها بە <b>${PRICE()}</b> پەیوەندیمان پێوە بکە 👇`, { reply_markup: buyKb() });
  }
  res.status(200).json({ kicked: n });
}


import { tg } from './_lib.js';
// Visit once: https://YOUR-APP.vercel.app/api/setup?key=CRON_SECRET
export default async function handler(req, res) {
  if (req.query.key !== process.env.CRON_SECRET) return res.status(403).send('no');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const r = await tg('setWebhook', { url: `https://${host}/api/bot`, secret_token: process.env.WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query', 'chat_member'], drop_pending_updates: true });
  const me = await tg('getMe', {});
  res.status(200).json({ webhook: r, bot: me.result && me.result.username });
}

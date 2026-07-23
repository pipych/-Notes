const crypto = require('crypto');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function verifyTelegramInitData(initDataRaw) {
  if (!initDataRaw || !BOT_TOKEN) return null;
  
  const urlParams = new URLSearchParams(initDataRaw);
  const hash = urlParams.get('hash');
  if (!hash) return null;

  urlParams.delete('hash');
  const params = [];
  for (const [key, value] of urlParams.entries()) {
    params.push(`${key}=${value}`);
  }
  params.sort();
  const dataCheckString = params.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash !== hash) return null;

  const userJson = urlParams.get('user');
  return userJson ? JSON.parse(userJson) : null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { initData } = req.body || {};
    const tgUser = verifyTelegramInitData(initData);

    if (!tgUser) {
      return res.status(401).json({ error: 'Invalid Telegram hash or missing initData' });
    }

    // 1. Поиск профиля в Supabase
    const selectRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?telegram_id=eq.${tgUser.id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      }
    );

    const profiles = await selectRes.json();
    let profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;

    // 2. Создание профиля, если его нет
    if (!profile) {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username || '',
          is_guest: false
        })
      });

      const insertedData = await insertRes.json();
      profile = Array.isArray(insertedData) && insertedData.length > 0 ? insertedData[0] : null;
    }

    return res.status(200).json({ user: profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

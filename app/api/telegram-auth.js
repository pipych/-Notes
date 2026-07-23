const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifyTelegramInitData(initDataRaw) {
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { initData } = req.body;
    const tgUser = verifyTelegramInitData(initData);

    if (!tgUser) {
      return res.status(401).json({ error: 'Invalid hash' });
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', tgUser.id)
      .single();

    if (!profile) {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          telegram_id: tgUser.id,
          first_name: tgUser.first_name,
          username: tgUser.username || '',
          is_guest: false,
        })
        .select()
        .single();

      if (error) throw error;
      profile = newProfile;
    }

    return res.status(200).json({ user: profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

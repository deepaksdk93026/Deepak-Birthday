const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Public folder ya root dono se static files serve karega
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const WISHES_FILE = path.join(__dirname, 'wishes.json');

// Telegram Bot Details
const TELEGRAM_BOT_TOKEN = '8686859259:AAGc7aeBbej-E1fH9s4g1hs0qDaHdmK7fG8';
const TELEGRAM_CHAT_ID = '5590745278';

function sendTelegramNotification(name, message) {
  const text = `🎉 *Nayi Birthday Wish Aayi!*\n\n👤 *From:* ${name}\n💌 *Message:* ${message}\n⏰ *Time:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
  
  const payload = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
  });

  req.on('error', (e) => {
    console.error('Telegram notification error:', e);
  });

  req.write(payload);
  req.end();
}

// Wishes Read API
app.get('/api/wishes', (req, res) => {
  if (!fs.existsSync(WISHES_FILE)) {
    fs.writeFileSync(WISHES_FILE, '[]');
  }
  try {
    const data = fs.readFileSync(WISHES_FILE, 'utf8');
    res.json(JSON.parse(data || '[]'));
  } catch (err) {
    res.json([]);
  }
});

// Wishes Post API (Telegram notification ke saath)
app.post('/api/wishes', (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message required' });
  }

  let wishes = [];
  if (fs.existsSync(WISHES_FILE)) {
    try {
      wishes = JSON.parse(fs.readFileSync(WISHES_FILE, 'utf8') || '[]');
    } catch (e) {
      wishes = [];
    }
  }

  const newWish = { id: Date.now(), name, message, date: new Date().toISOString() };
  wishes.push(newWish);

  fs.writeFileSync(WISHES_FILE, JSON.stringify(wishes, null, 2));

  // Instant Telegram Alert Trigger
  sendTelegramNotification(name, message);

  res.status(201).json(newWish);
});

// Home page fallback
app.get('*', (req, res) => {
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const rootPath = path.join(__dirname, 'index.html');

  if (fs.existsSync(publicPath)) {
    res.sendFile(publicPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.send('index.html file nahi mili.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

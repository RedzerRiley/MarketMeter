/* ============================================================
   MarketMeter — server.js
   Simple Node.js + Express backend
   Stores users in assets/database.txt (AES-256 encrypted)

   HOW TO RUN:
     1. npm install
     2. node server.js
     3. Open http://localhost:3000 in your browser

   FOLDER STRUCTURE EXPECTED:
     /
     ├── server.js
     ├── package.json
     ├── assets/
     │   └── database.txt       ← auto-created on first register
     ├── css/
     │   ├── style.css
     │   └── auth.css
     │   └── app.css
     ├── js/
     │   ├── auth.js
     │   └── app.js
     ├── index.html
     ├── login.html
     ├── register.html
     ├── dashboard.html
     └── submit-price.html
   ============================================================ */

'use strict';

const express    = require('express');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = 3000;

/* ============================================================
   ENCRYPTION CONFIG
   ============================================================ */
const ENCRYPTION_KEY = 'MarketMeter2025SecureKey!@#$%^&*'; // exactly 32 chars
const IV_LENGTH      = 16; 
const ALGORITHM      = 'aes-256-cbc';
const DB_PATH        = path.join(__dirname, 'assets', 'database.txt');

/* ============================================================
   HELPERS: Encrypt / Decrypt / Database I/O
   ============================================================ */

function encrypt(text) {
  const iv         = crypto.randomBytes(IV_LENGTH);
  const cipher     = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  const encrypted  = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts     = text.split(':');
  const iv        = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}

function readDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) return { users: [] };
    const raw = fs.readFileSync(DB_PATH, 'utf8').trim();
    if (!raw) return { users: [] };
    const decrypted = decrypt(raw);
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('[DB] Read error:', err.message);
    return { users: [] };
  }
}

function writeDatabase(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const json      = JSON.stringify(data, null, 2);
  const encrypted = encrypt(json);
  fs.writeFileSync(DB_PATH, encrypted, 'utf8');
}

/* ============================================================
   MIDDLEWARE
   ============================================================ */

app.use(express.json());
app.use(express.static(__dirname)); 

/* ============================================================
   PAGE ROUTES (Fixes "Cannot GET /")
   ============================================================ */

// This route handles the main address (http://localhost:3000)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

/* ============================================================
   API ROUTES
   ============================================================ */

// 1. REGISTER
app.post('/api/register', (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  const db = readDatabase();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const newUser = {
    id:          crypto.randomUUID(),
    fullName:    fullName.trim(),
    email:       email.trim().toLowerCase(),
    password:    hashedPassword,
    submissions: 0,
    memberSince: new Date().toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
    createdAt:   new Date().toISOString()
  };

  db.users.push(newUser);
  writeDatabase(db);
  res.status(201).json({ success: true, message: 'Account created!' });
});

// 2. LOGIN
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db   = readDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
  if (hashedInput !== user.password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const profile = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    submissions: user.submissions,
    memberSince: user.memberSince
  };

  res.status(200).json({ success: true, user: profile });
});

// 3. INCREMENT SUBMISSIONS
app.post('/api/increment-submissions', (req, res) => {
  const { userId } = req.body;
  const db   = readDatabase();
  const user = db.users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.submissions = (user.submissions || 0) + 1;
  writeDatabase(db);
  res.status(200).json({ success: true, submissions: user.submissions });
});

// 4. EXPORT CSV (Downloads the database as a CSV)
app.get('/api/export-csv', (req, res) => {
    const db = readDatabase();
    if (!db.users || db.users.length === 0) {
        return res.status(404).send('No data to export.');
    }

    let csvContent = "ID,Full Name,Email,Submissions,Member Since\n";
    db.users.forEach(u => {
        csvContent += `${u.id},${u.fullName},${u.email},${u.submissions},${u.memberSince}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=MarketMeter_Users.csv');
    res.status(200).send(csvContent);
});

// 5. HEALTH CHECK
app.get('/api/health', (req, res) => {
  const db = readDatabase();
  res.json({ status: 'ok', totalUsers: db.users.length });
});

/* ============================================================
   START SERVER
   ============================================================ */
app.listen(PORT, () => {
  console.log('\n✅ Success! MarketMeter Server is Live.');
  console.log(`🔗 Access here: http://localhost:${PORT}`);
  console.log(`📂 DB Location: ${DB_PATH}\n`);
});
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
   Change ENCRYPTION_KEY to any 32-character string you want.
   Keep it secret — this is what protects your database.txt
   ============================================================ */
const ENCRYPTION_KEY = 'MarketMeter2025SecureKey!@#$%^&*'; // exactly 32 chars
const IV_LENGTH      = 16; // AES block size
const ALGORITHM      = 'aes-256-cbc';
const DB_PATH        = path.join(__dirname, 'assets', 'database.txt');

/* ============================================================
   HELPERS: Encrypt / Decrypt
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

/* ============================================================
   HELPERS: Read / Write database.txt
   ============================================================ */

function readDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) return { users: [] };
    const raw       = fs.readFileSync(DB_PATH, 'utf8').trim();
    if (!raw)       return { users: [] };
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
app.use(express.static(__dirname)); // serve all HTML, CSS, JS files

/* ============================================================
   API ROUTES
   ============================================================ */

/* ----------------------------------------------------------
   POST /api/register
   Body: { fullName, email, password }
   ---------------------------------------------------------- */
app.post('/api/register', (req, res) => {
  const { fullName, email, password } = req.body;

  /* Basic server-side validation */
  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const db = readDatabase();

  /* Check for duplicate email */
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'This email is already registered.' });
  }

  /* Hash password with SHA-256 before storing
     NOTE: For production use bcrypt. SHA-256 is fine for a university demo. */
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  /* Build new user object */
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

  console.log(`[Register] New user: ${newUser.email} (${newUser.id})`);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully!'
  });
});

/* ----------------------------------------------------------
   POST /api/login
   Body: { email, password }
   ---------------------------------------------------------- */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const db   = readDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
  if (hashedInput !== user.password) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  /* Return safe user profile (never send password hash to client) */
  const profile = {
    id:          user.id,
    fullName:    user.fullName,
    email:       user.email,
    submissions: user.submissions,
    memberSince: user.memberSince
  };

  console.log(`[Login] User logged in: ${user.email}`);

  return res.status(200).json({
    success: true,
    message: `Welcome back, ${user.fullName}!`,
    user:    profile
  });
});

/* ----------------------------------------------------------
   POST /api/increment-submissions
   Body: { userId }
   Called by submit-price page after a successful submission
   ---------------------------------------------------------- */
app.post('/api/increment-submissions', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'userId required.' });

  const db   = readDatabase();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.submissions = (user.submissions || 0) + 1;
  writeDatabase(db);

  return res.status(200).json({ success: true, submissions: user.submissions });
});

/* ----------------------------------------------------------
   GET /api/health
   Quick sanity check — open http://localhost:3000/api/health
   ---------------------------------------------------------- */
app.get('/api/health', (req, res) => {
  const db = readDatabase();
  res.json({ status: 'ok', totalUsers: db.users.length });
});

/* ============================================================
   START SERVER
   ============================================================ */

app.listen(PORT, () => {
  console.log('');
  console.log('  MarketMeter Server');
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`  Database:   ${DB_PATH}`);
  console.log('');
});
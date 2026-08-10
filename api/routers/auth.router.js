const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Demo accounts usable when SKIP_DB=true or for quick local testing
const demoAccounts = {
  'admin@inptic.ga': { password: '123admin', role: 'admin', name: 'Admin User' },
  'teacher@inptic.ga': { password: 'teacher123', role: 'teacher', name: 'Demo Teacher' },
  'secretariat@inptic.ga': { password: 'secret123', role: 'secretariat', name: 'Secretariat' },
  'student@inptic.ga': { password: 'student123', role: 'student', name: 'Demo Student' }
};

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const acct = demoAccounts[email.toLowerCase()];
  if (!acct || acct.password !== password) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const user = { email: email.toLowerCase(), name: acct.name, role: acct.role };
  const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, user });
});

// optional: expose demo users for quick frontend UX (no passwords)
router.get('/demo-users', (req, res) => {
  const list = Object.keys(demoAccounts).map((email) => ({ email, name: demoAccounts[email].name, role: demoAccounts[email].role }));
  res.json(list);
});

module.exports = router;

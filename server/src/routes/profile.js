import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  res.json({ profile: profile || null });
});

router.put('/', requireAuth, (req, res) => {
  const { business_name, email, address, phone, logo_url } = req.body;
  if (!business_name || !email) return res.status(400).json({ error: 'Business name and email are required' });
  const db = getDb();
  const existing = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  const id = existing ? existing.id : uuidv4();
  if (existing) {
    db.prepare('UPDATE profiles SET business_name=?, email=?, address=?, phone=?, logo_url=?, updated_at=datetime("now") WHERE user_id=?')
      .run(business_name, email, address || '', phone || '', logo_url || '', req.userId);
  } else {
    db.prepare('INSERT INTO profiles (id, user_id, business_name, email, address, phone, logo_url) VALUES (?,?,?,?,?,?,?)')
      .run(id, req.userId, business_name, email, address || '', phone || '', logo_url || '');
  }
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  res.json({ profile });
});

export default router;
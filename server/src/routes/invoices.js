import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper: generate invoice number
function nextInvoiceNumber(db, userId) {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM invoices WHERE user_id = ?').get(userId);
  return `INV-${String(row.cnt + 1).padStart(4, '0')}`;
}

// Helper: calculate total
function calcTotal(items, taxRate, discount) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 1) * (item.rate || 0), 0);
  const tax = subtotal * (taxRate || 0) / 100;
  return subtotal + tax - (discount || 0);
}

// List invoices
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const invoices = db.prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json({ invoices });
});

// Get single invoice with items
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
  res.json({ invoice, items });
});

// Create invoice
router.post('/', requireAuth, (req, res) => {
  const { client_name, client_email, client_address, issue_date, due_date, notes, tax_rate, discount, items } = req.body;
  if (!client_name || !client_email) return res.status(400).json({ error: 'Client name and email required' });
  if (!items || !items.length) return res.status(400).json({ error: 'At least one line item required' });

  const db = getDb();
  const id = uuidv4();
  const shareToken = uuidv4().replace(/-/g, '').slice(0, 12);
  const invoiceNumber = nextInvoiceNumber(db, req.userId);
  const total = calcTotal(items, tax_rate || 0, discount || 0);

  db.prepare(`INSERT INTO invoices (id, user_id, invoice_number, client_name, client_email, client_address, issue_date, due_date, notes, tax_rate, discount, total, share_token)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.userId, invoiceNumber, client_name, client_email, client_address || '', issue_date || null, due_date || null, notes || '', tax_rate || 0, discount || 0, total, shareToken);

  const stmt = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount) VALUES (?,?,?,?,?,?)');
  for (const item of items) {
    const amount = (item.quantity || 1) * (item.rate || 0);
    stmt.run(uuidv4(), id, item.description, item.quantity || 1, item.rate || 0, amount);
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  const invoiceItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
  res.status(201).json({ invoice, items: invoiceItems });
});

// Update invoice
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const { client_name, client_email, client_address, issue_date, due_date, notes, tax_rate, discount, status, items } = req.body;
  const taxRate = tax_rate !== undefined ? tax_rate : existing.tax_rate;
  const disc = discount !== undefined ? discount : existing.discount;
  let total = existing.total;

  db.prepare(`UPDATE invoices SET client_name=?, client_email=?, client_address=?, issue_date=?, due_date=?, notes=?, tax_rate=?, discount=?, status=?, updated_at=datetime('now') WHERE id=?`)
    .run(
      client_name || existing.client_name,
      client_email || existing.client_email,
      client_address !== undefined ? client_address : existing.client_address,
      issue_date !== undefined ? issue_date : existing.issue_date,
      due_date !== undefined ? due_date : existing.due_date,
      notes !== undefined ? notes : existing.notes,
      taxRate, disc,
      status || existing.status,
      req.params.id
    );

  // Update items if provided
  if (items && items.length) {
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    const stmt = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount) VALUES (?,?,?,?,?,?)');
    for (const item of items) {
      const amount = (item.quantity || 1) * (item.rate || 0);
      stmt.run(uuidv4(), req.params.id, item.description, item.quantity || 1, item.rate || 0, amount);
    }
    total = calcTotal(items, taxRate, disc);
    db.prepare('UPDATE invoices SET total = ? WHERE id = ?').run(total, req.params.id);
  }

  if (status === 'paid' && existing.status !== 'paid') {
    db.prepare('UPDATE invoices SET paid_at = datetime("now") WHERE id = ?').run(req.params.id);
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  const invoiceItems = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json({ invoice, items: invoiceItems });
});

// Delete invoice
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ success: true });
});

// Mark as paid
router.post('/:id/mark-paid', requireAuth, (req, res) => {
  const db = getDb();
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  db.prepare("UPDATE invoices SET status='paid', paid_at=datetime('now'), updated_at=datetime('now') WHERE id=?")
    .run(req.params.id);
  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json({ invoice: updated });
});

export default router;
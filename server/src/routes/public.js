import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/:token', (req, res) => {
  try {
    const db = getDb();
    const invoice = db.prepare('SELECT * FROM invoices WHERE share_token = ?').get(req.params.token);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Mark as viewed if not already
    if (invoice.status === 'sent') {
      db.prepare("UPDATE invoices SET status='viewed', viewed_at=datetime('now'), updated_at=datetime('now') WHERE id=?")
        .run(invoice.id);
      invoice.status = 'viewed';
    }

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(invoice.user_id);

    res.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_address: invoice.client_address,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        notes: invoice.notes,
        tax_rate: invoice.tax_rate,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at
      },
      items,
      profile: profile ? {
        business_name: profile.business_name,
        email: profile.email,
        address: profile.address,
        phone: profile.phone,
        logo_url: profile.logo_url
      } : null
    });
  } catch (err) {
    console.error('Public invoice error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
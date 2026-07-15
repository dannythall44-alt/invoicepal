import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(501).json({ error: 'Stripe not configured. Dev mode.' });
    }
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, req.userId);
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'usd', product_data: { name: 'InvoicePal Pro' }, unit_amount: 1900, recurring: { interval: 'month' } },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:3002'}/dashboard?checkout=success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3002'}/pricing?checkout=canceled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ received: true });
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    const db = getDb();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const user = db.prepare('SELECT * FROM users WHERE stripe_customer_id = ?').get(session.customer);
      if (user) db.prepare("UPDATE users SET subscription_status='active', subscription_id=?, updated_at=datetime('now') WHERE id=?").run(session.subscription, user.id);
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const user = db.prepare('SELECT * FROM users WHERE stripe_customer_id = ?').get(sub.customer);
      if (user) db.prepare("UPDATE users SET subscription_status='inactive', subscription_id=NULL, updated_at=datetime('now') WHERE id=?").run(user.id);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

router.get('/status', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT subscription_status FROM users WHERE id = ?').get(req.userId);
  const status = process.env.STRIPE_SECRET_KEY ? (user?.subscription_status || 'inactive') : 'active';
  res.json({ subscription_status: status, requires_payment: !!process.env.STRIPE_SECRET_KEY });
});

export default router;
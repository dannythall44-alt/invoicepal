import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import invoiceRoutes from './routes/invoices.js';
import publicRoutes from './routes/public.js';
import stripeRoutes from './routes/stripe.js';
import { getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;

getDb();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/stripe', stripeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'invoicepal', version: '1.0.0' }));

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧾 InvoicePal server running on http://0.0.0.0:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/health`);
});
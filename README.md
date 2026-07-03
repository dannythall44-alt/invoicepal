# InvoicePal 🧾

**Minimal invoicing + payment tracking for freelancers. $19/month.**

InvoicePal is a micro-SaaS that lets you create, send, and track invoices. Built by MicroSprint Studio.

## Features

- **Simple Invoices** — Line items, quantity, rate, tax, discounts
- **Shareable Links** — Clients view invoices online without an account (`/i/:token`)
- **Status Tracking** — Draft → Sent → Viewed → Paid / Overdue
- **Business Profile** — Your business name, email, address on every invoice
- **Mark as Paid** — Manually mark invoices as paid
- **Dashboard** — Overview of paid vs pending amounts
- **Dev Mode** — Works without Stripe in development

## Tech Stack

- **Backend:** Node.js, Express, better-sqlite3
- **Frontend:** React 19, Vite 6, React Router 7
- **Auth:** JWT-based authentication with bcrypt
- **Payments:** Stripe (optional — dev mode works without it)
- **Database:** SQLite (per-product)

## Architecture

```
invoicepal/
├── server/              # Express API server (port 3002)
│   ├── src/
│   │   ├── index.js     # Main entry point
│   │   ├── db.js        # SQLite schema (users, profiles, invoices, invoice_items)
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/      # API routes
│   │       ├── auth.js      # Signup/Login
│   │       ├── profile.js   # Business profile CRUD
│   │       ├── invoices.js  # Invoice CRUD + mark-paid
│   │       ├── public.js    # Public invoice view (no auth)
│   │       └── stripe.js    # Stripe payment integration
│   └── .env
├── client/              # React SPA
│   ├── src/
│   │   ├── App.jsx      # Routes + Landing page
│   │   ├── AuthContext.jsx
│   │   ├── api.js
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── InvoiceEditor.jsx
│   │       └── PublicInvoice.jsx
│   └── index.html
└── README.md
```

## Getting Started

### Installation

```bash
cd server && npm install
cd ../client && npm install
cd ../client && npm run build
```

### Configuration

Edit `server/.env`:
```env
PORT=3002
APP_URL=http://localhost:3002
JWT_SECRET=your-secret-here
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Running

```bash
cd server && npm start
```

App available at `http://localhost:3002`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Yes | Get current user |
| GET/PUT | `/api/profile` | Yes | Get/Update business profile |
| GET/POST | `/api/invoices` | Yes | List/Create invoices |
| GET/PUT/DELETE | `/api/invoices/:id` | Yes | Get/Update/Delete invoice |
| POST | `/api/invoices/:id/mark-paid` | Yes | Mark invoice as paid |
| GET | `/api/public/:token` | No | Public invoice view |
| POST | `/api/stripe/create-checkout-session` | Yes | Stripe checkout |
| GET | `/api/stripe/status` | Yes | Subscription status |
| GET | `/api/health` | No | Health check |

## Pricing

- **Pro:** $19/month — Unlimited invoices, clients, shareable links
- **Dev mode:** Free (no Stripe key configured)

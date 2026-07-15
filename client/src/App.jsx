import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InvoiceEditor from './pages/InvoiceEditor.jsx';
import PublicInvoice from './pages/PublicInvoice.jsx';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/invoices/new" element={<ProtectedRoute><InvoiceEditor /></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceEditor /></ProtectedRoute>} />
      <Route path="/i/:token" element={<PublicInvoice />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function Landing() {
  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-brand"><span className="nav-logo">🧾</span><span className="nav-title">InvoicePal</span></div>
        <div className="nav-links"><a href="/login" className="btn btn-ghost">Sign In</a><a href="/signup" className="btn btn-primary">Get Started</a></div>
      </nav>
      <main className="landing-main">
        <div className="hero">
          <div className="hero-badge">🚀 Invoicing made simple</div>
          <h1 className="hero-title">Send invoices <span className="text-gradient">that get paid</span></h1>
          <p className="hero-subtitle">Create, send, and track invoices in minutes. No accounting degree required.</p>
          <div className="hero-actions"><a href="/signup" className="btn btn-primary btn-lg">Start Free Trial</a></div>
        </div>
        <div className="features">
          <div className="feature-card"><div className="feature-icon">📄</div><h3>Simple Invoices</h3><p>Line items, tax, discounts — everything you need. No bloat.</p></div>
          <div className="feature-card"><div className="feature-icon">🔗</div><h3>Shareable Links</h3><p>Send clients a link to view their invoice online. No account needed.</p></div>
          <div className="feature-card"><div className="feature-icon">📊</div><h3>Track Everything</h3><p>Know when invoices are sent, viewed, and paid at a glance.</p></div>
          <div className="feature-card"><div className="feature-icon">💼</div><h3>Business Profile</h3><p>Your logo, business name, and contact info on every invoice.</p></div>
        </div>
        <div className="pricing-section" id="pricing">
          <h2 className="section-title">Simple Pricing</h2>
          <div className="pricing-card">
            <div className="pricing-header"><h3>Pro</h3><div className="pricing-amount"><span className="price">$19</span><span className="period">/month</span></div></div>
            <ul className="pricing-features">
              <li>✅ Unlimited invoices</li>
              <li>✅ Unlimited clients</li>
              <li>✅ Shareable invoice links</li>
              <li>✅ Payment tracking</li>
              <li>✅ Business profile</li>
            </ul>
            <a href="/signup" className="btn btn-primary btn-block">Start Free Trial</a>
          </div>
        </div>
        <footer className="footer"><p>© 2025 InvoicePal. Built by MicroSprint Studio.</p></footer>
      </main>
    </div>
  );
}

export default function App() { return <AuthProvider><AppRoutes /></AuthProvider>; }
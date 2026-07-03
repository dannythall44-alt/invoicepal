import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizAddr, setBizAddr] = useState('');
  const [bizPhone, setBizPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [invData, profData] = await Promise.all([api.invoices.list(), api.profile.get()]);
        setInvoices(invData.invoices);
        if (profData.profile) {
          setProfile(profData.profile);
          setBizName(profData.profile.business_name);
          setBizEmail(profData.profile.email);
          setBizAddr(profData.profile.address || '');
          setBizPhone(profData.profile.phone || '');
        } else {
          setBizName(user?.name || '');
          setBizEmail(user?.email || '');
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await api.profile.update({ business_name: bizName, email: bizEmail, address: bizAddr, phone: bizPhone });
      setProfile(data.profile);
      setShowProfile(false);
    } catch (err) { alert(err.message); }
  };

  const handleMarkPaid = async (e, id) => {
    e.stopPropagation();
    try { await api.invoices.markPaid(id); setInvoices(invoices.map(i => i.id === id ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i)); }
    catch (err) { alert(err.message); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this invoice?')) return;
    try { await api.invoices.delete(id); setInvoices(invoices.filter(i => i.id !== id)); }
    catch (err) { alert(err.message); }
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'sent' || i.status === 'viewed').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    totalPending: invoices.filter(i => i.status === 'sent' || i.status === 'viewed' || i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  };

  const formatCurrency = (n) => `$${(n || 0).toFixed(2)}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  return (
    <div className="dashboard">
      <nav className="nav">
        <div className="nav-brand"><span className="nav-logo">🧾</span><span className="nav-title">InvoicePal</span></div>
        <div className="nav-links">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowProfile(!showProfile)}>Profile</button>
          <span className="nav-user">{user?.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1>Invoices</h1>
          <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</button>
        </div>
        <p className="dashboard-subtitle">Create, send, and track your invoices.</p>

        {invoices.length > 0 && (
          <div className="stats-row">
            <div className="stat-card paid"><div className="stat-value">{formatCurrency(stats.totalPaid)}</div><div className="stat-label">Paid</div></div>
            <div className="stat-card pending"><div className="stat-value">{formatCurrency(stats.totalPending)}</div><div className="stat-label">Pending</div></div>
            <div className="stat-card"><div className="stat-value">{stats.pending}</div><div className="stat-label">Awaiting Payment</div></div>
            <div className="stat-card overdue"><div className="stat-value">{stats.overdue}</div><div className="stat-label">Overdue</div></div>
          </div>
        )}

        {showProfile && (
          <div className="profile-card" style={{ marginBottom: 24 }}>
            <h2>Business Profile</h2>
            <form onSubmit={saveProfile}>
              <div className="form-group"><label>Business Name</label><input className="input" value={bizName} onChange={e => setBizName(e.target.value)} required /></div>
              <div className="form-group"><label>Email</label><input className="input" type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} required /></div>
              <div className="form-group"><label>Address</label><input className="input" value={bizAddr} onChange={e => setBizAddr(e.target.value)} /></div>
              <div className="form-group"><label>Phone</label><input className="input" value={bizPhone} onChange={e => setBizPhone(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" type="submit">Save Profile</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowProfile(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div> :
         invoices.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧾</div>
            <h3>No invoices yet</h3>
            <p style={{ marginBottom: 24 }}>Create your first invoice to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>Create Your First Invoice</button>
          </div>
        ) : (
          <table className="invoice-table">
            <thead>
              <tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="invoice-row" onClick={() => navigate(`/invoices/${inv.id}`)}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.client_name}</td>
                  <td>{formatCurrency(inv.total)}</td>
                  <td><span className={`status-badge status-${inv.status}`}>{inv.status}</span></td>
                  <td>{formatDate(inv.created_at)}</td>
                  <td>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button className="btn btn-success btn-sm" style={{ marginRight: 4 }} onClick={(e) => handleMarkPaid(e, inv.id)}>Paid</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, inv.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
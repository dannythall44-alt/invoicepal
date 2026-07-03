import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

function LineItem({ item, index, onChange, onRemove }) {
  const amount = (item.quantity || 1) * (item.rate || 0);
  return (
    <div className="line-item">
      <div className="form-group">
        <label>Description</label>
        <input className="input" value={item.description} onChange={e => onChange(index, 'description', e.target.value)} placeholder="Service description" />
      </div>
      <div className="form-group">
        <label>Qty</label>
        <input className="input" type="number" value={item.quantity} onChange={e => onChange(index, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="1" />
      </div>
      <div className="form-group">
        <label>Rate</label>
        <input className="input" type="number" value={item.rate} onChange={e => onChange(index, 'rate', parseFloat(e.target.value) || 0)} min="0" step="0.01" placeholder="$" />
      </div>
      <div className="line-total">${amount.toFixed(2)}</div>
      <button className="btn btn-danger btn-sm" onClick={() => onRemove(index)} style={{ marginTop: 4 }}>×</button>
    </div>
  );
}

export default function InvoiceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState('draft');
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const load = async () => {
        setLoading(true);
        try {
          const data = await api.invoices.get(id);
          const inv = data.invoice;
          setClientName(inv.client_name);
          setClientEmail(inv.client_email);
          setClientAddress(inv.client_address || '');
          setIssueDate(inv.issue_date ? inv.issue_date.split('T')[0] : '');
          setDueDate(inv.due_date ? inv.due_date.split('T')[0] : '');
          setNotes(inv.notes || '');
          setTaxRate(inv.tax_rate || 0);
          setDiscount(inv.discount || 0);
          setStatus(inv.status);
          setItems(data.items.length > 0 ? data.items.map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate })) : [{ description: '', quantity: 1, rate: 0 }]);
        } catch (err) { alert(err.message); navigate('/dashboard'); }
        finally { setLoading(false); }
      };
      load();
    }
  }, [id, navigate]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0 }]);
  const removeItem = (idx) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };
  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const subtotal = items.reduce((s, item) => s + (item.quantity || 1) * (item.rate || 0), 0);
  const tax = subtotal * (taxRate || 0) / 100;
  const total = subtotal + tax - (discount || 0);

  const handleSave = async (newStatus) => {
    setSaving(true);
    try {
      const payload = {
        client_name: clientName,
        client_email: clientEmail,
        client_address: clientAddress,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        notes,
        tax_rate: parseFloat(taxRate) || 0,
        discount: parseFloat(discount) || 0,
        status: newStatus || status,
        items: items.map(i => ({ description: i.description, quantity: parseFloat(i.quantity) || 1, rate: parseFloat(i.rate) || 0 }))
      };

      if (isEditing) {
        await api.invoices.update(id, payload);
      } else {
        await api.invoices.create(payload);
      }
      navigate('/dashboard');
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <nav className="nav">
        <div className="nav-brand"><span className="nav-logo">🧾</span><span className="nav-title">InvoicePal</span></div>
        <div className="nav-links">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <span className="nav-user">{user?.name}</span>
        </div>
      </nav>

      <main className="editor-main">
        <h1 style={{ marginBottom: 24 }}>{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>

        <div className="editor-card">
          <h2>Client Details</h2>
          <div className="form-row">
            <div className="form-group"><label>Client Name</label><input className="input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name" required /></div>
            <div className="form-group"><label>Client Email</label><input className="input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" required /></div>
          </div>
          <div className="form-group"><label>Client Address</label><input className="input" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Optional" /></div>
          <div className="form-row">
            <div className="form-group"><label>Issue Date</label><input className="input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div className="form-group"><label>Due Date</label><input className="input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
        </div>

        <div className="editor-card">
          <h2>Line Items</h2>
          {items.map((item, i) => (
            <LineItem key={i} item={item} index={i} onChange={updateItem} onRemove={removeItem} />
          ))}
          <button className="btn btn-ghost btn-sm add-item-btn" onClick={addItem}>+ Add Item</button>

          <div className="invoice-totals">
            <div className="total-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {taxRate > 0 && <div className="total-row"><span>Tax ({taxRate}%)</span><span>${tax.toFixed(2)}</span></div>}
            {discount > 0 && <div className="total-row"><span>Discount</span><span>-${parseFloat(discount).toFixed(2)}</span></div>}
            <div className="total-row final"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="editor-card">
          <h2>Tax &amp; Discount</h2>
          <div className="form-row">
            <div className="form-group"><label>Tax Rate (%)</label><input className="input" type="number" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} min="0" step="0.1" /></div>
            <div className="form-group"><label>Discount ($)</label><input className="input" type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} min="0" step="0.01" /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, thank you note, etc." /></div>
        </div>

        {isEditing && status === 'draft' && (
          <div className="editor-card">
            <h2>Status</h2>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Send (Mark as Sent)</option>
            </select>
          </div>
        )}

        <div className="editor-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
          {!isEditing && (
            <button className="btn btn-outline" onClick={() => handleSave('draft')} disabled={saving}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => handleSave(isEditing ? status : 'sent')} disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Invoice' : 'Create & Send'}
          </button>
        </div>
      </main>
    </div>
  );
}
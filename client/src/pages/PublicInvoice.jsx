import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';

export default function PublicInvoice() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try { setData(await api.public.get(token)); }
      catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (error || !data) return <div className="public-page"><div className="public-empty"><h2>Invoice not found</h2><p>This invoice doesn't exist or has been removed.</p></div></div>;

  const { invoice, items, profile } = data;
  const subtotal = items.reduce((s, i) => s + (i.quantity || 1) * (i.rate || 0), 0);
  const tax = subtotal * (invoice.tax_rate || 0) / 100;
  const total = subtotal + tax - (invoice.discount || 0);

  const statusColors = { paid: '#22c55e', sent: '#3b82f6', viewed: '#6366f1', draft: '#8888a0', overdue: '#ef4444', cancelled: '#8888a0' };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

  return (
    <div className="public-page">
      <div className="public-invoice">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div className="business-name">{profile?.business_name || 'Business'}</div>
            <div className="business-info">
              {profile?.email}<br />
              {profile?.address && <>{profile.address}<br /></>}
              {profile?.phone}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1>{invoice.invoice_number}</h1>
            <div className={`status-label`} style={{ background: `${statusColors[invoice.status] || '#888'}20`, color: statusColors[invoice.status] || '#888' }}>
              {invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="invoice-meta">
          <div className="invoice-meta-left">
            <strong>Bill To:</strong>
            <div>{invoice.client_name}</div>
            <div>{invoice.client_email}</div>
            {invoice.client_address && <div>{invoice.client_address}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><strong>Issue Date:</strong> {formatDate(invoice.issue_date)}</div>
            <div><strong>Due Date:</strong> {formatDate(invoice.due_date)}</div>
            {invoice.paid_at && <div><strong>Paid Date:</strong> {formatDate(invoice.paid_at)}</div>}
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>${(item.rate || 0).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>${((item.quantity || 1) * (item.rate || 0)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total-section">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          {invoice.tax_rate > 0 && <div>Tax ({invoice.tax_rate}%): ${tax.toFixed(2)}</div>}
          {invoice.discount > 0 && <div>Discount: -${parseFloat(invoice.discount).toFixed(2)}</div>}
          <div className="grand-total">Total: ${(invoice.total || total).toFixed(2)}</div>
        </div>

        {invoice.notes && <div className="notes"><strong>Notes:</strong><br />{invoice.notes}</div>}
      </div>
      <div className="public-powered">Powered by <strong>InvoicePal</strong></div>
    </div>
  );
}
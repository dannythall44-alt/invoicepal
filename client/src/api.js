const API_BASE = '/api';

function getToken() { return localStorage.getItem('invoicepal_token'); }

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    signup: (b) => request('/auth/signup', { method: 'POST', body: JSON.stringify(b) }),
    login: (b) => request('/auth/login', { method: 'POST', body: JSON.stringify(b) }),
    me: () => request('/auth/me'),
  },
  profile: {
    get: () => request('/profile'),
    update: (b) => request('/profile', { method: 'PUT', body: JSON.stringify(b) }),
  },
  invoices: {
    list: () => request('/invoices'),
    get: (id) => request(`/invoices/${id}`),
    create: (b) => request('/invoices', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    delete: (id) => request(`/invoices/${id}`, { method: 'DELETE' }),
    markPaid: (id) => request(`/invoices/${id}/mark-paid`, { method: 'POST' }),
  },
  public: {
    get: (token) => request(`/public/${token}`),
  },
  stripe: {
    status: () => request('/stripe/status'),
    createCheckout: () => request('/stripe/create-checkout-session', { method: 'POST' }),
  },
};
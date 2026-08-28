const API_BASE = (window.__API_BASE__) || localStorage.getItem('civicvoice_api') || 'http://localhost:8080/api';

function getToken() { return localStorage.getItem('civicvoice_email'); }
function getCurrentUser() { try { return JSON.parse(localStorage.getItem('civicvoice_user') || 'null'); } catch (e) { return null; } }

function setSession(email, user) {
  if (email) localStorage.setItem('civicvoice_email', email); else localStorage.removeItem('civicvoice_email');
  if (user) localStorage.setItem('civicvoice_user', JSON.stringify(user)); else localStorage.removeItem('civicvoice_user');
}
function logout() { setSession(null, null); location.href = 'index.html'; }

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('Request failed: ' + res.status));
  return data;
}

const Civic = {
  login: (email, firstName, lastName) => api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName, lastName })
  }),
  fetchIssues: (params) => api('/issues?' + new URLSearchParams(params).toString()),
  fetchMine: (email, page) => api('/issues/mine?email=' + encodeURIComponent(email) + '&page=' + page + '&pageSize=10'),
  fetchOverview: (email) => api('/admin/overview?adminEmail=' + encodeURIComponent(email)),
  createIssue: (formData) => api('/issues', { method: 'POST', body: formData }),
  vote: (id) => api('/issues/' + id + '/vote', { method: 'POST' }),
  updateStatus: (id, status, adminEmail) => api('/issues/' + id + '/status?adminEmail=' + encodeURIComponent(adminEmail), {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
  }),
  assignIssue: (id, assignedTo, adminEmail) => api('/issues/' + id + '/assign?adminEmail=' + encodeURIComponent(adminEmail), {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTo })
  })
};

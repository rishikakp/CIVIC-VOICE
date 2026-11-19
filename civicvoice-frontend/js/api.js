// ---- DEPLOYMENT OVERRIDE ----
// For cloud deployment, set this to your live backend URL, e.g.:
//   'https://civicvoice-backend.onrender.com/api'
// Leave null for local development (falls back to http://localhost:8080/api).
if (!window.__API_BASE__) { window.__API_BASE__ = null; }

const API_BASE = localStorage.getItem('civicvoice_api') || (window.__API_BASE__) || 'http://localhost:8080/api';

// Legacy helper: the signed-in email (kept for existing pages)
function getToken() { return localStorage.getItem('civicvoice_email'); }
// Civic Voice session token issued by POST /api/auth/clerk after a Clerk sign-in
function getSessionToken() { return localStorage.getItem('civicvoice_token'); }
function getCurrentUser() { try { return JSON.parse(localStorage.getItem('civicvoice_user') || 'null'); } catch (e) { return null; } }

function setSession(email, user, sessionToken) {
  if (email) localStorage.setItem('civicvoice_email', email); else localStorage.removeItem('civicvoice_email');
  if (user) localStorage.setItem('civicvoice_user', JSON.stringify(user)); else localStorage.removeItem('civicvoice_user');
  if (sessionToken) localStorage.setItem('civicvoice_token', sessionToken); else localStorage.removeItem('civicvoice_token');
}

function logout() {
  // Clear the local Civic Voice session; the Clerk session cookie is cleared
  // the next time login.html loads (flag consumed there, best effort).
  setSession(null, null);
  if (window.__CLERK_PK__) localStorage.setItem('civicvoice_clerk_signout', '1');
  location.href = 'index.html';
}

let __redirectingToLogin = false;
async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers);
  const sessionToken = getSessionToken();
  if (sessionToken && !headers['Authorization']) headers['Authorization'] = 'Bearer ' + sessionToken;
  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
  if (res.status === 401 && sessionToken && !path.startsWith('/auth/')) {
    // Our session token was rejected (expired or revoked) -> re-authenticate once.
    if (!__redirectingToLogin) {
      __redirectingToLogin = true;
      setSession(null, null);
      localStorage.setItem('civicvoice_clerk_signout', '1');
      location.href = 'login.html';
    }
    throw new Error('Session expired, please sign in again');
  }
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
  // Completes a Clerk sign-in: sends the short-lived Clerk session JWT, receives
  // a long-lived Civic Voice session token + user profile.
  clerkLogin: (clerkToken) => api('/auth/clerk', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + clerkToken },
    skipAuthRedirect: true
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

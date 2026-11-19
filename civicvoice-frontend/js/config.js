// Civic Voice - deployment configuration
// Local development (localhost / 127.0.0.1): use the local backend at http://localhost:8080/api.
// Deployed site: use the live Render backend.
(function () {
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  window.__API_BASE__ = window.__API_BASE__ || (isLocal ? 'http://localhost:8080/api'
    : 'https://civicvoice-backend-t7m6.onrender.com/api');
})();

// Clerk publishable key (public by design - safe to ship in the browser).
// Keep in sync with CLERK_PUBLISHABLE_KEY in the repo-root .env file.
window.__CLERK_PK__ = window.__CLERK_PK__ || 'pk_test_dXNlZnVsLXF1ZXR6YWwtNzk1OC5jbGVyay5hY2NvdW50cy5kZXYk';

// Clerk Core 3 SDK (ClerkJS 6). ClerkJS 5 is blocked by Clerk's minimum-version
// protection, so both the UI bundle and clerk-js must be v6+/v1+.
// The Frontend API origin is derived from the publishable key, so the Clerk-hosted
// fallback always points at this instance (and keeps working if a CDN is blocked).
(function () {
  var pk = window.__CLERK_PK__ || '';
  var domain = '';
  try {
    var parts = pk.split('_');
    var encoded = parts.length > 2 ? parts[2] : parts[1];
    domain = atob(encoded).replace(/\$$/, '');
  } catch (e) { /* fall back to the generic Clerk origin */ }
  var clerkOrigin = domain ? 'https://' + domain : 'https://clerk.accounts.dev';

  window.__CLERK_UI_CDN__ = [
    'https://cdn.jsdelivr.net/npm/@clerk/ui@1/dist/ui.browser.js',
    clerkOrigin + '/npm/@clerk/ui@1/dist/ui.browser.js'
  ];
  window.__CLERK_CDN__ = [
    'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js',
    clerkOrigin + '/npm/@clerk/clerk-js@6/dist/clerk.browser.js'
  ];
})();

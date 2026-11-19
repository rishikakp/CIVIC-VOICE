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
window.__CLERK_PK__ = window.__CLERK_PK__ || 'pk_test_c3Ryb25nLWdvcmlsbGEtNzAuY2xlcmsuYWNjb3VudHMuZGV2JA';

// Clerk JS SDK sources, in order of preference. The second URL is hosted by
// Clerk itself, so sign-in still works if cdn.jsdelivr.net is blocked.
window.__CLERK_CDN__ = [
  'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js',
  'https://strong-gorilla-70.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js'
];

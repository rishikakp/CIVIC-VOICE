function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function severityClass(sev) {
  const map = { CRITICAL: 'bg-red-100 text-red-800', HIGH: 'bg-orange-100 text-orange-800', MEDIUM: 'bg-amber-100 text-amber-800', LOW: 'bg-green-100 text-green-800' };
  return map[sev] || 'bg-zinc-100 text-zinc-800';
}

function statusClass(st) {
  const map = { RESOLVED: 'bg-emerald-100 text-emerald-800', IN_PROGRESS: 'bg-amber-100 text-amber-800', ASSIGNED: 'bg-blue-100 text-blue-800', SUBMITTED: 'bg-zinc-100 text-zinc-800' };
  return map[st] || 'bg-zinc-100 text-zinc-800';
}

function badge(text, cls) { return '<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' + (cls || statusClass(text)) + '">' + esc(text) + '</span>'; }

function timeAgo(iso) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const units = [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]];
  for (const [label, size] of units) { const v = Math.floor(sec / size); if (v >= 1) return v + label + ' ago'; }
  return 'just now';
}

function toast(msg, ok = true) {
  const el = document.createElement('div');
  el.className = 'fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm text-white shadow-lg ' + (ok ? 'bg-zinc-900' : 'bg-red-600');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function renderTopbar() {
  const user = getCurrentUser();
  const el = document.querySelector('#topbar');
  if (!el) return;
  el.innerHTML =
    '<header class="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-40">' +
    '<div class="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">' +
    '<a href="index.html" class="font-bold text-lg text-zinc-900">Civic<span class="text-blue-600">Voice</span></a>' +
    '<nav class="flex items-center gap-1 text-sm">' +
    '<a class="px-3 py-1.5 rounded-lg hover:bg-zinc-100" href="index.html">Explore</a>' +
    (user ? '<a class="px-3 py-1.5 rounded-lg hover:bg-zinc-100" href="report.html">Report</a>' +
      '<a class="px-3 py-1.5 rounded-lg hover:bg-zinc-100" href="my.html">My Issues</a>' : '') +
    (user && user.admin ? '<a class="px-3 py-1.5 rounded-lg hover:bg-zinc-100" href="admin.html">Admin</a>' : '') +
    (user
      ? '<button onclick="logout()" class="ml-2 px-3 py-1.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700">Sign out</button>'
      : '<a href="login.html" class="ml-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Sign in</a>') +
    '</nav></div></header>';
}

function renderSignin() {
  const user = getCurrentUser();
  const el = document.querySelector('#signin');
  if (!el) return;
  if (user) {
    el.innerHTML = '<span class="text-sm text-zinc-500">Signed in as <b>' + esc(user.email) + '</b></span>';
  } else {
    el.innerHTML = '<div class="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">' +
      '<h2 class="font-semibold text-zinc-900">Sign in to report</h2>' +
      '<input id="auth-email" type="email" placeholder="you@example.com" class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">' +
      '<div class="grid grid-cols-2 gap-2"><input id="auth-first" placeholder="First name" class="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">' +
      '<input id="auth-last" placeholder="Last name" class="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></div>' +
      '<button onclick="doLogin()" class="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Continue</button>' +
      '<p class="text-xs text-zinc-400">Tip: sign in with admin@civicvoice.local for admin access</p></div>';
    window.doLogin = async () => {
      const email = document.getElementById('auth-email').value.trim();
      const first = document.getElementById('auth-first').value.trim();
      const last = document.getElementById('auth-last').value.trim();
      if (!email) return toast('Email required', false);
      try {
        const u = await Civic.login(email, first, last);
        setSession(email, u);
        toast('Welcome, ' + (u.firstName || email));
        location.reload();
      } catch (e) { toast(e.message, false); }
    };
  }
}

function mapsUrl(issue) {
  const q = issue.coordinates || issue.locationName || issue.location;
  return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : null;
}

function apiOrigin() {
  try { return new URL(API_BASE).origin; } catch (e) { return 'http://localhost:8080'; }
}

function absImgUrl(u) {
  if (!u) return u;
  return u.startsWith('http') ? u : apiOrigin() + (u.startsWith('/') ? '' : '/') + u;
}

function issueCardHTML(i) {
  const loc = i.mainArea || i.locationName || i.location || i.coordinates || 'Location unknown';
  const url = mapsUrl(i);
  const img = absImgUrl(i.imageUrl);
  return '<div class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">' +
    (img
      ? '<a href="' + esc(img) + '" target="_blank"><img src="' + esc(img) + '" class="w-full h-40 object-cover rounded-xl" onerror="this.style.display=\'none\'"></a>'
      : '<div class="w-full h-40 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">🏙️</div>') +
    '<div class="flex items-center justify-between gap-2">' + badge(i.issueType, 'bg-blue-50 text-blue-700') + badge(i.severity, severityClass(i.severity)) + '</div>' +
    '<p class="text-sm text-zinc-800 line-clamp-3">' + esc(i.description) + '</p>' +
    '<p class="text-xs text-zinc-500">📍 ' + esc(loc) + (url ? ' · <a href="' + esc(url) + '" target="_blank" class="text-blue-600 hover:underline">Map</a>' : '') + '</p>' +
    '<div class="flex items-center justify-between pt-1 border-t border-zinc-100">' +
    '<span class="text-xs text-zinc-500">' + timeAgo(i.createdAt) + ' · ' + esc(i.shortId.slice(-4)) + '</span>' +
    '<button onclick="vote(' + "'" + esc(i.id) + "'" + ', this)" class="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium hover:bg-blue-50 hover:border-blue-200">' +
    '👍 <b class="vote-count">' + i.voteCount + '</b></button></div></div>';
}

window.vote = async (id, btn) => {
  try {
    const r = await Civic.vote(id);
    const el = btn.querySelector('.vote-count');
    if (el) el.textContent = r.voteCount;
    toast('Vote counted ✔');
  } catch (e) { toast(e.message, false); }
};

document.addEventListener('DOMContentLoaded', renderTopbar);

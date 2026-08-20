const $ = (s, root = document) => root.querySelector(s);

const ROUTES = {
  home: 'index.html',
  login: 'login.html',
  signup: 'signup.html',
  setup: 'setup.html',
  interview: 'interview.html',
  results: 'results.html',
  profile: 'profile.html'
};

function pageUrl(page) {
  return new URL(ROUTES[page] || page, window.location.origin + '/').href;
}

function go(page, replace = false) {
  const url = pageUrl(page);
  if (replace) window.location.replace(url);
  else window.location.assign(url);
}

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}

function getAccount() { return readStorage('aiCoachAccount'); }
function getUser() { return readStorage('aiCoachSession'); }
function isLoggedIn() { return Boolean(getUser()); }

function setSession(account) {
  if (!account) return;
  localStorage.setItem('aiCoachSession', JSON.stringify({
    name: account.name,
    email: account.email,
    loggedInAt: new Date().toISOString()
  }));
}

function requireAuth() {
  if (!isLoggedIn()) {
    toast('Please log in to continue.');
    go('login', true);
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('aiCoachSession');
  localStorage.removeItem('interviewSetup');
  localStorage.removeItem('activeInterview');
  go('login', true);
}

function toast(msg) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function renderNav() {
  const nav = $('.nav');
  if (!nav) return;
  const loggedIn = isLoggedIn();
  nav.innerHTML = `
    <a class="brand" href="${pageUrl('home')}"><span class="brand-bot">🤖</span> AI Interview Coach</a>
    <nav class="nav-links">
      <a href="${pageUrl('home')}">Home</a>
      ${loggedIn ? `
        <a href="${pageUrl('setup')}">Practice</a>
        <a href="${pageUrl('profile')}">Profile</a>
        <button class="btn secondary" id="logoutBtn" type="button">Log Out</button>
      ` : `
        <a href="${pageUrl('login')}">Log In</a>
        <a class="btn" href="${pageUrl('signup')}">Get Started</a>
      `}
    </nav>`;
  $('#logoutBtn')?.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  const protectedPages = new Set(['setup.html', 'interview.html', 'results.html', 'profile.html']);
  const current = location.pathname.split('/').pop() || 'index.html';
  if (protectedPages.has(current)) requireAuth();
});

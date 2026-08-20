document.addEventListener('DOMContentLoaded', () => {
  const current = location.pathname.split('/').pop() || 'index.html';
  if ((current === 'login.html' || current === 'signup.html') && isLoggedIn()) {
    go('setup', true);
    return;
  }

  const login = $('#loginForm');
  const signup = $('#signupForm');

  login?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const password = $('#loginPassword').value;
    const account = getAccount();

    if (!account || account.email !== email || account.password !== password) {
      toast('No matching account found. Please sign up or check your details.');
      return;
    }

    setSession(account);
    renderNav();
    go('setup', true);
  });

  signup?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim().toLowerCase();
    const password = $('#signupPassword').value;

    if (!name || !email || password.length < 6) {
      toast('Please enter valid details. Password must have at least 6 characters.');
      return;
    }

    const account = { name, email, password, createdAt: new Date().toISOString() };
    localStorage.setItem('aiCoachAccount', JSON.stringify(account));
    setSession(account);
    renderNav();
    go('setup', true);
  });
});

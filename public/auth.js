function fetchMe() {
  return fetch('/api/me').then((response) => response.json());
}

function mountAuthNav() {
  const el = document.getElementById('authArea');
  if (!el) return;

  fetchMe().then((me) => {
    el.innerHTML = '';
    if (me.loggedIn) {
      const greeting = document.createElement('span');
      greeting.className = 'auth-greeting';
      greeting.textContent = `Hi, ${me.name}`;

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'nav-link auth-logout';
      logoutBtn.textContent = 'Log out';
      logoutBtn.addEventListener('click', () => {
        fetch('/api/logout', { method: 'POST' }).then(() => {
          window.location.href = '/';
        });
      });

      el.appendChild(greeting);
      el.appendChild(logoutBtn);
    } else {
      const loginLink = document.createElement('a');
      loginLink.className = 'nav-link';
      loginLink.href = '/login';
      loginLink.textContent = 'Log in';
      el.appendChild(loginLink);
    }
  });
}

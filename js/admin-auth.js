import { state } from './state.js';
import { render } from './render.js';

window.handleLogin = async (e) => {
  e.preventDefault();
  const user = document.getElementById('f-user')?.value?.trim();
  const pass = document.getElementById('f-pass')?.value;
  state.loginError = '';
  state.loginLoading = true;
  render();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      state.isLoggedIn = true;
      sessionStorage.setItem('rayna_admin_auth', 'true');
    } else {
      state.loginError = data.error || 'Incorrect username or password. Please try again.';
    }
  } catch (err) {
    state.loginError = 'Network error. Please try again.';
  }

  state.loginLoading = false;
  render();
};

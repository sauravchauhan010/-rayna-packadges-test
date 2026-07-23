import { state } from './state.js';
import { render } from './render.js';
import { loadAgents } from './db-agents.js';
import { loadLogs } from './db-logs.js';

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
      // The server just set a signed, HttpOnly session cookie in its
      // response — the browser stores it automatically. We don't (and
      // can't) set anything ourselves here; state.isLoggedIn just reflects
      // what we know to be true right after this successful check.
      state.isLoggedIn = true;
      loadAgents();
      loadLogs();
    } else {
      state.loginError = data.error || 'Incorrect username or password. Please try again.';
    }
  } catch (err) {
    state.loginError = 'Network error. Please try again.';
  }

  state.loginLoading = false;
  render();
};

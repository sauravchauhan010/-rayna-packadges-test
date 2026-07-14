import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { auth, isFirebaseReady } from './firebase.js';
import { state } from './state.js';
import { render } from './render.js';
import { fetchFolderSheets } from './drive.js';

function agentActionCodeSettings() {
  return {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true
  };
}

window.handleSendAgentLink = async () => {
  const emailEl = document.getElementById('agent-email-input');
  const email = (emailEl ? emailEl.value : '').trim().toLowerCase();

  state.agentLoginError = '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    state.agentLoginError = 'Please enter a valid email address.';
    render();
    return;
  }

  if (!isFirebaseReady || !auth) {
    state.agentLoginError = 'Agent login requires cloud mode and is unavailable right now. Please try again shortly.';
    render();
    return;
  }

  state.agentLoginLoading = true;
  render();

  // Give the agents listener a brief moment to finish loading on a cold start
  let attempts = 0;
  while (!state.agentsLoaded && attempts < 20) {
    await new Promise(r => setTimeout(r, 150));
    attempts++;
  }

  const match = state.agents.find(a => (a.email || '').toLowerCase() === email);

  if (!match) {
    state.agentLoginLoading = false;
    state.agentLoginError = 'This email is not on our access list. Please contact Rayna Tours for access.';
    render();
    return;
  }

  try {
    await sendSignInLinkToEmail(auth, email, agentActionCodeSettings());
    window.localStorage.setItem('rayna_email_for_signin', email);
    window.localStorage.setItem('rayna_company_for_signin', match.companyName || '');
    state.agentLinkSent = true;
    state.agentLoginError = '';
  } catch (err) {
    console.error('Send sign-in link error:', err);
    state.agentLoginError = 'Could not send sign-in link: ' + err.message;
  }

  state.agentLoginLoading = false;
  render();
};

export function hasPendingAgentSignInLink() {
  return isFirebaseReady && !!auth && isSignInWithEmailLink(auth, window.location.href);
}

// Handles the return trip when the agent clicks the emailed sign-in link
export async function completeAgentEmailLinkSignIn() {
  if (!isFirebaseReady || !auth) return;
  if (!isSignInWithEmailLink(auth, window.location.href)) return;

  state.agentVerifyingLink = true;
  render();

  let email = window.localStorage.getItem('rayna_email_for_signin');

  if (!email) {
    // Link opened on a different device/browser — ask the agent to confirm their email
    state.agentVerifyingLink = false;
    state.agentNeedsEmailConfirm = true;
    state.activeView = 'hotels';
    state.showAgentLoginForm = true;
    render();
    return;
  }

  try {
    await signInWithEmailLink(auth, email, window.location.href);

    // Wait briefly for the agents list to load so we can validate + fetch company name
    let attempts = 0;
    while (!state.agentsLoaded && attempts < 20) {
      await new Promise(r => setTimeout(r, 150));
      attempts++;
    }
    const match = state.agents.find(a => (a.email || '').toLowerCase() === email.toLowerCase());

    if (!match) {
      state.agentLoginError = 'This email is not on our access list. Please contact Rayna Tours for access.';
    } else {
      state.agentUnlocked = email;
      state.agentCompanyName = match.companyName || '';
      localStorage.setItem('rayna_agent_email', email);
      localStorage.setItem('rayna_agent_company', state.agentCompanyName);
      state.activeView = 'hotels';
      await fetchFolderSheets();
    }
  } catch (err) {
    console.error('Email link sign-in error:', err);
    state.agentLoginError = 'That sign-in link has already been used or has expired. Please request a new one.';
    state.activeView = 'hotels';
    state.showAgentLoginForm = true;
  }

  window.localStorage.removeItem('rayna_email_for_signin');
  window.localStorage.removeItem('rayna_company_for_signin');

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);

  state.agentVerifyingLink = false;
  render();
}

window.handleConfirmAgentEmail = async () => {
  const emailEl = document.getElementById('agent-confirm-email-input');
  const email = (emailEl ? emailEl.value : '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    state.agentLoginError = 'Please enter a valid email address.';
    render();
    return;
  }
  window.localStorage.setItem('rayna_email_for_signin', email);
  state.agentNeedsEmailConfirm = false;
  render();
  await completeAgentEmailLinkSignIn();
};

window.agentLogout = () => {
  state.agentUnlocked    = '';
  state.agentCompanyName = '';
  state.folderFetched    = false;
  state.folderSheets     = [];
  state.activeSheetId    = null;
  state.activeSheetName  = '';
  state.agentLoginError  = '';
  state.agentLinkSent    = false;
  localStorage.removeItem('rayna_agent_email');
  localStorage.removeItem('rayna_agent_company');
  render();
};

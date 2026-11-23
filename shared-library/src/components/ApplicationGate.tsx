import React, { useEffect, useState } from 'react';
import type { ApplicationCode } from '../config/applicationRegistry';
import { roleLabel } from '../ui/format';
import {
  clearApplicationSession,
  exchangeForApplication,
  fetchMyApplications,
  isUsablePlatformToken,
  readApplicationSession,
  signInToApplication,
  storeApplicationSession,
  workspacesFor,
  type ApplicationSession,
  type Workspace,
} from '../auth/applicationSession';

// Plain React on purpose: the shared library must not pull its own UI-kit copy into every application bundle.

interface ApplicationGateProps {
  applicationCode: ApplicationCode;
  applicationName: string;
  children: React.ReactNode;
}

/** The account sign-in kept by the shell (localStorage 'jwt_token'), when it is a live platform token. */
function accountToken(): string | null {
  try {
    const token = localStorage.getItem('jwt_token');
    return token && isUsablePlatformToken(token) ? token : null;
  } catch {
    return null;
  }
}

/**
 * Shows its children only with a valid session for this application (a tenant-scoped token). A signed-in person picks
 * one of their workspaces that grants the application and opens it without typing a password again (token exchange);
 * otherwise they enter the client workspace and credentials. The session lives in sessionStorage, so every screen of
 * the same application shares it until the browser session ends or they switch workspace.
 */
export function ApplicationGate({ applicationCode, applicationName, children }: ApplicationGateProps) {
  const [session, setSession] = useState<ApplicationSession | null>(() => readApplicationSession(applicationCode, sessionStorage));

  if (!session) {
    return <ApplicationSignIn applicationCode={applicationCode} applicationName={applicationName}
      onAuthenticated={(next) => { storeApplicationSession(next, sessionStorage); setSession(next); }} />;
  }

  const signOut = () => {
    // End the session on the server too, so it no longer appears as active or works if copied.
    fetch('/api/users/logout', { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } }).catch(() => undefined);
    clearApplicationSession(applicationCode, sessionStorage);
    setSession(null);
  };
  return (
    <>
      <div style={styles.bar} data-testid="application-session-bar">
        <span style={styles.muted}>{applicationName} · {session.tenantName || session.tenantSlug} · {roleLabel(session.role) || session.role}</span>
        <button type="button" onClick={signOut} style={styles.linkButton}>Switch workspace</button>
      </div>
      {children}
    </>
  );
}

interface ApplicationSignInProps {
  applicationCode: ApplicationCode;
  applicationName: string;
  onAuthenticated: (session: ApplicationSession) => void;
}

export function ApplicationSignIn({ applicationCode, applicationName, onAuthenticated }: ApplicationSignInProps) {
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const token = accountToken();

  useEffect(() => {
    if (!token) { setWorkspaces([]); return; }
    let active = true;
    fetchMyApplications(token)
      .then((mine) => { if (active) setWorkspaces(workspacesFor(mine, applicationCode)); })
      .catch(() => { if (active) setWorkspaces([]); });
    return () => { active = false; };
  }, [token, applicationCode]);

  const run = async (attempt: () => Promise<ApplicationSession>) => {
    setError('');
    setSubmitting(true);
    try {
      onAuthenticated(await attempt());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    void run(() => signInToApplication({ applicationCode, tenantSlug, email, password }));
  };

  const quickList = token && workspaces && workspaces.length > 0 && !showForm;

  return (
    <div style={styles.page}>
      {quickList ? (
        <div style={styles.card} aria-label={`Choose a workspace for ${applicationName}`}>
          <h2 style={styles.title}>Open {applicationName}</h2>
          <p style={styles.muted}>Choose the client workspace to work in. You stay signed in with your account.</p>
          {error && <div role="alert" style={styles.error}>{error}</div>}
          {workspaces!.map((workspace) => {
            const role = workspace.applications.find((app) => app.applicationCode === applicationCode)?.role;
            return (
              <button key={workspace.tenantId} type="button" disabled={submitting} style={styles.workspace}
                onClick={() => void run(() => exchangeForApplication({ applicationCode, tenantSlug: workspace.slug }, token!))}>
                <strong>{workspace.name}</strong>
                <span style={styles.muted}>{workspace.slug}{role ? ` · ${roleLabel(role) || role}` : ''}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setShowForm(true)} style={styles.linkButton}>Use a different account</button>
        </div>
      ) : (
        <form onSubmit={signIn} style={styles.card} aria-label={`Sign in to ${applicationName}`}>
          <h2 style={styles.title}>Sign in to {applicationName}</h2>
          <p style={styles.muted}>
            {token && workspaces && workspaces.length === 0
              ? 'Your account has no workspace with this application. Sign in with an account that has access, or ask your client owner.'
              : 'Use your client workspace and account. Access is checked for this application.'}
          </p>
          {error && <div role="alert" style={styles.error}>{error}</div>}
          <label style={styles.label}>Client workspace
            <input style={styles.input} value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="legacy" autoComplete="organization" required />
          </label>
          <label style={styles.label}>Email
            <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="username" type="email" required />
          </label>
          <label style={styles.label}>Password
            <input style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" type="password" required />
          </label>
          <button type="submit" disabled={submitting} style={styles.primary}>
            {submitting ? 'Signing in…' : `Continue to ${applicationName}`}
          </button>
          {token && workspaces && workspaces.length > 0 && (
            <button type="button" onClick={() => setShowForm(false)} style={styles.linkButton}>Back to my workspaces</button>
          )}
        </form>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '32px 16px' },
  card: { width: 'min(100%, 440px)', display: 'grid', gap: 14, padding: 28, borderRadius: 16,
    border: '1px solid rgba(127,127,127,.25)', background: 'var(--ucp-surface, inherit)', color: 'inherit', fontFamily: 'inherit' },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  muted: { margin: 0, opacity: .75, fontSize: 14 },
  label: { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(127,127,127,.4)', font: 'inherit', fontWeight: 400 },
  primary: { minHeight: 46, borderRadius: 8, border: 0, background: '#4F46E5', color: '#fff', fontWeight: 800, font: 'inherit', cursor: 'pointer' },
  workspace: { display: 'grid', gap: 2, textAlign: 'left', padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
    border: '1px solid rgba(127,127,127,.35)', background: 'transparent', color: 'inherit', font: 'inherit' },
  error: { padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,.12)', color: '#B91C1C', fontSize: 14 },
  bar: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '6px 16px',
    borderBottom: '1px solid rgba(127,127,127,.2)', fontSize: 13 },
  linkButton: { background: 'none', border: 0, color: '#4F46E5', cursor: 'pointer', font: 'inherit', fontWeight: 600, justifySelf: 'start' },
};

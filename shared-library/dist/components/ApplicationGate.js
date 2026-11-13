import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { clearApplicationSession, readApplicationSession, signInToApplication, storeApplicationSession, } from '../auth/applicationSession';
/**
 * Shows its children only with a valid session for this application (a tenant-scoped token from
 * /api/users/login/application); otherwise asks for the client workspace and credentials. The session lives in
 * sessionStorage, so every screen of the same application shares one sign-in until the browser session ends.
 */
export function ApplicationGate({ applicationCode, applicationName, children }) {
    const [session, setSession] = useState(() => readApplicationSession(applicationCode, sessionStorage));
    if (!session) {
        return _jsx(ApplicationSignIn, { applicationCode: applicationCode, applicationName: applicationName, onAuthenticated: (next) => { storeApplicationSession(next, sessionStorage); setSession(next); } });
    }
    const signOut = () => { clearApplicationSession(applicationCode, sessionStorage); setSession(null); };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: styles.bar, "data-testid": "application-session-bar", children: [_jsxs("span", { style: styles.muted, children: [applicationName, " \u00B7 ", session.tenantName || session.tenantSlug, " \u00B7 ", session.role] }), _jsxs("button", { type: "button", onClick: signOut, style: styles.linkButton, children: ["Sign out of ", applicationName] })] }), children] }));
}
export function ApplicationSignIn({ applicationCode, applicationName, onAuthenticated }) {
    const [tenantSlug, setTenantSlug] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const signIn = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            onAuthenticated(await signInToApplication({ applicationCode, tenantSlug, email, password }));
        }
        catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Sign in failed. Please try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { style: styles.page, children: _jsxs("form", { onSubmit: signIn, style: styles.card, "aria-label": `Sign in to ${applicationName}`, children: [_jsxs("h2", { style: styles.title, children: ["Sign in to ", applicationName] }), _jsx("p", { style: styles.muted, children: "Use your client workspace and account. Access is checked for this application." }), error && _jsx("div", { role: "alert", style: styles.error, children: error }), _jsxs("label", { style: styles.label, children: ["Client workspace", _jsx("input", { style: styles.input, value: tenantSlug, onChange: (e) => setTenantSlug(e.target.value), placeholder: "legacy", autoComplete: "organization", required: true })] }), _jsxs("label", { style: styles.label, children: ["Email", _jsx("input", { style: styles.input, value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "username", type: "email", required: true })] }), _jsxs("label", { style: styles.label, children: ["Password", _jsx("input", { style: styles.input, value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", type: "password", required: true })] }), _jsx("button", { type: "submit", disabled: submitting, style: styles.primary, children: submitting ? 'Signing in…' : `Continue to ${applicationName}` })] }) }));
}
const styles = {
    page: { minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '32px 16px' },
    card: { width: 'min(100%, 440px)', display: 'grid', gap: 14, padding: 28, borderRadius: 16,
        border: '1px solid rgba(127,127,127,.25)', background: 'var(--ucp-surface, inherit)', color: 'inherit', fontFamily: 'inherit' },
    title: { margin: 0, fontSize: 22, fontWeight: 800 },
    muted: { margin: 0, opacity: .75, fontSize: 14 },
    label: { display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 },
    input: { padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(127,127,127,.4)', font: 'inherit', fontWeight: 400 },
    primary: { minHeight: 46, borderRadius: 8, border: 0, background: '#4F46E5', color: '#fff', fontWeight: 800, font: 'inherit', cursor: 'pointer' },
    error: { padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,.12)', color: '#B91C1C', fontSize: 14 },
    bar: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '6px 16px',
        borderBottom: '1px solid rgba(127,127,127,.2)', fontSize: 13 },
    linkButton: { background: 'none', border: 0, color: '#4F46E5', cursor: 'pointer', font: 'inherit', fontWeight: 600 },
};

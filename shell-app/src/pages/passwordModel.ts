// Password form rules mirrored from user-service (AccountSecurityService.validateNewPassword) so forms can explain
// themselves before submitting. The server remains the authority. No runtime imports: unit-tested directly.

/** The reset token from a "#token=…" fragment, or '' when absent or malformed. */
export function tokenFromHash(hash: string): string {
  const match = /(?:^#|&)token=([A-Za-z0-9_-]{20,200})(?:&|$)/.exec(hash);
  return match ? match[1] : '';
}

export function passwordProblem(password: string, confirm: string, email?: string): string | null {
  if (password.length < 12 || password.length > 128) return 'Use a password of 12 to 128 characters.';
  const name = (email ?? '').split('@')[0].toLowerCase();
  if (name.length >= 4 && password.toLowerCase().includes(name)) return 'The password must not contain your email name.';
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}

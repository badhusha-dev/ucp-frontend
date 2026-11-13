// Loyalty request headers and transaction styling.

export function authHeaders(token: string | null | undefined): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Green for points gained, red for points spent, grey for everything else. */
export function txColor(type: string) {
  if (type === 'EARN' || type === 'BONUS') return '#4ade80';
  if (type === 'REDEEM') return '#f87171';
  return '#94a3b8';
}

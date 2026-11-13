// Request config for the stock admin API.

export function authConfig(token: string | null | undefined) {
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
}

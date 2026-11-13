// Authenticated JSON calls to the platform API; non-2xx responses become errors with the server's message.

export async function request<T>(path: string, token: string, method = 'GET', body?: unknown, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
  return payload as T;
}

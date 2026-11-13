import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../src/platformRequest.ts';

type Call = { url: string; init: any };
function fakeFetch(status: number, body: unknown, contentType = 'application/json', calls: Call[] = []): typeof fetch {
  return (async (url: string, init: any) => {
    calls.push({ url, init });
    return new Response(body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': contentType } });
  }) as unknown as typeof fetch;
}

describe('request', () => {
  it('sends the bearer token, and JSON only with a body', async () => {
    const calls: Call[] = [];
    await request('/api/platform/tenants', 'tok', 'GET', undefined, fakeFetch(200, [], 'application/json', calls));
    await request('/api/platform/tenants', 'tok', 'POST', { slug: 'acme' }, fakeFetch(201, { id: '1' }, 'application/json', calls));
    assert.deepEqual(calls[0].init.headers, { Authorization: 'Bearer tok' });
    assert.equal(calls[0].init.body, undefined);
    assert.equal(calls[1].init.headers['Content-Type'], 'application/json');
    assert.equal(calls[1].init.body, '{"slug":"acme"}');
  });

  it('returns parsed JSON, or null for non-JSON success', async () => {
    assert.deepEqual(await request('/x', 't', 'GET', undefined, fakeFetch(200, { ok: 1 })), { ok: 1 });
    assert.equal(await request('/x', 't', 'DELETE', undefined, fakeFetch(204, undefined, 'text/plain')), null);
  });

  it('surfaces the server message, then error, then the status', async () => {
    await assert.rejects(request('/x', 't', 'GET', undefined, fakeFetch(403, { message: 'Platform Super Admin access is required.' })), /Super Admin/);
    await assert.rejects(request('/x', 't', 'GET', undefined, fakeFetch(409, { error: 'Conflict here' })), /Conflict here/);
    await assert.rejects(request('/x', 't', 'GET', undefined, fakeFetch(500, 'oops', 'text/plain')), /Request failed \(500\)/);
  });
});

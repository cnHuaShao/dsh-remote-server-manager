import http from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

async function main() {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'rsm-http-'));
  process.env.DSH_PROFILE_DIR = profile;
  const registrations = [];
  const disposers = [];
  const rejects = new Set();
  const stores = new Map();
  const ctx = {
    logger: { warn() {}, info() {} },
    webServer: {
      register(route) {
        registrations.push(route);
        return () => {};
      },
    },
    connection: {
      requestRejection(request) {
        return request.headers['x-test-reject'] ? 401 : undefined;
      },
    },
    credentials: {
      async set(ref, value) {
        stores.set(String(ref), String(value));
      },
      async unset(ref) {
        stores.delete(String(ref));
      },
      async resolve(ref) {
        const value = stores.get(String(ref));
        return value === undefined ? undefined : { value, source: 'test' };
      },
      async describe(ref) {
        return { configured: stores.has(String(ref)), writable: true };
      },
    },
    effect(callback) {
      const dispose = callback();
      disposers.push(dispose);
      return dispose;
    },
  };
  const { apply } = await import('../index.js');
  await apply(ctx);
  assert.equal(registrations.length, 1, 'one HTTP route registered');
  assert.equal(registrations[0].kind, 'prefix');
  assert.equal(registrations[0].path, '/remote-server-manager');

  const server = http.createServer((req, res) => registrations[0].handler(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/remote-server-manager`;

  const get = async (route, options = {}) => {
    const response = await fetch(base + route, options);
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    return { status: response.status, body };
  };

  let result = await get('/health');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, value: { status: 'ok' } });

  result = await get('/health', { headers: { 'x-test-reject': '1' } });
  assert.equal(result.status, 401, 'auth rejection is honoured');

  result = await get('/servers');
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.value, []);

  const created = await get('/servers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      server: {
        name: 'http-test',
        host: '127.0.0.1',
        port: 22,
        username: 'root',
        authType: 'password',
        dockerCommand: 'docker',
      },
      secrets: { password: 'not-returned' },
    }),
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.value.name, 'http-test');
  assert.equal(created.body.value.secret.password, true);
  assert.equal(JSON.stringify(created.body).includes('not-returned'), false, 'secret is not returned');
  const id = created.body.value.id;

  result = await get('/servers');
  assert.equal(result.body.value.length, 1);
  assert.equal(result.body.value[0].secret.password, true);

  result = await get(`/servers/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ server: { ...created.body.value, name: 'http-test-renamed' } }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.value.name, 'http-test-renamed');

  result = await get('/servers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ server: { name: '', host: '', username: '', authType: 'password' } }),
  });
  assert.equal(result.status, 400, 'validation errors map to 400');

  result = await get('/servers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{broken',
  });
  assert.equal(result.status, 400, 'invalid JSON maps to 400');

  result = await get(`/servers/${id}`, { method: 'DELETE' });
  assert.equal(result.status, 200);
  result = await get('/servers');
  assert.deepEqual(result.body.value, []);

  result = await get('/unknown');
  assert.equal(result.status, 404);

  result = await get('/servers/srv_missing/images');
  assert.equal(result.status, 404, 'images route is registered and validates the server id');

  result = await get('/servers/srv_missing/firewall');
  assert.equal(result.status, 404, 'firewall route is registered and validates the server id');

  result = await get('/servers/srv_missing/programs');
  assert.equal(result.status, 404, 'programs route is registered and validates the server id');

  result = await get('/servers/srv_missing/apt-sources');
  assert.equal(result.status, 404, 'apt sources route is registered and validates the server id');

  result = await get('/servers/srv_missing/apt-sources/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'update' }),
  });
  assert.equal(result.status, 404, 'apt sources action route is registered and validates the server id');

  result = await get('/servers/srv_missing/docker-sources');
  assert.equal(result.status, 404, 'docker sources route is registered and validates the server id');

  result = await get('/servers/srv_missing/docker-sources/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'save', mirrors: [] }),
  });
  assert.equal(result.status, 404, 'docker sources action route is registered and validates the server id');

  result = await get('/servers/srv_missing/programs/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'install', id: 'jq' }),
  });
  assert.equal(result.status, 404, 'program action route is registered and validates the server id');

  result = await get('/servers/srv_missing/firewall/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'open_port', port: 8080, protocol: 'tcp' }),
  });
  assert.equal(result.status, 404, 'firewall action route is registered and validates the server id');

  await new Promise((resolve) => server.close(resolve));
  for (const dispose of disposers.reverse()) {
    try {
      await dispose();
    } catch {
      // ignore
    }
  }
  await rm(profile, { recursive: true, force: true });
  console.log('PASS HTTP route checks');
}

main().catch((error) => {
  console.error('FAIL', error);
  process.exit(1);
});

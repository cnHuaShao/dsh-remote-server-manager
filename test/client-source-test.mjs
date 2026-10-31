import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(testDir);
let loaded;
globalThis.window = {
  __ModuleLoader__: {
    load(spec) {
      loaded = spec;
    },
  },
};
globalThis.fetch = async (url) => {
  assert.match(String(url), /\/remote-server-manager\/servers$/);
  return new Response(
    JSON.stringify({
      ok: true,
      value: [
        {
          id: 'srv_test',
          name: '测试服务器',
          host: '10.0.0.5',
          port: 2222,
          username: 'tester',
          secret: { password: true, privateKey: false },
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};

const React = {
  createElement: () => null,
  Fragment: {},
  useState: (value) => [value, () => {}],
  useEffect: () => {},
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
};
const modulePath = path.join(root, 'client.js');
await import(pathToFileURL(modulePath).href);
assert.ok(loaded, 'client module registers through the module loader');
const client = loaded.factory((name) => {
  if (name === 'react') return React;
  throw new Error(`unexpected client import: ${name}`);
});
assert.equal(typeof client.apply, 'function');

const sources = [];
const effects = [];
const ctx = {
  locale: {
    register: () => () => {},
    bind: () => (key) => key,
  },
  effect(fn) {
    const dispose = fn();
    effects.push(dispose);
    return dispose;
  },
  get(name) {
    return name === 'inputTriggers' ? { registerSource: (source) => {
      sources.push(source);
      return () => {};
    } } : undefined;
  },
  slots: { inject() {} },
};
client.apply(ctx);
assert.equal(sources.length, 1, 'one @ reference source is registered');
const source = sources[0];
assert.equal(source.trigger, '@');
assert.equal(source.name, 'remote-server');

const rows = await source.candidates({ sessionId: 'session' }, { query: '', signal: new AbortController().signal });
assert.equal(rows.length, 1);
assert.equal(rows[0].name, '测试服务器');
assert.match(rows[0].description, /tester@10\.0\.0\.5:2222/);
assert.ok(rows[0].section);

const outcome = source.onPick({ candidate: rows[0], action: 'pick' });
assert.equal(outcome.insert.source, 'remote-server');
assert.equal(outcome.insert.label, '测试服务器');
assert.equal(outcome.insert.appearance, 'session');
assert.match(outcome.insert.ref, /服务器引用 server: 测试服务器 \(tester@10\.0\.0\.5:2222, id=srv_test\)/);
assert.equal(await source.codec.serialize(outcome.insert.ref), outcome.insert.ref);
console.log('PASS client @ server reference source');

for (const dispose of effects) if (typeof dispose === 'function') dispose();

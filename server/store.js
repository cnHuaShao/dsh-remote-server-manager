import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AppError,
  assertDockerCommand,
  cleanString,
  randomId,
  requiredString,
} from './util.js';

const DATA_VERSION = 1;

export function credentialRefs(server) {
  const suffix = String(server.id).replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
  return {
    password: `DSH_RSM_${suffix}_PASSWORD`,
    privateKey: `DSH_RSM_${suffix}_PRIVATE_KEY`,
    passphrase: `DSH_RSM_${suffix}_PASSPHRASE`,
  };
}

function normalizePort(value) {
  const port = Number.parseInt(String(value ?? '22'), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new AppError('invalid_argument', 'Port must be between 1 and 65535', 400, { field: 'port' });
  }
  return port;
}

function normalizeHost(value) {
  const host = cleanString(value, 255);
  if (host.length === 0) throw new AppError('invalid_argument', 'Host is required', 400, { field: 'host' });
  if (/[\s\u0000-\u001f]/.test(host)) {
    throw new AppError('invalid_argument', 'Host must not contain whitespace or control characters', 400, { field: 'host' });
  }
  return host;
}

function normalizeUsername(value) {
  const username = requiredString(value, 'username', 64);
  if (/[\s\u0000-\u001f]/.test(username)) {
    throw new AppError('invalid_argument', 'Username must not contain whitespace or control characters', 400, { field: 'username' });
  }
  return username;
}

function normalizePath(value) {
  const text = cleanString(value, 4096);
  if (/\u0000/.test(text)) throw new AppError('invalid_argument', 'Path must not contain NUL bytes', 400, { field: 'defaultPath' });
  return text;
}

function normalizeDescription(value) {
  return cleanString(value, 500);
}

function sanitizeServerInput(input, existing) {
  const source = input && typeof input === 'object' ? input : {};
  const authType = source.authType === 'key' || existing?.authType === 'key' ? 'key' : 'password';
  return {
    name: requiredString(source.name ?? existing?.name, 'name', 64),
    host: normalizeHost(source.host ?? existing?.host),
    port: normalizePort(source.port ?? existing?.port ?? 22),
    username: normalizeUsername(source.username ?? existing?.username),
    authType: source.authType === 'key' || source.authType === 'password' ? source.authType : authType,
    dockerCommand: assertDockerCommand(source.dockerCommand ?? existing?.dockerCommand ?? 'docker'),
    defaultPath: normalizePath(source.defaultPath ?? existing?.defaultPath ?? ''),
    description: normalizeDescription(source.description ?? existing?.description ?? ''),
  };
}

function sanitizeStoredServer(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string') return undefined;
  try {
    return {
      id: value.id,
      ...sanitizeServerInput(value, undefined),
      fingerprint: typeof value.fingerprint === 'string' ? value.fingerprint.slice(0, 200) : '',
      createdAt: typeof value.createdAt === 'number' ? value.createdAt : Date.now(),
      updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
      lastConnectedAt: typeof value.lastConnectedAt === 'number' ? value.lastConnectedAt : 0,
    };
  } catch {
    return undefined;
  }
}

export class ServerStore {
  constructor(directory) {
    this.directory = directory;
    this.filename = path.join(directory, 'servers.json');
    this.servers = [];
    this.loaded = false;
    this.writeQueue = Promise.resolve();
  }

  async load() {
    if (this.loaded) return this;
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      const text = await readFile(this.filename, 'utf8');
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed?.servers;
      this.servers = Array.isArray(rows) ? rows.map(sanitizeStoredServer).filter(Boolean) : [];
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw new Error(`remote-server-manager: cannot read ${this.filename}: ${error.message}`);
      }
      this.servers = [];
    }
    this.loaded = true;
    return this;
  }

  list() {
    return this.servers.map((server) => ({ ...server }));
  }

  get(id) {
    const server = this.servers.find((entry) => entry.id === id);
    if (server === undefined) throw new AppError('not_found', 'Server not found', 404, { id });
    return { ...server };
  }

  async create(input) {
    const data = sanitizeServerInput(input, undefined);
    this.assertUniqueName(data.name, undefined);
    const now = Date.now();
    const server = {
      id: randomId('srv'),
      ...data,
      fingerprint: '',
      createdAt: now,
      updatedAt: now,
      lastConnectedAt: 0,
    };
    this.servers = [...this.servers, server];
    await this.persist();
    return { ...server };
  }

  async update(id, input) {
    const current = this.get(id);
    const data = sanitizeServerInput(input, current);
    this.assertUniqueName(data.name, id);
    const next = {
      ...current,
      ...data,
      updatedAt: Date.now(),
    };
    this.servers = this.servers.map((entry) => (entry.id === id ? next : entry));
    await this.persist();
    return { ...next };
  }

  async patchRuntime(id, patch) {
    const current = this.get(id);
    const next = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
    };
    this.servers = this.servers.map((entry) => (entry.id === id ? next : entry));
    await this.persist();
    return { ...next };
  }

  async remove(id) {
    this.get(id);
    this.servers = this.servers.filter((entry) => entry.id !== id);
    await this.persist();
  }

  assertUniqueName(name, exceptId) {
    const key = name.toLocaleLowerCase();
    const duplicate = this.servers.find(
      (entry) => entry.id !== exceptId && entry.name.toLocaleLowerCase() === key,
    );
    if (duplicate !== undefined) {
      throw new AppError('name_conflict', `A server named "${name}" already exists`, 409, {
        field: 'name',
      });
    }
  }

  async persist() {
    const payload = JSON.stringify({ version: DATA_VERSION, servers: this.servers }, null, 2);
    const write = async () => {
      await mkdir(this.directory, { recursive: true, mode: 0o700 });
      const temp = `${this.filename}.${process.pid}.tmp`;
      await writeFile(temp, payload, { encoding: 'utf8', mode: 0o600 });
      await rename(temp, this.filename);
    };
    this.writeQueue = this.writeQueue.then(write, write);
    await this.writeQueue;
  }
}

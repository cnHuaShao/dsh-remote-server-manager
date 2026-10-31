import os from 'node:os';
import path from 'node:path';
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { RemoteManager } from './server/manager.js';
import { ServerStore } from './server/store.js';
import { AppError, asAppError, cleanString } from './server/util.js';

export const inject = ['webServer', 'connection', 'credentials'];

const PREFIX = '/remote-server-manager';
const JSON_LIMIT = 40 * 1024 * 1024;

function resolveProfileDirectory() {
  if (process.env.DSH_PROFILE_DIR) return process.env.DSH_PROFILE_DIR;
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  const profiles = path.join(home, 'profiles');
  for (const arg of process.argv.slice(1)) {
    if (typeof arg !== 'string' || !arg) continue;
    let resolved;
    try {
      resolved = path.resolve(arg);
    } catch {
      continue;
    }
    if (resolved !== profiles && !resolved.startsWith(`${profiles}${path.sep}`)) continue;
    const relative = path.relative(profiles, resolved);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) continue;
    const profileDir = path.join(profiles, relative.split(path.sep)[0]);
    if (existsSync(path.join(profileDir, 'package.json'))) return profileDir;
  }
  if (process.env.DSH_PROFILE) return path.join(profiles, process.env.DSH_PROFILE);
  return path.join(profiles, 'default');
}

function resolveDataDirectory() {
  return path.join(resolveProfileDirectory(), 'remote-server-manager');
}

async function migrateLegacyData(directory, logger) {
  const profileDir = path.dirname(directory);
  const profilesRoot = path.dirname(profileDir);
  const legacy = path.join(profilesRoot, 'default', 'remote-server-manager');
  if (path.resolve(legacy) === path.resolve(directory)) return;
  if (existsSync(path.join(directory, 'servers.json'))) return;
  if (!existsSync(path.join(legacy, 'servers.json'))) return;
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await copyFile(path.join(legacy, 'servers.json'), path.join(directory, 'servers.json'));
    logger?.info?.(`remote-server-manager: migrated servers.json from the default profile to ${profileDir}`);
  } catch (error) {
    logger?.warn?.(`remote-server-manager: could not migrate legacy servers.json: ${error.message}`);
  }
}

const TOOL_OUTPUT_SCHEMA = { type: 'object', additionalProperties: true };

function renderToolValue(_args, value) {
  return [{ type: 'text', text: JSON.stringify(value) }];
}

function publicServerView(server) {
  return {
    id: server.id,
    name: server.name,
    host: server.host,
    port: server.port,
    username: server.username,
    authType: server.authType,
    dockerCommand: server.dockerCommand,
    defaultPath: server.defaultPath || '',
    connected: server.connected === true,
    lastConnectedAt: server.lastConnectedAt || 0,
  };
}

function findSavedServer(servers, reference) {
  const text = cleanString(reference, 512);
  if (!text) throw new AppError('invalid_argument', 'The "server" parameter is required for this action', 400);
  const mentioned = /(?:dsh-server:|\bid=)([A-Za-z0-9_-]+)/.exec(text);
  const needle = (mentioned ? mentioned[1] : text).trim();
  const lower = needle.toLowerCase();
  const exact =
    servers.find((server) => server.id === needle) ||
    servers.find((server) => server.name.toLowerCase() === lower) ||
    servers.find((server) => server.host.toLowerCase() === lower) ||
    servers.find((server) => `${server.username}@${server.host}`.toLowerCase() === lower) ||
    servers.find((server) => `${server.username}@${server.host}:${server.port}`.toLowerCase() === lower);
  if (exact) return exact;
  const partial = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(lower) ||
      server.host.toLowerCase().includes(lower) ||
      server.id.toLowerCase().includes(lower),
  );
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    throw new AppError(
      'ambiguous_server',
      `More than one saved server matches "${needle}". Use the exact server name or id.`,
      400,
      { matches: partial.map((server) => ({ id: server.id, name: server.name, host: server.host })) },
    );
  }
  throw new AppError('not_found', `No saved server matches "${needle}"`, 404);
}

async function resolveContainerIds(manager, serverId, references) {
  const ids = [];
  const missing = [];
  let first = true;
  for (const reference of references) {
    const raw = cleanString(reference, 256);
    if (!raw) continue;
    const wanted = raw.replace(/^\/+/, '');
    const listing = await manager.containers(serverId, {
      q: wanted,
      page: 1,
      pageSize: 50,
      refresh: first ? '1' : '0',
    });
    first = false;
    const item = listing.items.find(
      (container) =>
        container.id === raw ||
        container.id === wanted ||
        container.id.startsWith(wanted) ||
        container.name === raw ||
        container.name === wanted ||
        container.name.replace(/^\//, '') === wanted,
    );
    if (item) ids.push(item.id);
    else missing.push(raw);
  }
  if (missing.length > 0) {
    throw new AppError('not_found', `Container not found: ${missing.join(', ')}`, 404, { missing });
  }
  return [...new Set(ids)];
}

function remoteServerTool(manager) {
  return {
    name: 'remote_server',
    description:
      'Inspect or operate a Linux server saved in the Harness Remote Server Manager (远程服务器管家). Use it when the user references a saved server, for example a mention like "服务器引用 server: name (user@host:22, id=srv_...)" or plain text naming one of the saved servers. Actions: list saved servers; overview; containers (search/filter/page); images (list Docker images, separate from containers); firewall (show firewall backend, status and rules); programs (detect development/deployment software and versions); apt_sources (show apt distribution, current source URLs, and mirror presets); docker_sources (show Docker daemon registry mirrors); container_action (start, stop, restart — only when the user explicitly asks); files (list a remote directory); file_read (read a remote text file). Never use container_action to experiment or without the user asking for that exact change.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'overview', 'containers', 'images', 'firewall', 'programs', 'apt_sources', 'docker_sources', 'container_action', 'files', 'file_read'],
          description: 'Operation to perform.',
        },
        server: {
          type: 'string',
          description: 'Saved server name, id, host, username@host, or a server mention copied from the user message.',
        },
        q: { type: 'string', description: 'Container name/image/id search text for action=containers.' },
        state: {
          type: 'string',
          enum: ['all', 'running', 'stopped', 'paused', 'other'],
          description: 'Container state filter for action=containers.',
        },
        project: { type: 'string', description: 'Compose project name filter for action=containers.' },
        dangling: {
          type: 'string',
          enum: ['all', 'tagged', 'dangling'],
          description: 'Image tag filter for action=images.',
        },
        page: { type: 'integer', minimum: 1, description: 'Container page number, default 1.' },
        pageSize: { type: 'integer', minimum: 10, maximum: 200, description: 'Container page size, default 50.' },
        sort: {
          type: 'string',
          enum: ['name', 'state', 'project', 'image', 'size', 'created', 'id'],
          description: 'Sort order for action=containers (name/state/project/image) or action=images (name/size/created/id).',
        },
        containerAction: {
          type: 'string',
          enum: ['start', 'stop', 'restart'],
          description: 'Change to apply for action=container_action.',
        },
        containers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Container names or ids for action=container_action (maximum 100).',
        },
        path: {
          type: 'string',
          description: 'Remote path for action=files (default: home directory) or file_read.',
        },
        refresh: {
          type: 'boolean',
          description: 'Bypass the short cache for action=firewall or action=programs.',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: { schema: TOOL_OUTPUT_SCHEMA, render: renderToolValue },
    presentCall(args) {
      return {
        card: 'generic',
        title: args?.action === 'container_action' ? `Remote container: ${args.containerAction || 'action'}` : `Remote server: ${args?.action || 'read'}`,
        kind: args?.action === 'container_action' ? 'execute' : 'read',
        rawInput: args,
      };
    },
    isConcurrencySafe(args) {
      return args?.action !== 'container_action';
    },
    async execute(args) {
      try {
        const action = args?.action;
        if (action === 'list') {
          const servers = await manager.listServers();
          return { servers: servers.map(publicServerView) };
        }
        const servers = await manager.listServers();
        const server = findSavedServer(servers, args?.server);
        if (action === 'overview') {
          const overview = await manager.overview(server.id);
          const fresh = (await manager.listServers()).find((entry) => entry.id === server.id) || server;
          return { server: publicServerView(fresh), overview };
        }
        if (action === 'containers') {
          const listing = await manager.containers(server.id, {
            q: args.q,
            state: args.state,
            project: args.project,
            page: args.page,
            pageSize: args.pageSize,
            sort: args.sort,
            refresh: '1',
          });
          return { server: publicServerView(server), ...listing };
        }
        if (action === 'images') {
          const listing = await manager.images(server.id, {
            q: args.q,
            dangling: args.dangling,
            page: args.page,
            pageSize: args.pageSize,
            sort: args.sort === 'image' ? 'name' : args.sort,
            refresh: '1',
          });
          return { server: publicServerView(server), ...listing };
        }
        if (action === 'firewall') {
          return { server: publicServerView(server), firewall: await manager.firewall(server.id, { refresh: args.refresh === true ? '1' : '0' }) };
        }
        if (action === 'programs') {
          return { server: publicServerView(server), ...(await manager.programs(server.id, { refresh: args.refresh === true ? '1' : '0' })) };
        }
        if (action === 'apt_sources') {
          return { server: publicServerView(server), aptSources: await manager.aptSources(server.id) };
        }
        if (action === 'docker_sources') {
          return { server: publicServerView(server), dockerSources: await manager.dockerSources(server.id) };
        }
        if (action === 'container_action') {
          const change = args.containerAction;
          if (!['start', 'stop', 'restart'].includes(change)) {
            throw new AppError('invalid_argument', 'containerAction must be start, stop, or restart', 400);
          }
          const references = Array.isArray(args.containers) ? args.containers.slice(0, 100) : [];
          if (references.length === 0) {
            throw new AppError('invalid_argument', 'containers must contain at least one container name or id', 400);
          }
          const ids = await resolveContainerIds(manager, server.id, references);
          const result = await manager.containerAction(server.id, { action: change, ids });
          return { server: publicServerView(server), ...result };
        }
        if (action === 'files') {
          return { server: publicServerView(server), ...(await manager.listFiles(server.id, args.path)) };
        }
        if (action === 'file_read') {
          const file = await manager.readFile(server.id, args.path);
          if (file.binary) {
            return { server: publicServerView(server), ...file, content: undefined, note: 'Binary file; open or download it from the Remote Server Manager panel.' };
          }
          if (file.content.length > 120_000) {
            return { server: publicServerView(server), ...file, content: file.content.slice(0, 120_000), truncated: true };
          }
          return { server: publicServerView(server), ...file };
        }
        throw new AppError('invalid_argument', `Unsupported action "${action}"`, 400);
      } catch (error) {
        throw new Error(asAppError(error).message);
      }
    },
  };
}

function registerRemoteServerTool(ctx, manager) {
  let tools;
  try {
    tools = typeof ctx.get === 'function' ? ctx.get('tools') : ctx.tools;
  } catch {
    tools = undefined;
  }
  if (!tools) return;
  ctx.effect(() => tools.register(remoteServerTool(manager)), 'remote-server-manager: agent tool');
}

function sendJson(res, status, payload) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendOk(res, value, status = 200) {
  sendJson(res, status, { ok: true, value });
}

function sendError(res, error) {
  const appError = asAppError(error);
  if (!res.headersSent) {
    sendJson(res, appError.status, {
      ok: false,
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.details === undefined ? {} : { details: appError.details }),
      },
    });
  }
}

async function readJson(req, limit = JSON_LIMIT) {
  const contentType = String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw new AppError('unsupported_media_type', 'Content-Type must be application/json', 415);
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) {
      throw new AppError('payload_too_large', 'Request body is too large', 413);
    }
    chunks.push(chunk);
  }
  if (total === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    throw new AppError('invalid_json', 'Request body is not valid JSON', 400);
  }
}

function decodePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function contentDisposition(filename) {
  const safe = String(filename || 'download')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(String(filename || 'download')).replace(/['()]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

function routeMatch(rest, pattern) {
  return pattern.exec(rest);
}

function parseSecrets(body) {
  const secret = body?.secrets && typeof body.secrets === 'object' ? body.secrets : {};
  return {
    password: typeof secret.password === 'string' ? secret.password : undefined,
    privateKey: typeof secret.privateKey === 'string' ? secret.privateKey : undefined,
    passphrase: typeof secret.passphrase === 'string' ? secret.passphrase : undefined,
    clearPassword: secret.clearPassword === true,
    clearPrivateKey: secret.clearPrivateKey === true,
    clearPassphrase: secret.clearPassphrase === true,
  };
}

async function handleDownload(req, res, manager, serverId, inputPath) {
  const file = await manager.openDownload(serverId, inputPath);
  res.statusCode = 200;
  res.setHeader('content-type', 'application/octet-stream');
  res.setHeader('content-length', String(file.size));
  res.setHeader('content-disposition', contentDisposition(file.name));
  res.setHeader('cache-control', 'no-store');
  const cleanup = () => {
    try {
      file.stream.destroy();
    } catch {
      // ignore
    }
  };
  req.once('close', cleanup);
  res.once('close', cleanup);
  file.stream.once('error', () => {
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: { code: 'download_failed', message: 'Download failed' } });
    } else {
      res.destroy();
    }
  });
  file.stream.pipe(res);
}

async function dispatch(req, res, manager) {
  const url = new URL(req.url || '/', 'http://localhost');
  let rest = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : url.pathname;
  if (!rest) rest = '/';
  const method = String(req.method || 'GET').toUpperCase();
  const query = url.searchParams;

  if (rest === '/health' && method === 'GET') {
    sendOk(res, { status: 'ok' });
    return;
  }

  if (rest === '/servers') {
    if (method === 'GET') {
      sendOk(res, await manager.listServers());
      return;
    }
    if (method === 'POST') {
      const body = await readJson(req);
      const server = await manager.saveServer(undefined, body.server ?? body, parseSecrets(body));
      const publicServer = (await manager.listServers()).find((entry) => entry.id === server.id) || server;
      sendOk(res, publicServer, 201);
      return;
    }
    throw new AppError('method_not_allowed', 'Method not allowed', 405);
  }

  let match = routeMatch(rest, /^\/servers\/([^/]+)$/);
  if (match) {
    const serverId = decodePart(match[1]);
    if (method === 'GET') {
      const servers = await manager.listServers();
      const server = servers.find((entry) => entry.id === serverId);
      if (!server) throw new AppError('not_found', 'Server not found', 404);
      sendOk(res, server);
      return;
    }
    if (method === 'PUT') {
      const body = await readJson(req);
      const server = await manager.saveServer(serverId, body.server ?? body, parseSecrets(body));
      const publicServer = (await manager.listServers()).find((entry) => entry.id === server.id) || server;
      sendOk(res, publicServer);
      return;
    }
    if (method === 'DELETE') {
      const server = await manager.deleteServer(serverId);
      sendOk(res, { id: server.id });
      return;
    }
    throw new AppError('method_not_allowed', 'Method not allowed', 405);
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/test$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.testConnection(decodePart(match[1])));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/overview$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.overview(decodePart(match[1])));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/activity$/);
  if (match && method === 'GET') {
    sendOk(res, manager.activityFor(decodePart(match[1])));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/files$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.listFiles(decodePart(match[1]), query.get('path') || ''));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/file$/);
  if (match) {
    const serverId = decodePart(match[1]);
    if (method === 'GET') {
      sendOk(res, await manager.readFile(serverId, query.get('path') || ''));
      return;
    }
    if (method === 'PUT') {
      const body = await readJson(req);
      sendOk(res, await manager.writeFile(serverId, body));
      return;
    }
    throw new AppError('method_not_allowed', 'Method not allowed', 405);
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/fs\/mkdir$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.mkdir(decodePart(match[1]), await readJson(req)), 201);
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/fs\/rename$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.rename(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/fs\/delete$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.deleteEntry(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/fs\/upload$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.uploadFile(decodePart(match[1]), await readJson(req)), 201);
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/download$/);
  if (match && method === 'GET') {
    await handleDownload(req, res, manager, decodePart(match[1]), query.get('path') || '');
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/firewall$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.firewall(decodePart(match[1]), { refresh: query.get('refresh') === '1' }));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/firewall\/action$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.firewallAction(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/apt-sources$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.aptSources(decodePart(match[1])));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/apt-sources\/action$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.aptSourcesAction(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/programs$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.programs(decodePart(match[1]), { refresh: query.get('refresh') === '1' }));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/programs\/action$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.programAction(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/docker-sources$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.dockerSources(decodePart(match[1])));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/docker-sources\/action$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.dockerSourcesAction(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/images$/);
  if (match && method === 'GET') {
    sendOk(
      res,
      await manager.images(decodePart(match[1]), {
        q: query.get('q') || '',
        dangling: query.get('dangling') || 'all',
        sort: query.get('sort') || 'name',
        page: query.get('page') || 1,
        pageSize: query.get('pageSize') || 50,
        refresh: query.get('refresh') === '1',
      }),
    );
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/containers$/);
  if (match && method === 'GET') {
    sendOk(
      res,
      await manager.containers(decodePart(match[1]), {
        q: query.get('q') || '',
        state: query.get('state') || 'all',
        project: query.get('project') || '',
        sort: query.get('sort') || 'name',
        page: query.get('page') || 1,
        pageSize: query.get('pageSize') || 50,
        refresh: query.get('refresh') === '1',
      }),
    );
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/containers\/action$/);
  if (match && method === 'POST') {
    sendOk(res, await manager.containerAction(decodePart(match[1]), await readJson(req)));
    return;
  }

  match = routeMatch(rest, /^\/servers\/([^/]+)\/containers\/([^/]+)$/);
  if (match && method === 'GET') {
    sendOk(res, await manager.inspectContainer(decodePart(match[1]), decodePart(match[2])));
    return;
  }

  throw new AppError('not_found', 'Unknown remote-server-manager route', 404);
}

export async function apply(ctx) {
  const dataDirectory = resolveDataDirectory();
  await migrateLegacyData(dataDirectory, ctx.logger);
  const store = new ServerStore(dataDirectory);
  const manager = new RemoteManager({
    store,
    credentials: ctx.credentials,
    logger: ctx.logger,
  });
  await manager.init();
  registerRemoteServerTool(ctx, manager);

  const disposeRoute = ctx.webServer.register({
    kind: 'prefix',
    path: PREFIX,
    handler: async (req, res) => {
      const rejection = ctx.connection.requestRejection(req);
      if (rejection !== undefined) {
        res.statusCode = rejection;
        res.end();
        return;
      }
      try {
        await dispatch(req, res, manager);
      } catch (error) {
        const appError = asAppError(error);
        if (appError.status >= 500) {
          ctx.logger?.warn?.(`remote-server-manager: ${req.method} ${req.url} failed: ${appError.message}`);
        }
        sendError(res, appError);
      }
    },
  });

  ctx.effect(() => () => {
    disposeRoute();
    manager.dispose();
  }, 'remote-server-manager: HTTP route and SSH pool');
}

export const name = 'remote-server-manager';

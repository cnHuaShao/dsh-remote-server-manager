import { createRequire } from 'node:module';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ssh2 from 'ssh2';
import { ServerStore } from '../server/store.js';
import { RemoteManager } from '../server/manager.js';

const require = createRequire(import.meta.url);
const { STATUS_CODE, Stats } = require('ssh2/lib/protocol/SFTP.js');
const { Server } = ssh2;

const PORT = Number(process.env.RSM_TEST_PORT || 0);

function stats(mode, size, mtime) {
  return new Stats({ mode, size, uid: 1000, gid: 1000, atime: mtime, mtime });
}

const fileMode = (content) => 0o100000 | 0o644;
const dirMode = 0o040000 | 0o755;

function createFs() {
  const now = Math.floor(Date.now() / 1000);
  const files = new Map();
  const dirs = new Set(['/', '/home', '/home/tester', '/home/tester/projects', '/var', '/var/log']);
  files.set('/home/tester/notes.txt', { content: Buffer.from('hello from mock server\nsecond line\n'), mtime: now });
  files.set('/home/tester/app.env', { content: Buffer.from('APP_ENV=production\nPORT=8080\n'), mtime: now });
  files.set('/var/log/app.log', { content: Buffer.from('line 1\nline 2\nline 3\n'), mtime: now });
  files.set('/home/tester/projects/readme.md', { content: Buffer.from('# Demo\n'), mtime: now });
  return { files, dirs, now };
}

function resolveFsPath(vfs, raw) {
  let p = String(raw || '.');
  if (p === '~') p = '/home/tester';
  else if (p.startsWith('~/')) p = '/home/tester/' + p.slice(2);
  if (!p.startsWith('/')) p = path.posix.join('/home/tester', p);
  return path.posix.normalize(p);
}

function attrsFor(vfs, p) {
  if (vfs.dirs.has(p)) return stats(dirMode, 4096, vfs.now);
  const file = vfs.files.get(p);
  if (file) return stats(fileMode(file.content), file.content.length, file.mtime);
  return undefined;
}

function setupSftp(vfs, sftp) {
  const handles = new Map();
  let nextHandle = 1;
  sftp.on('error', (error) => console.error('[sftp error]', error));
  const getPath = (handle) => handles.get(handle.toString())?.path;
  const getEntry = (handle) => handles.get(handle.toString());
  const newHandle = (data) => {
    const id = String(nextHandle++);
    handles.set(id, data);
    return Buffer.from(id);
  };
  const pathStats = (id, p, follow = true) => {
    const attrs = attrsFor(vfs, p);
    if (!attrs) {
      sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    } else {
      sftp.attrs(id, attrs);
    }
  };

  sftp.on('REALPATH', (id, p) => {
    const resolved = resolveFsPath(vfs, p);
    if (!attrsFor(vfs, resolved)) {
      sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    } else {
      sftp.name(id, [{ filename: resolved, longname: resolved, attrs: attrsFor(vfs, resolved) }]);
    }
  });
  sftp.on('STAT', (id, p) => pathStats(id, resolveFsPath(vfs, p), true));
  sftp.on('LSTAT', (id, p) => pathStats(id, resolveFsPath(vfs, p), false));

  sftp.on('OPEN', (id, p, flags, attrs) => {
    const resolved = resolveFsPath(vfs, p);
    const existing = vfs.files.get(resolved);
    const writable = (flags & 0x2) !== 0 || (flags & 0x8) !== 0;
    if (writable) {
      const entry = existing || { content: Buffer.alloc(0), mtime: vfs.now };
      if ((flags & 0x10) !== 0) entry.content = Buffer.alloc(0);
      vfs.files.set(resolved, entry);
      sftp.handle(id, newHandle({ path: resolved, writable: true, buffer: entry.content }));
    } else if (existing) {
      sftp.handle(id, newHandle({ path: resolved, writable: false, buffer: existing.content }));
    } else {
      sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    }
  });

  sftp.on('FSTAT', (id, handle) => {
    const entry = getEntry(handle);
    if (!entry) return sftp.status(id, STATUS_CODE.FAILURE);
    const attrs = attrsFor(vfs, entry.path);
    if (attrs) sftp.attrs(id, attrs);
    else sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
  });

  sftp.on('READ', (id, handle, offset, len) => {
    const entry = getEntry(handle);
    if (!entry) return sftp.status(id, STATUS_CODE.FAILURE);
    if (offset >= entry.buffer.length) {
      sftp.status(id, STATUS_CODE.EOF);
    } else {
      sftp.data(id, entry.buffer.subarray(offset, offset + len));
    }
  });

  sftp.on('WRITE', (id, handle, offset, data) => {
    const entry = getEntry(handle);
    if (!entry || !entry.writable) return sftp.status(id, STATUS_CODE.FAILURE);
    const next = Buffer.alloc(Math.max(entry.buffer.length, offset + data.length));
    entry.buffer.copy(next, 0);
    data.copy(next, offset);
    entry.buffer = next;
    const file = vfs.files.get(entry.path);
    if (file) file.content = next;
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('CLOSE', (id, handle) => {
    const key = handle.toString();
    const entry = handles.get(key);
    if (entry?.writable) {
      const file = vfs.files.get(entry.path) || { content: entry.buffer, mtime: Math.floor(Date.now() / 1000) };
      file.content = entry.buffer;
      file.mtime = Math.floor(Date.now() / 1000);
      vfs.files.set(entry.path, file);
    }
    handles.delete(key);
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('OPENDIR', (id, p) => {
    const resolved = resolveFsPath(vfs, p);
    if (!vfs.dirs.has(resolved)) {
      sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    } else {
      sftp.handle(id, newHandle({ path: resolved, dir: true }));
    }
  });

  sftp.on('READDIR', (id, handle) => {
    const entry = getEntry(handle);
    if (!entry?.dir) return sftp.status(id, STATUS_CODE.FAILURE);
    if (entry.readdirDone) {
      sftp.status(id, STATUS_CODE.EOF);
      return;
    }
    entry.readdirDone = true;
    const dir = entry.path;
    const names = ['.', '..'];
    for (const p of [...vfs.dirs, ...vfs.files.keys()]) {
      if (p === '/' || path.posix.dirname(p) !== dir) continue;
      names.push(path.posix.basename(p));
    }
    const list = names.map((name) => {
      const p = name === '.' ? dir : name === '..' ? path.posix.dirname(dir) : path.posix.join(dir, name);
      const attrs = attrsFor(vfs, p) || stats(fileMode(Buffer.alloc(0)), 0, vfs.now);
      return { filename: name, longname: name, attrs };
    });
    sftp.name(id, list);
  });

  sftp.on('MKDIR', (id, p) => {
    const resolved = resolveFsPath(vfs, p);
    if (vfs.dirs.has(resolved) || vfs.files.has(resolved)) return sftp.status(id, STATUS_CODE.FAILURE);
    vfs.dirs.add(resolved);
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('RMDIR', (id, p) => {
    const resolved = resolveFsPath(vfs, p);
    if (!vfs.dirs.has(resolved)) return sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    vfs.dirs.delete(resolved);
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('REMOVE', (id, p) => {
    const resolved = resolveFsPath(vfs, p);
    if (!vfs.files.has(resolved)) return sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    vfs.files.delete(resolved);
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('RENAME', (id, oldPath, newPath) => {
    const from = resolveFsPath(vfs, oldPath);
    const to = resolveFsPath(vfs, newPath);
    if (vfs.files.has(from)) {
      vfs.files.set(to, vfs.files.get(from));
      vfs.files.delete(from);
    } else if (vfs.dirs.has(from)) {
      vfs.dirs.delete(from);
      vfs.dirs.add(to);
    } else {
      return sftp.status(id, STATUS_CODE.NO_SUCH_FILE);
    }
    sftp.status(id, STATUS_CODE.OK);
  });

  sftp.on('SETSTAT', (id) => {
    sftp.status(id, STATUS_CODE.OK);
  });
  sftp.on('FSETSTAT', (id) => {
    sftp.status(id, STATUS_CODE.OK);
  });
}

function makeContainers(count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const project = i % 3 === 0 ? '' : `stack-${i % 7}`;
    const state = i % 11 === 0 ? 'exited' : i % 13 === 0 ? 'paused' : 'running';
    rows.push({
      ID: `abcdef${String(i).padStart(6, '0')}deadbeef`,
      Names: project ? `${project}-service-${i}` : `standalone-${i}`,
      Image: `registry.local/team/app:${i % 5}`,
      Command: `node server.js --port ${8000 + i}`,
      CreatedAt: '2026-10-01 10:00:00 +0800 CST',
      RunningFor: `${i} hours ago`,
      Ports: `0.0.0.0:${9000 + i}->8080/tcp`,
      State: state,
      Status: state === 'running' ? 'Up 3 hours' : state === 'paused' ? 'Up 2 hours (Paused)' : 'Exited (0) 2 hours ago',
      Size: '12MB (virtual 100MB)',
      Labels: project ? `com.docker.compose.project=${project},com.docker.compose.service=service-${i}` : '',
      Mounts: '',
      Networks: 'bridge',
      LocalVolumes: '0',
    });
  }
  return rows;
}

const containers = makeContainers(320);
const imageRows = Array.from({ length: 60 }, (_, i) => {
  const dangling = i % 7 === 0;
  return {
    ID: `sha256:${String(i).padStart(2, '0').repeat(32)}`,
    Repository: dangling ? '<none>' : 'registry.local/team/app',
    Tag: dangling ? '<none>' : String(i % 5),
    Digest: dangling ? '<none>' : `sha256:${String(i + 1).padStart(2, '0').repeat(32)}`,
    CreatedAt: `2026-09-${String((i % 28) + 1).padStart(2, '0')} 10:00:00 +0800 CST`,
    CreatedSince: `${(i % 20) + 1} days ago`,
    Size: `${100 + i}MB`,
  };
});
for (const [i, base] of imageRows.filter((row) => row.Repository !== '<none>').slice(0, 10).entries()) {
  imageRows.push({
    ...base,
    Tag: `extra-${i}`,
    Digest: `sha256:${String(90 + i).padStart(2, '0').repeat(32)}`,
  });
}
const actionLog = [];
const firewallLog = [];
const packageLog = [];
const aptLog = [];
const dockerSourceLog = [];
let firewallMode = 'firewalld';

function execHandler(command, stream, vfs) {
  const output = (text, code = 0) => {
    if (text) stream.write(text);
    stream.exit(code);
    stream.end();
  };
  if (command.includes('__RSM_FW_META__')) {
    if (firewallMode.startsWith('ufw')) {
      const inactive = firewallMode === 'ufwInactive';
      return output(
        [
          '__RSM_FW_META__',
          'uid=1000',
          'sudo=root',
          '__RSM_FW_FW_PATH__',
          '',
          '__RSM_FW_FW_STATE__',
          '',
          '__RSM_FW_FW_ZONE__',
          '',
          '__RSM_FW_FW_LIST__',
          '__RSM_FW_UFW_PATH__',
          '/usr/sbin/ufw',
          '__RSM_FW_UFW_VERBOSE__',
          `Status: ${inactive ? 'inactive' : 'active'}`,
          'Logging: on (low)',
          'Default: deny (incoming), allow (outgoing), disabled (routed)',
          '',
          '__RSM_FW_UFW_NUMBERED__',
          inactive ? '' : '[ 1] 22/tcp                     ALLOW IN    Anywhere\n[ 2] 8080/tcp                   ALLOW IN    Anywhere',
          '__RSM_FW_UFW_ADDED__',
          inactive ? 'Added user rules (see \'ufw status\' for running firewall):\nufw allow 22/tcp' : '',
          '__RSM_FW_NFT_PATH__',
          '',
          '__RSM_FW_NFT_RULES__',
          '__RSM_FW_IPTABLES_PATH__',
          '',
          '__RSM_FW_IPTABLES_RULES__',
          '',
        ].join('\n'),
      );
    }
    return output(
      [
        '__RSM_FW_META__',
        'uid=1000',
        'sudo=root',
        '__RSM_FW_FW_PATH__',
        '/usr/bin/firewall-cmd',
        '__RSM_FW_FW_STATE__',
        'running',
        '__RSM_FW_FW_ZONE__',
        'public',
        '__RSM_FW_FW_LIST__',
        'public (active)',
        '  target: default',
        '  interfaces: eth0',
        '  sources:',
        '  services: cockpit dhcpv6-client ssh',
        '  ports: 8080/tcp 443/tcp',
        '  protocols:',
        '  forward-ports:',
        '  source-ports:',
        '  icmp-blocks:',
        '  rich rules:',
        '__RSM_FW_UFW_PATH__',
        '',
        '__RSM_FW_UFW_VERBOSE__',
        '__RSM_FW_UFW_NUMBERED__',
        '__RSM_FW_NFT_PATH__',
        '',
        '__RSM_FW_NFT_RULES__',
        '__RSM_FW_IPTABLES_PATH__',
        '',
        '__RSM_FW_IPTABLES_RULES__',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('__RSM_DOCKER_SOURCE_META__')) {
    const config = Buffer.from(JSON.stringify({ 'registry-mirrors': ['https://docker.m.daocloud.io'], 'log-driver': 'json-file' })).toString('base64');
    return output(
      [
        '__RSM_DOCKER_SOURCE_META__',
        'exists=yes',
        'sudo=root',
        'systemctl=yes',
        `__RSM_DOCKER_DAEMON__${config}`,
        '__RSM_DOCKER_ACTIVE__',
        '["https://docker.m.daocloud.io"]',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('__RSM_DOCKER_SOURCE_OK__')) {
    dockerSourceLog.push(command);
    return output('daemon.json updated\n__RSM_DOCKER_SOURCE_OK__/etc/docker/rsm-backup-test\n');
  }
  if (command.includes('__RSM_APT_META__')) {
    return output(
      [
        '__RSM_APT_META__',
        'id=ubuntu',
        'codename=jammy',
        'version=22.04',
        'arch=amd64',
        'sudo=root',
        'apt=yes',
        '__RSM_APT_FILE__/etc/apt/sources.list',
        'deb http://archive.ubuntu.com/ubuntu jammy main restricted',
        'deb http://security.ubuntu.com/ubuntu jammy-security main',
        '__RSM_APT_FILE__/etc/apt/sources.list.d/ubuntu.sources',
        'Types: deb',
        'URIs: http://archive.ubuntu.com/ubuntu',
        'Suites: jammy',
        'Components: main universe',
        '',
        'Enabled: yes',
        '__RSM_APT_FILE__/etc/apt/sources.list.d/docker.list',
        'deb https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy stable',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('__RSM_APT_SWITCH_OK__')) {
    aptLog.push(command);
    return output('Reading package lists...\n__RSM_APT_SWITCH_OK__/etc/apt/rsm-backup-test\n');
  }
  if (command.includes('apt-get update')) {
    aptLog.push(command);
    return output('Reading package lists...\nAll packages are up to date.\n');
  }
  if (command.includes('__RSM_PKG_META__')) {
    return output(
      [
        '__RSM_PKG_META__',
        'pm=apt',
        'sudo=root',
        '__RSM_PKG_START__node',
        '__RSM_PKG_NAME__nodejs',
        '__RSM_PKG_INSTALLED__install ok installed|12.22.9~dfsg-1ubuntu3.6',
        '__RSM_PKG_CANDIDATE__12.22.9~dfsg-1ubuntu3.6',
        '__RSM_PKG_START__git',
        '__RSM_PKG_NAME__git',
        '__RSM_PKG_INSTALLED__install ok installed|2.43.0-1ubuntu1',
        '__RSM_PKG_CANDIDATE__2.44.0-1ubuntu1',
        '__RSM_PKG_START__jq',
        '__RSM_PKG_NAME__jq',
        '__RSM_PKG_INSTALLED__',
        '__RSM_PKG_CANDIDATE__1.6-2.1',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('__RSM_PROG_START__')) {
    return output(
      [
        '__RSM_PROG_START__node',
        '__RSM_PROG_PATH__/usr/bin/node',
        '__RSM_PROG_EXIT__0',
        'v20.11.1',
        '__RSM_PROG_START__git',
        '__RSM_PROG_PATH__/usr/bin/git',
        '__RSM_PROG_EXIT__0',
        'git version 2.43.0',
        '__RSM_PROG_START__docker',
        '__RSM_PROG_PATH__/usr/bin/docker',
        '__RSM_PROG_EXIT__0',
        'Docker version 29.3.0, build abc',
        '__RSM_PROG_START__docker-compose',
        '__RSM_PROG_PATH__/usr/bin/docker',
        '__RSM_PROG_EXIT__1',
        "docker: 'compose' is not a docker command.",
        '__RSM_PROG_START__nginx',
        '__RSM_PROG_PATH__/usr/sbin/nginx',
        '__RSM_PROG_EXIT__0',
        'nginx version: nginx/1.24.0',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('apt-get install')) {
    packageLog.push(command);
    return output('Setting up package...\n');
  }
  if (command.includes('firewall-cmd') || command.trim().startsWith('ufw ')) {
    firewallLog.push(command);
    return output('success\n');
  }
  if (command.includes('__RSM_OS__') && !command.includes('__RSM_UPTIME__')) {
    return output(
      [
        '__RSM_OS__',
        'Linux 6.8.0 x86_64',
        '__RSM_HOST__',
        'mock-host',
        '__RSM_HOME__',
        '/home/tester',
        '__RSM_DOCKER__',
        '25.0.3',
        '',
      ].join('\n'),
    );
  }
  if (command.includes('docker ps -a --no-trunc')) {
    return output(containers.map((row) => JSON.stringify(row)).join('\n') + '\n');
  }
  if (command.includes('docker images --no-trunc')) {
    return output(imageRows.map((row) => JSON.stringify(row)).join('\n') + '\n');
  }
  if (command.includes('docker version --format') && !command.includes('__RSM_UPTIME__')) {
    return output('25.0.3\n');
  }
  if (/docker (stop|restart|start) /.test(command)) {
    const action = /docker (stop|restart|start) /.exec(command)[1];
    const id = command.split("'")[1];
    actionLog.push({ action, id });
    return output(`${id}\n`);
  }
  if (command.includes('docker inspect --format')) {
    const id = command.match(/'([^']+)'\s*$/)?.[1] || '';
    return output(
      JSON.stringify({
        Id: id,
        Name: '/mock-container',
        Image: 'sha256:1234',
        Created: '2026-10-01T02:00:00Z',
        Platform: 'linux',
        State: { Status: 'running', RestartCount: 2, StartedAt: '2026-10-01T02:00:00Z' },
        Config: { Cmd: ['node', 'server.js'], Entrypoint: ['/entrypoint.sh'], Env: ['A=1', 'B=2'], Labels: { app: 'demo' } },
        Mounts: [{ Type: 'bind', Source: '/srv/app', Destination: '/app', Mode: '', RW: true }],
        NetworkSettings: { Networks: { bridge: {} }, Ports: { '8080/tcp': [{ HostIp: '0.0.0.0', HostPort: '9000' }] } },
      }),
    );
  }
  if (command.includes('__RSM_UPTIME__')) {
    return output(
      [
        '__RSM_OS__',
        'Linux 6.8.0 x86_64',
        '__RSM_UPTIME__',
        ' 10:00:00 up 10 days,  3:21,  1 user,  load average: 0.12, 0.18, 0.20',
        '__RSM_IDENTITY__',
        'uid=1000(tester) gid=1000(tester) groups=1000(tester),999(docker)',
        '__RSM_DISK__',
        'Filesystem      Size  Used Avail Use% Mounted on',
        '/dev/sda1        98G   42G   51G  46% /',
        '__RSM_MEMORY__',
        '              total        used        free      shared  buff/cache   available',
        'Mem:          15884        6120        2100         120        7664        9300',
        '__RSM_DOCKER__',
        '25.0.3',
        '__RSM_CONTAINERS__',
        `${containers.filter((row) => row.State === 'running').length}`,
        '',
      ].join('\n'),
    );
  }
  if (command.includes('rm -rf --')) {
    const target = command.split("'")[1];
    if (target) {
      const resolved = resolveFsPath(vfs, target);
      vfs.dirs.delete(resolved);
      vfs.files.delete(resolved);
      for (const key of [...vfs.dirs]) if (key.startsWith(`${resolved}/`)) vfs.dirs.delete(key);
      for (const key of [...vfs.files.keys()]) if (key.startsWith(`${resolved}/`)) vfs.files.delete(key);
    }
    return output('');
  }
  return output('mock exec ok\n');
}

async function startServer(vfs) {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const hostKey = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const server = new Server({ hostKeys: [hostKey] }, (client) => {
    client.on('authentication', (ctx) => {
      if (ctx.method === 'password' && ctx.username === 'tester' && ctx.password === 'secret') ctx.accept();
      else if (ctx.method === 'publickey') ctx.reject(['password']);
      else ctx.reject(['password']);
    });
    client.on('ready', () => {});
    client.on('session', (accept) => {
      const session = accept();
      session.on('exec', (acceptExec, _reject, info) => {
        const stream = acceptExec();
        execHandler(info.command, stream, vfs);
      });
      session.on('sftp', (acceptSftp) => {
        const sftp = acceptSftp();
        setupSftp(vfs, sftp);
      });
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
  return server;
}

async function main() {
  const vfs = createFs();
  const server = await startServer(vfs);
  const port = server.address().port;
  const temp = await mkdtemp(path.join(os.tmpdir(), 'rsm-test-'));
  const dataDir = path.join(temp, 'data');
  const store = new ServerStore(dataDir);
  const secrets = new Map();
  const credentials = {
    async set(ref, value) {
      secrets.set(String(ref), String(value));
    },
    async unset(ref) {
      secrets.delete(String(ref));
    },
    async resolve(ref) {
      const value = secrets.get(String(ref));
      return value === undefined ? undefined : { value, source: 'test' };
    },
    async describe(ref) {
      return { configured: secrets.has(String(ref)), writable: true };
    },
  };
  const manager = new RemoteManager({ store, credentials, logger: { warn: console.warn } });
  await manager.init();
  const serverRecord = await manager.saveServer(
    undefined,
    {
      name: 'mock-linux',
      host: '127.0.0.1',
      port,
      username: 'tester',
      authType: 'password',
      dockerCommand: 'docker',
      defaultPath: '/home/tester',
    },
    { password: 'secret' },
  );
  const results = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(`ASSERT: ${message}`);
    results.push(message);
  };
  const assertRejects = async (fn, pattern, message) => {
    let error;
    try {
      await fn();
    } catch (failure) {
      error = failure;
    }
    assert(error && pattern.test(error.message), message);
  };

  const test = await manager.testConnection(serverRecord.id);
  assert(test.ok && test.dockerVersion === '25.0.3', 'testConnection reports Docker version');
  assert(test.fingerprint.length > 10, 'host fingerprint was captured');

  const servers = await manager.listServers();
  assert(servers[0].secret.password === true, 'secret status is exposed without the secret');
  assert(servers[0].connected === true, 'server reports connected');

  const listing = await manager.listFiles(serverRecord.id, '/home/tester');
  assert(listing.path === '/home/tester', 'listFiles resolves the directory');
  assert(listing.entries.some((entry) => entry.name === 'notes.txt'), 'listFiles returns files');
  assert(listing.entries.some((entry) => entry.name === 'projects' && entry.type === 'dir'), 'listFiles marks directories');

  const read = await manager.readFile(serverRecord.id, '/home/tester/notes.txt');
  assert(read.content.includes('hello from mock server') && read.binary === false, 'readFile returns text');

  const write = await manager.writeFile(serverRecord.id, {
    path: '/home/tester/notes.txt',
    content: 'updated\n',
    encoding: 'utf8',
    expectedMtime: read.mtime,
  });
  assert(write.size === 8, 'writeFile writes bytes');
  const reread = await manager.readFile(serverRecord.id, '/home/tester/notes.txt');
  assert(reread.content === 'updated\n', 'writeFile content is readable');

  const made = await manager.mkdir(serverRecord.id, { parent: '/home/tester', name: 'new-dir' });
  assert(made.path === '/home/tester/new-dir', 'mkdir creates a folder');
  const renamed = await manager.rename(serverRecord.id, { path: '/home/tester/new-dir', name: 'renamed-dir' });
  assert(renamed.path === '/home/tester/renamed-dir', 'rename moves a folder');
  await manager.deleteEntry(serverRecord.id, { path: '/home/tester/renamed-dir', recursive: true });
  const afterDelete = await manager.listFiles(serverRecord.id, '/home/tester');
  assert(!afterDelete.entries.some((entry) => entry.name === 'renamed-dir'), 'recursive delete removes folder');

  const upload = await manager.uploadFile(serverRecord.id, {
    parent: '/home/tester',
    name: 'upload.txt',
    contentBase64: Buffer.from('uploaded').toString('base64'),
  });
  assert(upload.size === 8, 'uploadFile writes a file');

  const firstPage = await manager.containers(serverRecord.id, { page: 1, pageSize: 50, sort: 'name' });
  assert(firstPage.total === 320, 'container total counts all containers');
  assert(firstPage.items.length === 50, 'container page size is respected');
  assert(firstPage.totalPages === 7, 'container pagination total pages');
  assert(firstPage.summary.projects.length === 7, 'compose projects are grouped');
  const filtered = await manager.containers(serverRecord.id, { q: 'standalone', page: 1, pageSize: 10 });
  assert(filtered.total === Math.ceil(320 / 3), 'search filters container names');
  const exited = await manager.containers(serverRecord.id, { state: 'stopped', page: 1, pageSize: 200 });
  assert(exited.items.every((item) => item.state === 'exited'), 'state filter returns only stopped containers');
  const paged = await manager.containers(serverRecord.id, { page: 2, pageSize: 20, project: 'stack-1' });
  assert(paged.page === 2 && paged.items.length > 0, 'project filter paginates');

  const imagePage = await manager.images(serverRecord.id, { page: 1, pageSize: 25, sort: 'name' });
  assert(imagePage.total === 60, 'image total counts unique image ids');
  assert(imagePage.summary.tagged === 51 && imagePage.summary.dangling === 9, 'image summary separates tagged and dangling');
  const imageAll = await manager.images(serverRecord.id, { page: 1, pageSize: 200 });
  assert(imageAll.items.some((image) => image.repoTags.length > 1), 'multiple tags are grouped under one image id');
  const danglingOnly = await manager.images(serverRecord.id, { dangling: 'dangling', page: 1, pageSize: 200 });
  assert(danglingOnly.total === 9 && danglingOnly.items.every((image) => image.dangling), 'dangling image filter works');
  const imageSearch = await manager.images(serverRecord.id, { q: 'extra-3', page: 1, pageSize: 50 });
  assert(imageSearch.total === 1 && imageSearch.items[0].repoTags.some((ref) => ref.endsWith(':extra-3')), 'image search matches secondary tags');
  const imageSorted = await manager.images(serverRecord.id, { sort: 'size', page: 1, pageSize: 200 });
  assert(imageSorted.items.every((image, index, list) => index === 0 || list[index - 1].sizeBytes >= image.sizeBytes), 'image size sort is descending');

  const firewall = await manager.firewall(serverRecord.id, { refresh: '1' });
  assert(firewall.backend === 'firewalld' && firewall.active, 'firewall detects active firewalld');
  assert(firewall.zone === 'public' && firewall.rules.some((rule) => rule.kind === 'port' && rule.port === 8080), 'firewall parses zone and port rules');
  assert(firewall.rules.some((rule) => rule.kind === 'service' && rule.service === 'ssh'), 'firewall parses service rules');
  assert(firewall.rules.find((rule) => rule.service === 'ssh')?.sshProtected, 'firewall protects the SSH service rule');
  assert(firewall.canManage, 'firewall reports manage capability with sudo');
  const opened = await manager.firewallAction(serverRecord.id, { action: 'open_port', port: 9091, protocol: 'tcp' });
  assert(opened.ok && opened.firewall.backend === 'firewalld', 'firewall opens a port and returns refreshed state');
  assert(firewallLog.some((command) => command.includes('--add-port=') && command.includes('9091/tcp')), 'firewall invokes firewalld add-port');
  await assertRejects(
    () => manager.firewallAction(serverRecord.id, { action: 'close_port', port: 22, protocol: 'tcp' }),
    /SSH port/,
    'firewall refuses to close the SSH port',
  );

  const programs = await manager.programs(serverRecord.id, { refresh: '1' });
  const node = programs.items.find((item) => item.id === 'node');
  const compose = programs.items.find((item) => item.id === 'docker-compose');
  assert(node.status === 'installed' && node.version === '20.11.1', 'program detection reads Node.js version');
  assert(compose.status === 'missing', 'program detection treats a failing docker compose probe as missing');
  assert(programs.summary.installed === 4, 'program summary counts installed tools');
  const lastInstalled = programs.items.map((item) => item.status).lastIndexOf('installed');
  const firstMissing = programs.items.findIndex((item) => item.status === 'missing');
  assert(lastInstalled >= 0 && firstMissing > lastInstalled, 'program detection lists installed tools before missing tools');
  const cachedPrograms = await manager.programs(serverRecord.id);
  assert(cachedPrograms.cached === true, 'program detection reuses the backend cache');
  const jq = programs.items.find((item) => item.id === 'jq');
  const git = programs.items.find((item) => item.id === 'git');
  assert(jq.canInstall && jq.latestVersion === '1.6', 'program detection exposes installable apt packages');
  assert(git.canUpgrade && git.latestVersion === '2.44.0', 'program detection exposes upgradeable apt packages');
  await manager.programAction(serverRecord.id, { action: 'install', id: 'jq' });
  assert(packageLog.some((command) => command.includes('apt-get install') && command.includes("'jq'")), 'program action installs a package through apt');
  await manager.programAction(serverRecord.id, { action: 'upgrade', id: 'git' });
  assert(packageLog.some((command) => command.includes('--only-upgrade') && command.includes("'git'")), 'program action upgrades a package through apt');

  const aptSources = await manager.aptSources(serverRecord.id);
  assert(aptSources.supported && aptSources.distro.id === 'ubuntu', 'apt source inspection detects Ubuntu');
  assert(aptSources.origins.length === 2 && aptSources.canManage, 'apt source inspection lists origins and management capability');
  assert(aptSources.currentMirrorId === 'official', 'apt source inspection ignores third-party hosts when detecting the mirror');
  const switchedSources = await manager.aptSourcesAction(serverRecord.id, { action: 'switch', mirror: 'aliyun' });
  assert(switchedSources.changedFiles.length === 2, 'apt source switch rewrites distro source files');
  assert(switchedSources.backup.startsWith('/etc/apt/rsm-backup-'), 'apt source switch creates a backup path');
  assert(aptLog.some((command) => command.includes('base64 -d') && command.includes('apt-get update')), 'apt source switch writes sources and runs apt-get update');
  const switchCommand = aptLog.find((command) => command.includes('__RSM_APT_SWITCH_OK__'));
  const rewritten = [...switchCommand.matchAll(/printf '%s' '([^']+)' \| base64 -d/g)]
    .map((match) => Buffer.from(match[1], 'base64').toString('utf8'))
    .join('\n');
  assert(rewritten.includes('mirrors.aliyun.com/ubuntu'), 'apt source switch writes the selected mirror origin');
  assert(!rewritten.includes('docker-ce'), 'apt source switch leaves third-party source files unchanged');
  await manager.aptSourcesAction(serverRecord.id, { action: 'update' });
  assert(aptLog.some((command) => command.trim().includes('apt-get update')), 'apt source update refreshes the package index');

  const dockerSources = await manager.dockerSources(serverRecord.id);
  assert(dockerSources.valid && dockerSources.mirrors[0] === 'https://docker.m.daocloud.io', 'docker source inspection reads daemon.json mirrors');
  const savedDockerSources = await manager.dockerSourcesAction(serverRecord.id, {
    action: 'save',
    mirrors: ['https://docker.1panel.live', 'https://docker.m.daocloud.io'],
  });
  assert(savedDockerSources.mirrors.length === 2, 'docker source save accepts mirror URLs');
  assert(savedDockerSources.backup.startsWith('/etc/docker/rsm-backup-'), 'docker source save creates a backup');
  assert(dockerSourceLog.some((command) => command.includes('systemctl restart docker')), 'docker source save restarts the Docker daemon');

  firewallMode = 'ufw';
  const ufw = await manager.firewall(serverRecord.id, { refresh: '1' });
  assert(ufw.backend === 'ufw' && ufw.active && ufw.rules.length === 2, 'firewall detects and parses ufw rules');
  assert(ufw.capabilities.enable, 'firewall exposes ufw enable capability');
  await manager.firewallAction(serverRecord.id, { action: 'delete_rule', id: 'ufw:2' });
  assert(firewallLog.some((command) => command.includes('ufw --force delete 2')), 'firewall deletes a ufw rule');
  await assertRejects(
    () => manager.firewallAction(serverRecord.id, { action: 'delete_rule', id: 'ufw:1' }),
    /SSH rule/,
    'firewall protects the SSH rule in ufw',
  );
  firewallMode = 'ufwInactive';
  const inactiveUfw = await manager.firewall(serverRecord.id, { refresh: '1' });
  assert(!inactiveUfw.active && inactiveUfw.capabilities.enable, 'firewall reports inactive ufw as enable-capable');
  assert(inactiveUfw.rules.some((rule) => rule.staged && rule.target === '22/tcp'), 'firewall shows staged ufw rules while inactive');
  await manager.firewallAction(serverRecord.id, { action: 'enable' });
  assert(firewallLog.some((command) => command.includes(`ufw allow '${serverRecord.port}/tcp'`)), 'firewall allows SSH before enabling ufw');
  assert(firewallLog.some((command) => command.includes('ufw --force enable')), 'firewall enables ufw');
  firewallMode = 'firewalld';

  const action = await manager.containerAction(serverRecord.id, { action: 'restart', ids: [firstPage.items[0].id, firstPage.items[1].id] });
  assert(action.succeeded === 2 && action.failed === 0, 'batch restart succeeds');
  assert(actionLog.length === 2, 'docker restart was invoked twice');

  const inspect = await manager.inspectContainer(serverRecord.id, firstPage.items[0].id);
  assert(inspect.name === 'mock-container' && inspect.ports.length === 1, 'inspect returns normalized details');

  const overview = await manager.overview(serverRecord.id);
  assert(overview.dockerVersion === '25.0.3' && overview.os.includes('Linux'), 'overview parses host sections');
  assert(overview.runningContainers > 0, 'overview counts running containers');

  // The second connection must reuse the cached connection; no auth failure should occur.
  const again = await manager.testConnection(serverRecord.id);
  assert(again.ok, 'reconnect/reuse succeeds');

  manager.dispose();
  await rm(temp, { recursive: true, force: true });
  console.log(`PASS ${results.length} checks`);
  for (const line of results) console.log(`  - ${line}`);
  server.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('FAIL', error);
  process.exit(1);
});

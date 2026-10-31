import ssh2 from 'ssh2';
import path from 'node:path';
import { posix } from 'node:path';
import {
  AppError,
  assertContainerId,
  assertDockerCommand,
  cleanString,
  clampInt,
  shellQuote,
} from './util.js';
import { credentialRefs } from './store.js';

const { Client } = ssh2;

const CONNECT_TIMEOUT_MS = 15_000;
const EXEC_TIMEOUT_MS = 30_000;
const ACTION_TIMEOUT_MS = 90_000;
const CONTAINERS_TTL_MS = 4_000;
const IMAGES_TTL_MS = 4_000;
const FIREWALL_TTL_MS = 5_000;
const PROGRAMS_TTL_MS = 30_000;
const IDLE_CLOSE_MS = 5 * 60_000;
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;
const MAX_EXEC_BYTES = 24 * 1024 * 1024;
const MAX_ACTIVITY = 120;

function naturalCompare(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function lower(value) {
  return String(value ?? '').toLowerCase();
}

function normalizeState(state) {
  return lower(state) || 'unknown';
}

function parseLabels(text) {
  const labels = {};
  if (typeof text !== 'string' || text.length === 0) return labels;
  for (const pair of text.split(',')) {
    const index = pair.indexOf('=');
    if (index <= 0) continue;
    const key = pair.slice(0, index).trim();
    if (!key) continue;
    labels[key] = pair.slice(index + 1);
  }
  return labels;
}

function parseContainerLine(line) {
  const raw = JSON.parse(line);
  if (!raw || typeof raw !== 'object') return undefined;
  const labels = parseLabels(raw.Labels);
  const project = labels['com.docker.compose.project'] || '';
  const service = labels['com.docker.compose.service'] || '';
  const id = cleanString(raw.ID, 128);
  const name = cleanString(raw.Names, 256);
  if (!id || !name) return undefined;
  return {
    id,
    name,
    image: cleanString(raw.Image, 512),
    command: cleanString(raw.Command, 1024),
    createdAt: cleanString(raw.CreatedAt, 128),
    runningFor: cleanString(raw.RunningFor, 128),
    ports: cleanString(raw.Ports, 1024),
    state: normalizeState(raw.State),
    status: cleanString(raw.Status, 256),
    size: cleanString(raw.Size, 64),
    networks: cleanString(raw.Networks, 512),
    mounts: cleanString(raw.Mounts, 1024),
    labels,
    project,
    service,
    compose: project.length > 0,
  };
}

function stateBucket(state) {
  if (state === 'running') return 'running';
  if (state === 'paused') return 'paused';
  if (state === 'exited' || state === 'created' || state === 'dead') return 'stopped';
  return 'other';
}

function sortContainers(items, sort) {
  const list = [...items];
  if (sort === 'state') {
    const rank = { running: 0, restarting: 1, paused: 2, created: 3, exited: 4, dead: 5 };
    list.sort((a, b) => (rank[a.state] ?? 9) - (rank[b.state] ?? 9) || naturalCompare(a.name, b.name));
  } else if (sort === 'project') {
    list.sort(
      (a, b) =>
        naturalCompare(a.project || '~', b.project || '~') || naturalCompare(a.name, b.name),
    );
  } else if (sort === 'image') {
    list.sort((a, b) => naturalCompare(a.image, b.image) || naturalCompare(a.name, b.name));
  } else {
    list.sort((a, b) => naturalCompare(a.name, b.name));
  }
  return list;
}

function parseDockerSize(value) {
  const match = /^\s*([\d.]+)\s*([kKmMgGtTpP]?)(?:i?B)\s*$/.exec(String(value || ''));
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  const unit = (match[2] || '').toUpperCase();
  const multiplier = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4, P: 1024 ** 5 }[unit] || 1;
  return Math.round(amount * multiplier);
}

function parseImageLine(line) {
  const raw = JSON.parse(line);
  if (!raw || typeof raw !== 'object') return undefined;
  const id = cleanString(raw.ID, 128);
  if (!id) return undefined;
  const repository = cleanString(raw.Repository, 512) || '<none>';
  const tag = cleanString(raw.Tag, 128) || '<none>';
  return {
    id,
    repository,
    tag,
    dangling: repository === '<none>' && tag === '<none>',
    size: cleanString(raw.Size, 64),
    sizeBytes: parseDockerSize(raw.Size),
    createdAt: cleanString(raw.CreatedAt, 128),
    createdSince: cleanString(raw.CreatedSince, 128),
    digest: cleanString(raw.Digest, 256) === '<none>' ? '' : cleanString(raw.Digest, 256),
  };
}

function sortImages(items, sort) {
  const list = [...items];
  const label = (item) => item.repoTags[0] || item.id;
  if (sort === 'size') {
    list.sort((a, b) => b.sizeBytes - a.sizeBytes || naturalCompare(label(a), label(b)));
  } else if (sort === 'created') {
    list.sort((a, b) => naturalCompare(b.createdAt, a.createdAt) || naturalCompare(label(a), label(b)));
  } else if (sort === 'id') {
    list.sort((a, b) => naturalCompare(a.id, b.id));
  } else {
    list.sort((a, b) => naturalCompare(label(a), label(b)));
  }
  return list;
}

function splitFirewallSections(text) {
  const sections = new Map();
  let current = '';
  for (const line of String(text || '').split(/\r?\n/)) {
    const marker = /^__RSM_FW_([A-Z_]+)__$/.exec(line.trim());
    if (marker) {
      current = marker[1];
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  const read = (key) => (sections.get(key) || []).join('\n').trim();
  return { read };
}

function extractPorts(value) {
  const ports = [];
  for (const match of String(value || '').matchAll(/\b(\d{1,5})(?:\/(?:tcp|udp|sctp|dccp))?\b/gi)) {
    const port = Number(match[1]);
    if (port >= 1 && port <= 65535) ports.push(port);
  }
  return [...new Set(ports)];
}

function ruleTargetsSsh(rule, sshPort) {
  const text = `${rule.target || ''} ${rule.service || ''}`.toLowerCase();
  if (/\bssh\b|openssh/.test(text)) return true;
  return extractPorts(rule.target).some((port) => port === 22 || port === Number(sshPort));
}

function parseFirewalldRules(text, zone, manage, sshPort) {
  const fields = new Map();
  let current = '';
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = /^\s{2}([a-z][a-z -]*):\s*(.*)$/i.exec(line);
    if (match) {
      current = match[1].trim().toLowerCase();
      fields.set(current, match[2].trim());
    } else if (current && /^\s+/.test(line) && line.trim()) {
      fields.set(current, `${fields.get(current) || ''} ${line.trim()}`.trim());
    }
  }
  const rules = [];
  for (const port of (fields.get('ports') || '').split(/\s+/).filter(Boolean)) {
    const [number, protocol = 'tcp'] = port.split('/');
    const rule = {
      id: `fw:port:${port}`,
      kind: 'port',
      target: port,
      port: Number(number),
      protocol,
      zone,
      action: 'allow',
      permanent: true,
      canDelete: manage,
    };
    rule.sshProtected = ruleTargetsSsh(rule, sshPort);
    if (rule.sshProtected) rule.canDelete = false;
    rules.push(rule);
  }
  for (const service of (fields.get('services') || '').split(/\s+/).filter(Boolean)) {
    const rule = {
      id: `fw:service:${service}`,
      kind: 'service',
      target: service,
      service,
      zone,
      action: 'allow',
      permanent: true,
      canDelete: manage,
    };
    rule.sshProtected = ruleTargetsSsh(rule, sshPort);
    if (rule.sshProtected) rule.canDelete = false;
    rules.push(rule);
  }
  for (const source of (fields.get('sources') || '').split(/\s+/).filter(Boolean)) {
    rules.push({
      id: `fw:source:${source}`,
      kind: 'source',
      target: source,
      source,
      zone,
      action: 'allow',
      permanent: true,
      canDelete: false,
    });
  }
  const rich = String(text || '')
    .split(/\r?\n/)
    .filter((line) => /^\s+rule\s/.test(line))
    .map((line) => line.trim());
  rich.forEach((rule, index) => {
    rules.push({
      id: `fw:rich:${index}`,
      kind: 'rich',
      target: rule,
      zone,
      action: 'allow',
      permanent: true,
      canDelete: false,
    });
  });
  return rules;
}

function parseUfwRules(verbose, numbered, added, manage, sshPort) {
  const statusLine = /^Status:\s*(.+)$/im.exec(verbose)?.[1]?.trim() || '';
  const active = /^active$/i.test(statusLine);
  const defaultPolicy = /^Default:\s*(.+)$/im.exec(verbose)?.[1]?.trim() || '';
  const rules = [];
  for (const line of String(numbered || '').split(/\r?\n/)) {
    const match = /^\[\s*(\d+)\]\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const parts = match[2].trim().split(/\s{2,}/);
    if (parts.length < 2) continue;
    const target = parts[0].trim();
    const action = parts[1].trim();
    const source = (parts[2] || '').trim();
    const portMatch = /^([\d,]+)(?:\/(tcp|udp|sctp|dccp))?$/i.exec(target);
    const ports = portMatch ? portMatch[1].split(',').map(Number) : extractPorts(target);
    const rule = {
      id: `ufw:${match[1]}`,
      kind: 'ufw',
      target,
      action,
      direction: /\bOUT\b/i.test(action) ? 'out' : 'in',
      source,
      ports,
      port: ports[0] || undefined,
      protocol: portMatch?.[2]?.toLowerCase() || '',
      raw: match[2].trim(),
      canDelete: manage,
    };
    if (rule.canDelete && ruleTargetsSsh(rule, sshPort)) rule.canDelete = false;
    rule.sshProtected = ruleTargetsSsh(rule, sshPort);
    rules.push(rule);
  }
  if (rules.length === 0) {
    let index = 0;
    for (const line of String(added || '').split(/\r?\n/)) {
      const match = /^ufw\s+(allow|deny|reject|limit)\s+(.+)$/i.exec(line.trim());
      if (!match) continue;
      const target = match[2].trim();
      const first = target.split(/\s+/)[0] || '';
      const ports = extractPorts(first);
      const rule = {
        id: `ufw-added:${index++}`,
        kind: 'ufw',
        target,
        action: match[1].toUpperCase(),
        source: '',
        ports,
        port: ports[0] || undefined,
        raw: line.trim(),
        staged: true,
        canDelete: false,
      };
      rule.sshProtected = ruleTargetsSsh(rule, sshPort);
      rules.push(rule);
    }
  }
  return { active, statusLine, defaultPolicy, rules };
}

function normalizeProgramVersion(value) {
  const text = String(value || '').replace(/\r/g, '');
  const match = /\bv?(\d+(?:\.\d+){1,3})\b/.exec(text);
  return match ? match[1] : '';
}

const PROGRAM_CHECKS = [
  { id: 'node', label: 'Node.js', category: 'runtime', command: 'node', args: ['--version'] },
  { id: 'npm', label: 'npm', category: 'runtime', command: 'npm', args: ['--version'] },
  { id: 'pnpm', label: 'pnpm', category: 'runtime', command: 'pnpm', args: ['--version'] },
  { id: 'yarn', label: 'Yarn', category: 'runtime', command: 'yarn', args: ['--version'] },
  { id: 'bun', label: 'Bun', category: 'runtime', command: 'bun', args: ['--version'] },
  { id: 'deno', label: 'Deno', category: 'runtime', command: 'deno', args: ['--version'] },
  { id: 'python', label: 'Python', category: 'runtime', command: 'python', args: ['--version'] },
  { id: 'python3', label: 'Python 3', category: 'runtime', command: 'python3', args: ['--version'] },
  { id: 'pip', label: 'pip', category: 'runtime', command: 'pip', args: ['--version'] },
  { id: 'pip3', label: 'pip 3', category: 'runtime', command: 'pip3', args: ['--version'] },
  { id: 'java', label: 'Java', category: 'runtime', command: 'java', args: ['-version'] },
  { id: 'javac', label: 'javac', category: 'build', command: 'javac', args: ['-version'] },
  { id: 'go', label: 'Go', category: 'runtime', command: 'go', args: ['version'] },
  { id: 'rustc', label: 'Rust', category: 'runtime', command: 'rustc', args: ['--version'] },
  { id: 'cargo', label: 'Cargo', category: 'build', command: 'cargo', args: ['--version'] },
  { id: 'dotnet', label: '.NET', category: 'runtime', command: 'dotnet', args: ['--version'] },
  { id: 'php', label: 'PHP', category: 'runtime', command: 'php', args: ['--version'] },
  { id: 'composer', label: 'Composer', category: 'build', command: 'composer', args: ['--version'] },
  { id: 'ruby', label: 'Ruby', category: 'runtime', command: 'ruby', args: ['--version'] },
  { id: 'perl', label: 'Perl', category: 'runtime', command: 'perl', args: ['--version'] },
  { id: 'git', label: 'Git', category: 'vcs', command: 'git', args: ['--version'] },
  { id: 'gcc', label: 'GCC', category: 'build', command: 'gcc', args: ['--version'] },
  { id: 'g++', label: 'G++', category: 'build', command: 'g++', args: ['--version'] },
  { id: 'make', label: 'GNU Make', category: 'build', command: 'make', args: ['--version'] },
  { id: 'cmake', label: 'CMake', category: 'build', command: 'cmake', args: ['--version'] },
  { id: 'mvn', label: 'Maven', category: 'build', command: 'mvn', args: ['-version'] },
  { id: 'gradle', label: 'Gradle', category: 'build', command: 'gradle', args: ['--version'] },
  { id: 'docker', label: 'Docker', category: 'container', command: 'docker', args: ['--version'] },
  { id: 'docker-compose', label: 'Docker Compose', category: 'container', command: 'docker', args: ['compose', 'version'] },
  { id: 'podman', label: 'Podman', category: 'container', command: 'podman', args: ['--version'] },
  { id: 'kubectl', label: 'kubectl', category: 'orchestration', command: 'kubectl', args: ['version', '--client'] },
  { id: 'helm', label: 'Helm', category: 'orchestration', command: 'helm', args: ['version', '--short'] },
  { id: 'k3s', label: 'K3s', category: 'orchestration', command: 'k3s', args: ['--version'] },
  { id: 'ansible', label: 'Ansible', category: 'devops', command: 'ansible', args: ['--version'] },
  { id: 'terraform', label: 'Terraform', category: 'devops', command: 'terraform', args: ['version'] },
  { id: 'jenkins', label: 'Jenkins', category: 'devops', command: 'jenkins', args: ['--version'] },
  { id: 'pm2', label: 'PM2', category: 'devops', command: 'pm2', args: ['--version'] },
  { id: 'supervisord', label: 'Supervisor', category: 'devops', command: 'supervisord', args: ['--version'] },
  { id: 'nginx', label: 'Nginx', category: 'web', command: 'nginx', args: ['-v'] },
  { id: 'caddy', label: 'Caddy', category: 'web', command: 'caddy', args: ['version'] },
  { id: 'haproxy', label: 'HAProxy', category: 'web', command: 'haproxy', args: ['-v'] },
  { id: 'redis-server', label: 'Redis', category: 'database', command: 'redis-server', args: ['--version'] },
  { id: 'mysqld', label: 'MySQL', category: 'database', command: 'mysqld', args: ['--version'] },
  { id: 'psql', label: 'PostgreSQL', category: 'database', command: 'psql', args: ['--version'] },
  { id: 'mongod', label: 'MongoDB', category: 'database', command: 'mongod', args: ['--version'] },
  { id: 'curl', label: 'curl', category: 'tool', command: 'curl', args: ['--version'] },
  { id: 'wget', label: 'Wget', category: 'tool', command: 'wget', args: ['--version'] },
  { id: 'jq', label: 'jq', category: 'tool', command: 'jq', args: ['--version'] },
];

const APT_PACKAGES = {
  node: 'nodejs',
  npm: 'npm',
  python3: 'python3',
  pip: 'python3-pip',
  pip3: 'python3-pip',
  go: 'golang-go',
  rustc: 'rustc',
  cargo: 'cargo',
  php: 'php-cli',
  composer: 'composer',
  ruby: 'ruby',
  perl: 'perl',
  git: 'git',
  gcc: 'gcc',
  'g++': 'g++',
  make: 'make',
  cmake: 'cmake',
  mvn: 'maven',
  gradle: 'gradle',
  podman: 'podman',
  ansible: 'ansible',
  supervisord: 'supervisor',
  nginx: 'nginx',
  haproxy: 'haproxy',
  'redis-server': 'redis-server',
  psql: 'postgresql-client',
  curl: 'curl',
  wget: 'wget',
  jq: 'jq',
};

function versionParts(value) {
  return String(value || '')
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((part) => Number(part));
}

function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const x = a[index] ?? 0;
    const y = b[index] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

const APT_MIRRORS = {
  ubuntu: [
    { id: 'official', label: 'Ubuntu official', base: 'http://archive.ubuntu.com/ubuntu' },
    { id: 'aliyun', label: 'Aliyun', base: 'https://mirrors.aliyun.com/ubuntu' },
    { id: 'tuna', label: 'Tsinghua TUNA', base: 'https://mirrors.tuna.tsinghua.edu.cn/ubuntu' },
    { id: 'ustc', label: 'USTC', base: 'https://mirrors.ustc.edu.cn/ubuntu' },
    { id: 'huawei', label: 'Huawei Cloud', base: 'https://repo.huaweicloud.com/ubuntu' },
    { id: 'netease', label: 'NetEase', base: 'https://mirrors.163.com/ubuntu' },
  ],
  debian: [
    { id: 'official', label: 'Debian official', base: 'http://deb.debian.org/debian' },
    { id: 'aliyun', label: 'Aliyun', base: 'https://mirrors.aliyun.com/debian' },
    { id: 'tuna', label: 'Tsinghua TUNA', base: 'https://mirrors.tuna.tsinghua.edu.cn/debian' },
    { id: 'ustc', label: 'USTC', base: 'https://mirrors.ustc.edu.cn/debian' },
    { id: 'huawei', label: 'Huawei Cloud', base: 'https://repo.huaweicloud.com/debian' },
    { id: 'netease', label: 'NetEase', base: 'https://mirrors.163.com/debian' },
  ],
};

const APT_SOURCE_SCRIPT = [
  'set +e',
  'uid=$(id -u 2>/dev/null)',
  'if [ "$uid" = "0" ]; then sudo=root; elif sudo -n true 2>/dev/null; then sudo=available; else sudo=unavailable; fi',
  'if [ "$sudo" = "root" ]; then SUDO=""; elif [ "$sudo" = "available" ]; then SUDO="sudo -n "; else SUDO=""; fi',
  'apt=no; command -v apt-get >/dev/null 2>&1 && apt=yes',
  '. /etc/os-release 2>/dev/null || true',
  'codename=${VERSION_CODENAME:-${UBUNTU_CODENAME:-}}',
  'arch=$(dpkg --print-architecture 2>/dev/null || uname -m)',
  'printf "__RSM_APT_META__\\n"',
  'printf "id=%s\\ncodename=%s\\nversion=%s\\narch=%s\\nsudo=%s\\napt=%s\\n" "$ID" "$codename" "$VERSION_ID" "$arch" "$sudo" "$apt"',
  'for f in /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; do',
  '  [ -f "$f" ] || continue',
  '  printf "__RSM_APT_FILE__%s\\n" "$f"',
  '  $SUDO cat "$f" 2>/dev/null || true',
  'done',
].join('\n');

function parseAptSourceState(text) {
  const meta = { id: '', codename: '', version: '', arch: '', sudo: 'unavailable', apt: 'no' };
  const metaText = String(text || '').split('__RSM_APT_FILE__')[0];
  for (const line of metaText.split(/\r?\n/)) {
    const pair = /^(id|codename|version|arch|sudo|apt)=(.*)$/.exec(line);
    if (pair) meta[pair[1]] = pair[2].trim();
  }
  const files = [];
  let current = null;
  for (const line of String(text || '').split(/\r?\n/)) {
    const file = /^__RSM_APT_FILE__(.+)$/.exec(line);
    if (file) {
      current = { path: file[1].trim(), content: '' };
      files.push(current);
      continue;
    }
    if (line === '__RSM_APT_META__') continue;
    if (current) current.content += `${line}\n`;
  }
  const entries = [];
  for (const file of files) {
    if (file.path.endsWith('.sources')) {
      for (const block of file.content.split(/\n\s*\n/)) {
        const fields = {};
        for (const line of block.split(/\r?\n/)) {
          const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
          if (pair) fields[pair[1].toLowerCase()] = pair[2].trim();
        }
        if (!fields.uris) continue;
        for (const uri of fields.uris.split(/\s+/).filter(Boolean)) {
          entries.push({
            file: file.path,
            type: fields.types || 'deb',
            url: uri,
            suite: fields.suites || '',
            components: fields.components || '',
            enabled: !/^(no|false|0)$/i.test(fields.enabled || 'yes'),
          });
        }
      }
    } else {
      for (const line of file.content.split(/\r?\n/)) {
        const match = /^\s*(deb(?:-src)?)\s+(?:\[[^\]]*\]\s+)?(\S+)\s+(\S+)(?:\s+(.*))?$/.exec(line);
        if (!match) continue;
        entries.push({
          file: file.path,
          type: match[1],
          url: match[2],
          suite: match[3],
          components: (match[4] || '').trim(),
          enabled: true,
        });
      }
    }
  }
  const origins = [
    ...new Set(
      entries
        .filter((entry) => entry.enabled && isDistroRepoUrl(entry.url, meta.id))
        .map((entry) => entry.url),
    ),
  ];
  const mirrors = APT_MIRRORS[meta.id] || [];
  const currentMirror = mirrors.find((mirror) => {
    try {
      const mirrorHost = new URL(mirror.base).host;
      return origins.some((origin) => {
        const host = new URL(origin).host;
        if (mirror.id !== 'official') return host === mirrorHost;
        return meta.id === 'ubuntu' ? /(^|\.)ubuntu\.com$/i.test(host) : /(^|\.)debian\.org$/i.test(host);
      });
    } catch {
      return false;
    }
  });
  const canManage = meta.apt === 'yes' && (meta.sudo === 'root' || meta.sudo === 'available');
  return {
    supported: meta.apt === 'yes',
    distro: { id: meta.id, codename: meta.codename, version: meta.version, arch: meta.arch },
    sudo: meta.sudo,
    canManage,
    files: files.map((file) => file.path),
    entries,
    origins,
    mirrors,
    currentMirrorId: currentMirror?.id || '',
    fetchedAt: Date.now(),
    rawFiles: files,
  };
}

function isDistroRepoUrl(raw, distro) {
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol)) return false;
    if (distro === 'ubuntu') return /^\/(ubuntu|ubuntu-ports)(\/|$)/.test(url.pathname);
    if (distro === 'debian') return /^\/(debian|debian-security)(\/|$)/.test(url.pathname);
    return false;
  } catch {
    return false;
  }
}

function officialAptBase(distro, security, pathname) {
  if (distro === 'ubuntu') {
    if (/ubuntu-ports/.test(pathname)) return 'http://ports.ubuntu.com/ubuntu-ports';
    return security ? 'http://security.ubuntu.com/ubuntu' : 'http://archive.ubuntu.com/ubuntu';
  }
  return security ? 'http://security.debian.org/debian-security' : 'http://deb.debian.org/debian';
}

function rewriteAptUrls(content, distro, mirror, security) {
  return String(content).replace(/https?:\/\/[^\s#]+/g, (raw) => {
    if (!isDistroRepoUrl(raw, distro)) return raw;
    try {
      const parsed = new URL(raw);
      const base = new URL(mirror.id === 'official' ? officialAptBase(distro, security, parsed.pathname) : mirror.base);
      parsed.protocol = base.protocol;
      parsed.host = base.host;
      return parsed.toString();
    } catch {
      return raw;
    }
  });
}

function rewriteAptSourceFile(file, distro, mirror) {
  if (file.path.endsWith('.sources')) {
    return String(file.content)
      .split(/\n\s*\n/)
      .map((block) => {
        const suites = (/\n?Suites:\s*([^\n]+)/i.exec(block)?.[1] || '')
          .split(/\s+/)
          .filter(Boolean);
        const security = suites.length > 0 && suites.every((suite) => /-security$/.test(suite));
        return rewriteAptUrls(block, distro, mirror, security);
      })
      .join('\n\n');
  }
  return String(file.content)
    .split(/\r?\n/)
    .map((line) => rewriteAptUrls(line, distro, mirror, /-security\b/.test(line) || /debian-security/.test(line)))
    .join('\n');
}

function normalizeMirrorUrl(value) {
  if (!value) throw new AppError('invalid_argument', 'A mirror URL is required', 400);
  if (String(value).length > 300) throw new AppError('invalid_argument', 'The mirror URL is too long', 400);
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    throw new AppError('invalid_argument', 'The mirror URL is invalid', 400);
  }
  if (!/^https?:$/.test(url.protocol)) throw new AppError('invalid_argument', 'The mirror URL must use http or https', 400);
  if (!url.hostname || url.username || url.password) throw new AppError('invalid_argument', 'The mirror URL must not contain credentials', 400);
  if (url.search || url.hash) throw new AppError('invalid_argument', 'The mirror URL must not contain a query or fragment', 400);
  return `${url.protocol}//${url.host}`;
}

function pickAptMirror(distro, input) {
  const id = cleanString(input?.mirror, 32);
  if (id === 'custom') {
    const origin = normalizeMirrorUrl(input?.customUrl);
    return { id: 'custom', label: 'Custom', base: origin };
  }
  const mirror = (APT_MIRRORS[distro] || []).find((item) => item.id === id);
  if (!mirror) throw new AppError('invalid_argument', 'Unknown mirror preset', 400);
  return mirror;
}

const DOCKER_MIRROR_PRESETS = [
  { id: 'daocloud', label: 'DaoCloud', url: 'https://docker.m.daocloud.io' },
  { id: '1panel', label: '1Panel', url: 'https://docker.1panel.live' },
  { id: 'ustc', label: 'USTC', url: 'https://docker.mirrors.ustc.edu.cn' },
];

const DOCKER_SOURCE_SCRIPT = (docker) => [
  'set +e',
  'uid=$(id -u 2>/dev/null)',
  'if [ "$uid" = "0" ]; then sudo=root; elif sudo -n true 2>/dev/null; then sudo=available; else sudo=unavailable; fi',
  'if [ "$sudo" = "root" ]; then SUDO=""; elif [ "$sudo" = "available" ]; then SUDO="sudo -n "; else SUDO=""; fi',
  'systemctl=no; command -v systemctl >/dev/null 2>&1 && systemctl=yes',
  'exists=no; [ -f /etc/docker/daemon.json ] && exists=yes',
  'printf "__RSM_DOCKER_SOURCE_META__\\n"',
  'printf "exists=%s\\nsudo=%s\\nsystemctl=%s\\n" "$exists" "$sudo" "$systemctl"',
  'if [ "$exists" = "yes" ]; then',
  '  printf "__RSM_DOCKER_DAEMON__"',
  '  $SUDO base64 -w0 /etc/docker/daemon.json 2>/dev/null',
  '  printf "\\n"',
  'else',
  '  printf "__RSM_DOCKER_DAEMON__\\n"',
  'fi',
  'printf "__RSM_DOCKER_ACTIVE__\\n"',
  `${docker} info --format '{{json .RegistryConfig.Mirrors}}' 2>/dev/null || true`,
].join('\n');

function normalizeDockerMirror(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new AppError('invalid_argument', 'A registry mirror URL is required', 400);
  if (raw.length > 300) throw new AppError('invalid_argument', 'The registry mirror URL is too long', 400);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError('invalid_argument', 'The registry mirror URL is invalid', 400);
  }
  if (url.protocol !== 'https:') throw new AppError('invalid_argument', 'A Docker registry mirror must use https', 400);
  if (!url.hostname || url.username || url.password) throw new AppError('invalid_argument', 'The mirror URL must not contain credentials', 400);
  if (url.search || url.hash) throw new AppError('invalid_argument', 'The mirror URL must not contain a query or fragment', 400);
  return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;
}

function parseDockerSources(text) {
  const meta = { exists: 'no', sudo: 'unavailable', systemctl: 'no' };
  const metaText = String(text || '').split('__RSM_DOCKER_DAEMON__')[0];
  for (const line of metaText.split(/\r?\n/)) {
    const pair = /^(exists|sudo|systemctl)=(.*)$/.exec(line);
    if (pair) meta[pair[1]] = pair[2].trim();
  }
  const configMatch = /__RSM_DOCKER_DAEMON__([^\n]*)\n/.exec(String(text || ''));
  const activeMatch = /__RSM_DOCKER_ACTIVE__\s*\n?([^\n]*)/.exec(String(text || ''));
  let config = {};
  let valid = true;
  let invalidReason = '';
  if (meta.exists === 'yes' && configMatch?.[1]) {
    try {
      config = JSON.parse(Buffer.from(configMatch[1], 'base64').toString('utf8'));
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        valid = false;
        invalidReason = 'daemon.json must contain a JSON object';
      }
    } catch {
      valid = false;
      invalidReason = 'The existing daemon.json is not valid JSON';
    }
  } else if (meta.exists === 'yes') {
    valid = false;
    invalidReason = 'Could not read /etc/docker/daemon.json';
  }
  let activeMirrors = [];
  try {
    const parsed = JSON.parse(activeMatch?.[1] || '[]');
    if (Array.isArray(parsed)) activeMirrors = parsed.filter((entry) => typeof entry === 'string');
  } catch {
    activeMirrors = [];
  }
  const mirrors = Array.isArray(config['registry-mirrors'])
    ? config['registry-mirrors'].filter((entry) => typeof entry === 'string')
    : [];
  const canManage = valid && (meta.sudo === 'root' || meta.sudo === 'available');
  return {
    configPath: '/etc/docker/daemon.json',
    exists: meta.exists === 'yes',
    valid,
    invalidReason,
    config,
    mirrors,
    activeMirrors,
    presets: DOCKER_MIRROR_PRESETS,
    sudo: meta.sudo,
    systemctl: meta.systemctl === 'yes',
    canManage,
    fetchedAt: Date.now(),
  };
}

const PACKAGE_SCRIPT = [
  'set +e',
  'uid=$(id -u 2>/dev/null)',
  'if [ "$uid" = "0" ]; then sudo=root; elif sudo -n true 2>/dev/null; then sudo=available; else sudo=unavailable; fi',
  'pm=none',
  'if command -v apt-get >/dev/null 2>&1 && command -v apt-cache >/dev/null 2>&1; then pm=apt; fi',
  'printf "__RSM_PKG_META__\\npm=%s\\nsudo=%s\\n" "$pm" "$sudo"',
  'if [ "$pm" = "apt" ]; then',
  ...Object.entries(APT_PACKAGES).flatMap(([id, pkg]) => [
    `  printf "__RSM_PKG_START__${id}\\n"`,
    `  pkg=${shellQuote(pkg)}`,
    '  printf "__RSM_PKG_NAME__%s\\n" "$pkg"',
    '  status=$(dpkg-query -W -f="\\${Status}|\\${Version}" "$pkg" 2>/dev/null)',
    '  printf "__RSM_PKG_INSTALLED__%s\\n" "$status"',
    '  candidate=$(LC_ALL=C apt-cache policy "$pkg" 2>/dev/null | sed -n "s/^  Candidate: //p" | head -n 1)',
    '  printf "__RSM_PKG_CANDIDATE__%s\\n" "$candidate"',
  ]),
  'fi',
].join('\n');

function parsePackages(text) {
  const sections = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const start = /^__RSM_PKG_START__(.+)$/.exec(line.trim());
    if (start) {
      sections.set(start[1], { name: '', installedRaw: '', candidateRaw: '' });
      continue;
    }
    const current = [...sections.values()].at(-1);
    if (!current) continue;
    const name = /^__RSM_PKG_NAME__(.+)$/.exec(line);
    const installed = /^__RSM_PKG_INSTALLED__(.*)$/.exec(line);
    const candidate = /^__RSM_PKG_CANDIDATE__(.*)$/.exec(line);
    if (name) current.name = name[1].trim();
    else if (installed) current.installedRaw = installed[1].trim();
    else if (candidate) current.candidateRaw = candidate[1].trim();
  }
  const meta = /pm=(\w+)/.exec(text)?.[1] || 'none';
  const sudo = /sudo=(\w+)/.exec(text)?.[1] || 'unavailable';
  return { manager: meta, sudo, entries: sections };
}

function mergeProgramPackages(items, packageInfo) {
  const merged = items.map((item) => {
    const entry = packageInfo.entries.get(item.id);
    if (!entry || !entry.name) {
      return { ...item, packageManager: packageInfo.manager, canInstall: false, canUpgrade: false };
    }
    const installed = /install ok installed/i.test(entry.installedRaw);
    const latestVersion = normalizeProgramVersion(entry.candidateRaw);
    const comparison = latestVersion && item.version ? compareVersions(latestVersion, item.version) : 0;
    const repoStatus = !latestVersion ? 'unknown' : comparison > 0 ? 'upgrade' : comparison === 0 ? 'current' : 'older';
    const systemPath = /^\/(usr\/)?s?bin\//.test(item.path || '');
    const canInstall = item.status === 'missing' && Boolean(latestVersion) && !installed;
    const canUpgrade = item.status !== 'missing' && repoStatus === 'upgrade' && installed && systemPath;
    return {
      ...item,
      packageManager: packageInfo.manager,
      packageName: entry.name,
      packageInstalled: installed,
      latestVersion,
      repoStatus,
      systemManaged: systemPath,
      canInstall,
      canUpgrade,
    };
  });
  const summary = {
    total: merged.length,
    installed: merged.filter((item) => item.status !== 'missing').length,
    missing: merged.filter((item) => item.status === 'missing').length,
    installable: merged.filter((item) => item.canInstall).length,
    upgradeable: merged.filter((item) => item.canUpgrade).length,
    categories: {},
  };
  merged.sort((left, right) => Number(left.status === 'missing') - Number(right.status === 'missing'));
  for (const item of merged) {
    if (item.status !== 'missing') summary.categories[item.category] = (summary.categories[item.category] || 0) + 1;
  }
  return { items: merged, summary, packageManager: packageInfo.manager, packageSudo: packageInfo.sudo };
}

const PROGRAM_SCRIPT = [
  'set +e',
  'resolve_cmd() {',
  '  command -v "$1" 2>/dev/null && return 0',
  '  for dir in /usr/sbin /sbin /usr/local/sbin /usr/local/bin /opt/bin; do',
  '    if [ -x "$dir/$1" ]; then printf "%s\\n" "$dir/$1"; return 0; fi',
  '  done',
  '  return 1',
  '}',
  'check() {',
  '  id="$1"; cmd="$2"; shift 2',
  '  printf "__RSM_PROG_START__%s\\n" "$id"',
  '  path=$(resolve_cmd "$cmd")',
  '  if [ -z "$path" ]; then printf "__RSM_PROG_MISSING__\\n"; return 0; fi',
  '  printf "__RSM_PROG_PATH__%s\\n" "$path"',
  '  if command -v timeout >/dev/null 2>&1; then',
  '    out=$(timeout 6 "$path" "$@" 2>&1); code=$?',
  '  else',
  '    out=$("$path" "$@" 2>&1); code=$?',
  '  fi',
  '  printf "__RSM_PROG_EXIT__%s\\n" "$code"',
  '  printf "%s\\n" "$out" | head -n 4',
  '}',
  ...PROGRAM_CHECKS.map(
    (entry) =>
      `check ${shellQuote(entry.id)} ${shellQuote(entry.command)}${entry.args.length ? ' ' + entry.args.map(shellQuote).join(' ') : ''}`,
  ),
].join('\n');

const FIREWALL_SCRIPT = [
  'set +e',
  'uid=$(id -u 2>/dev/null)',
  'if [ "$uid" = "0" ]; then sudo=root; elif sudo -n true 2>/dev/null; then sudo=available; else sudo=unavailable; fi',
  'printf "__RSM_FW_META__\\nuid=%s\\nsudo=%s\\n" "$uid" "$sudo"',
  'if [ "$sudo" = "root" ]; then SUDO=""; elif [ "$sudo" = "available" ]; then SUDO="sudo -n "; else SUDO=""; fi',
  'printf "__RSM_FW_FW_PATH__\\n"; command -v firewall-cmd 2>/dev/null || true',
  'if command -v firewall-cmd >/dev/null 2>&1; then',
  '  printf "__RSM_FW_FW_STATE__\\n"; $SUDO firewall-cmd --state 2>&1 || true',
  '  printf "__RSM_FW_FW_ZONE__\\n"; $SUDO firewall-cmd --get-default-zone 2>&1 || true',
  '  printf "__RSM_FW_FW_LIST__\\n"; $SUDO firewall-cmd --permanent --list-all 2>&1 || true',
  'else',
  '  printf "__RSM_FW_FW_STATE__\\n__RSM_FW_FW_ZONE__\\n__RSM_FW_FW_LIST__\\n"',
  'fi',
  'printf "__RSM_FW_UFW_PATH__\\n"; command -v ufw 2>/dev/null || true',
  'if command -v ufw >/dev/null 2>&1; then',
  '  printf "__RSM_FW_UFW_VERBOSE__\\n"; $SUDO ufw status verbose 2>&1 || true',
  '  printf "__RSM_FW_UFW_NUMBERED__\\n"; $SUDO ufw status numbered 2>&1 || true',
  '  printf "__RSM_FW_UFW_ADDED__\\n"; $SUDO ufw show added 2>&1 || true',
  'else',
  '  printf "__RSM_FW_UFW_VERBOSE__\\n__RSM_FW_UFW_NUMBERED__\\n__RSM_FW_UFW_ADDED__\\n"',
  'fi',
  'printf "__RSM_FW_NFT_PATH__\\n"; command -v nft 2>/dev/null || true',
  'if command -v nft >/dev/null 2>&1; then printf "__RSM_FW_NFT_RULES__\\n"; $SUDO nft list ruleset 2>&1 | head -n 300 || true; else printf "__RSM_FW_NFT_RULES__\\n"; fi',
  'printf "__RSM_FW_IPTABLES_PATH__\\n"; command -v iptables 2>/dev/null || true',
  'if command -v iptables >/dev/null 2>&1; then printf "__RSM_FW_IPTABLES_RULES__\\n"; $SUDO iptables -S 2>&1 | head -n 300 || true; else printf "__RSM_FW_IPTABLES_RULES__\\n"; fi',
].join('\n');

function parsePrograms(text) {
  const byId = new Map();
  for (const block of String(text || '').split('__RSM_PROG_START__').slice(1)) {
    const lines = block.split(/\r?\n/);
    const id = lines.shift()?.trim() || '';
    if (!id) continue;
    let path = '';
    let code = 0;
    const output = [];
    for (const line of lines) {
      const pathMatch = /^__RSM_PROG_PATH__(.+)$/.exec(line);
      const exitMatch = /^__RSM_PROG_EXIT__(-?\d+)$/.exec(line);
      if (pathMatch) {
        path = pathMatch[1].trim();
        continue;
      }
      if (exitMatch) {
        code = Number(exitMatch[1]);
        continue;
      }
      if (line.trim() === '__RSM_PROG_MISSING__') continue;
      if (line.trim()) output.push(line.trim());
    }
    const raw = output.join('\n').slice(0, 400);
    byId.set(id, {
      path,
      code,
      raw,
      version: normalizeProgramVersion(raw),
      missing: !path,
    });
  }
  const items = PROGRAM_CHECKS.map((entry) => {
    const result = byId.get(entry.id);
    const missing = !result || result.missing || result.code === 127;
    const composeFailure = entry.id === 'docker-compose' && result && result.code !== 0;
    const installed = !missing && !composeFailure;
    return {
      id: entry.id,
      label: entry.label,
      category: entry.category,
      command: entry.command,
      path: result?.path || '',
      version: installed ? result?.version || '' : '',
      versionRaw: installed ? result?.raw || '' : '',
      status: installed ? (result?.version ? 'installed' : 'unknown') : 'missing',
    };
  });
  const summary = { total: items.length, installed: 0, missing: 0, categories: {} };
  for (const item of items) {
    if (item.status === 'missing') summary.missing += 1;
    else {
      summary.installed += 1;
      summary.categories[item.category] = (summary.categories[item.category] || 0) + 1;
    }
  }
  return { items, summary };
}

function mapSftpError(error, fallback = 'sftp_error') {
  if (error instanceof AppError) return error;
  const code = Number(error?.code);
  if (code === 2) return new AppError('not_found', 'Remote path not found', 404);
  if (code === 3) return new AppError('permission_denied', 'Permission denied on the remote path', 403);
  if (code === 4) return new AppError('sftp_failure', 'The remote filesystem rejected the operation', 400);
  if (code === 8) return new AppError('unsupported', 'The remote SFTP server does not support this operation', 400);
  return new AppError(fallback, error?.message || 'SFTP operation failed', 500);
}

function sftpCall(sftp, method, ...args) {
  return new Promise((resolve, reject) => {
    sftp[method](...args, (error, value) => {
      if (error) reject(mapSftpError(error));
      else resolve(value);
    });
  });
}

async function readSftpFile(sftp, remotePath, maxBytes) {
  const stat = await sftpCall(sftp, 'stat', remotePath);
  if (stat.isDirectory && stat.isDirectory()) {
    throw new AppError('is_directory', 'This path is a directory', 400);
  }
  if (Number(stat.size) > maxBytes) {
    throw new AppError('file_too_large', `File is larger than ${Math.floor(maxBytes / 1024 / 1024)} MB`, 413, {
      size: Number(stat.size),
      limit: maxBytes,
    });
  }
  const chunks = [];
  let total = 0;
  const stream = sftp.createReadStream(remotePath);
  try {
    for await (const chunk of stream) {
      total += chunk.length;
      if (total > maxBytes) {
        stream.destroy();
        throw new AppError('file_too_large', 'File is larger than the read limit', 413, {
          size: total,
          limit: maxBytes,
        });
      }
      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mapSftpError(error, 'read_failed');
  }
  return { buffer: Buffer.concat(chunks), stat, size: total };
}

async function writeSftpFile(sftp, remotePath, buffer, mode = 0o644) {
  await new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(remotePath, { mode });
    stream.once('error', (error) => reject(mapSftpError(error, 'write_failed')));
    stream.once('close', resolve);
    stream.end(buffer);
  });
  return sftpCall(sftp, 'stat', remotePath);
}

function modeString(mode) {
  const permissions = Number(mode) & 0o777;
  return permissions.toString(8).padStart(3, '0');
}

function entryType(attrs) {
  const mode = Number(attrs.mode) || 0;
  const format = mode & 0o170000;
  if (format === 0o040000 || (attrs.isDirectory && attrs.isDirectory())) return 'dir';
  if (format === 0o120000 || (attrs.isSymbolicLink && attrs.isSymbolicLink())) return 'symlink';
  return 'file';
}

function mapConnectError(error, host) {
  const message = error?.message || String(error);
  if (error instanceof AppError) return error;
  if (/authentication methods failed|authentication failure/i.test(message)) {
    return new AppError('auth_failed', 'SSH authentication failed. Check the username and secret.', 401);
  }
  if (/host denied|verification failed/i.test(message)) {
    return new AppError(
      'host_key_changed',
      'The server host key does not match the trusted fingerprint. Refusing to connect.',
      409,
    );
  }
  if (/ECONNREFUSED/i.test(message)) {
    return new AppError('connect_refused', `Connection refused by ${host}`, 502);
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(message)) {
    return new AppError('dns_failed', `Cannot resolve host ${host}`, 502);
  }
  if (/ETIMEDOUT|Timed out|timeout/i.test(message)) {
    return new AppError('connect_timeout', `Timed out while connecting to ${host}`, 504);
  }
  if (/ENETUNREACH|EHOSTUNREACH/i.test(message)) {
    return new AppError('network_unreachable', `Network unreachable for ${host}`, 502);
  }
  return new AppError('ssh_error', message, 502);
}

export class RemoteManager {
  constructor({ store, credentials, logger = console }) {
    this.store = store;
    this.credentials = credentials;
    this.logger = logger;
    this.pool = new Map();
    this.cache = new Map();
    this.imageCache = new Map();
    this.firewallCache = new Map();
    this.programsCache = new Map();
    this.packageLocks = new Set();
    this.activity = new Map();
    this.cleanupTimer = undefined;
  }

  async init() {
    await this.store.load();
    this.cleanupTimer = setInterval(() => this.cleanupIdle(), 60_000);
    if (typeof this.cleanupTimer.unref === 'function') this.cleanupTimer.unref();
  }

  dispose() {
    if (this.cleanupTimer !== undefined) clearInterval(this.cleanupTimer);
    this.cleanupTimer = undefined;
    for (const entry of this.pool.values()) this.closeEntry(entry);
    this.pool.clear();
    this.cache.clear();
    this.imageCache.clear();
    this.firewallCache.clear();
    this.programsCache.clear();
    this.packageLocks.clear();
  }

  cleanupIdle() {
    const cutoff = Date.now() - IDLE_CLOSE_MS;
    for (const [id, entry] of this.pool) {
      if (entry.lastUsed < cutoff) {
        this.closeEntry(entry);
        this.pool.delete(id);
      }
    }
  }

  closeEntry(entry) {
    entry.alive = false;
    try {
      entry.client.end();
    } catch {
      try {
        entry.client.destroy();
      } catch {
        // ignore
      }
    }
  }

  async listServers() {
    const servers = this.store.list();
    return Promise.all(
      servers.map(async (server) => {
        const refs = credentialRefs(server);
        let password = false;
        let privateKey = false;
        try {
          password = (await this.credentials.describe(refs.password)).configured;
          privateKey = (await this.credentials.describe(refs.privateKey)).configured;
        } catch {
          // A missing credentials provider must not hide the server list.
        }
        return {
          ...server,
          secret: {
            password,
            privateKey,
            passphrase: false,
          },
          connected: this.pool.get(server.id)?.alive === true,
        };
      }),
    );
  }

  async saveServer(id, input, secrets = {}) {
    let server;
    const isNew = !id;
    if (isNew) {
      if (input?.authType === 'key' && !cleanString(secrets.privateKey, 200_000)) {
        throw new AppError('missing_secret', 'A private key is required for key authentication', 400, {
          field: 'privateKey',
        });
      }
      if (input?.authType !== 'key' && !cleanString(secrets.password, 2048)) {
        throw new AppError('missing_secret', 'A password is required for password authentication', 400, {
          field: 'password',
        });
      }
      server = await this.store.create(input);
    } else {
      const current = this.store.get(id);
      server = await this.store.update(id, input);
      if (
        current.host !== server.host ||
        current.port !== server.port ||
        current.username !== server.username ||
        current.authType !== server.authType ||
        current.dockerCommand !== server.dockerCommand
      ) {
        this.invalidate(id);
      }
    }
    await this.applySecrets(server, secrets);
    this.recordActivity(server.id, {
      action: isNew ? 'server.create' : 'server.update',
      target: server.name,
      ok: true,
      message: `${server.username}@${server.host}:${server.port}`,
    });
    return server;
  }

  async applySecrets(server, secrets) {
    const refs = credentialRefs(server);
    const writes = [];
    if (typeof secrets.password === 'string' && secrets.password.length > 0) {
      writes.push(this.credentials.set(refs.password, secrets.password));
    }
    if (secrets.clearPassword === true) writes.push(this.credentials.unset(refs.password));
    if (typeof secrets.privateKey === 'string' && secrets.privateKey.trim().length > 0) {
      writes.push(this.credentials.set(refs.privateKey, secrets.privateKey));
    }
    if (secrets.clearPrivateKey === true) writes.push(this.credentials.unset(refs.privateKey));
    if (typeof secrets.passphrase === 'string' && secrets.passphrase.length > 0) {
      writes.push(this.credentials.set(refs.passphrase, secrets.passphrase));
    }
    if (secrets.clearPassphrase === true) writes.push(this.credentials.unset(refs.passphrase));
    await Promise.all(writes);
  }

  async deleteServer(id) {
    const server = this.store.get(id);
    this.invalidate(id);
    await this.store.remove(id);
    const refs = credentialRefs(server);
    await Promise.allSettled([
      this.credentials.unset(refs.password),
      this.credentials.unset(refs.privateKey),
      this.credentials.unset(refs.passphrase),
    ]);
    this.activity.delete(id);
    return server;
  }

  async resolveAuth(server) {
    const refs = credentialRefs(server);
    if (server.authType === 'key') {
      const key = await this.credentials.resolve(refs.privateKey);
      if (!key?.value) {
        throw new AppError('missing_secret', 'No private key is saved for this server', 400, {
          field: 'privateKey',
        });
      }
      const passphrase = await this.credentials.resolve(refs.passphrase).catch(() => undefined);
      return {
        privateKey: key.value,
        passphrase: passphrase?.value,
      };
    }
    const password = await this.credentials.resolve(refs.password);
    if (!password?.value) {
      throw new AppError('missing_secret', 'No password is saved for this server', 400, {
        field: 'password',
      });
    }
    return { password: password.value };
  }

  async ensureConnection(server, { force = false } = {}) {
    const cached = this.pool.get(server.id);
    if (!force && cached?.alive && !cached.connecting) {
      cached.lastUsed = Date.now();
      return cached;
    }
    if (cached?.connecting) return cached.connecting;

    const entry = {
      server,
      client: undefined,
      sftp: undefined,
      alive: false,
      connecting: undefined,
      lastUsed: Date.now(),
      fingerprint: server.fingerprint || '',
      connectedAt: 0,
    };
    entry.connecting = (async () => {
      const auth = await this.resolveAuth(server);
      const client = new Client();
      let seenFingerprint = '';
      let hostRejected = false;
      const options = {
        host: server.host,
        port: server.port,
        username: server.username,
        readyTimeout: CONNECT_TIMEOUT_MS,
        keepaliveInterval: 10_000,
        keepaliveCountMax: 3,
        hostHash: 'sha256',
        hostVerifier: (hashedKey, callback) => {
          seenFingerprint = String(hashedKey || '');
          if (server.fingerprint && server.fingerprint !== seenFingerprint) {
            hostRejected = true;
            callback(false);
            return;
          }
          callback(true);
        },
        ...auth,
      };
      await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (error) {
            try {
              client.end();
            } catch {
              // ignore
            }
            reject(error);
          } else {
            resolve();
          }
        };
        const timer = setTimeout(() => {
          finish(new AppError('connect_timeout', `Timed out while connecting to ${server.host}`, 504));
        }, CONNECT_TIMEOUT_MS + 2_000);
        client.once('ready', () => finish());
        client.once('error', (error) => {
          if (hostRejected) {
            finish(
              new AppError(
                'host_key_changed',
                'The server host key changed since it was trusted. Refusing to connect.',
                409,
              ),
            );
            return;
          }
          finish(mapConnectError(error, server.host));
        });
        client.once('close', () => {
          if (!settled) {
            finish(new AppError('connection_closed', 'SSH connection closed during setup', 502));
          }
        });
        try {
          client.connect(options);
        } catch (error) {
          finish(mapConnectError(error, server.host));
        }
      });

      entry.client = client;
      entry.alive = true;
      entry.connecting = undefined;
      entry.connectedAt = Date.now();
      entry.lastUsed = Date.now();
      client.on('close', () => {
        entry.alive = false;
        entry.sftp = undefined;
        if (this.pool.get(server.id) === entry) this.pool.delete(server.id);
      });
      client.on('error', () => {
        entry.alive = false;
      });

      if (!server.fingerprint && seenFingerprint) {
        entry.fingerprint = seenFingerprint;
        await this.store.patchRuntime(server.id, {
          fingerprint: seenFingerprint,
          lastConnectedAt: Date.now(),
        }).catch((error) => this.logger.warn?.('remote-server-manager: cannot save fingerprint', error));
      } else {
        await this.store.patchRuntime(server.id, { lastConnectedAt: Date.now() }).catch(() => {});
      }
      this.pool.set(server.id, entry);
      return entry;
    })();

    try {
      return await entry.connecting;
    } catch (error) {
      if (this.pool.get(server.id) === entry) this.pool.delete(server.id);
      throw error;
    }
  }

  async withConnection(serverId, operation, { force = false } = {}) {
    const server = this.store.get(serverId);
    const entry = await this.ensureConnection(server, { force });
    entry.lastUsed = Date.now();
    try {
      return await operation(entry);
    } catch (error) {
      if (this.isDeadConnection(error)) {
        this.invalidate(serverId);
      }
      throw error;
    }
  }

  isDeadConnection(error) {
    const text = `${error?.code || ''} ${error?.message || ''}`;
    return /ECONNRESET|EPIPE|connection (?:closed|lost|reset)|not connected|No response from server|channel open failure/i.test(
      text,
    );
  }

  invalidate(serverId) {
    const entry = this.pool.get(serverId);
    if (entry) {
      this.closeEntry(entry);
      this.pool.delete(serverId);
    }
    this.cache.delete(serverId);
  }

  async getSftp(entry) {
    if (entry.sftp) return entry.sftp;
    return new Promise((resolve, reject) => {
      entry.client.sftp((error, sftp) => {
        if (error) {
          reject(mapSftpError(error));
          return;
        }
        entry.sftp = sftp;
        sftp.on('close', () => {
          if (entry.sftp === sftp) entry.sftp = undefined;
        });
        sftp.on('end', () => {
          if (entry.sftp === sftp) entry.sftp = undefined;
        });
        resolve(sftp);
      });
    });
  }

  async exec(entry, command, { timeoutMs = EXEC_TIMEOUT_MS, maxBytes = MAX_EXEC_BYTES } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(value);
      };
      const timer = setTimeout(() => {
        finish(new AppError('exec_timeout', `Remote command timed out after ${Math.round(timeoutMs / 1000)}s`, 504));
      }, timeoutMs);
      entry.client.exec(command, (error, stream) => {
        if (error) {
          finish(mapConnectError(error, entry.server.host));
          return;
        }
        let stdout = '';
        let stderr = '';
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let truncated = false;
        const append = (current, chunk, limit) => {
          if (current.length >= limit) {
            truncated = true;
            return current;
          }
          const text = chunk.toString('utf8');
          const remaining = limit - current.length;
          if (text.length > remaining) truncated = true;
          return current + text.slice(0, remaining);
        };
        stream.on('data', (chunk) => {
          stdoutBytes += chunk.length;
          stdout = append(stdout, chunk, maxBytes);
        });
        stream.stderr.on('data', (chunk) => {
          stderrBytes += chunk.length;
          stderr = append(stderr, chunk, 64 * 1024);
        });
        stream.once('error', (streamError) => finish(mapConnectError(streamError, entry.server.host)));
        stream.once('close', (code, signal) => {
          finish(undefined, {
            code: typeof code === 'number' ? code : -1,
            signal: signal || '',
            stdout,
            stderr,
            stdoutBytes,
            stderrBytes,
            truncated,
          });
        });
      });
    });
  }

  async testConnection(serverId) {
    const started = Date.now();
    const server = this.store.get(serverId);
    const entry = await this.ensureConnection(server, { force: true });
    let probe;
    try {
      probe = await this.exec(
        entry,
        'printf "__RSM_OS__\\n"; uname -srm 2>&1; printf "__RSM_HOST__\\n"; hostname 2>&1; printf "__RSM_HOME__\\n"; printf "%s\\n" "$HOME" 2>&1; printf "__RSM_DOCKER__\\n"; ' +
          `${assertDockerCommand(server.dockerCommand)} version --format '{{.Server.Version}}' 2>&1 || true`,
        { timeoutMs: 20_000 },
      );
    } catch (error) {
      this.invalidate(serverId);
      throw error;
    }
    const sections = this.parseSections(probe.stdout);
    const dockerText = (sections.docker || '').trim();
    return {
      ok: true,
      latencyMs: Date.now() - started,
      fingerprint: entry.fingerprint || server.fingerprint || '',
      os: (sections.os || '').trim(),
      hostname: (sections.host || '').trim(),
      home: (sections.home || '').trim(),
      dockerVersion: /^\d+\./.test(dockerText) ? dockerText : '',
      dockerRaw: dockerText.slice(0, 300),
    };
  }

  async overview(serverId) {
    const server = this.store.get(serverId);
    return this.withConnection(serverId, async (entry) => {
      const docker = assertDockerCommand(server.dockerCommand);
      const command = [
        'printf "__RSM_OS__\\n"; uname -srm 2>&1',
        'printf "__RSM_UPTIME__\\n"; uptime 2>&1',
        'printf "__RSM_IDENTITY__\\n"; id 2>&1',
        'printf "__RSM_DISK__\\n"; df -h / 2>&1',
        'printf "__RSM_MEMORY__\\n"; (free -m 2>&1 || true)',
        'printf "__RSM_DOCKER__\\n"; (' + docker + ' version --format "{{.Server.Version}}" 2>&1 || true)',
        'printf "__RSM_CONTAINERS__\\n"; (' + docker + ' ps -q 2>/dev/null | wc -l || true)',
      ].join('; ');
      const result = await this.exec(entry, command, { timeoutMs: 20_000, maxBytes: 256 * 1024 });
      const sections = this.parseSections(result.stdout);
      const dockerVersion = (sections.docker || '').trim();
      const runningText = (sections.containers || '').trim();
      return {
        os: (sections.os || '').trim(),
        uptime: (sections.uptime || '').trim(),
        identity: (sections.identity || '').trim(),
        disk: (sections.disk || '').trim(),
        memory: (sections.memory || '').trim(),
        dockerVersion: /^\d+\./.test(dockerVersion) ? dockerVersion : '',
        dockerMessage: /^\d+\./.test(dockerVersion) ? '' : dockerVersion.slice(0, 400),
        runningContainers: Number.parseInt(runningText, 10) || 0,
        fingerprint: entry.fingerprint || server.fingerprint || '',
        lastConnectedAt: server.lastConnectedAt || 0,
      };
    });
  }

  parseSections(text) {
    const sections = {};
    let key = '';
    for (const line of String(text).split(/\r?\n/)) {
      const match = /^__RSM_([A-Z]+)__$/.exec(line.trim());
      if (match) {
        key = match[1].toLowerCase();
        sections[key] = '';
        continue;
      }
      if (key) sections[key] += `${line}\n`;
    }
    return sections;
  }

  async getHome(entry) {
    const sftp = await this.getSftp(entry);
    return sftpCall(sftp, 'realpath', '.');
  }

  async resolvePath(entry, server, input) {
    const home = await this.getHome(entry).catch(() => '/');
    let target = cleanString(input, 4096) || server.defaultPath || home;
    if (target === '~') target = home;
    else if (target.startsWith('~/')) target = posix.join(home, target.slice(2));
    if (!target.startsWith('/')) target = posix.join(home, target);
    const normalized = posix.normalize(target);
    if (normalized.includes('\u0000')) throw new AppError('invalid_path', 'Invalid remote path', 400);
    return normalized;
  }

  mapEntries(resolvedPath, rows) {
    return rows
      .filter((row) => row.filename !== '.' && row.filename !== '..')
      .map((row) => {
        const type = entryType(row.attrs);
        return {
          name: row.filename,
          path: posix.join(resolvedPath, row.filename),
          type,
          size: Number(row.attrs.size) || 0,
          mtime: (Number(row.attrs.mtime) || 0) * 1000,
          mode: modeString(row.attrs.mode),
          uid: Number(row.attrs.uid) || 0,
          gid: Number(row.attrs.gid) || 0,
        };
      })
      .sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return naturalCompare(a.name, b.name);
      });
  }

  async listFiles(serverId, inputPath) {
    const server = this.store.get(serverId);
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const resolved = await this.resolvePath(entry, server, inputPath);
      let stat;
      try {
        stat = await sftpCall(sftp, 'stat', resolved);
      } catch (error) {
        throw mapSftpError(error);
      }
      if (!stat.isDirectory()) {
        throw new AppError('not_directory', 'This path is not a directory', 400, { path: resolved });
      }
      const rows = await sftpCall(sftp, 'readdir', resolved);
      return {
        path: resolved,
        parent: resolved === '/' ? null : posix.dirname(resolved),
        home: await this.getHome(entry).catch(() => '/'),
        entries: this.mapEntries(resolved, rows),
      };
    });
  }

  async readFile(serverId, inputPath) {
    const server = this.store.get(serverId);
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const resolved = await this.resolvePath(entry, server, inputPath);
      const { buffer, stat, size } = await readSftpFile(sftp, resolved, MAX_TEXT_BYTES);
      const binary = buffer.subarray(0, Math.min(buffer.length, 8000)).includes(0);
      return {
        path: resolved,
        size,
        mtime: (Number(stat.mtime) || 0) * 1000,
        mode: modeString(stat.mode),
        binary,
        encoding: binary ? 'base64' : 'utf8',
        content: binary ? buffer.toString('base64') : buffer.toString('utf8'),
        editable: !binary,
      };
    });
  }

  async writeFile(serverId, input) {
    const server = this.store.get(serverId);
    const inputPath = cleanString(input?.path, 4096);
    if (!inputPath) throw new AppError('invalid_argument', 'Path is required', 400, { field: 'path' });
    if (typeof input?.content !== 'string') {
      throw new AppError('invalid_argument', 'Content is required', 400, { field: 'content' });
    }
    const buffer = Buffer.from(input.content, input.encoding === 'base64' ? 'base64' : 'utf8');
    if (buffer.length > MAX_TEXT_BYTES) {
      throw new AppError('file_too_large', 'Content exceeds the editable size limit', 413);
    }
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const resolved = await this.resolvePath(entry, server, inputPath);
      let before;
      try {
        before = await sftpCall(sftp, 'stat', resolved);
      } catch (error) {
        if (!(error instanceof AppError) || error.code !== 'not_found') throw error;
      }
      if (input.expectedMtime && before) {
        const current = (Number(before.mtime) || 0) * 1000;
        if (Math.abs(current - Number(input.expectedMtime)) > 1000) {
          throw new AppError(
            'file_conflict',
            'The file changed on the server since it was opened. Reload it before saving.',
            409,
            { currentMtime: current },
          );
        }
      }
      const mode = before ? Number(before.mode) & 0o777 : 0o644;
      const after = await writeSftpFile(sftp, resolved, buffer, mode);
      this.recordActivity(serverId, {
        action: 'file.write',
        target: resolved,
        ok: true,
        message: `${buffer.length} bytes`,
      });
      return {
        path: resolved,
        size: Number(after.size),
        mtime: (Number(after.mtime) || 0) * 1000,
      };
    });
  }

  async mkdir(serverId, input) {
    const server = this.store.get(serverId);
    const parent = cleanString(input?.parent, 4096);
    const name = cleanString(input?.name, 255);
    if (!name || name === '.' || name === '..' || /[/\\\u0000]/.test(name)) {
      throw new AppError('invalid_argument', 'Invalid folder name', 400, { field: 'name' });
    }
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const base = await this.resolvePath(entry, server, parent);
      const target = posix.join(base, name);
      await sftpCall(sftp, 'mkdir', target);
      this.recordActivity(serverId, { action: 'file.mkdir', target, ok: true });
      return { path: target };
    });
  }

  async rename(serverId, input) {
    const server = this.store.get(serverId);
    const from = cleanString(input?.path, 4096);
    const name = cleanString(input?.name, 255);
    if (!from) throw new AppError('invalid_argument', 'Path is required', 400, { field: 'path' });
    if (!name || name === '.' || name === '..' || /[/\\\u0000]/.test(name)) {
      throw new AppError('invalid_argument', 'Invalid name', 400, { field: 'name' });
    }
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const source = await this.resolvePath(entry, server, from);
      const target = posix.join(posix.dirname(source), name);
      if (source === target) return { path: target };
      await sftpCall(sftp, 'rename', source, target);
      this.recordActivity(serverId, { action: 'file.rename', target, ok: true, message: source });
      return { path: target };
    });
  }

  async deleteEntry(serverId, input) {
    const server = this.store.get(serverId);
    const targetPath = cleanString(input?.path, 4096);
    if (!targetPath) throw new AppError('invalid_argument', 'Path is required', 400, { field: 'path' });
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const resolved = await this.resolvePath(entry, server, targetPath);
      if (resolved === '/') throw new AppError('forbidden', 'Refusing to delete the root directory', 400);
      const stat = await sftpCall(sftp, 'stat', resolved);
      if (stat.isDirectory()) {
        if (input?.recursive === true) {
          const result = await this.exec(entry, `rm -rf -- ${shellQuote(resolved)}`, { timeoutMs: 60_000 });
          if (result.code !== 0) {
            throw new AppError('delete_failed', result.stderr.trim() || 'Failed to delete directory', 500);
          }
        } else {
          await sftpCall(sftp, 'rmdir', resolved);
        }
      } else {
        await sftpCall(sftp, 'unlink', resolved);
      }
      this.recordActivity(serverId, { action: 'file.delete', target: resolved, ok: true });
      return { path: resolved };
    });
  }

  async uploadFile(serverId, input) {
    const server = this.store.get(serverId);
    const parent = cleanString(input?.parent, 4096);
    const name = cleanString(input?.name, 255);
    if (!name || /[/\\\u0000]/.test(name)) {
      throw new AppError('invalid_argument', 'Invalid file name', 400, { field: 'name' });
    }
    if (typeof input?.contentBase64 !== 'string') {
      throw new AppError('invalid_argument', 'File content is required', 400, { field: 'contentBase64' });
    }
    const buffer = Buffer.from(input.contentBase64, 'base64');
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new AppError('file_too_large', 'Upload exceeds the 24 MB limit', 413);
    }
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const base = await this.resolvePath(entry, server, parent);
      const target = posix.join(base, name);
      const stat = await writeSftpFile(sftp, target, buffer, 0o644);
      this.recordActivity(serverId, {
        action: 'file.upload',
        target,
        ok: true,
        message: `${buffer.length} bytes`,
      });
      return { path: target, size: Number(stat.size) };
    });
  }

  async openDownload(serverId, inputPath) {
    const server = this.store.get(serverId);
    return this.withConnection(serverId, async (entry) => {
      const sftp = await this.getSftp(entry);
      const resolved = await this.resolvePath(entry, server, inputPath);
      const stat = await sftpCall(sftp, 'stat', resolved);
      if (stat.isDirectory()) throw new AppError('is_directory', 'Cannot download a directory', 400);
      return {
        path: resolved,
        name: posix.basename(resolved),
        size: Number(stat.size) || 0,
        stream: sftp.createReadStream(resolved),
        close: () => {},
      };
    });
  }

  async firewall(serverId, query = {}) {
    const server = this.store.get(serverId);
    const refresh = query.refresh === true || query.refresh === '1';
    const cached = this.firewallCache.get(serverId);
    let data;
    if (!refresh && cached && Date.now() - cached.at < FIREWALL_TTL_MS) {
      data = cached.data;
    } else {
      data = await this.fetchFirewall(serverId, server);
      this.firewallCache.set(serverId, { at: Date.now(), data });
    }
    return { ...data, cached: data === cached?.data };
  }

  async fetchFirewall(serverId, server) {
    return this.withConnection(serverId, async (entry) => {
      const result = await this.exec(entry, FIREWALL_SCRIPT, {
        timeoutMs: 30_000,
        maxBytes: 2 * 1024 * 1024,
      });
      const { read } = splitFirewallSections(result.stdout);
      const meta = read('META');
      const uid = /uid=(\d+)/.exec(meta)?.[1] || '';
      const sudo = /sudo=(\w+)/.exec(meta)?.[1] || 'unavailable';
      const fwPath = read('FW_PATH').split(/\r?\n/)[0].trim();
      const fwState = read('FW_STATE').trim();
      const fwZone = read('FW_ZONE').split(/\r?\n/)[0].trim();
      const fwList = read('FW_LIST');
      const ufwPath = read('UFW_PATH').split(/\r?\n/)[0].trim();
      const ufwVerbose = read('UFW_VERBOSE');
      const ufwNumbered = read('UFW_NUMBERED');
      const ufwAdded = read('UFW_ADDED');
      const nftPath = read('NFT_PATH').split(/\r?\n/)[0].trim();
      const nftRules = read('NFT_RULES');
      const iptablesPath = read('IPTABLES_PATH').split(/\r?\n/)[0].trim();
      const iptablesRules = read('IPTABLES_RULES');
      const fwRunning = /\brunning\b/i.test(fwState);
      const ufwRunning = /^Status:\s*active\b/im.test(ufwVerbose);
      const backend = fwPath
        ? fwRunning || !ufwPath || !ufwRunning
          ? 'firewalld'
          : 'ufw'
        : ufwPath
          ? 'ufw'
          : nftPath
            ? 'nftables'
            : iptablesPath
              ? 'iptables'
              : 'none';
      const canManage = (sudo === 'root' || sudo === 'available') && (backend === 'firewalld' || backend === 'ufw');
      const capabilities = {
        manage: canManage,
        ports: canManage,
        services: canManage && backend === 'firewalld',
        rules: canManage && backend === 'ufw',
        reload: canManage,
        enable: canManage && backend === 'ufw',
      };
      let active = false;
      let zone = backend === 'firewalld' ? fwZone : '';
      let defaultPolicy = '';
      let rules = [];
      let message = '';
      if (backend === 'firewalld') {
        active = /\brunning\b/i.test(fwState);
        const listError = /authorization failed|permission denied|not authorized|you need to be root/i.test(fwList)
          ? fwList.split(/\r?\n/)[0]
          : '';
        if (!zone) zone = /^\s*([A-Za-z0-9_.-]+)\s+\(active\)/m.exec(fwList)?.[1] || '';
        if (!/^[A-Za-z0-9_.-]{1,64}$/.test(zone)) zone = '';
        defaultPolicy = /^\s{2}target:\s*(.*)$/m.exec(fwList)?.[1]?.trim() || '';
        rules = parseFirewalldRules(fwList, zone, canManage, server.port);
        if (!active) message = fwState || 'firewalld is installed but not running';
        if (listError) message = listError.slice(0, 400);
        if (sudo === 'unavailable') {
          message = 'The SSH user needs a sudo password to change firewall rules. Configure passwordless sudo or manage the firewall manually.';
        }
      } else if (backend === 'ufw') {
        const parsed = parseUfwRules(ufwVerbose, ufwNumbered, ufwAdded, canManage, server.port);
        active = parsed.active;
        rules = parsed.rules;
        defaultPolicy = parsed.defaultPolicy;
        if (!active) message = parsed.statusLine || 'ufw is installed but not active';
        if (/permission denied|you need to be root|operation not permitted/i.test(ufwVerbose)) {
          message = ufwVerbose.split(/\r?\n/)[0].slice(0, 400);
        }
        if (sudo === 'unavailable') {
          message = 'The SSH user needs a sudo password to change firewall rules. Configure passwordless sudo or manage the firewall manually.';
        }
      } else if (backend === 'nftables' || backend === 'iptables') {
        const raw = backend === 'nftables' ? nftRules : iptablesRules;
        const lines = raw.split(/\r?\n/).filter((line) => line.trim()).slice(0, 300);
        rules = lines.map((line, index) => ({
          id: `${backend}:${index}`,
          kind: 'raw',
          target: line.trim(),
          action: '',
          canDelete: false,
        }));
        active = lines.length > 0;
        message = 'This firewall backend is shown read-only. Install firewalld or ufw to manage rules from the plugin.';
        if (/permission denied|operation not permitted|you must be root/i.test(raw)) {
          message = raw.split(/\r?\n/)[0].slice(0, 400);
        }
      } else {
        message = 'No supported firewall was detected (firewalld, ufw, nftables, iptables).';
      }
      return {
        backend,
        active,
        zone,
        defaultPolicy,
        rules,
        sshPort: server.port,
        sudo,
        canManage,
        capabilities,
        message,
        fetchedAt: Date.now(),
      };
    });
  }

  async firewallAction(serverId, input) {
    const server = this.store.get(serverId);
    const info = await this.firewall(serverId, { refresh: true });
    if (!info.canManage) {
      throw new AppError('firewall_permission', info.message || 'Firewall changes are not available for this server', 403);
    }
    const action = input?.action;
    const prefix = info.sudo === 'root' ? '' : 'sudo -n ';
    const zone = cleanString(input?.zone, 64) || info.zone || '';
    if (zone && !/^[A-Za-z0-9_.-]{1,64}$/.test(zone)) {
      throw new AppError('invalid_argument', 'Invalid firewall zone', 400);
    }
    const protocol = cleanString(input?.protocol, 8).toLowerCase() || 'tcp';
    if (!['tcp', 'udp', 'sctp', 'dccp'].includes(protocol)) {
      throw new AppError('invalid_argument', 'protocol must be tcp, udp, sctp, or dccp', 400);
    }
    const parsedPort = Number(input?.port);
    const port = Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535 ? parsedPort : 0;
    const run = async (command) => {
      const result = await this.withConnection(serverId, async (entry) =>
        this.exec(entry, `${prefix}${command}`, { timeoutMs: 30_000, maxBytes: 1024 * 1024 }),
      );
      if (result.code !== 0) {
        throw new AppError('firewall_failed', (result.stderr || result.stdout || 'Firewall command failed').trim().slice(0, 2000), 500, {
          command,
          code: result.code,
        });
      }
      return result;
    };
    const record = (target, message) =>
      this.recordActivity(serverId, { action: `firewall.${action}`, target, ok: true, message });
    let message = 'Firewall updated';
    if (action === 'open_port') {
      if (!port) throw new AppError('invalid_argument', 'A valid port is required', 400);
      if (info.backend === 'firewalld') {
        const zonePart = zone ? ` --zone=${shellQuote(zone)}` : '';
        await run(`firewall-cmd --permanent${zonePart} --add-port=${shellQuote(`${port}/${protocol}`)}`);
        await run('firewall-cmd --reload');
      } else if (info.backend === 'ufw') {
        await run(`ufw allow ${shellQuote(`${port}/${protocol}`)}`);
        if (!info.active) message = 'Rule added, but ufw is not active. Enable ufw before it can filter traffic.';
      } else {
        throw new AppError('unsupported', 'This firewall backend does not support opening ports from the plugin', 400);
      }
      record(`${port}/${protocol}`, message);
    } else if (action === 'close_port') {
      if (!port) throw new AppError('invalid_argument', 'A valid port is required', 400);
      if (port === 22 || port === Number(server.port)) {
        throw new AppError('ssh_protected', 'Refusing to remove the SSH port from the firewall. Change it manually if you really need to.', 409);
      }
      if (info.backend !== 'firewalld') {
        throw new AppError('unsupported', 'Use delete_rule for ufw rules', 400);
      }
      const zonePart = zone ? ` --zone=${shellQuote(zone)}` : '';
      await run(`firewall-cmd --permanent${zonePart} --remove-port=${shellQuote(`${port}/${protocol}`)}`);
      await run('firewall-cmd --reload');
      record(`${port}/${protocol}`, 'Port removed');
    } else if (action === 'allow_service') {
      if (info.backend !== 'firewalld') throw new AppError('unsupported', 'Services are only supported for firewalld', 400);
      const service = cleanString(input?.service, 64).toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(service)) {
        throw new AppError('invalid_argument', 'Invalid service name', 400);
      }
      const zonePart = zone ? ` --zone=${shellQuote(zone)}` : '';
      await run(`firewall-cmd --permanent${zonePart} --add-service=${shellQuote(service)}`);
      await run('firewall-cmd --reload');
      record(service, 'Service allowed');
    } else if (action === 'remove_service') {
      if (info.backend !== 'firewalld') throw new AppError('unsupported', 'Services are only supported for firewalld', 400);
      const service = cleanString(input?.service, 64).toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(service)) {
        throw new AppError('invalid_argument', 'Invalid service name', 400);
      }
      if (/ssh|openssh/.test(service)) {
        throw new AppError('ssh_protected', 'Refusing to remove the SSH service from the firewall.', 409);
      }
      const zonePart = zone ? ` --zone=${shellQuote(zone)}` : '';
      await run(`firewall-cmd --permanent${zonePart} --remove-service=${shellQuote(service)}`);
      await run('firewall-cmd --reload');
      record(service, 'Service removed');
    } else if (action === 'delete_rule') {
      if (info.backend !== 'ufw') throw new AppError('unsupported', 'delete_rule is only supported for ufw', 400);
      const match = /^ufw:(\d+)$/.exec(cleanString(input?.id, 64));
      if (!match) throw new AppError('invalid_argument', 'Invalid ufw rule id', 400);
      const rule = info.rules.find((item) => item.id === `ufw:${match[1]}`);
      if (!rule) throw new AppError('not_found', 'The firewall rule no longer exists. Refresh and try again.', 404);
      if (ruleTargetsSsh(rule, server.port)) {
        throw new AppError('ssh_protected', 'Refusing to remove the SSH rule from the firewall.', 409);
      }
      await run(`ufw --force delete ${match[1]}`);
      record(rule.target, 'Rule deleted');
    } else if (action === 'enable') {
      if (info.backend !== 'ufw') throw new AppError('unsupported', 'Enabling is only supported for ufw', 400);
      if (info.active) throw new AppError('invalid_state', 'ufw is already active', 409);
      await run(`ufw allow ${shellQuote(`${server.port}/tcp`)}`);
      await run('ufw --force enable');
      record(`${server.port}/tcp`, 'ufw enabled with the SSH port allowed');
      message = `ufw enabled; SSH port ${server.port}/tcp was allowed first`;
    } else if (action === 'reload') {
      if (info.backend === 'firewalld') await run('firewall-cmd --reload');
      else if (info.backend === 'ufw') await run('ufw reload');
      else throw new AppError('unsupported', 'This firewall backend cannot be reloaded from the plugin', 400);
      record('', 'Firewall reloaded');
      message = 'Firewall reloaded';
    } else {
      throw new AppError('invalid_argument', 'Unsupported firewall action', 400);
    }
    this.firewallCache.delete(serverId);
    const firewall = await this.firewall(serverId, { refresh: true });
    return { ok: true, action, message, firewall };
  }

  async programs(serverId, query = {}) {
    this.store.get(serverId);
    const refresh = query.refresh === true || query.refresh === '1';
    const cached = this.programsCache.get(serverId);
    let data;
    if (!refresh && cached && Date.now() - cached.at < PROGRAMS_TTL_MS) {
      data = cached.data;
    } else {
      data = await this.fetchPrograms(serverId);
      this.programsCache.set(serverId, { at: Date.now(), data });
    }
    return { ...data, cached: data === cached?.data };
  }

  async fetchPrograms(serverId) {
    return this.withConnection(serverId, async (entry) => {
      const [result, packageResult] = await Promise.all([
        this.exec(entry, PROGRAM_SCRIPT, { timeoutMs: 45_000, maxBytes: 2 * 1024 * 1024 }),
        this.exec(entry, PACKAGE_SCRIPT, { timeoutMs: 45_000, maxBytes: 2 * 1024 * 1024 }),
      ]);
      const parsed = parsePrograms(result.stdout);
      const packages = parsePackages(packageResult.stdout);
      return {
        ...mergeProgramPackages(parsed.items, packages),
        fetchedAt: Date.now(),
        warning: result.code === 0 ? '' : (result.stderr || result.stdout || '').trim().slice(0, 400),
      };
    });
  }

  async programAction(serverId, input) {
    const server = this.store.get(serverId);
    const action = cleanString(input?.action, 16);
    if (!['install', 'upgrade'].includes(action)) {
      throw new AppError('invalid_argument', 'action must be install or upgrade', 400);
    }
    const id = cleanString(input?.id, 64);
    const entry = PROGRAM_CHECKS.find((item) => item.id === id);
    if (!entry || !APT_PACKAGES[id]) {
      throw new AppError('unsupported', 'This program has no supported package mapping on the target server', 400);
    }
    if (this.packageLocks.has(serverId)) {
      throw new AppError('package_busy', 'Another package operation is already running on this server', 409);
    }
    this.packageLocks.add(serverId);
    try {
      const listing = await this.programs(serverId, { refresh: '1' });
      const program = listing.items.find((item) => item.id === id);
      if (!program) throw new AppError('not_found', 'Program is not in the detection catalog', 404);
      if (listing.packageManager !== 'apt') {
        throw new AppError('unsupported', 'One-click package operations currently require apt (Debian/Ubuntu)', 400);
      }
      if (listing.packageSudo !== 'root' && listing.packageSudo !== 'available') {
        throw new AppError('requires_sudo', 'The SSH user needs root or passwordless sudo to install packages', 403);
      }
      if (action === 'install' && !program.canInstall) {
        throw new AppError('invalid_state', 'This package is not in an installable state. Refresh the list.', 409);
      }
      if (action === 'upgrade' && !program.canUpgrade) {
        throw new AppError('invalid_state', 'No newer version is available in the configured apt repositories', 409);
      }
      const prefix = listing.packageSudo === 'root' ? '' : 'sudo -n ';
      const upgradeFlag = action === 'upgrade' ? '--only-upgrade ' : '';
      const command = `${prefix}env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ${upgradeFlag}${shellQuote(program.packageName)}`;
      const result = await this.withConnection(serverId, async (connection) =>
        this.exec(connection, command, { timeoutMs: 600_000, maxBytes: 1024 * 1024 }),
      );
      const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(-4000);
      if (result.code !== 0) {
        throw new AppError('package_failed', output || 'Package operation failed', 500, { code: result.code, package: program.packageName });
      }
      this.programsCache.delete(serverId);
      const refreshed = await this.programs(serverId, { refresh: '1' });
      const updated = refreshed.items.find((item) => item.id === id);
      this.recordActivity(serverId, {
        action: `program.${action}`,
        target: program.packageName,
        ok: true,
        message: updated?.version ? `${program.label} ${updated.version}` : program.label,
      });
      return {
        ok: true,
        action,
        message: action === 'install' ? `${program.label} installed` : `${program.label} upgraded`,
        program: updated,
        output,
      };
    } finally {
      this.packageLocks.delete(serverId);
    }
  }

  async fetchAptSourceState(serverId) {
    return this.withConnection(serverId, async (entry) => {
      const result = await this.exec(entry, APT_SOURCE_SCRIPT, {
        timeoutMs: 30_000,
        maxBytes: 2 * 1024 * 1024,
      });
      return parseAptSourceState(result.stdout);
    });
  }

  async aptSources(serverId) {
    this.store.get(serverId);
    const state = await this.fetchAptSourceState(serverId);
    const { rawFiles, ...publicState } = state;
    return publicState;
  }

  async aptSourcesAction(serverId, input) {
    this.store.get(serverId);
    const action = cleanString(input?.action, 16);
    if (!['update', 'switch'].includes(action)) {
      throw new AppError('invalid_argument', 'action must be update or switch', 400);
    }
    if (this.packageLocks.has(serverId)) {
      throw new AppError('package_busy', 'Another package operation is already running on this server', 409);
    }
    this.packageLocks.add(serverId);
    try {
      const state = await this.fetchAptSourceState(serverId);
      if (!state.supported) throw new AppError('unsupported', 'This server does not use apt', 400);
      if (!state.canManage) {
        throw new AppError('requires_sudo', 'The SSH user needs root or passwordless sudo to change apt sources', 403);
      }
      const prefix = state.sudo === 'root' ? '' : 'sudo -n ';
      if (action === 'update') {
        const result = await this.withConnection(serverId, async (entry) =>
          this.exec(entry, `${prefix}env DEBIAN_FRONTEND=noninteractive apt-get update 2>&1`, {
            timeoutMs: 300_000,
            maxBytes: 2 * 1024 * 1024,
          }),
        );
        const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(-4000);
        if (result.code !== 0) {
          throw new AppError('apt_update_failed', output || 'apt-get update failed', 500, { code: result.code });
        }
        this.programsCache.delete(serverId);
        this.recordActivity(serverId, { action: 'apt.update', target: 'apt sources', ok: true, message: 'apt-get update' });
        return { ok: true, action, message: 'Package index updated', output, aptSources: await this.aptSources(serverId) };
      }

      const distro = state.distro.id;
      const mirror = pickAptMirror(distro, input);
      const changes = state.rawFiles
        .map((file) => {
          const hasDistroSource = state.entries.some(
            (entry) => entry.file === file.path && entry.enabled && isDistroRepoUrl(entry.url, distro),
          );
          if (!hasDistroSource) return null;
          return { path: file.path, content: rewriteAptSourceFile(file, distro, mirror), original: file.content };
        })
        .filter((file) => file && file.content !== file.original);
      if (changes.length === 0) {
        throw new AppError('no_sources', 'No Ubuntu/Debian official repository URLs were found to switch', 400);
      }
      const backup = `/etc/apt/rsm-backup-${Date.now()}`;
      const lines = ['set +e'];
      lines.push(`SUDO=${shellQuote(prefix.trim())}`);
      lines.push(`backup=${shellQuote(backup)}`);
      lines.push('$SUDO mkdir -p "$backup" || exit 1');
      lines.push('cd / || exit 1');
      for (const file of state.rawFiles) {
        lines.push(`$SUDO cp -a --parents ${shellQuote(file.path)} "$backup" || exit 1`);
      }
      lines.push('write_failed=0');
      for (const change of changes) {
        const encoded = Buffer.from(change.content, 'utf8').toString('base64');
        lines.push(`printf '%s' ${shellQuote(encoded)} | base64 -d | $SUDO tee ${shellQuote(change.path)} >/dev/null || write_failed=1`);
      }
      lines.push('if [ "$write_failed" = "1" ]; then');
      lines.push('  printf "__RSM_APT_SWITCH_ROLLED_BACK__%s\\n" "$backup"');
      for (const file of state.rawFiles) {
        lines.push(`  $SUDO cp -a "$backup${file.path}" ${shellQuote(file.path)} 2>/dev/null || true`);
      }
      lines.push('  exit 1');
      lines.push('fi');
      lines.push('$SUDO env DEBIAN_FRONTEND=noninteractive apt-get update 2>&1');
      lines.push('code=$?');
      lines.push('if [ "$code" = "0" ]; then');
      lines.push('  printf "__RSM_APT_SWITCH_OK__%s\\n" "$backup"');
      lines.push('  exit 0');
      lines.push('fi');
      lines.push('printf "__RSM_APT_SWITCH_ROLLED_BACK__%s\\n" "$backup"');
      for (const file of state.rawFiles) {
        lines.push(`$SUDO cp -a "$backup${file.path}" ${shellQuote(file.path)} 2>/dev/null || true`);
      }
      lines.push('exit "$code"');
      const result = await this.withConnection(serverId, async (entry) =>
        this.exec(entry, lines.join('\n'), { timeoutMs: 300_000, maxBytes: 3 * 1024 * 1024 }),
      );
      const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim().slice(-4000);
      if (result.code !== 0) {
        const rolledBack = output.includes('__RSM_APT_SWITCH_ROLLED_BACK__');
        throw new AppError(
          'apt_source_failed',
          rolledBack ? `apt-get update failed; original sources restored\n${output}` : output || 'Failed to switch apt source',
          500,
          { backup, rolledBack },
        );
      }
      this.programsCache.delete(serverId);
      this.recordActivity(serverId, {
        action: 'apt.switch',
        target: mirror.label,
        ok: true,
        message: `${changes.length} source file(s) switched to ${mirror.base}`,
      });
      return {
        ok: true,
        action,
        message: `Sources switched to ${mirror.label}`,
        backup,
        changedFiles: changes.map((file) => file.path),
        output,
        aptSources: await this.aptSources(serverId),
      };
    } finally {
      this.packageLocks.delete(serverId);
    }
  }

  async dockerSources(serverId) {
    const server = this.store.get(serverId);
    const docker = assertDockerCommand(server.dockerCommand);
    return this.withConnection(serverId, async (entry) => {
      const result = await this.exec(entry, DOCKER_SOURCE_SCRIPT(docker), {
        timeoutMs: 30_000,
        maxBytes: 2 * 1024 * 1024,
      });
      return parseDockerSources(result.stdout);
    });
  }

  async dockerSourcesAction(serverId, input) {
    this.store.get(serverId);
    if (cleanString(input?.action, 16) !== 'save') {
      throw new AppError('invalid_argument', 'action must be save', 400);
    }
    const rawMirrors = Array.isArray(input?.mirrors) ? input.mirrors : [];
    if (rawMirrors.length > 10) throw new AppError('invalid_argument', 'At most 10 registry mirrors are allowed', 400);
    const mirrors = [];
    for (const entry of rawMirrors) {
      const normalized = normalizeDockerMirror(entry);
      if (!mirrors.includes(normalized)) mirrors.push(normalized);
    }
    if (this.packageLocks.has(serverId)) {
      throw new AppError('package_busy', 'Another package operation is already running on this server', 409);
    }
    this.packageLocks.add(serverId);
    try {
      const state = await this.dockerSources(serverId);
      if (!state.valid) throw new AppError('invalid_config', state.invalidReason || 'daemon.json is not valid', 400);
      if (state.sudo !== 'root' && state.sudo !== 'available') {
        throw new AppError('requires_sudo', 'The SSH user needs root or passwordless sudo to change Docker sources', 403);
      }
      if (JSON.stringify(mirrors) === JSON.stringify(state.mirrors)) {
        return { ok: true, action: 'save', unchanged: true, message: 'Docker sources are unchanged', dockerSources: state };
      }
      const config = { ...state.config };
      if (mirrors.length) config['registry-mirrors'] = mirrors;
      else delete config['registry-mirrors'];
      const content = `${JSON.stringify(config, null, 2)}\n`;
      const encoded = Buffer.from(content, 'utf8').toString('base64');
      const backup = `/etc/docker/rsm-backup-${Date.now()}`;
      const prefix = state.sudo === 'root' ? '' : 'sudo -n ';
      const lines = ['set +e'];
      lines.push(`SUDO=${shellQuote(prefix.trim())}`);
      lines.push(`systemctl=${shellQuote(state.systemctl ? 'yes' : 'no')}`);
      lines.push(`backup=${shellQuote(backup)}`);
      lines.push('$SUDO mkdir -p /etc/docker "$backup" || exit 1');
      lines.push('if [ -f /etc/docker/daemon.json ]; then');
      lines.push('  $SUDO cp -a /etc/docker/daemon.json "$backup/daemon.json" || exit 1');
      lines.push('else');
      lines.push('  backup_missing=1');
      lines.push('fi');
      lines.push('write_failed=0');
      lines.push(`printf '%s' ${shellQuote(encoded)} | base64 -d | $SUDO tee /etc/docker/daemon.json >/dev/null || write_failed=1`);
      lines.push('if [ "$write_failed" = "1" ]; then');
      lines.push('  printf "__RSM_DOCKER_SOURCE_ROLLED_BACK__%s\\n" "$backup"');
      lines.push('  if [ "$backup_missing" = "1" ]; then');
      lines.push('    $SUDO rm -f /etc/docker/daemon.json');
      lines.push('  else');
      lines.push('    $SUDO cp -a "$backup/daemon.json" /etc/docker/daemon.json 2>/dev/null || true');
      lines.push('  fi');
      lines.push('  exit 1');
      lines.push('fi');
      lines.push('if [ "$systemctl" = "yes" ]; then');
      lines.push('  $SUDO systemctl restart docker 2>&1');
      lines.push('else');
      lines.push('  $SUDO service docker restart 2>&1');
      lines.push('fi');
      lines.push('code=$?');
      lines.push('if [ "$code" = "0" ]; then');
      lines.push('  printf "__RSM_DOCKER_SOURCE_OK__%s\\n" "$backup"');
      lines.push('  exit 0');
      lines.push('fi');
      lines.push('printf "__RSM_DOCKER_SOURCE_ROLLED_BACK__%s\\n" "$backup"');
      lines.push('if [ "$backup_missing" = "1" ]; then');
      lines.push('  $SUDO rm -f /etc/docker/daemon.json');
      lines.push('else');
      lines.push('  $SUDO cp -a "$backup/daemon.json" /etc/docker/daemon.json 2>/dev/null || true');
      lines.push('fi');
      lines.push('if [ "$systemctl" = "yes" ]; then');
      lines.push('  $SUDO systemctl restart docker 2>&1 || true');
      lines.push('else');
      lines.push('  $SUDO service docker restart 2>&1 || true');
      lines.push('fi');
      lines.push('exit "$code"');
      const result = await this.withConnection(serverId, async (entry) =>
        this.exec(entry, lines.join('\n'), { timeoutMs: 240_000, maxBytes: 2 * 1024 * 1024 }),
      );
      const rawOutput = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
      const rolledBack = rawOutput.includes('__RSM_DOCKER_SOURCE_ROLLED_BACK__');
      const output = rawOutput.replace(/__RSM_DOCKER_SOURCE_(?:OK|ROLLED_BACK)__\S*/g, '').trim().slice(-4000);
      if (result.code !== 0) {
        throw new AppError(
          'docker_source_failed',
          rolledBack ? `Docker restart failed; daemon.json restored\n${output}` : output || 'Failed to update Docker sources',
          500,
          { backup, rolledBack },
        );
      }
      this.cache.delete(serverId);
      this.imageCache.delete(serverId);
      this.recordActivity(serverId, {
        action: 'docker.sources',
        target: mirrors.length ? mirrors.join(', ') : 'Docker Hub direct',
        ok: true,
        message: 'Docker daemon.json updated',
      });
      return {
        ok: true,
        action: 'save',
        message: mirrors.length ? 'Docker registry mirrors updated' : 'Docker registry mirrors cleared',
        backup,
        mirrors,
        output,
        dockerSources: await this.dockerSources(serverId),
      };
    } finally {
      this.packageLocks.delete(serverId);
    }
  }

  async containers(serverId, query = {}) {
    const server = this.store.get(serverId);
    const refresh = query.refresh === true || query.refresh === '1';
    const cached = this.cache.get(serverId);
    let data;
    if (!refresh && cached && Date.now() - cached.at < CONTAINERS_TTL_MS) {
      data = cached;
    } else {
      data = await this.fetchContainers(serverId, server);
      this.cache.set(serverId, data);
    }
    const pageSize = clampInt(query.pageSize, 10, 200, 50);
    const page = clampInt(query.page, 1, 1_000_000, 1);
    const q = lower(cleanString(query.q, 200));
    const state = ['all', 'running', 'stopped', 'paused', 'other'].includes(query.state)
      ? query.state
      : 'all';
    const project = cleanString(query.project, 256);
    const sort = ['name', 'state', 'project', 'image'].includes(query.sort) ? query.sort : 'name';
    let items = data.items;
    if (q) {
      items = items.filter((container) =>
        [container.name, container.image, container.id, container.project, container.service, container.status, container.ports]
          .join('\n')
          .toLowerCase()
          .includes(q),
      );
    }
    if (state !== 'all') {
      items = items.filter((container) => stateBucket(container.state) === state);
    }
    if (project) {
      if (project === '__standalone__') items = items.filter((container) => !container.project);
      else items = items.filter((container) => container.project === project);
    }
    items = sortContainers(items, sort);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    return {
      items: items.slice(offset, offset + pageSize),
      page: safePage,
      pageSize,
      total,
      totalPages,
      summary: data.summary,
      dockerVersion: data.dockerVersion,
      dockerMessage: data.dockerMessage,
      fetchedAt: data.at,
      cached: data === cached,
    };
  }

  async fetchContainers(serverId, server) {
    const docker = assertDockerCommand(server.dockerCommand);
    return this.withConnection(serverId, async (entry) => {
      const versionPromise = this.exec(entry, `${docker} version --format '{{.Server.Version}}'`, {
        timeoutMs: 10_000,
        maxBytes: 4096,
      }).catch(() => undefined);
      const result = await this.exec(
        entry,
        `${docker} ps -a --no-trunc --format ${shellQuote('{{json .}}')}`,
        { timeoutMs: 30_000, maxBytes: MAX_EXEC_BYTES },
      );
      const versionResult = await versionPromise;
      const dockerVersion =
        versionResult?.code === 0 ? String(versionResult.stdout || '').trim().slice(0, 64) : '';
      if (result.code !== 0) {
        const stderr = `${result.stderr}\n${result.stdout}`.trim();
        if (/command not found|not found|No such file/i.test(stderr)) {
          throw new AppError(
            'docker_unavailable',
            'Docker is not available. Check that Docker is installed on the server.',
            400,
            { stderr: stderr.slice(0, 2000) },
          );
        }
        if (/permission denied/i.test(stderr)) {
          throw new AppError(
            'docker_permission',
            'Permission denied while running docker. Add the SSH user to the docker group or use sudo docker.',
            403,
            { stderr: stderr.slice(0, 2000) },
          );
        }
        throw new AppError('docker_failed', stderr || 'docker ps failed', 500, {
          code: result.code,
          stderr: stderr.slice(0, 2000),
        });
      }
      const items = [];
      let skipped = 0;
      for (const line of result.stdout.split(/\r?\n/)) {
        const text = line.trim();
        if (!text) continue;
        try {
          const parsed = parseContainerLine(text);
          if (parsed) items.push(parsed);
          else skipped += 1;
        } catch {
          skipped += 1;
        }
      }
      const counts = { total: items.length, running: 0, stopped: 0, paused: 0, other: 0 };
      const projectMap = new Map();
      for (const item of items) {
        const bucket = stateBucket(item.state);
        counts[bucket] += 1;
        const key = item.project || '';
        const current = projectMap.get(key) || { name: key, count: 0, running: 0 };
        current.count += 1;
        if (item.state === 'running') current.running += 1;
        projectMap.set(key, current);
      }
      const projects = [...projectMap.values()]
        .filter((project) => project.name)
        .sort((a, b) => naturalCompare(a.name, b.name));
      return {
        items,
        at: Date.now(),
        dockerVersion,
        dockerMessage: dockerVersion ? '' : (versionResult?.stderr || '').trim().slice(0, 400),
        skipped,
        summary: {
          ...counts,
          projects,
          standalone: projectMap.get('')?.count || 0,
        },
      };
    });
  }

  async images(serverId, query = {}) {
    this.store.get(serverId);
    const refresh = query.refresh === true || query.refresh === '1';
    const cached = this.imageCache.get(serverId);
    let data;
    if (!refresh && cached && Date.now() - cached.at < IMAGES_TTL_MS) {
      data = cached;
    } else {
      data = await this.fetchImages(serverId);
      this.imageCache.set(serverId, data);
    }
    const pageSize = clampInt(query.pageSize, 10, 200, 50);
    const page = clampInt(query.page, 1, 1_000_000, 1);
    const q = lower(cleanString(query.q, 200));
    const dangling = ['all', 'tagged', 'dangling'].includes(query.dangling) ? query.dangling : 'all';
    const sort = ['name', 'size', 'created', 'id'].includes(query.sort) ? query.sort : 'name';
    let items = data.items;
    if (q) {
      items = items.filter((image) =>
        [image.id, image.digest, image.repoTags.join(' '), image.repository, image.tag]
          .join('\n')
          .toLowerCase()
          .includes(q),
      );
    }
    if (dangling === 'dangling') items = items.filter((image) => image.dangling);
    else if (dangling === 'tagged') items = items.filter((image) => !image.dangling);
    items = sortImages(items, sort);
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    return {
      items: items.slice(offset, offset + pageSize),
      page: safePage,
      pageSize,
      total,
      totalPages,
      summary: data.summary,
      fetchedAt: data.at,
      cached: data === cached,
    };
  }

  async fetchImages(serverId) {
    const server = this.store.get(serverId);
    const docker = assertDockerCommand(server.dockerCommand);
    return this.withConnection(serverId, async (entry) => {
      const result = await this.exec(
        entry,
        `${docker} images --no-trunc --format ${shellQuote('{{json .}}')}`,
        { timeoutMs: 30_000, maxBytes: MAX_EXEC_BYTES },
      );
      if (result.code !== 0) {
        const stderr = `${result.stderr}\n${result.stdout}`.trim();
        if (/command not found|not found|No such file/i.test(stderr)) {
          throw new AppError(
            'docker_unavailable',
            'Docker is not available. Check that Docker is installed on the server.',
            400,
            { stderr: stderr.slice(0, 2000) },
          );
        }
        if (/permission denied/i.test(stderr)) {
          throw new AppError(
            'docker_permission',
            'Permission denied while running docker. Add the SSH user to the docker group or use sudo docker.',
            403,
            { stderr: stderr.slice(0, 2000) },
          );
        }
        throw new AppError('docker_failed', stderr || 'docker images failed', 500, {
          code: result.code,
          stderr: stderr.slice(0, 2000),
        });
      }
      const byId = new Map();
      let skipped = 0;
      for (const line of result.stdout.split(/\r?\n/)) {
        const text = line.trim();
        if (!text) continue;
        let parsed;
        try {
          parsed = parseImageLine(text);
        } catch {
          skipped += 1;
          continue;
        }
        if (!parsed) {
          skipped += 1;
          continue;
        }
        const existing = byId.get(parsed.id);
        if (!existing) {
          byId.set(parsed.id, {
            ...parsed,
            repoTags: parsed.dangling ? [] : [`${parsed.repository}:${parsed.tag}`],
          });
          continue;
        }
        if (!parsed.dangling) {
          const ref = `${parsed.repository}:${parsed.tag}`;
          if (!existing.repoTags.includes(ref)) existing.repoTags.push(ref);
          if (existing.dangling) {
            existing.repository = parsed.repository;
            existing.tag = parsed.tag;
          }
          existing.dangling = false;
          if (parsed.digest) existing.digest = parsed.digest;
        }
        if (parsed.sizeBytes > existing.sizeBytes) {
          existing.sizeBytes = parsed.sizeBytes;
          existing.size = parsed.size;
        }
      }
      const items = [...byId.values()].map((image) => ({
        ...image,
        repoTags: image.repoTags.sort(naturalCompare),
        shortId: image.id.replace(/^sha256:/, '').slice(0, 12),
      }));
      const repositories = new Set();
      let tagged = 0;
      let dangling = 0;
      let sizeBytes = 0;
      for (const image of items) {
        if (image.dangling) dangling += 1;
        else tagged += 1;
        for (const ref of image.repoTags) repositories.add(ref.slice(0, ref.lastIndexOf(':')));
        sizeBytes += image.sizeBytes;
      }
      return {
        items,
        at: Date.now(),
        skipped,
        summary: {
          total: items.length,
          tagged,
          dangling,
          repositories: repositories.size,
          sizeBytes,
          tags: items.reduce((count, image) => count + image.repoTags.length, 0),
        },
      };
    });
  }

  async containerAction(serverId, input) {
    const server = this.store.get(serverId);
    const action = input?.action;
    if (!['start', 'stop', 'restart', 'kill'].includes(action)) {
      throw new AppError('invalid_argument', 'Unsupported container action', 400, { action });
    }
    if (action === 'kill' && input?.confirm !== 'kill') {
      throw new AppError('invalid_argument', 'Kill requires explicit confirmation', 400);
    }
    const rawIds = Array.isArray(input?.ids) ? input.ids : input?.id ? [input.id] : [];
    const ids = [...new Set(rawIds.map((id) => assertContainerId(id)))];
    if (ids.length === 0) throw new AppError('invalid_argument', 'At least one container id is required', 400);
    if (ids.length > 200) throw new AppError('invalid_argument', 'At most 200 containers per request', 400);
    const docker = assertDockerCommand(server.dockerCommand);
    const results = await this.runPool(ids, 4, async (id) => {
      try {
        const result = await this.withConnection(serverId, async (entry) =>
          this.exec(entry, `${docker} ${action} ${shellQuote(id)}`, { timeoutMs: ACTION_TIMEOUT_MS }),
        );
        const ok = result.code === 0;
        const message = ok
          ? (result.stdout.trim() || `${action} succeeded`)
          : (result.stderr.trim() || result.stdout.trim() || `docker ${action} exited with code ${result.code}`);
        this.recordActivity(serverId, {
          action: `container.${action}`,
          target: id,
          ok,
          message: message.slice(0, 300),
        });
        return {
          id,
          ok,
          code: result.code,
          message: message.slice(0, 4000),
          stdout: result.stdout.slice(0, 4000),
          stderr: result.stderr.slice(0, 4000),
        };
      } catch (error) {
        const appError = error instanceof AppError ? error : new AppError('action_failed', error?.message || 'Action failed', 500);
        this.recordActivity(serverId, {
          action: `container.${action}`,
          target: id,
          ok: false,
          message: appError.message.slice(0, 300),
        });
        return { id, ok: false, code: -1, message: appError.message, stderr: '', stdout: '' };
      }
    });
    this.cache.delete(serverId);
    return {
      action,
      requested: ids.length,
      succeeded: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).length,
      results,
    };
  }

  async inspectContainer(serverId, containerId) {
    const server = this.store.get(serverId);
    const id = assertContainerId(containerId);
    const docker = assertDockerCommand(server.dockerCommand);
    return this.withConnection(serverId, async (entry) => {
      const result = await this.exec(entry, `${docker} inspect --format ${shellQuote('{{json .}}')} ${shellQuote(id)}`, {
        timeoutMs: 20_000,
        maxBytes: 4 * 1024 * 1024,
      });
      if (result.code !== 0) {
        throw new AppError('inspect_failed', result.stderr.trim() || 'docker inspect failed', 500);
      }
      let raw;
      try {
        raw = JSON.parse(result.stdout);
      } catch {
        throw new AppError('inspect_failed', 'Could not parse docker inspect output', 500);
      }
      const state = raw.State || {};
      const config = raw.Config || {};
      return {
        id: raw.Id || id,
        name: String(raw.Name || '').replace(/^\//, ''),
        image: raw.Image || '',
        createdAt: raw.Created || '',
        platform: raw.Platform || '',
        restartCount: state.RestartCount || 0,
        state: normalizeState(state.Status),
        status: state.Status || '',
        startedAt: state.StartedAt || '',
        finishedAt: state.FinishedAt || '',
        command: [config.Entrypoint, config.Cmd].filter(Boolean).join(' '),
        env: Array.isArray(config.Env) ? config.Env.slice(0, 60) : [],
        labels: config.Labels || {},
        mounts: (raw.Mounts || []).slice(0, 30).map((mount) => ({
          type: mount.Type,
          source: mount.Source,
          destination: mount.Destination,
          mode: mount.Mode,
          rw: mount.RW,
        })),
        networks: Object.keys(raw.NetworkSettings?.Networks || {}),
        ports: Object.entries(raw.NetworkSettings?.Ports || {}).map(([key, bindings]) => ({
          container: key,
          host: (bindings || []).map((binding) => `${binding.HostIp || '0.0.0.0'}:${binding.HostPort}`),
        })),
      };
    });
  }

  async runPool(items, concurrency, worker) {
    const results = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await worker(items[index], index);
      }
    });
    await Promise.all(workers);
    return results;
  }

  recordActivity(serverId, event) {
    const list = this.activity.get(serverId) || [];
    list.unshift({
      at: Date.now(),
      action: event.action,
      target: event.target || '',
      ok: event.ok !== false,
      message: event.message || '',
    });
    this.activity.set(serverId, list.slice(0, MAX_ACTIVITY));
  }

  activityFor(serverId) {
    return this.activity.get(serverId) || [];
  }
}

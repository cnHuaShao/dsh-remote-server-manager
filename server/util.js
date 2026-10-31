import { createHash, randomBytes } from 'node:crypto';

export class AppError extends Error {
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function asAppError(error, fallbackCode = 'internal_error') {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new AppError(fallbackCode, message, 500);
}

export function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function cleanString(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function requiredString(value, field, maxLength) {
  const text = cleanString(value, maxLength);
  if (text.length === 0) throw new AppError('invalid_argument', `${field} is required`, 400, { field });
  return text;
}

export function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function randomId(prefix) {
  return `${prefix}_${randomBytes(6).toString('hex')}`;
}

export const CONTAINER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;
export const DOCKER_COMMAND_RE = /^[A-Za-z0-9_./ -]{1,64}$/;

export function assertContainerId(id) {
  if (!CONTAINER_ID_RE.test(String(id ?? ''))) {
    throw new AppError('invalid_argument', 'Invalid container id', 400, { id });
  }
  return String(id);
}

export function assertDockerCommand(value) {
  const command = cleanString(value, 64) || 'docker';
  if (!DOCKER_COMMAND_RE.test(command)) {
    throw new AppError(
      'invalid_argument',
      'Docker command may only contain letters, digits, spaces, /, _, . and -',
      400,
      { field: 'dockerCommand' },
    );
  }
  return command;
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

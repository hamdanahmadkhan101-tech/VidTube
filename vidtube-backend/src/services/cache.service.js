import { createHash } from 'node:crypto';
import { createClient } from 'redis';
import { logInfo, logWarn } from '../utils/logger.js';

const CACHE_PREFIX = process.env.CACHE_PREFIX || 'vidtube';
const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';
const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_DEFAULT_TTL_SECONDS) || 60;
const REDIS_URL = process.env.REDIS_URL;

let redisClient = null;
let initAttempted = false;

const cacheDiagnostics = {
  enabled: CACHE_ENABLED,
  configured: Boolean(REDIS_URL),
  connected: false,
  provider: 'none',
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0,
  bypassed: 0,
  errors: 0,
  lastConnectedAt: null,
  lastError: null,
};

const normalizeTtl = (ttlSeconds) => {
  const parsed = Number(ttlSeconds);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_TTL_SECONDS;
};

const normalizeForStableJson = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStableJson(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeForStableJson(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const toStableJson = (value) => JSON.stringify(normalizeForStableJson(value));

const getNamespacePattern = (namespace) => `${CACHE_PREFIX}:${namespace}:*`;

const isCacheConfigured = () => CACHE_ENABLED && Boolean(REDIS_URL);

const ensureClient = async () => {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (!initAttempted) {
    await initializeCache();
  }

  if (!redisClient?.isOpen) {
    return null;
  }

  return redisClient;
};

const scanKeys = async (client, pattern) => {
  const matchedKeys = [];
  let cursor = '0';

  do {
    const result = await client.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = result.cursor;
    if (result.keys?.length) {
      matchedKeys.push(...result.keys);
    }
  } while (cursor !== '0');

  return matchedKeys;
};

export const createCacheKey = (namespace, payload) => {
  const serialized =
    typeof payload === 'string' ? payload : toStableJson(payload);
  const digest = createHash('sha1').update(serialized).digest('hex');
  return `${CACHE_PREFIX}:${namespace}:${digest}`;
};

export const initializeCache = async () => {
  if (initAttempted) {
    return cacheDiagnostics.connected;
  }

  initAttempted = true;

  if (!isCacheConfigured()) {
    cacheDiagnostics.enabled = CACHE_ENABLED;
    cacheDiagnostics.configured = Boolean(REDIS_URL);
    cacheDiagnostics.connected = false;
    cacheDiagnostics.provider = 'none';

    if (!CACHE_ENABLED) {
      logInfo('Distributed cache disabled via CACHE_ENABLED=false');
    } else {
      logInfo('Distributed cache disabled because REDIS_URL is not configured');
    }

    return false;
  }

  if (redisClient?.isOpen) {
    return true;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    redisClient.on('ready', () => {
      cacheDiagnostics.connected = true;
      cacheDiagnostics.lastConnectedAt = new Date().toISOString();
      cacheDiagnostics.lastError = null;
    });

    redisClient.on('end', () => {
      cacheDiagnostics.connected = false;
    });

    redisClient.on('error', (error) => {
      cacheDiagnostics.connected = false;
      cacheDiagnostics.errors += 1;
      cacheDiagnostics.lastError = error.message;
      logWarn('Redis client error', { message: error.message });
    });

    await redisClient.connect();

    cacheDiagnostics.connected = redisClient.isOpen;
    cacheDiagnostics.configured = true;
    cacheDiagnostics.provider = REDIS_URL.includes('upstash')
      ? 'upstash-redis'
      : 'redis';

    logInfo('Distributed cache connected', {
      provider: cacheDiagnostics.provider,
    });

    return cacheDiagnostics.connected;
  } catch (error) {
    cacheDiagnostics.connected = false;
    cacheDiagnostics.errors += 1;
    cacheDiagnostics.lastError = error.message;
    redisClient = null;

    logWarn('Redis connection unavailable; cache will run in bypass mode', {
      message: error.message,
    });

    return false;
  }
};

export const getCacheValue = async (key) => {
  const client = await ensureClient();
  if (!client) {
    cacheDiagnostics.bypassed += 1;
    return null;
  }

  try {
    const raw = await client.get(key);
    if (!raw) {
      cacheDiagnostics.misses += 1;
      return null;
    }

    cacheDiagnostics.hits += 1;
    return JSON.parse(raw);
  } catch (error) {
    cacheDiagnostics.errors += 1;
    cacheDiagnostics.lastError = error.message;
    return null;
  }
};

export const setCacheValue = async (
  key,
  value,
  ttlSeconds = DEFAULT_TTL_SECONDS
) => {
  const client = await ensureClient();
  if (!client) {
    cacheDiagnostics.bypassed += 1;
    return false;
  }

  try {
    await client.set(key, JSON.stringify(value), {
      EX: normalizeTtl(ttlSeconds),
    });
    cacheDiagnostics.sets += 1;
    return true;
  } catch (error) {
    cacheDiagnostics.errors += 1;
    cacheDiagnostics.lastError = error.message;
    return false;
  }
};

export const invalidateCacheNamespace = async (namespace) => {
  if (!namespace) {
    return 0;
  }

  const client = await ensureClient();
  if (!client) {
    cacheDiagnostics.bypassed += 1;
    return 0;
  }

  try {
    const keys = await scanKeys(client, getNamespacePattern(namespace));
    if (!keys.length) {
      return 0;
    }

    const deleted = await client.del(keys);
    cacheDiagnostics.invalidations += deleted;
    return deleted;
  } catch (error) {
    cacheDiagnostics.errors += 1;
    cacheDiagnostics.lastError = error.message;
    return 0;
  }
};

export const invalidateCacheNamespaces = async (namespaces = []) => {
  const uniqueNamespaces = [...new Set(namespaces.filter(Boolean))];
  if (!uniqueNamespaces.length) {
    return 0;
  }

  let totalDeleted = 0;
  for (const namespace of uniqueNamespaces) {
    totalDeleted += await invalidateCacheNamespace(namespace);
  }

  return totalDeleted;
};

export const getCacheDiagnostics = () => ({
  ...cacheDiagnostics,
  enabled: CACHE_ENABLED,
  configured: Boolean(REDIS_URL),
  prefix: CACHE_PREFIX,
  defaultTtlSeconds: DEFAULT_TTL_SECONDS,
});

export const closeCache = async () => {
  if (!redisClient) {
    return;
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  } finally {
    redisClient = null;
    cacheDiagnostics.connected = false;
    initAttempted = false;
  }
};

import crypto from 'node:crypto';
import apiError from '../utils/apiError.js';
import IdempotencyKey from '../models/idempotencyKey.model.js';
import { deleteFile } from '../utils/cleanupTemp.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9:_\-.]{8,128}$/;
const completionCache = new Map();

const pruneCompletionCache = () => {
  const now = Date.now();
  for (const [scopeKey, cached] of completionCache.entries()) {
    if (cached.expiresAt <= now) {
      completionCache.delete(scopeKey);
    }
  }
};

const buildScopeKey = ({ key, method, route, scope }) =>
  `${key}::${method}::${route}::${scope}`;

const getCachedCompletion = (scopeKey) => {
  pruneCompletionCache();
  const cached = completionCache.get(scopeKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    completionCache.delete(scopeKey);
    return null;
  }

  return cached;
};

const setCachedCompletion = (scopeKey, payload) => {
  pruneCompletionCache();
  completionCache.set(scopeKey, payload);
};

const cleanupUploadedTempFiles = (req) => {
  if (Array.isArray(req.files)) {
    req.files.forEach((file) => {
      if (file?.path) {
        deleteFile(file.path);
      }
    });
    return;
  }

  if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((fieldFiles) => {
      if (!Array.isArray(fieldFiles)) {
        return;
      }
      fieldFiles.forEach((file) => {
        if (file?.path) {
          deleteFile(file.path);
        }
      });
    });
    return;
  }

  if (req.file?.path) {
    deleteFile(req.file.path);
  }
};

const normalizeFiles = (req) => {
  const files = [];

  if (Array.isArray(req.files)) {
    req.files.forEach((file) => {
      files.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
    });
  } else if (req.files && typeof req.files === 'object') {
    Object.keys(req.files)
      .sort()
      .forEach((field) => {
        const fieldFiles = req.files[field];
        if (!Array.isArray(fieldFiles)) {
          return;
        }
        fieldFiles.forEach((file) => {
          files.push({
            fieldname: file.fieldname,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          });
        });
      });
  }

  if (req.file) {
    files.push({
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  }

  return files.sort((a, b) => {
    if (a.fieldname !== b.fieldname) {
      return a.fieldname.localeCompare(b.fieldname);
    }
    if (a.originalname !== b.originalname) {
      return a.originalname.localeCompare(b.originalname);
    }
    return a.size - b.size;
  });
};

const stableSerialize = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => stableSerialize(item));
  }

  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSerialize(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const buildRequestHash = (req, customFingerprintBuilder) => {
  const payload = customFingerprintBuilder
    ? customFingerprintBuilder(req)
    : {
        body: req.body || {},
        params: req.params || {},
        query: req.query || {},
        files: normalizeFiles(req),
      };

  const normalized = stableSerialize(payload);
  const content = JSON.stringify(normalized);

  return crypto.createHash('sha256').update(content).digest('hex');
};

const normalizeScope = (req) => {
  if (req.user?._id) {
    return String(req.user._id);
  }

  if (req.ip) {
    return `ip:${req.ip}`;
  }

  return 'anonymous';
};

const tryReplayExisting = async ({
  existing,
  requestHash,
  req,
  res,
  processingTtlMs,
}) => {
  if (existing.requestHash !== requestHash) {
    throw new apiError(
      409,
      'Idempotency key was already used with different payload'
    );
  }

  if (existing.status === 'completed') {
    cleanupUploadedTempFiles(req);
    res.set('Idempotency-Key', existing.key);
    res.set('Idempotency-Replayed', 'true');
    return res
      .status(existing.responseStatusCode || 200)
      .json(existing.responseBody);
  }

  const isStaleProcessing =
    existing.status === 'processing' &&
    Date.now() - new Date(existing.updatedAt).getTime() > processingTtlMs;

  if (isStaleProcessing) {
    await IdempotencyKey.deleteOne({ _id: existing._id, status: 'processing' });
    return null;
  }

  throw new apiError(
    409,
    'A request with this Idempotency-Key is already being processed'
  );
};

export const enforceIdempotency = ({
  requireKey = false,
  ttlSeconds = 24 * 60 * 60,
  processingTtlSeconds = 20 * 60,
  fingerprintBuilder,
} = {}) => {
  const ttlMs = ttlSeconds * 1000;
  const processingTtlMs = processingTtlSeconds * 1000;

  return async (req, res, next) => {
    const rawKey = req.get('Idempotency-Key') || req.get('idempotency-key');
    const key = rawKey?.trim();

    if (!key) {
      if (requireKey) {
        return next(
          new apiError(
            400,
            'Idempotency-Key header is required for this endpoint'
          )
        );
      }
      return next();
    }

    if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
      return next(
        new apiError(
          400,
          'Invalid Idempotency-Key format. Use 8-128 chars: letters, numbers, :, _, -, .'
        )
      );
    }

    const route = req.baseUrl + req.path;
    const method = req.method.toUpperCase();
    const scope = normalizeScope(req);
    const requestHash = buildRequestHash(req, fingerprintBuilder);
    const scopeKey = buildScopeKey({ key, route, method, scope });

    const cached = getCachedCompletion(scopeKey);
    if (cached) {
      if (cached.requestHash !== requestHash) {
        return next(
          new apiError(
            409,
            'Idempotency key was already used with different payload'
          )
        );
      }

      cleanupUploadedTempFiles(req);
      res.set('Idempotency-Key', key);
      res.set('Idempotency-Replayed', 'true');
      return res
        .status(cached.responseStatusCode || 200)
        .json(cached.responseBody);
    }

    let existing = await IdempotencyKey.findOne({ key, route, method, scope });
    if (existing) {
      const replayResponse = await tryReplayExisting({
        existing,
        requestHash,
        req,
        res,
        processingTtlMs,
      });
      if (replayResponse) {
        return replayResponse;
      }
      existing = null;
    }

    let record;
    try {
      record = await IdempotencyKey.create({
        key,
        route,
        method,
        scope,
        requestHash,
        status: 'processing',
        expiresAt: new Date(Date.now() + ttlMs),
      });
    } catch (error) {
      if (error?.code === 11000) {
        const concurrent = await IdempotencyKey.findOne({
          key,
          route,
          method,
          scope,
        });
        if (concurrent) {
          const replayResponse = await tryReplayExisting({
            existing: concurrent,
            requestHash,
            req,
            res,
            processingTtlMs,
          });
          if (replayResponse) {
            return replayResponse;
          }
        }
      }
      return next(error);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      if (isSuccess) {
        setCachedCompletion(scopeKey, {
          requestHash,
          responseStatusCode: res.statusCode,
          responseBody: body,
          expiresAt: Date.now() + ttlMs,
        });

        void IdempotencyKey.updateOne(
          { _id: record._id },
          {
            $set: {
              status: 'completed',
              responseStatusCode: res.statusCode,
              responseBody: body,
              completedAt: new Date(),
              expiresAt: new Date(Date.now() + ttlMs),
            },
          }
        );
      } else {
        // Failed responses are not cached so callers can safely retry.
        completionCache.delete(scopeKey);
        void IdempotencyKey.deleteOne({ _id: record._id });
      }

      res.set('Idempotency-Key', key);
      return originalJson(body);
    };

    return next();
  };
};

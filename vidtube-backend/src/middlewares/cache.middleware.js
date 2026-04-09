import {
  createCacheKey,
  getCacheValue,
  setCacheValue,
  invalidateCacheNamespaces,
} from '../services/cache.service.js';

const buildDefaultCachePayload = (req) => ({
  method: req.method,
  path: req.baseUrl + req.path,
  params: req.params,
  query: req.query,
});

/**
 * Cache successful GET responses in Redis.
 */
export const cacheResponse = ({
  namespace,
  ttlSeconds = 60,
  keyBuilder = buildDefaultCachePayload,
  skip = () => false,
} = {}) => {
  if (!namespace) {
    throw new Error('cacheResponse middleware requires a namespace');
  }

  return async (req, res, next) => {
    if (req.method !== 'GET' || skip(req)) {
      return next();
    }

    const cacheKey = createCacheKey(namespace, keyBuilder(req));
    const cachedPayload = await getCacheValue(cacheKey);

    if (cachedPayload) {
      res.set('X-Server-Cache', 'HIT');
      return res
        .status(cachedPayload.statusCode || 200)
        .json(cachedPayload.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.set('X-Server-Cache', 'MISS');
        void setCacheValue(
          cacheKey,
          {
            statusCode: res.statusCode,
            body,
          },
          ttlSeconds
        );
      } else {
        res.set('X-Server-Cache', 'BYPASS');
      }

      return originalJson(body);
    };

    return next();
  };
};

/**
 * Invalidate one or more cache namespaces after successful mutation responses.
 */
export const invalidateCacheOnSuccess = ({ namespaces = [] } = {}) => {
  const uniqueNamespaces = [...new Set(namespaces.filter(Boolean))];

  return (req, res, next) => {
    if (!uniqueNamespaces.length) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void invalidateCacheNamespaces(uniqueNamespaces);
      }

      return originalJson(body);
    };

    return next();
  };
};

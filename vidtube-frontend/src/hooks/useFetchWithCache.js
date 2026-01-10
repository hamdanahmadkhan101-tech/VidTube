import { useState, useEffect, useRef } from 'react';

/**
 * Fetch hook with caching support
 * Reduces unnecessary API calls by caching responses
 * @param {function} fetchFn - Async function that returns data
 * @param {Array} dependencies - Dependencies array (like useEffect)
 * @param {Object} options - { cacheKey, cacheTime, enabled }
 * @returns {Object} { data, loading, error, refetch }
 */
export default function useFetchWithCache(
  fetchFn,
  dependencies = [],
  options = {}
) {
  const { cacheKey, cacheTime = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  const fetchData = async (forceRefresh = false) => {
    // Check cache if not forcing refresh
    if (cacheKey && !forceRefresh) {
      const cached = cacheRef.current.get(cacheKey);
      if (
        cached &&
        Date.now() - cached.timestamp < cacheTime &&
        cached.data !== null
      ) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortControllerRef.current.signal);

      // Don't update state if request was aborted
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        setLoading(false);

        // Cache the result
        if (cacheKey) {
          cacheRef.current.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      if (!abortControllerRef.current.signal.aborted) {
        setError(err);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (enabled) {
      fetchData();
    } else {
      setLoading(false);
    }

    // Cleanup: abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  const refetch = () => fetchData(true);

  return { data, loading, error, refetch };
}

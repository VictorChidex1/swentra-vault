import { useState, useEffect, useCallback } from 'react'

// Global in-memory cache to prevent slow navigation between admin pages.
// Also de-dupes concurrent requests for the same key.
const cache = new Map<string, { data: any, timestamp: number }>()
const inflight = new Map<string, Promise<any>>()
const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

/**
 * Run a fetcher through the shared cache: returns the in-flight promise if one
 * exists for `key`, otherwise starts it and stores the result.
 */
export function fetchAdminCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = fetcher()
    .then((result) => {
      cache.set(key, { data: result, timestamp: Date.now() })
      return result
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

/**
 * Warm the cache for a key ahead of time (fire-and-forget). Used by AdminLayout
 * to prefetch common data so pages paint instantly from cache.
 */
export function primeAdminCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  return fetchAdminCache(key, fetcher).catch((error) => {
    console.error(`[AdminCache] Failed to prime ${key}:`, error)
    return undefined as unknown as T
  })
}

export function useAdminCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options = { backgroundRefetch: true }
) {
  const [data, setData] = useState<T | null>(cache.get(key)?.data || null)
  // Only show loading if we don't have cached data
  const [loading, setLoading] = useState(!cache.has(key))

  const executeFetch = useCallback(async (forceLoadingState = false) => {
    if (forceLoadingState) setLoading(true)
    try {
      const result = await fetchAdminCache(key, fetcher)
      setData(result)
    } catch (error) {
      console.error(`[AdminCache] Failed to fetch ${key}:`, error)
    } finally {
      if (forceLoadingState) setLoading(false)
    }
  }, [key, fetcher])

  useEffect(() => {
    const cached = cache.get(key)
    const isStale = !cached || (Date.now() - cached.timestamp > CACHE_DURATION)

    if (!cached) {
      // First time fetch, show spinner
      executeFetch(true)
    } else if (isStale || options.backgroundRefetch) {
      // We have data, but it's stale or we want to background update.
      // Don't show spinner, just update silently.
      executeFetch(false)
    }
  }, [key, executeFetch, options.backgroundRefetch])

  return {
    data,
    loading,
    refetch: () => executeFetch(true),
    // A way to manually update the cache when a mutation happens (e.g., approving a user)
    mutate: (newData: T) => {
      cache.set(key, { data: newData, timestamp: Date.now() })
      setData(newData)
    }
  }
}
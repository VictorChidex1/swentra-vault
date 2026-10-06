import { useState, useEffect, useCallback } from 'react'

// Global memory cache to prevent slow navigation
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 1000 * 60 * 5 // 5 minutes

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
      const result = await fetcher()
      cache.set(key, { data: result, timestamp: Date.now() })
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

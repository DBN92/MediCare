import { useState, useEffect, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  size(): number {
    return this.cache.size
  }
}

export const queryCache = new QueryCache()

export function useQueryCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number
    enabled?: boolean
    dependencies?: any[]
  } = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { ttl, enabled = true, dependencies = [] } = options

  const executeQuery = useCallback(async () => {
    if (!enabled) return

    // Verificar cache primeiro
    const cachedData = queryCache.get<T>(key)
    if (cachedData) {
      setData(cachedData)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      queryCache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'))
    } finally {
      setLoading(false)
    }
  }, [key, queryFn, enabled, ttl, ...dependencies])

  useEffect(() => {
    executeQuery()
  }, [executeQuery])

  const refetch = useCallback(() => {
    queryCache.clear(key)
    executeQuery()
  }, [key, executeQuery])

  return {
    data,
    loading,
    error,
    refetch
  }
}
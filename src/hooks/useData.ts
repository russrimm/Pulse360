import { useState, useCallback } from 'react'

interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  fetchData: (url: string, options?: RequestInit) => Promise<void>
}

export function useData<T>(): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (url: string, options?: RequestInit) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchData }
} 
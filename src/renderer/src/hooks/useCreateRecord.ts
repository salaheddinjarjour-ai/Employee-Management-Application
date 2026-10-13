import { useState } from 'react'

interface CreateRecordResponse {
  id: number
}

interface UseCreateRecordOptions {
  onSuccess?: (result: CreateRecordResponse) => void
  onError?: (error: Error) => void
}

export function useCreateRecord(options: UseCreateRecordOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)

  const mutateAsync = async (params: { entity: string; payload: any }): Promise<CreateRecordResponse> => {
    setIsLoading(true)
    try {
      if (!window.api?.createRecord) {
        throw new Error('API not available')
      }

      const result = await window.api.createRecord(params.entity, params.payload)
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error')
      options.onError?.(errorObj)
      throw errorObj
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutateAsync,
    isLoading
  }
}

// Hook for listing records with refresh capability
export function useListRecords(entity: string) {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async (filters?: any) => {
    setIsLoading(true)
    setError(null)
    try {
      if (!window.api?.listRecords) {
        throw new Error('API not available')
      }

      const result = await window.api.listRecords(entity, filters)
      setData(result)
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch data')
      setError(errorObj)
      throw errorObj
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = () => fetchData()

  return {
    data,
    isLoading,
    error,
    fetchData,
    refetch
  }
}

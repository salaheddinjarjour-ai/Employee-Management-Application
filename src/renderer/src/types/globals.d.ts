// Global type declarations for renderer process

declare global {
  interface Window {
    // Electron API (from preload)
    api: {
      createRecord: (entity: string, payload: any) => Promise<{ id: number }>
      listRecords: (entity: string, filters?: any) => Promise<any[]>
    }
    
    // Toast notifications (if available)
    toast?: {
      success?: (message: string) => void
      error?: (message: string) => void
      info?: (message: string) => void
    }
    
    // Event system (if available)
    events?: {
      emit?: (event: string, data?: any) => void
      on?: (event: string, handler: (data?: any) => void) => void
      off?: (event: string, handler: (data?: any) => void) => void
    }
  }
}

export {}

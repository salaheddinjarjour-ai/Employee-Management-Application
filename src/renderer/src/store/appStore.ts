import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type CurrencyView = 'USD' | 'TRY'

export interface ExchangeRate {
  rate: number
  effective_from: string
  note?: string
}

interface AppState {
  // Currency management
  currencyView: CurrencyView
  activeRate: ExchangeRate | null
  
  // Actions
  setCurrencyView: (view: CurrencyView) => void
  setActiveRate: (rate: ExchangeRate) => void
  
  // UI State
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        currencyView: 'USD',
        activeRate: {
          rate: 36.5,
          effective_from: '2025-09-24',
          note: 'Default exchange rate'
        },
        sidebarCollapsed: false,
        
        // Actions
        setCurrencyView: (view) => set({ currencyView: view }, false, 'setCurrencyView'),
        
        setActiveRate: (rate) => set({ activeRate: rate }, false, 'setActiveRate'),
        
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          currencyView: state.currencyView,
          activeRate: state.activeRate,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'AppStore',
    }
  )
)

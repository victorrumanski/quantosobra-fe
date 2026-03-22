import React from 'react'

export type FinanceContextValue = {
  session: any
  month: string
}

export const FinanceContext = React.createContext<FinanceContextValue | null>(null)

export const useFinanceContext = () => {
  const context = React.useContext(FinanceContext)
  if (!context) throw new Error('useFinanceContext must be used within FinanceContext.Provider')
  return context
}

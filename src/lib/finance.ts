import { useEffect } from 'react'
import { supabase } from './supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// --- Types ---
export type TransactionType = 'despesa' | 'receita'
export const TransactionType = {
  DESPESA: 'despesa' as const,
  RECEITA: 'receita' as const,
}

export interface Transaction {
  id: string
  transaction_date: string
  description: string
  details: string
  category: string
  account: string
  type: TransactionType
  amount: number
  account_id?: string
  category_id?: string
}

export interface Budget {
  id?: string
  user_id?: string
  category_id: string
  plan_month: string
  amount: number
  category?: { name: string } // Support for the join
}

export interface Category {
  id: string
  name: string
}

export interface Account {
  id: string
  name: string
}

// --- Service ---
export const financeService = {
  async getAccounts() {
    const { data, error } = await supabase.from('accounts').select('*').order('name')
    if (error) throw error
    return data as Account[]
  },
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('name')
    if (error) throw error
    return data as Category[]
  },
  async getTransactions(month: string) {
    const [y, m] = month.split('-').map(Number)
    const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${(m + 1).toString().padStart(2, '0')}`
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, accounts(name), categories(name)')
      .gte('transaction_date', `${month}-01`)
      .lt('transaction_date', `${nextMonth}-01`)
      .order('transaction_date', { ascending: false })
    if (error) throw error
    return (data || []).map(t => ({
      ...t,
      description: t.description || '',
      details: t.details || '',
      amount: Math.abs(Number(t.amount)),
      type: Number(t.amount) >= 0 ? TransactionType.RECEITA : TransactionType.DESPESA,
      account: t.accounts?.name || '',
      category: t.categories?.name || '',
    })) as Transaction[]
  },
  async getBudgets(month: string) {
    const planMonth = `${month}-01`
    const { data, error } = await supabase.from('category_plan').select('*, categories(name)').eq('plan_month', planMonth)
    if (error) throw error
    return (data || []).map(p => ({
      ...p,
      amount: Number(p.amount),
      category: p.categories
    })) as Budget[]
  },
  async createTransaction(payload: any) {
    const { data, error } = await supabase.from('transactions').insert(payload).select().single()
    if (error) throw error
    return data
  },
  async updateTransaction(id: string, payload: any) {
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
  },
  async saveAllBudgets(list: any[]) {
    if (list.length === 0) return
    const { error } = await supabase.from('category_plan').upsert(list)
    if (error) throw error
  }
}

// --- Hook ---
export function useFinanceData(month: string, userId?: string) {
  const queryClient = useQueryClient()
  const accountsQ = useQuery({ 
    queryKey: ['accounts'], 
    queryFn: financeService.getAccounts, 
    enabled: !!userId,
    staleTime: 1000 * 60 * 10 // 10 minutes for accounts
  })
  const categoriesQ = useQuery({ 
    queryKey: ['categories'], 
    queryFn: financeService.getCategories, 
    enabled: !!userId,
    staleTime: 1000 * 60 * 10 // 10 minutes for categories
  })
  const transactionsQ = useQuery({ 
    queryKey: ['transactions', month], 
    queryFn: () => financeService.getTransactions(month), 
    enabled: !!userId 
  })
  const budgetsQ = useQuery({ 
    queryKey: ['budgets', month], 
    queryFn: () => financeService.getBudgets(month), 
    enabled: !!userId 
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const addTx = useMutation({ 
    mutationFn: financeService.createTransaction, 
    onSuccess: () => { invalidate(); toast.success('Adicionado com sucesso!') } 
  })
  const updateTx = useMutation({ 
    mutationFn: ({ id, payload }: any) => financeService.updateTransaction(id, payload), 
    onSuccess: () => { invalidate(); toast.success('Atualizado com sucesso!') } 
  })
  const deleteTx = useMutation({ 
    mutationFn: financeService.deleteTransaction, 
    onSuccess: () => { invalidate(); toast.success('Excluído com sucesso!') } 
  })
  const saveBudgets = useMutation({ 
    mutationFn: financeService.saveAllBudgets, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Planejamento salvo!') } 
  })

  // --- Auto-provisioning for new users ---
  useEffect(() => {
    if (!userId || accountsQ.isLoading || categoriesQ.isLoading) return

    const provision = async () => {
      const hasNoAccounts = accountsQ.isSuccess && accountsQ.data?.length === 0
      const hasNoCategories = categoriesQ.isSuccess && categoriesQ.data?.length === 0

      console.log('Provisioning check:', { userId, hasNoAccounts, hasNoCategories })

      if (hasNoAccounts) {
        console.log('Creating default accounts...')
        const defaults = ['Banco', 'Cartão Credito']
        await supabase.from('accounts').insert(defaults.map(name => ({ user_id: userId, name })))
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
      }

      if (hasNoCategories) {
        console.log('Creating default categories...')
        const defaults = ["Mercado", "Lazer", "Lanches", "Transporte", "Financiamentos", "Escola", "Assinaturas", "Gastos da Casa", "Eletrodomesticos", "Roupas", "Comunicação", "Presentes", "Reformas", "Concertos", "Saude", "Beleza", "Estudos", "Viagens", "Gasolina", "Outros"]
        await supabase.from('categories').insert(defaults.map(name => ({ user_id: userId, name })))
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      }
    }

    provision()
  }, [userId, accountsQ.isSuccess, categoriesQ.isSuccess, accountsQ.isLoading, categoriesQ.isLoading])

  return {
    accounts: accountsQ.data || [],
    categories: categoriesQ.data || [],
    transactions: transactionsQ.data || [],
    budgets: budgetsQ.data || [],
    isLoading: accountsQ.isLoading || categoriesQ.isLoading || transactionsQ.isLoading || budgetsQ.isLoading,
    mutations: { addTx, updateTx, deleteTx, saveBudgets }
  }
}

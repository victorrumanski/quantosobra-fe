import { useEffect, useState } from 'react'
import { LogOut, Plus, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useFinanceData } from '../lib/finance'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { useFinanceContext } from '../context/finance-context'

export default function Configuracoes() {
  const { session, month } = useFinanceContext()
  const { accounts, categories } = useFinanceData(month, session?.user?.id)
  const queryClient = useQueryClient()
  const [accountDrafts, setAccountDrafts] = useState<Record<string, string>>({})
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    setAccountDrafts(Object.fromEntries(accounts.map(a => [a.id, a.name])))
  }, [accounts])

  useEffect(() => {
    setCategoryDrafts(Object.fromEntries(categories.map(c => [c.id, c.name])))
  }, [categories])

  const add = async (table: string) => {
    const name = prompt(`Nome da nova ${table === 'accounts' ? 'conta' : 'categoria'}:`)
    if (name) {
      const { error } = await supabase.from(table).insert({ name, user_id: session.user.id })
      if (!error) {
        queryClient.invalidateQueries({ queryKey: [table] })
        toast.success(`${table === 'accounts' ? 'Conta' : 'Categoria'} adicionada!`)
      }
    }
  }

  const del = async (table: string, id: string, name: string) => {
    if (confirm(`Excluir ${name}?`)) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (!error) {
        queryClient.invalidateQueries({ queryKey: [table] })
        toast.success(`${table === 'accounts' ? 'Conta' : 'Categoria'} excluída!`)
      }
    }
  }

  const saveName = async (table: 'accounts' | 'categories', id: string, currentName: string, draftName: string) => {
    const nextName = draftName.trim()
    if (!nextName || nextName === currentName) return

    const { error } = await supabase
      .from(table)
      .update({ name: nextName })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      return
    }

    queryClient.invalidateQueries({ queryKey: [table] })
    toast.success(`${table === 'accounts' ? 'Conta' : 'Categoria'} atualizada!`)
  }

  return (
    <div className="panel">
      <h3>Contas</h3>
      <div className="budget-grid settings-grid-block">
        {accounts.map(a => (
          <div key={a.id} className="budget-card settings-row-card">
            <input
              type="text"
              className="settings-name-input"
              value={accountDrafts[a.id] ?? a.name}
              onChange={e => setAccountDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
            />
            <div className="settings-actions-row">
              <button
                onClick={() => saveName('accounts', a.id, a.name, accountDrafts[a.id] ?? a.name)}
                className="btn small"
                disabled={!(accountDrafts[a.id] ?? a.name).trim() || (accountDrafts[a.id] ?? a.name).trim() === a.name}
              >
                Salvar
              </button>
              <button onClick={() => del('accounts', a.id, a.name)} className="btn danger small"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <button onClick={() => add('accounts')} className="btn-primary-large"><Plus size={16} /> Adicionar Conta</button>
      </div>

      <h3>Categorias</h3>
      <div className="budget-grid settings-grid-block">
        {categories.map(c => (
          <div key={c.id} className="budget-card settings-row-card">
            <input
              type="text"
              className="settings-name-input"
              value={categoryDrafts[c.id] ?? c.name}
              onChange={e => setCategoryDrafts(prev => ({ ...prev, [c.id]: e.target.value }))}
            />
            <div className="settings-actions-row">
              <button
                onClick={() => saveName('categories', c.id, c.name, categoryDrafts[c.id] ?? c.name)}
                className="btn small"
                disabled={!(categoryDrafts[c.id] ?? c.name).trim() || (categoryDrafts[c.id] ?? c.name).trim() === c.name}
              >
                Salvar
              </button>
              <button onClick={() => del('categories', c.id, c.name)} className="btn danger small"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <button onClick={() => add('categories')} className="btn-primary-large"><Plus size={16} /> Adicionar Categoria</button>
      </div>

      <div className="settings-signout-wrap">
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} className="btn danger">
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>
    </div>
  )
}

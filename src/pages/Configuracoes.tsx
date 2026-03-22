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

  return (
    <div className="panel">
      <h3>Contas</h3>
      <div className="budget-grid settings-grid-block">
        {accounts.map(a => (
          <div key={a.id} className="budget-card settings-row-card">
            <span>{a.name}</span>
            <button onClick={() => del('accounts', a.id, a.name)} className="btn danger small"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => add('accounts')} className="btn-primary-large"><Plus size={16} /> Adicionar Conta</button>
      </div>

      <h3>Categorias</h3>
      <div className="budget-grid settings-grid-block">
        {categories.map(c => (
          <div key={c.id} className="budget-card settings-row-card">
            <span>{c.name}</span>
            <button onClick={() => del('categories', c.id, c.name)} className="btn danger small"><Trash2 size={14} /></button>
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

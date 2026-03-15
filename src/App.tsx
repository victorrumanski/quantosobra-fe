import React, { useState, useEffect, useMemo } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useFinanceData, TransactionType, type Transaction } from './lib/finance'

// --- Context for state sharing ---
const FinanceContext = React.createContext<{ session: any; month: string } | null>(null)
const useFinanceContext = () => React.useContext(FinanceContext)!

// --- Utils ---
const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// --- Layout & Auth ---
function Auth() {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const email = form.email.trim()
    const password = form.password.trim()

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) alert(error.message)
    else if (mode === 'signup') alert('Conta criada! Tente fazer login.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <main className="panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <h1 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '2rem' }}>Quanto Sobra?</h1>
        <form onSubmit={handleSubmit} className="form-col">
          <label>Email <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Senha <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--primary)', width: '100%' }}>
          {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Login'}
        </button>
      </main>
    </div>
  )
}

function Layout({ children, month, setMonth }: any) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = location.pathname

  return (
    <div className="container" style={{ padding: '0' }}>
      <header className="header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Quanto Sobra?</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>Gestão Simplificada</p>
        </div>
        <div className="month-selector">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
      </header>
      <nav className="tabs" style={{ padding: '0 1.5rem' }}>
        <button onClick={() => navigate({ to: '/' })} className={activeTab === '/' ? 'active' : ''}>Gastos</button>
        <button onClick={() => navigate({ to: '/receitas' })} className={activeTab === '/receitas' ? 'active' : ''}>Receitas</button>
        <button onClick={() => navigate({ to: '/relatorios' })} className={activeTab === '/relatorios' ? 'active' : ''}>Relatórios</button>
        <button onClick={() => navigate({ to: '/planejamento' })} className={activeTab === '/planejamento' ? 'active' : ''}>Planejamento</button>
        <button onClick={() => navigate({ to: '/config' })} className={activeTab === '/config' ? 'active' : ''}>⚙️</button>
      </nav>
      <main style={{ padding: '1.5rem' }}>{children}</main>
    </div>
  )
}

// --- Route Components ---
function MeusGastos() {
  const { session, month } = useFinanceContext()
  const { accounts, categories, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [activeAccountTab, setActiveAccountTab] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'transaction_date', direction: 'desc' })

  const [form, setForm] = useState({
    day: new Date().getDate().toString().padStart(2, '0'),
    desc: '',
    details: '',
    cat: '',
    acc: '',
    amt: '',
  })

  useEffect(() => {
    if (accounts[0] && !form.acc) setForm(f => ({ ...f, acc: accounts[0].name }))
    if (categories[0] && !form.cat) setForm(f => ({ ...f, cat: categories[0].name }))
  }, [accounts, categories])

  const totals = useMemo(() => {
    const list = transactions.filter(t => t.type === TransactionType.DESPESA)
    const accTotals: Record<string, number> = {}
    list.forEach(t => accTotals[t.account] = (accTotals[t.account] || 0) + t.amount)
    return {
      total: list.reduce((a, b) => a + b.amount, 0),
      byAccount: accTotals
    }
  }, [transactions, month])

  const filteredData = useMemo(() => {
    let list = transactions.filter(t => t.type === TransactionType.DESPESA)
    if (activeAccountTab !== 'Todas') {
      list = list.filter(t => t.account === activeAccountTab)
    }

    if (sortConfig) {
      list.sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return list
  }, [transactions, month, activeAccountTab, sortConfig])

  const handleSort = (key: keyof Transaction) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = Number(form.amt.replace(',', '.'))
    if (!val) return
    const payload = {
      user_id: session.user.id,
      amount: -val,
      description: form.desc,
      details: form.details,
      transaction_date: `${month}-${form.day}`,
      account_id: accounts.find(a => a.name === form.acc)?.id,
      category_id: categories.find(c => c.name === form.cat)?.id,
    }
    if (editingId) await mutations.updateTx.mutateAsync({ id: editingId, payload })
    else await mutations.addTx.mutateAsync(payload)
    setEditingId(null)
    setForm({ ...form, desc: '', details: '', amt: '' })
  }

  const onEdit = (t: Transaction) => {
    setEditingId(t.id)
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      cat: t.category,
      acc: t.account,
      amt: t.amount.toString().replace('.', ','),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="layout-split">
      <aside className="layout-sidebar">
        <section className={`panel ${editingId ? 'editing' : ''}`}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar' : 'Novo Gasto'}</h2>
          <form onSubmit={onSubmit} className="form-col">
            <label>Conta <select value={form.acc} onChange={e => setForm({ ...form, acc: e.target.value })}>{accounts.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
            <label>Dia <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: e.target.value.padStart(2, '0') })} required /></label>
            <label>Nome <input type="text" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>
            <label>Valor <input type="text" placeholder="0,00" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} required /></label>
            <label>Categoria <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></label>
            <label>Detalhes <input type="text" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>{editingId ? 'Salvar' : 'Adicionar'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="btn danger">Cancelar</button>}
            </div>
          </form>
        </section>
      </aside>

      <main className="layout-main">
        <section className="panel">
          <nav className="tabs" style={{ marginBottom: '1.5rem' }}>
            <button onClick={() => setActiveAccountTab('Todas')} className={activeAccountTab === 'Todas' ? 'active' : ''}>
              Todas: {formatCurrency(totals.total)}
            </button>
            {accounts.map(acc => (
              <button key={acc.id} onClick={() => setActiveAccountTab(acc.name)} className={activeAccountTab === acc.name ? 'active' : ''}>
                {acc.name}: {formatCurrency(totals.byAccount[acc.name] || 0)}
              </button>
            ))}
          </nav>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('transaction_date')} style={{ cursor: 'pointer' }}>Data ↕️</th>
                  <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>Gasto ↕️</th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Categoria ↕️</th>
                  <th onClick={() => handleSort('amount')} style={{ textAlign: 'right', cursor: 'pointer' }}>Valor ↕️</th>
                  <th className="col-actions" style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>
                      <strong>{t.description}</strong>
                      {t.details && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.details}</div>}
                    </td>
                    <td><span className="badge">{t.category}</span></td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(t.amount)}</td>
                    <td className="col-actions" style={{ textAlign: 'right' }}>
                      <button onClick={() => onEdit(t)} className="btn small" style={{ marginRight: '0.3rem' }}>✏️</button>
                      <button onClick={() => mutations.deleteTx.mutate(t.id)} className="btn danger small">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function Receitas() {
  const { session, month } = useFinanceContext()
  const { accounts, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [editingId, setEditingId] = useState<string | null>(null)

  const list = useMemo(() => transactions.filter(t => t.type === TransactionType.RECEITA).sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)), [transactions, month])

  const [form, setForm] = useState({
    day: new Date().getDate().toString().padStart(2, '0'),
    desc: '',
    amt: '',
    acc: '',
    details: ''
  })

  useEffect(() => {
    if (accounts[0] && !form.acc) setForm(f => ({ ...f, acc: accounts[0].name }))
  }, [accounts])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const accId = accounts.find(a => a.name === form.acc)?.id
    if (!accId) return

    const payload = {
      user_id: session.user.id,
      amount: Number(form.amt.replace(',', '.')),
      description: form.desc,
      details: form.details,
      transaction_date: `${month}-${form.day}`,
      account_id: accId
    }

    if (editingId) await mutations.updateTx.mutateAsync({ id: editingId, payload })
    else await mutations.addTx.mutateAsync(payload)

    setEditingId(null)
    setForm({ ...form, desc: '', amt: '', details: '' })
  }

  const onEdit = (t: Transaction) => {
    setEditingId(t.id)
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      acc: t.account,
      amt: t.amount.toString().replace('.', ','),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="layout-split">
      <aside className="layout-sidebar">
        <section className={`panel ${editingId ? 'editing' : ''}`}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Editar Receita' : 'Nova Receita'}</h2>
          <form onSubmit={onSubmit} className="form-col">
            <label>Conta <select value={form.acc} onChange={e => setForm({ ...form, acc: e.target.value })}>{accounts.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
            <label>Dia <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: e.target.value.padStart(2, '0') })} required /></label>
            <label>Nome <input type="text" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>
            <label>Valor <input type="text" placeholder="0,00" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} required /></label>
            <label>Detalhes <input type="text" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn" style={{ flex: 1 }}>{editingId ? 'Salvar' : 'Adicionar'}</button>
              {editingId && <button type="button" onClick={() => setEditingId(null)} className="btn danger">Cancelar</button>}
            </div>
          </form>
        </section>
      </aside>

      <main className="layout-main">
        <section className="panel">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nome</th>
                  <th>Conta</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th className="col-actions" style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>
                      <strong>{t.description}</strong>
                      {t.details && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.details}</div>}
                    </td>
                    <td><span className="badge">{t.account}</span></td>
                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(t.amount)}</td>
                    <td className="col-actions" style={{ textAlign: 'right' }}>
                      <button onClick={() => onEdit(t)} className="btn small" style={{ marginRight: '0.3rem' }}>✏️</button>
                      <button onClick={() => mutations.deleteTx.mutate(t.id)} className="btn danger small">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function Relatorios() {
  const { session, month } = useFinanceContext()
  const { categories, transactions, budgets } = useFinanceData(month, session?.user?.id)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const monthDespesas = useMemo(() => transactions.filter(t => t.type === TransactionType.DESPESA), [transactions])
  const totalReceita = useMemo(() => transactions.filter(t => t.type === TransactionType.RECEITA).reduce((a, b) => a + b.amount, 0), [transactions])
  const totalDespesa = useMemo(() => monthDespesas.reduce((a, b) => a + b.amount, 0), [monthDespesas])

  const statsByCat = useMemo(() => {
    const map: Record<string, { total: number; txs: any[] }> = {}
    monthDespesas.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, txs: [] }
      map[t.category].total += t.amount
      map[t.category].txs.push(t)
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }, [monthDespesas])

  return (
    <>
      <div className="summary">
        <div className="card receita"><h3>Receita</h3><strong>{formatCurrency(totalReceita)}</strong></div>
        <div className="card despesa"><h3>Despesa</h3><strong>{formatCurrency(totalDespesa)}</strong></div>
        <div className="card saldo"><h3>Saldo</h3><strong>{formatCurrency(totalReceita - totalDespesa)}</strong></div>
      </div>

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Gastos por Categoria</h2>
        {statsByCat.map(([cat, data]) => {
          const catId = categories.find(c => c.name === cat)?.id
          const limit = budgets.find(b => b.category_id === catId)?.amount || 0
          const percentOfTotal = ((data.total / (totalDespesa || 1)) * 100).toFixed(1)
          const isExpanded = expandedCat === cat

          return (
            <div key={cat} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div
                onClick={() => setExpandedCat(isExpanded ? null : cat)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{isExpanded ? '▼' : '▶'}</span>
                  <strong>{cat}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>({percentOfTotal}%)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{formatCurrency(data.total)}</div>
                  {limit > 0 && (
                    <div style={{ fontSize: '0.75rem', color: data.total > limit ? 'var(--danger)' : 'var(--success)' }}>
                      Limite: {formatCurrency(limit)}
                      <span style={{ marginLeft: '0.4rem', fontWeight: 'bold' }}>
                        ({data.total > limit ? `gastou a mais ${formatCurrency(data.total - limit)}` : `economizou ${formatCurrency(limit - data.total)}`})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                    <span>% do Total ({percentOfTotal}%)</span>
                  </div>
                  <div className="progress" style={{ height: '6px' }}>
                    <div className="fill" style={{ width: `${percentOfTotal}%`, background: 'var(--primary)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                    <span>Uso do Limite ({limit > 0 ? ((data.total / limit) * 100).toFixed(1) : '100'}%)</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="fill"
                      style={{
                        width: `${Math.min(100, (data.total / (limit || data.total)) * 100)}%`,
                        background: limit > 0 && data.total > limit ? 'var(--danger)' : 'var(--success)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '1rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.txs.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text)' }}>
                      <div>
                        <span style={{ color: 'var(--muted)', marginRight: '0.5rem' }}>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>{t.description}</span>
                        {t.details && <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({t.details})</span>}
                      </div>
                      <strong>{formatCurrency(t.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function Planejamento() {
  const { session, month } = useFinanceContext()
  const { categories, budgets, mutations } = useFinanceData(month, session?.user?.id)
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const map: Record<string, string> = {}
    categories.forEach(c => {
      const b = budgets.find(x => x.category_id === c.id)
      map[c.id] = b ? b.amount.toString().replace('.', ',') : ''
    })
    setValues(map)
  }, [categories, budgets])

  const onSave = async () => {
    const list = Object.entries(values).map(([catId, v]) => {
      const amount = Number(v.replace(',', '.'))
      if (isNaN(amount)) return null
      // Get existing ID if available to allow upsert to work correctly
      const existing = budgets.find(b => b.category_id === catId)
      return {
        id: existing?.id,
        user_id: session.user.id,
        category_id: catId,
        plan_month: `${month}-01`,
        amount: amount
      }
    }).filter(x => x !== null)

    await mutations.saveBudgets.mutateAsync(list)
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '600px' }}>
          Estipule um teto de gastos para cada categoria. No <strong>Relatórios</strong>, 
          você poderá ver o quanto economizou ou se ultrapassou o planejado.
        </p>
        <button className="btn" onClick={onSave} disabled={mutations.saveBudgets.isPending}>
          {mutations.saveBudgets.isPending ? 'Salvando...' : 'Salvar Planejamento'}
        </button>
      </div>
      <div className="budget-grid">
        {categories.map(c => (
          <div key={c.id} className="budget-card">
            <div className="budget-card-header">
              <h3>{c.name}</h3>
              <input
                type="text"
                placeholder="0,00"
                style={{ width: '100px', padding: '0.2rem' }}
                value={values[c.id] || ''}
                onChange={e => setValues({ ...values, [c.id]: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Configuracoes() {
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
      <div className="budget-grid" style={{ marginBottom: '2rem' }}>
        {accounts.map(a => (
          <div key={a.id} className="budget-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{a.name}</span>
            <button onClick={() => del('accounts', a.id, a.name)} className="btn danger small">🗑️</button>
          </div>
        ))}
        <button onClick={() => add('accounts')} className="btn">Adicionar Conta</button>
      </div>

      <h3>Categorias</h3>
      <div className="budget-grid" style={{ marginBottom: '2rem' }}>
        {categories.map(c => (
          <div key={c.id} className="budget-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{c.name}</span>
            <button onClick={() => del('categories', c.id, c.name)} className="btn danger small">🗑️</button>
          </div>
        ))}
        <button onClick={() => add('categories')} className="btn">Adicionar Categoria</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <button onClick={() => { supabase.auth.signOut(); window.location.reload() }} className="btn danger">Sair da Conta</button>
      </div>
    </div>
  )
}

// --- Router Setup ---
const rootRoute = createRootRoute({
  component: () => {
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
      const { data } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
      return () => data.subscription.unsubscribe()
    }, [])

    if (loading && !session) return <div className="loader">Carregando...</div>
    if (!session) return <Auth />

    return (
      <FinanceContext.Provider value={{ session, month }}>
        <Toaster position="bottom-right" />
        <Layout month={month} setMonth={setMonth}>
          <Outlet />
        </Layout>
      </FinanceContext.Provider>
    )
  }
})

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: MeusGastos }),
  createRoute({ getParentRoute: () => rootRoute, path: '/receitas', component: Receitas }),
  createRoute({ getParentRoute: () => rootRoute, path: '/relatorios', component: Relatorios }),
  createRoute({ getParentRoute: () => rootRoute, path: '/planejamento', component: Planejamento }),
  createRoute({ getParentRoute: () => rootRoute, path: '/config', component: Configuracoes }),
])

export const router = createRouter({ routeTree })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
export default function App() { return null }

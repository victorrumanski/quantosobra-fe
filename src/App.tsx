import React, { useState, useEffect, useMemo } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useFinanceData, TransactionType, type Transaction } from './lib/finance'
import {
  Settings,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  ArrowUpDown,
  BarChart3,
  Target,
  Plus,
  LogOut,
  CircleDollarSign,
  BanknoteArrowDown,
  BanknoteArrowUp,
  PiggyBank,
  X
} from 'lucide-react'

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
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ background: 'var(--primary)', color: 'white', padding: '0.8rem', borderRadius: '1rem', marginBottom: '1.2rem', display: 'flex' }}>
            <PiggyBank size={42} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Quanto Sobra?</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Controle seus gastos para sobrar mais no fim do mês
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-col">
          <label>Email
            <input
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>Senha
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="btn" style={{ width: '100%', height: '48px', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          style={{ marginTop: '1.2rem', background: 'none', border: 'none', color: 'var(--primary)', width: '100%', cursor: 'pointer', fontWeight: 600 }}
        >
          {mode === 'login' ? 'Ainda não tem uma conta? Cadastre-se' : 'Já possui uma conta? Faça o login'}
        </button>

        <div className="auth-features">
          <div className="feature-item">
            <BarChart3 size={18} className="text-primary" />
            <span>Relatórios visuais de gastos e lucros</span>
          </div>
          <div className="feature-item">
            <Target size={18} className="text-primary" />
            <span>Planejamento por categoria de custo</span>
          </div>
          <div className="feature-item">
            <CircleDollarSign size={18} className="text-primary" />
            <span>Controle total do seu saldo mensal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Layout({ children, month, setMonth }: any) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = location.pathname
  const { session } = useFinanceContext()

  return (
    <div className="container">
      <header className="header">
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex' }}>
            <PiggyBank size={24} />
          </div>
          <div>
            <h1 style={{ marginBottom: '2px' }}>Quanto Sobra?</h1>
            <p>Controle seus gastos mensais</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button onClick={() => navigate({ to: '/' })} className={`nav-item ${activeTab === '/' ? 'active' : ''}`}>
            <BanknoteArrowDown size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Gastos
          </button>
          <button onClick={() => navigate({ to: '/receitas' })} className={`nav-item ${activeTab === '/receitas' ? 'active' : ''}`}>
            <BanknoteArrowUp size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Receitas
          </button>
          <button onClick={() => navigate({ to: '/relatorios' })} className={`nav-item ${activeTab === '/relatorios' ? 'active' : ''}`}>
            <BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Relatórios
          </button>
          <button onClick={() => navigate({ to: '/planejamento' })} className={`nav-item ${activeTab === '/planejamento' ? 'active' : ''}`}>
            <Target size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Planejamento
          </button>
          <button onClick={() => navigate({ to: '/config' })} className={`nav-item ${activeTab === '/config' ? 'active' : ''}`}>
            <Settings size={18} style={{ verticalAlign: 'middle' }} />
          </button>
        </nav>

        <div className="header-actions">
          <div className="month-selector">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="user-profile" title={session?.user?.email}>
            <span className="user-icon"><User size={18} /></span>
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  )
}

type GastoFormState = {
  day: string
  desc: string
  details: string
  cat: string
  acc: string
  amt: string
}

function GastoModal({
  isOpen,
  editingId,
  form,
  setForm,
  accounts,
  categories,
  onSubmit,
  onClose,
  onDelete,
  allowConfirmPlusOne = false,
}: {
  isOpen: boolean
  editingId: string | null
  form: GastoFormState
  setForm: (next: GastoFormState) => void
  accounts: Account[]
  categories: Category[]
  onSubmit: (e: React.FormEvent, keepOpen?: boolean) => void | Promise<void>
  onClose: () => void
  onDelete?: () => void | Promise<void>
  allowConfirmPlusOne?: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingId ? 'Editar Gasto' : 'Novo Gasto'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit} className="form-col">
            <label>Conta <select value={form.acc} onChange={e => setForm({ ...form, acc: e.target.value })}>{accounts.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
            <label>Dia <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: e.target.value.padStart(2, '0') })} required /></label>
            <label>Nome <input type="text" placeholder="Origem do gasto" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>
            <label>Valor <input type="text" placeholder="0,00" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} required /></label>
            <label>Categoria <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></label>
            <label>Detalhes <input type="text" placeholder="Opcional" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn" style={{ flex: 1, height: '44px', marginTop: 0 }}>{editingId ? 'Salvar Alterações' : 'Confirmar Gasto'}</button>
              {!editingId && allowConfirmPlusOne && (
                <button type="button" className="btn" style={{ flex: 1, height: '44px', marginTop: 0, background: 'var(--success)' }} onClick={e => onSubmit(e as any, true)}>Confirmar +1</button>
              )}
              {editingId && onDelete && (
                <button type="button" onClick={onDelete} className="btn danger" style={{ height: '44px', marginTop: 0 }}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// --- Route Components ---
function MeusGastos() {
  const { session, month } = useFinanceContext()
  const { accounts, categories, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [activeAccountTab, setActiveAccountTab] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const onSubmit = async (e: React.FormEvent, keepOpen = false) => {
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
    let res;
    if (editingId) res = await mutations.updateTx.mutateAsync({ id: editingId, payload })
    else res = await mutations.addTx.mutateAsync(payload)

    if (res?.id) {
      setHighlightedId(res.id)
      setTimeout(() => setHighlightedId(null), 2000)
    }
    if (keepOpen) {
      setForm(f => ({ ...f, desc: '', details: '', amt: '' }))
    } else {
      closeModal()
    }
  }

  const onEdit = (t: Transaction) => {
    setEditingId(t.id)
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      cat: t.category,
      acc: t.account,
      amt: Math.abs(t.amount).toString().replace('.', ','),
    })
    setIsModalOpen(true)
  }

  const onAdd = () => {
    setEditingId(null)
    setForm({
      ...form,
      day: new Date().getDate().toString().padStart(2, '0'),
      desc: '',
      details: '',
      amt: '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (editingId && confirm('Excluir este gasto?')) {
      await mutations.deleteTx.mutateAsync(editingId)
      closeModal()
    }
  }

  return (
    <>
      <div className="mobile-view-header">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          Gerencie seus gastos mensais
        </p>
        <button onClick={onAdd} className="btn-primary-large">
          <Plus size={20} /> Novo Gasto
        </button>
      </div>

      <section className="panel">
        <div className="account-filter-row" style={{ marginBottom: '1.5rem' }}>
          <span className="account-filter-label">Total de gastos: {formatCurrency(totals.total)}</span>
          <select
            className="account-filter-select"
            value={activeAccountTab}
            onChange={e => setActiveAccountTab(e.target.value)}
          >
            <option value="Todas">Todas as Contas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.name}>
                {acc.name} ({formatCurrency(totals.byAccount[acc.name] || 0)})
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('transaction_date')} style={{ cursor: 'pointer' }}>Data <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>Gasto <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Categoria <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('amount')} style={{ textAlign: 'right', cursor: 'pointer' }}>Valor <ArrowUpDown size={14} /></th>
                <th className="col-actions" style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className={highlightedId === t.id ? 'row-highlight' : ''}>
                  <td>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>
                    <strong>{t.description}</strong>
                    {t.details && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.details}</div>}
                  </td>
                  <td><span className="badge">{t.category}</span></td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(t.amount)}</td>
                  <td className="col-actions" style={{ textAlign: 'right' }}>
                    <button onClick={() => onEdit(t)} className="btn small"><Pencil size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <GastoModal
        isOpen={isModalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        accounts={accounts}
        categories={categories}
        onSubmit={onSubmit}
        onClose={closeModal}
        onDelete={handleDelete}
        allowConfirmPlusOne
      />
    </>
  )
}


function Receitas() {
  const { session, month } = useFinanceContext()
  const { accounts, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [activeAccountFilter, setActiveAccountFilter] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totals = useMemo(() => {
    const list = transactions.filter(t => t.type === TransactionType.RECEITA)
    const accTotals: Record<string, number> = {}
    list.forEach(t => accTotals[t.account] = (accTotals[t.account] || 0) + t.amount)
    return {
      total: list.reduce((a, b) => a + b.amount, 0),
      byAccount: accTotals
    }
  }, [transactions, month])

  const list = useMemo(() => {
    let result = transactions.filter(t => t.type === TransactionType.RECEITA)
    if (activeAccountFilter !== 'Todas') {
      result = result.filter(t => t.account === activeAccountFilter)
    }
    return result.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
  }, [transactions, month, activeAccountFilter])

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

    let res;
    if (editingId) res = await mutations.updateTx.mutateAsync({ id: editingId, payload })
    else res = await mutations.addTx.mutateAsync(payload)

    if (res?.id) {
      setHighlightedId(res.id)
      setTimeout(() => setHighlightedId(null), 2000)
    }

    closeModal()
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
    setIsModalOpen(true)
  }

  const onAdd = () => {
    setEditingId(null)
    setForm({
      ...form,
      day: new Date().getDate().toString().padStart(2, '0'),
      desc: '',
      amt: '',
      details: ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const handleDelete = async () => {
    if (editingId && confirm('Excluir esta receita?')) {
      await mutations.deleteTx.mutateAsync(editingId)
      closeModal()
    }
  }

  return (
    <>
      <div className="mobile-view-header">
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
          Registre suas entradas e acompanhe o crescimento do seu saldo
        </p>
        <button onClick={onAdd} className="btn-primary-large">
          <Plus size={20} /> Nova Receita
        </button>
      </div>

      <section className="panel">
        <div className="account-filter-row" style={{ marginBottom: '1.5rem' }}>
          <span className="account-filter-label">Total de receitas: {formatCurrency(totals.total)}</span>
          <select
            className="account-filter-select"
            value={activeAccountFilter}
            onChange={e => setActiveAccountFilter(e.target.value)}
          >
            <option value="Todas">Todas as Contas</option>
            {accounts.map(a => (
              <option key={a.id} value={a.name}>
                {a.name} ({formatCurrency(totals.byAccount[a.name] || 0)})
              </option>
            ))}
          </select>
        </div>

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
                <tr key={t.id} className={highlightedId === t.id ? 'row-highlight' : ''}>
                  <td>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>
                    <strong>{t.description}</strong>
                    {t.details && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.details}</div>}
                  </td>
                  <td><span className="badge">{t.account}</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 'bold' }}>{formatCurrency(t.amount)}</td>
                  <td className="col-actions" style={{ textAlign: 'right' }}>
                    <button onClick={() => onEdit(t)} className="btn small"><Pencil size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Editar Receita' : 'Nova Receita'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={onSubmit} className="form-col">
                <label>Conta <select value={form.acc} onChange={e => setForm({ ...form, acc: e.target.value })}>{accounts.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
                <label>Dia <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: e.target.value.padStart(2, '0') })} required /></label>
                <label>Nome <input type="text" placeholder="Ex: Salário, Venda, etc" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>
                <label>Valor <input type="text" placeholder="0,00" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} required /></label>
                <label>Detalhes <input type="text" placeholder="Opcional" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1, height: '44px', marginTop: 0 }}>{editingId ? 'Salvar Alterações' : 'Confirmar Receita'}</button>
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="btn danger" style={{ height: '44px', marginTop: 0 }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Relatorios() {
  const { session, month } = useFinanceContext()
  const { accounts, categories, transactions, budgets, mutations } = useFinanceData(month, session?.user?.id)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<GastoFormState>({
    day: new Date().getDate().toString().padStart(2, '0'),
    desc: '',
    details: '',
    cat: '',
    acc: '',
    amt: '',
  })

  const filteredTxs = useMemo(() => {
    if (accountFilter === 'Todas') return transactions
    return transactions.filter(t => t.account === accountFilter)
  }, [transactions, accountFilter])

  const monthDespesas = useMemo(() => filteredTxs.filter(t => t.type === TransactionType.DESPESA), [filteredTxs])
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

  useEffect(() => {
    if (accounts[0] && !form.acc) setForm(f => ({ ...f, acc: accounts[0].name }))
    if (categories[0] && !form.cat) setForm(f => ({ ...f, cat: categories[0].name }))
  }, [accounts, categories])

  const onEdit = (t: Transaction) => {
    setEditingId(t.id)
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      cat: t.category,
      acc: t.account,
      amt: Math.abs(t.amount).toString().replace('.', ','),
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

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

    await mutations.updateTx.mutateAsync({ id: editingId, payload })
    closeModal()
  }

  const handleDelete = async () => {
    if (editingId && confirm('Excluir este gasto?')) {
      await mutations.deleteTx.mutateAsync(editingId)
      closeModal()
    }
  }

  return (
    <>
      <div className="mobile-view-header" style={{ marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--muted)' }}>
          Aqui você descobre em qual categoria seu orçamento está estourando ou economizando
        </span>
        <select
          className="account-filter-select"
          value={accountFilter}
          onChange={e => setAccountFilter(e.target.value)}
        >
          <option value="Todas">Todas as Contas</option>
          {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
      </div>
      <div className="summary">
        <div className="card receita">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BanknoteArrowUp size={16} /> Receita</h3>
          <strong>{formatCurrency(totalReceita)}</strong>
        </div>
        <div className="card despesa">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BanknoteArrowDown size={16} /> Despesa</h3>
          <strong>{formatCurrency(totalDespesa)}</strong>
        </div>
        <div className="card saldo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CircleDollarSign size={16} /> Saldo</h3>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: (totalReceita - totalDespesa) >= 0 ? 'var(--success)' : 'var(--danger)',
              background: (totalReceita - totalDespesa) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '0.2rem 0.5rem',
              borderRadius: '999px'
            }}>
              {(totalReceita - totalDespesa) >= 0 ? 'economizou' : 'gastou a mais'}
            </span>
          </div>
          <strong style={{ color: (totalReceita - totalDespesa) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(totalReceita - totalDespesa)}
          </strong>
        </div>
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
                  <span style={{ display: 'flex' }}>{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</span>
                  <strong>{cat}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>{formatCurrency(data.total)}</div>
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
                    {limit > 0 && (
                      <span style={{ color: data.total > limit ? 'var(--danger)' : 'var(--success)' }}>
                        Limite: {formatCurrency(limit)}
                        <span style={{ marginLeft: '0.4rem', fontWeight: 'bold' }}>
                          ({data.total > limit ? `gastou a mais ${formatCurrency(data.total - limit)}` : `economizou ${formatCurrency(limit - data.total)}`})
                        </span>
                      </span>
                    )}
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
                <div style={{ marginTop: '1rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column' }}>
                  {data.txs.sort((a, b) => b.amount - a.amount).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text)', borderBottom: '1px solid #f1f5f9', padding: '0.4rem 0' }}>
                      <div>
                        <span>{t.description}</span>
                        {t.details && <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>({t.details})</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <strong>{formatCurrency(t.amount)}</strong>
                        <button
                          type="button"
                          onClick={() => onEdit(t)}
                          className="btn small"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <GastoModal
        isOpen={isModalOpen}
        editingId={editingId}
        form={form}
        setForm={setForm}
        accounts={accounts}
        categories={categories}
        onSubmit={onSubmit}
        onClose={closeModal}
        onDelete={handleDelete}
      />
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
      const existing = budgets.find(b => b.category_id === catId)
      return {
        id: existing?.id || crypto.randomUUID(),
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
      <div className="mobile-view-header" style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '600px' }}>
          Estipule um teto de gastos para cada categoria. No <strong>Relatórios</strong>,
          você poderá ver o quanto economizou ou se ultrapassou o planejado.
        </p>
        <button className="btn-primary-large" onClick={onSave} disabled={mutations.saveBudgets.isPending}>
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
            <button onClick={() => del('accounts', a.id, a.name)} className="btn danger small"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => add('accounts')} className="btn-primary-large"><Plus size={16} /> Adicionar Conta</button>
      </div>

      <h3>Categorias</h3>
      <div className="budget-grid" style={{ marginBottom: '2rem' }}>
        {categories.map(c => (
          <div key={c.id} className="budget-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{c.name}</span>
            <button onClick={() => del('categories', c.id, c.name)} className="btn danger small"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={() => add('categories')} className="btn-primary-large"><Plus size={16} /> Adicionar Categoria</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} className="btn danger">
          <LogOut size={16} /> Sair da Conta
        </button>
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

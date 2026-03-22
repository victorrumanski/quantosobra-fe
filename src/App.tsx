import React, { useState, useEffect, useMemo } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Toaster, toast } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useFinanceData, TransactionType, type Transaction, type Account, type Category, type PlannedBudgetItem } from './lib/finance'
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
  Wallet,
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
const formatInsertedAt = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
          <div className="logo-box-large">
            <PiggyBank size={42} />
          </div>
          <h1 className="u-m-0 u-text-xl">Quanto Sobra?</h1>
          <p className="u-text-muted u-text-base u-mt-md" style={{ color: 'var(--muted)' }}>
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
          <button type="submit" className="btn" style={{ width: '100%', height: '48px' }} disabled={loading}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="u-mt-lg u-cursor-pointer u-font-600" style={{ background: 'none', border: 'none', color: 'var(--primary)', width: '100%' }}
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
        <div className="header-logo u-flex-center u-gap-lg">
          <div className="logo-box">
            <PiggyBank size={24} />
          </div>
          <div>
            <h1 className="u-mb-xs">Quanto Sobra?</h1>
            <p>Controle seus gastos mensais</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button onClick={() => navigate({ to: '/' })} className={`nav-item ${activeTab === '/' ? 'active' : ''}`}>
            <BanknoteArrowDown size={16} className="icon-nav" />
            Gastos
          </button>
          <button onClick={() => navigate({ to: '/receitas' })} className={`nav-item ${activeTab === '/receitas' ? 'active' : ''}`}>
            <BanknoteArrowUp size={16} className="icon-nav" />
            Receitas
          </button>
          <button onClick={() => navigate({ to: '/relatorios' })} className={`nav-item ${activeTab === '/relatorios' ? 'active' : ''}`}>
            <BarChart3 size={16} className="icon-nav" />
            Relatórios
          </button>
          <button onClick={() => navigate({ to: '/planejamento' })} className={`nav-item ${activeTab === '/planejamento' ? 'active' : ''}`}>
            <Target size={16} className="icon-nav" />
            Planejamento
          </button>
          <button onClick={() => navigate({ to: '/config' })} className={`nav-item ${activeTab === '/config' ? 'active' : ''}`}>
            <Settings size={18} className="icon-spacing" />
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
  plannedItemId: string
}

function GastoModal({
  isOpen,
  editingId,
  insertedAt,
  form,
  setForm,
  accounts,
  categories,
  plannedItems,
  plannedUsageCountById,
  onSubmit,
  onClose,
  onDelete,
  allowConfirmPlusOne = false,
}: {
  isOpen: boolean
  editingId: string | null
  insertedAt?: string | null
  form: GastoFormState
  setForm: (next: GastoFormState) => void
  accounts: Account[]
  categories: Category[]
  plannedItems: PlannedBudgetItem[]
  plannedUsageCountById: Record<string, number>
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
          <div>
            <h2>{editingId ? 'Editar Gasto' : 'Novo Gasto'}</h2>
            {editingId && insertedAt && <div className="u-text-sm u-text-muted">Inserido em: {insertedAt}</div>}
          </div>
          <button onClick={onClose} className="btn-reset">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={onSubmit} className="form-col">
            <label>Conta <select value={form.acc} onChange={e => setForm({ ...form, acc: e.target.value })}>{accounts.map(a => <option key={a.id}>{a.name}</option>)}</select></label>
            <label>Dia <input type="number" min="1" max="31" value={form.day} onChange={e => setForm({ ...form, day: e.target.value.padStart(2, '0') })} required /></label>
            <label>Nome <input type="text" placeholder="Origem do gasto" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} required /></label>
            <label>Valor <input type="text" placeholder="0,00" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} required /></label>
            <label>Categoria <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value, plannedItemId: '' })}>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></label>
            {plannedItems.length > 0 && (
              <div className="planned-match-box">
                <div className="u-text-sm u-text-muted">Vincular com item planejado (opcional)</div>
                <div className="planned-match-list">
                  {plannedItems.map(item => {
                    const usage = plannedUsageCountById[item.id] || 0
                    const isSelected = form.plannedItemId === item.id
                    return (
                      <div
                        key={item.id}
                        className={`planned-match-item ${isSelected ? 'planned-match-selected' : ''}`}
                        onClick={() => setForm({ ...form, plannedItemId: isSelected ? '' : item.id })}
                      >
                        <div>
                          <div>{item.name}</div>
                          <div className="u-text-sm u-text-muted">{usage} vínculos este mês</div>
                        </div>
                        <div className="u-text-right">{formatCurrency(item.amount)}</div>
                        <input
                          type="checkbox"
                          className="planned-match-checkbox"
                          checked={isSelected}
                          onClick={e => e.stopPropagation()}
                          onChange={() => setForm({ ...form, plannedItemId: isSelected ? '' : item.id })}
                          aria-label={`Vincular item planejado ${item.name}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <label>Detalhes <input type="text" placeholder="Opcional" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn" style={{ flex: 1, height: '44px' }}>{editingId ? 'Salvar Alterações' : 'Confirmar Gasto'}</button>
              {!editingId && allowConfirmPlusOne && (
                <button type="button" className="btn" style={{ flex: 1, height: '44px', background: 'var(--success)' }} onClick={e => onSubmit(e as any, true)}>Confirmar +1</button>
              )}
              {editingId && onDelete && (
                <button type="button" onClick={onDelete} className="btn danger" style={{ height: '44px' }}>
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
  const { accounts, categories, budgets, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [activeAccountTab, setActiveAccountTab] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingInsertedAt, setEditingInsertedAt] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'createdat', direction: 'desc' })

  const [form, setForm] = useState({
    day: new Date().getDate().toString().padStart(2, '0'),
    desc: '',
    details: '',
    cat: '',
    acc: '',
    amt: '',
    plannedItemId: '',
  })

  const plannedItemsByCategory = useMemo(() => {
    const map: Record<string, PlannedBudgetItem[]> = {}
    categories.forEach(c => {
      const budget = budgets.find(b => b.category_id === c.id)
      map[c.name] = budget?.planned_items || []
    })
    return map
  }, [categories, budgets])

  const plannedItemsForSelectedCategory = useMemo(() => {
    return plannedItemsByCategory[form.cat] || []
  }, [plannedItemsByCategory, form.cat])

  const plannedUsageCountById = useMemo(() => {
    const map: Record<string, number> = {}
    transactions
      .filter(t => t.type === TransactionType.DESPESA && t.planned_item_id)
      .forEach(t => {
        const key = String(t.planned_item_id)
        map[key] = (map[key] || 0) + 1
      })
    return map
  }, [transactions])

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
      planned_item_id: form.plannedItemId || null,
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
    setEditingInsertedAt(formatInsertedAt(t.createdat))
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      cat: t.category,
      acc: t.account,
      amt: Math.abs(t.amount).toString().replace('.', ','),
      plannedItemId: t.planned_item_id || '',
    })
    setIsModalOpen(true)
  }

  const onAdd = () => {
    setEditingId(null)
    setEditingInsertedAt(null)
    setForm({
      ...form,
      day: new Date().getDate().toString().padStart(2, '0'),
      desc: '',
      details: '',
      amt: '',
      plannedItemId: '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setEditingInsertedAt(null)
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
        <p className="u-text-muted u-m-0" style={{ maxWidth: '600px' }}>
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
                <th onClick={() => handleSort('description')} className="u-cursor-pointer">Gasto <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('amount')} className="u-text-right u-cursor-pointer">Valor <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('category')} className="u-cursor-pointer">Categoria <ArrowUpDown size={14} /></th>
                <th className="col-actions u-text-right u-cursor-pointer" onClick={() => handleSort('createdat')} title='Clique para ordenar por data de insercao dos dados'>Ações <ArrowUpDown size={14} /></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(t => (
                <tr key={t.id} className={highlightedId === t.id ? 'row-highlight' : ''}>
                  <td>{new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                  <td>
                    <strong>{t.description}</strong>
                    {t.details && <div className="u-text-sm u-text-muted">{t.details}</div>}
                  </td>
                  <td className="u-text-right">{formatCurrency(t.amount)}</td>
                  <td><span className="badge">{t.category}</span></td>
                  <td className="col-actions u-text-right">
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
        insertedAt={editingInsertedAt}
        form={form}
        setForm={setForm}
        accounts={accounts}
        categories={categories}
        plannedItems={plannedItemsForSelectedCategory}
        plannedUsageCountById={plannedUsageCountById}
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
        <p className="u-text-muted u-m-0" style={{ maxWidth: '600px' }}>
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
                    {t.details && <div className="u-text-sm u-text-muted">{t.details}</div>}
                  </td>
                  <td><span className="badge">{t.account}</span></td>
                  <td className="u-text-right u-font-bold" style={{ color: 'var(--success)' }}>{formatCurrency(t.amount)}</td>
                  <td className="col-actions u-text-right">
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
              <button onClick={closeModal} className="btn-reset">
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
                  <button type="submit" className="btn" style={{ flex: 1, height: '44px' }}>{editingId ? 'Salvar Alterações' : 'Confirmar Receita'}</button>
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="btn danger" style={{ height: '44px' }}>
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
  const [expandedCats, setExpandedCats] = useState<string[]>([])
  const [accountFilter, setAccountFilter] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingInsertedAt, setEditingInsertedAt] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<GastoFormState>({
    day: new Date().getDate().toString().padStart(2, '0'),
    desc: '',
    details: '',
    cat: '',
    acc: '',
    amt: '',
    plannedItemId: '',
  })

  const plannedItemsByCategory = useMemo(() => {
    const map: Record<string, PlannedBudgetItem[]> = {}
    categories.forEach(c => {
      const budget = budgets.find(b => b.category_id === c.id)
      map[c.name] = budget?.planned_items || []
    })
    return map
  }, [categories, budgets])

  const plannedItemsForSelectedCategory = useMemo(() => {
    return plannedItemsByCategory[form.cat] || []
  }, [plannedItemsByCategory, form.cat])

  const plannedUsageCountById = useMemo(() => {
    const map: Record<string, number> = {}
    transactions
      .filter(t => t.type === TransactionType.DESPESA && t.planned_item_id)
      .forEach(t => {
        const key = String(t.planned_item_id)
        map[key] = (map[key] || 0) + 1
      })
    return map
  }, [transactions])

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

  const plannedAmountByItemId = useMemo(() => {
    const map: Record<string, number> = {}
    budgets.forEach(budget => {
      ;(budget.planned_items || []).forEach(item => {
        map[item.id] = item.amount
      })
    })
    return map
  }, [budgets])

  useEffect(() => {
    if (accounts[0] && !form.acc) setForm(f => ({ ...f, acc: accounts[0].name }))
    if (categories[0] && !form.cat) setForm(f => ({ ...f, cat: categories[0].name }))
  }, [accounts, categories])

  const onEdit = (t: Transaction) => {
    setEditingId(t.id)
    setEditingInsertedAt(formatInsertedAt(t.createdat))
    setForm({
      day: t.transaction_date.split('-')[2],
      desc: t.description,
      details: t.details || '',
      cat: t.category,
      acc: t.account,
      amt: Math.abs(t.amount).toString().replace('.', ','),
      plannedItemId: t.planned_item_id || '',
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setEditingInsertedAt(null)
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
      planned_item_id: form.plannedItemId || null,
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
        <p className="u-text-muted u-m-0" style={{ maxWidth: '600px' }}>
          Aqui você descobre em qual categoria seu orçamento está estourando ou economizando
        </p>
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
          <h3 className="u-flex-center" style={{ gap: '0.4rem' }}><BanknoteArrowUp size={16} /> Receita</h3>
          <strong>{formatCurrency(totalReceita)}</strong>
        </div>
        <div className="card despesa">
          <h3 className="u-flex-center" style={{ gap: '0.4rem' }}><BanknoteArrowDown size={16} /> Despesa</h3>
          <strong>{formatCurrency(totalDespesa)}</strong>
        </div>
        <div className="card saldo">
          <div className="u-flex-between">
            <h3 className="u-flex-center" style={{ gap: '0.4rem' }}><CircleDollarSign size={16} /> Saldo</h3>
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

      <div style={{ marginTop: '1.5rem' }}>
        <h2 className="u-mb-lg u-text-center">Gastos por Categoria</h2>
        {statsByCat.map(([cat, data]) => {
          const catId = categories.find(c => c.name === cat)?.id
          const limit = budgets.find(b => b.category_id === catId)?.amount || 0
          const isExpanded = expandedCats.includes(cat)

          return (
            <div key={cat} className="report-category-card panel" style={{ marginBottom: '1.5rem' }}>
              <div
                onClick={() => setExpandedCats(prev => isExpanded ? prev.filter(x => x !== cat) : [...prev, cat])}
                className="u-cursor-pointer u-flex-between u-mb-sm"
              >
                <div className="u-flex-center" style={{ gap: '0.5rem' }}>
                  <span style={{ display: 'flex' }}>{isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}</span>
                  <strong>{cat}</strong>
                </div>
                <div className="u-text-right">
                  <div className="u-font-bold">{formatCurrency(data.total)}</div>
                </div>
              </div>

              {limit > 0 && (
                <div className="u-flex-between u-text-sm u-mt-md">
                  <span style={{ color: data.total > limit ? 'var(--danger)' : 'var(--success)' }}>
                    Limite: {formatCurrency(limit)}
                  </span>
                  <span className="u-font-bold" style={{ color: data.total > limit ? 'var(--danger)' : 'var(--success)' }}>
                    {data.total > limit ? `gastou a mais ${formatCurrency(data.total - limit)}` : `economizou ${formatCurrency(limit - data.total)}`}
                  </span>
                </div>
              )}

              {isExpanded && (
                <div style={{ marginTop: '1rem', paddingLeft: '2rem', display: 'flex', flexDirection: 'column' }}>
                  {data.txs.sort((a, b) => b.amount - a.amount).map(t => (
                    <div key={t.id} className="gasto-item report-expense-row" style={{ fontSize: '0.9rem', color: 'var(--text)', borderBottom: '1px solid #f1f5f9', padding: '0.4rem 0' }}>
                      <div>
                        <span>{t.description}</span>
                        {t.details && <div className="u-text-muted u-text-sm">({t.details})</div>}
                        <div className="u-text-muted u-text-sm u-flex-center u-gap-xs">
                          <Wallet size={12} />
                          <span>{t.account}</span>
                        </div>
                      </div>
                      <div className="report-expense-right">
                        <div className="report-expense-values">
                          <strong>{formatCurrency(t.amount)}</strong>
                          {(() => {
                            const plannedAmount = t.planned_item_id ? plannedAmountByItemId[t.planned_item_id] : undefined
                            if (plannedAmount === undefined) return null

                            const isWithinPlanned = t.amount <= plannedAmount
                            const isOverTwoPercent = t.amount > plannedAmount * 1.02
                            const plannedColor = isOverTwoPercent
                              ? 'var(--danger)'
                              : isWithinPlanned
                                ? 'var(--success)'
                                : 'var(--muted)'

                            return (
                              <div className="u-text-sm" style={{ color: plannedColor }}>
                                Plano: {formatCurrency(plannedAmount)}
                              </div>
                            )
                          })()}
                        </div>
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
        insertedAt={editingInsertedAt}
        form={form}
        setForm={setForm}
        accounts={accounts}
        categories={categories}
        plannedItems={plannedItemsForSelectedCategory}
        plannedUsageCountById={plannedUsageCountById}
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
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, Array<{ id: string; name: string; amount: string }>>>({})
  const [isCopyingNextMonth, setIsCopyingNextMonth] = useState(false)

  useEffect(() => {
    const map: Record<string, Array<{ id: string; name: string; amount: string }>> = {}
    categories.forEach(c => {
      const b = budgets.find(x => x.category_id === c.id)
      const plannedItems = (b?.planned_items || []) as PlannedBudgetItem[]

      if (plannedItems.length > 0) {
        map[c.id] = plannedItems.map(item => ({
          id: item.id || crypto.randomUUID(),
          name: item.name,
          amount: item.amount.toString().replace('.', ','),
        }))
      } else if (b && b.amount > 0) {
        map[c.id] = [{ id: crypto.randomUUID(), name: 'Item planejado', amount: b.amount.toString().replace('.', ',') }]
      } else {
        map[c.id] = []
      }
    })
    setItemsByCategory(map)
  }, [categories, budgets])

  const addItem = (catId: string) => {
    setItemsByCategory(prev => ({
      ...prev,
      [catId]: [...(prev[catId] || []), { id: crypto.randomUUID(), name: '', amount: '' }]
    }))
  }

  const removeItem = (catId: string, itemId: string) => {
    setItemsByCategory(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).filter(item => item.id !== itemId)
    }))
  }

  const updateItem = (catId: string, itemId: string, key: 'name' | 'amount', value: string) => {
    setItemsByCategory(prev => ({
      ...prev,
      [catId]: (prev[catId] || []).map(item => item.id === itemId ? { ...item, [key]: value } : item)
    }))
  }

  const sumCategory = (catId: string) => {
    return (itemsByCategory[catId] || []).reduce((acc, item) => {
      const amount = Number(item.amount.replace(',', '.'))
      return acc + (Number.isFinite(amount) ? amount : 0)
    }, 0)
  }

  const buildPlanPayload = (planMonth: string, existingByCategory: Record<string, string | undefined>) => {
    return categories.map(category => {
      const catId = category.id

      const plannedItems = (itemsByCategory[catId] || [])
        .map(item => ({
          id: item.id,
          name: item.name.trim(),
          amount: Number(item.amount.replace(',', '.')) || 0,
        }))
        .filter(item => item.name || item.amount > 0)

      const total = plannedItems.reduce((acc, item) => acc + item.amount, 0)

      return {
        id: existingByCategory[catId] || crypto.randomUUID(),
        user_id: session.user.id,
        category_id: catId,
        plan_month: planMonth,
        amount: total,
        planned_items: plannedItems,
      }
    })
  }

  const onSave = async () => {
    const existingByCategory = Object.fromEntries(budgets.map(b => [b.category_id, b.id]))
    const list = buildPlanPayload(`${month}-01`, existingByCategory)

    await mutations.saveBudgets.mutateAsync(list)
  }

  const onCopyToNextMonth = async () => {
    const shouldProceed = confirm('Isso vai copiar o planejamento atual para o próximo mês e pode sobrescrever dados já existentes. Deseja continuar?')
    if (!shouldProceed) return

    setIsCopyingNextMonth(true)
    try {
      const [year, monthNumber] = month.split('-').map(Number)
      const nextMonth = monthNumber === 12
        ? `${year + 1}-01`
        : `${year}-${String(monthNumber + 1).padStart(2, '0')}`
      const nextPlanMonth = `${nextMonth}-01`

      const { data, error } = await supabase
        .from('category_plan')
        .select('id, category_id')
        .eq('user_id', session.user.id)
        .eq('plan_month', nextPlanMonth)

      if (error) throw error

      const existingByCategory: Record<string, string | undefined> = {}
      ;(data || []).forEach((row: any) => {
        existingByCategory[row.category_id] = row.id
      })

      const list = buildPlanPayload(nextPlanMonth, existingByCategory)
      await mutations.saveBudgets.mutateAsync(list)
      toast.success(`Planejamento copiado para ${nextMonth}`)
    } finally {
      setIsCopyingNextMonth(false)
    }
  }

  return (
    <>
      <div className="mobile-view-header" style={{ marginBottom: '1.5rem' }}>
        <p className="u-text-muted u-m-0" style={{ maxWidth: '600px' }}>
          Aqui você pode cadastrar seus gastos fixos e variáveis do mês. 
          Assim, o sistema avisa quando algum gasto fixo, como condomínio ou financiamento, vier mais caro do que o planejado. Isso também ajuda a conferir se os valores que você pensa que gasta são realmente os que você gasta. 
          Sabe aquele papo de “eu gasto somente 300 por mês com lanches”, mas no fim acaba gastando 800? Isso aqui vai ajudar.
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
              <strong>{formatCurrency(sumCategory(c.id))}</strong>
            </div>

            <div className="plan-items-list">
              {(itemsByCategory[c.id] || []).map(item => (
                <div key={item.id} className="plan-item-row">
                  <input
                    type="text"
                    placeholder="Nome do gasto"
                    value={item.name}
                    onChange={e => updateItem(c.id, item.id, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="0,00"
                    value={item.amount}
                    onChange={e => updateItem(c.id, item.id, 'amount', e.target.value)}
                  />
                  <button type="button" className="btn danger small" onClick={() => removeItem(c.id, item.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn small plan-add-btn" onClick={() => addItem(c.id)}>
              <Plus size={14} /> Adicionar gasto planejado
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="btn"
          onClick={onCopyToNextMonth}
          disabled={isCopyingNextMonth || mutations.saveBudgets.isPending}
        >
          {isCopyingNextMonth ? 'Copiando...' : 'Copiar dados para próximo mês'}
        </button>
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

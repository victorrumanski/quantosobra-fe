import { useEffect, useMemo, useState } from 'react'

type TransactionType = 'receita' | 'despesa'

type Transaction = {
  id: string
  date: string
  name: string
  details: string
  category: string
  account: string
  type: TransactionType
  frequency: 'fixo' | 'variavel'
  value: number
}

type Budget = {
  category: string
  limit: number
}

const STORAGE_KEY = 'quantosobra-data-v1'
const BUDGET_KEY = 'quantosobra-budget-v1'

function parseTransactions(raw: string | null): Transaction[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data as Transaction[]
  } catch {
  }
  return []
}

function parseBudgets(raw: string | null): Budget[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data as Budget[]
  } catch {
  }
  return []
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => parseTransactions(localStorage.getItem(STORAGE_KEY)))
  const [budgets, setBudgets] = useState<Budget[]>(() => parseBudgets(localStorage.getItem(BUDGET_KEY)))

  const [form, setForm] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    name: '',
    details: '',
    category: 'Geral',
    account: 'Conta Corrente',
    type: 'despesa',
    frequency: 'variavel',
    value: 0,
  })

  const [filter, setFilter] = useState({
    month: '',
    category: 'Todas',
    account: 'Todas',
    type: 'Todas',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets))
  }, [budgets])

  const totals = useMemo(() => {
    const receita = transactions.filter((t) => t.type === 'receita').reduce((sum, t) => sum + t.value, 0)
    const despesa = transactions.filter((t) => t.type === 'despesa').reduce((sum, t) => sum + t.value, 0)
    return { receita, despesa, saldo: receita - despesa }
  }, [transactions])

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.value))
    return Object.fromEntries(map)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchMonth = !filter.month || t.date.slice(0, 7) === filter.month
      const matchCategory = filter.category === 'Todas' || t.category === filter.category
      const matchAccount = filter.account === 'Todas' || t.account === filter.account
      const matchType = filter.type === 'Todas' || t.type === filter.type
      return matchMonth && matchCategory && matchAccount && matchType
    })
  }, [transactions, filter])

  const addTransaction = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.value || !form.date) {
      alert('Preencha data, nome e valor corretamente.')
      return
    }

    const next: Transaction = {
      id: crypto.randomUUID(),
      ...form,
    }
    setTransactions((prev) => [next, ...prev])
    setForm((prev) => ({ ...prev, name: '', details: '', value: 0 }))
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id))
  }

  const addBudget = () => {
    const category = prompt('Informe categoria do orçamento (ex: Lazer):', 'Lazer')?.trim()
    if (!category) return
    const limitString = prompt('Informe o limite para essa categoria (R$):', '1000')
    if (!limitString) return
    const limit = Number(limitString.replace(',', '.'))
    if (Number.isNaN(limit) || limit < 0) {
      alert('Valor inválido')
      return
    }

    setBudgets((prev) => {
      const exists = prev.find((b) => b.category.toLowerCase() === category.toLowerCase())
      if (exists) {
        return prev.map((b) => (b.category.toLowerCase() === category.toLowerCase() ? { ...b, limit } : b))
      }
      return [...prev, { category, limit }]
    })
  }

  const removeBudget = (category: string) => {
    setBudgets((prev) => prev.filter((b) => b.category !== category))
  }

  const budgetRows = budgets.map((budget) => {
    const spent = categoryTotals[budget.category] ?? 0
    const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0
    return { ...budget, spent, percent }
  })

  const categories = Array.from(new Set(['Todas', ...transactions.map((t) => t.category)]))
  const accounts = Array.from(new Set(['Todas', ...transactions.map((t) => t.account)]))

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
  const [activeTab, setActiveTab] = useState<'gastos' | 'relatorios' | 'receitas' | 'planejamento'>('gastos')
  const receitas = transactions.filter((t) => t.type === 'receita')

  const renderMeusGastos = () => (
    <>
      <section className="main-grid">
        <article className="panel">
          <h2>Adicionar transação</h2>
          <form onSubmit={addTransaction} className="form-grid">
            <label>
              Data
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </label>
            <label>
              Nome
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Detalhes
              <input type="text" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            </label>
            <label>
              Categoria
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <label>
              Conta
              <input type="text" value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} />
            </label>
            <label>
              Tipo
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </label>
            <label>
              Fixo / Variável
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as 'fixo' | 'variavel' })}>
                <option value="variavel">Variável</option>
                <option value="fixo">Fixo</option>
              </select>
            </label>
            <label>
              Valor
              <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
            </label>
            <button type="submit" className="btn">Salvar transação</button>
          </form>
        </article>

        <article className="panel">
          <h2>Filtros</h2>
          <div className="filters">
            <label>
              Mês
              <input type="month" value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} />
            </label>
            <label>
              Categoria
              <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </label>
            <label>
              Conta
              <select value={filter.account} onChange={(e) => setFilter({ ...filter, account: e.target.value })}>
                {accounts.map((acc) => (<option key={acc} value={acc}>{acc}</option>))}
              </select>
            </label>
            <label>
              Tipo
              <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
                <option value="Todas">Todas</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </label>
          </div>
          <button className="btn" type="button" onClick={() => setFilter({ month: '', category: 'Todas', account: 'Todas', type: 'Todas' })}>Limpar filtros</button>
        </article>
      </section>

      <section className="panel">
        <h2>Lista de transações ({filteredTransactions.length})</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Conta</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.account}</td>
                  <td>{item.type}</td>
                  <td>{formatCurrency(item.value)}</td>
                  <td><button onClick={() => deleteTransaction(item.id)} className="btn danger">Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )

  const renderRelatorios = () => (
    <>
      <section className="summary">
        <div className="card receita">
          <h3>Receita</h3>
          <strong>{formatCurrency(totals.receita)}</strong>
        </div>
        <div className="card despesa">
          <h3>Despesa</h3>
          <strong>{formatCurrency(totals.despesa)}</strong>
        </div>
        <div className="card saldo">
          <h3>Saldo</h3>
          <strong>{formatCurrency(totals.saldo)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Orçamento vs Realizado</h2>
        <button type="button" className="btn" onClick={addBudget}>Adicionar/Atualizar orçamento</button>
        <div className="budget-grid">
          {budgetRows.length === 0 ? <p>Nenhum orçamento configurado.</p> : budgetRows.map((row) => (
            <div key={row.category} className={`budget-card ${row.percent > 100 ? 'over' : ''}`}>
              <h3>{row.category}</h3>
              <p>Limite {formatCurrency(row.limit)}</p>
              <p>Gasto {formatCurrency(row.spent)}</p>
              <p>{row.percent.toFixed(1)}%</p>
              <div className="progress">
                <div className="fill" style={{ width: Math.min(100, row.percent) + '%' }} />
              </div>
              <button type="button" className="btn danger small" onClick={() => removeBudget(row.category)}>Remover</button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Insights</h2>
        <p>Categoria mais gasta: <strong>{topCategory ? `${topCategory[0]} (${formatCurrency(topCategory[1])})` : 'Nenhuma'}</strong></p>
      </section>
    </>
  )

  const renderReceitas = () => (
    <section className="panel">
      <h2>Receitas ({receitas.length})</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {receitas.map((item) => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.account}</td>
                <td>{formatCurrency(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderPlanejamento = () => (
    <section className="panel">
      <h2>Planejamento Mensal</h2>
      <p>Defina orçamentos por categoria e acompanhe o consumo.</p>
      <button type="button" className="btn" onClick={addBudget}>Adicionar/Atualizar orçamento</button>
      <div className="budget-grid">
        {budgetRows.length === 0 ? <p>Nenhum orçamento configurado.</p> : budgetRows.map((row) => (
          <div key={row.category} className={`budget-card ${row.percent > 100 ? 'over' : ''}`}>
            <h3>{row.category}</h3>
            <p>Limite {formatCurrency(row.limit)}</p>
            <p>Gasto {formatCurrency(row.spent)}</p>
            <p>{row.percent.toFixed(1)}%</p>
            <div className="progress">
              <div className="fill" style={{ width: Math.min(100, row.percent) + '%' }} />
            </div>
            <button type="button" className="btn danger small" onClick={() => removeBudget(row.category)}>Remover</button>
          </div>
        ))}
      </div>
    </section>
  )

  const tabContent = () => {
    if (activeTab === 'gastos') return renderMeusGastos()
    if (activeTab === 'relatorios') return renderRelatorios()
    if (activeTab === 'receitas') return renderReceitas()
    return renderPlanejamento()
  }

  return (
    <div className="app">
      <header>
        <h1>Quanto Sobra</h1>
        <p>Controle mensal de gastos e receitas</p>
      </header>

      <nav className="tabs">
        <button className={activeTab === 'gastos' ? 'active' : ''} onClick={() => setActiveTab('gastos')}>Meus Gastos</button>
        <button className={activeTab === 'relatorios' ? 'active' : ''} onClick={() => setActiveTab('relatorios')}>Relatórios</button>
        <button className={activeTab === 'receitas' ? 'active' : ''} onClick={() => setActiveTab('receitas')}>Receitas</button>
        <button className={activeTab === 'planejamento' ? 'active' : ''} onClick={() => setActiveTab('planejamento')}>Planejamento Mensal</button>
      </nav>

      {tabContent()}

      <footer>
        <p>Dados salvos no localStorage. Recarregue para verificar persistência.</p>
      </footer>
    </div>
  )
}

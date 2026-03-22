import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Pencil, Plus } from 'lucide-react'
import { TransactionType, type PlannedBudgetItem, type Transaction, useFinanceData } from '../lib/finance'
import { useFinanceContext } from '../context/finance-context'
import GastoModal, { type GastoFormState } from '../components/GastoModal'
import { formatCurrency, formatInsertedAt } from '../utils/format'

export default function MeusGastos() {
  const { session, month } = useFinanceContext()
  const { accounts, categories, budgets, transactions, mutations } = useFinanceData(month, session?.user?.id)
  const [activeAccountTab, setActiveAccountTab] = useState('Todas')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingInsertedAt, setEditingInsertedAt] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' } | null>({ key: 'createdat', direction: 'desc' })

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

  const plannedItemsForSelectedCategory = useMemo(() => plannedItemsByCategory[form.cat] || [], [plannedItemsByCategory, form.cat])

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

    let res
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
      <div className="mobile-view-header mobile-view-header-center">
        <button onClick={onAdd} className="btn-primary-large">
          <Plus size={20} /> Novo Gasto
        </button>
      </div>

      <section className="panel">
        <div className="account-filter-row u-mb-lg">
          <span className="account-filter-label">Total de gastos: {formatCurrency(totals.total)}</span>
          <select className="account-filter-select" value={activeAccountTab} onChange={e => setActiveAccountTab(e.target.value)}>
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
                <th onClick={() => handleSort('transaction_date')} className="u-cursor-pointer">Data <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('description')} className="u-cursor-pointer">Gasto <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('amount')} className="u-text-right u-cursor-pointer">Valor <ArrowUpDown size={14} /></th>
                <th onClick={() => handleSort('category')} className="u-cursor-pointer">Categoria <ArrowUpDown size={14} /></th>
                <th className="col-actions u-text-right u-cursor-pointer" onClick={() => handleSort('createdat')} title="Clique para ordenar por data de insercao dos dados">Ações <ArrowUpDown size={14} /></th>
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

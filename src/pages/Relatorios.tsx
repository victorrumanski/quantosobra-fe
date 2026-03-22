import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Wallet,
} from 'lucide-react'
import { TransactionType, type PlannedBudgetItem, type Transaction, useFinanceData } from '../lib/finance'
import { useFinanceContext } from '../context/finance-context'
import { formatCurrency, formatInsertedAt } from '../utils/format'
import GastoModal, { type GastoFormState } from '../components/GastoModal'

export default function Relatorios() {
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

  const selectedAccountId = useMemo(() => {
    if (accountFilter === 'Todas') return null
    return accounts.find(a => a.name === accountFilter)?.id || null
  }, [accounts, accountFilter])

  const filteredTxs = useMemo(() => {
    if (accountFilter === 'Todas') return transactions
    return transactions.filter(t => {
      if (selectedAccountId && t.account_id) {
        return t.account_id === selectedAccountId
      }
      return t.account === accountFilter
    })
  }, [transactions, accountFilter, selectedAccountId])

  const monthDespesas = useMemo(() => filteredTxs.filter(t => t.type === TransactionType.DESPESA), [filteredTxs])
  const totalReceita = useMemo(() => filteredTxs.filter(t => t.type === TransactionType.RECEITA).reduce((a, b) => a + b.amount, 0), [filteredTxs])
  const totalDespesa = useMemo(() => monthDespesas.reduce((a, b) => a + b.amount, 0), [monthDespesas])

  const statsByCat = useMemo(() => {
    const map: Record<string, { total: number; txs: Transaction[] }> = {}
    monthDespesas.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, txs: [] }
      map[t.category].total += t.amount
      map[t.category].txs.push(t)
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }, [monthDespesas])

  const plannedItemsLookup = useMemo(() => {
    const scopedMap: Record<string, { name: string; amount: number }> = {}
    const byIdMap: Record<string, Array<{ name: string; amount: number }>> = {}

    budgets.forEach(budget => {
      ;(budget.planned_items || []).forEach(item => {
        const scopedKey = `${budget.category_id}::${item.id}`
        const payload = { name: item.name, amount: item.amount }
        scopedMap[scopedKey] = payload
        byIdMap[item.id] = [...(byIdMap[item.id] || []), payload]
      })
    })

    return { scopedMap, byIdMap }
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

  const totalSaldo = totalReceita - totalDespesa
  const isPositiveBalance = totalSaldo >= 0
  const balanceValueClass = isPositiveBalance ? 'u-text-success' : 'u-text-danger'

  const resolvePlannedItem = (tx: Transaction) => {
    if (!tx.planned_item_id) return undefined

    const scoped = tx.category_id
      ? plannedItemsLookup.scopedMap[`${tx.category_id}::${tx.planned_item_id}`]
      : undefined

    if (scoped) return scoped

    const sameIdItems = plannedItemsLookup.byIdMap[tx.planned_item_id] || []
    return sameIdItems.length === 1 ? sameIdItems[0] : undefined
  }

  const getPlannedVisualInfo = (tx: Transaction) => {
    const plannedItem = resolvePlannedItem(tx)
    if (!plannedItem) return null

    const plannedAmount = plannedItem.amount
    const isWithinPlanned = tx.amount <= plannedAmount
    const isOverTwoPercent = tx.amount > plannedAmount * 1.02
    const plannedTextClass = isOverTwoPercent
      ? 'u-text-danger'
      : isWithinPlanned
        ? 'u-text-success'
        : 'u-text-muted'

    return {
      text: `Plano (${plannedItem.name}): ${formatCurrency(plannedAmount)}`,
      className: plannedTextClass,
    }
  }

  return (
    <>
      <div className="mobile-view-header u-mb-lg">
        <p className="u-text-muted u-m-0 u-maxw-600">Aqui você descobre aonde seu dinheiro está sendo gasto.</p>
        <select className="account-filter-select" value={accountFilter} onChange={e => setAccountFilter(e.target.value)}>
          <option value="Todas">Todas as Contas</option>
          {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>
      </div>

      <div className="summary-single-wrap">
        <div className="card summary-single-card">
          <div className="summary-line">
            <h3 className="summary-line-label">Receitas</h3>
            <strong className="summary-line-value u-text-success">{formatCurrency(totalReceita)}</strong>
          </div>
          <div className="summary-line">
            <h3 className="summary-line-label">Gastos</h3>
            <strong className="summary-line-value u-text-danger">{formatCurrency(totalDespesa)}</strong>
          </div>
          <div className="summary-line">
            <h3 className="summary-line-label">Saldo</h3>
            <strong className={`summary-line-value ${balanceValueClass}`}>{formatCurrency(totalSaldo)}</strong>
          </div>
        </div>
      </div>

      <div className="u-mt-lg">
        <h2 className="u-mb-lg u-text-center">Gastos por Categoria</h2>
        {statsByCat.map(([cat, data]) => {
          const catId = categories.find(c => c.name === cat)?.id
          const limit = budgets.find(b => b.category_id === catId)?.amount || 0
          const isExpanded = expandedCats.includes(cat)
          const isOverLimit = data.total > limit
          const limitTextClass = isOverLimit ? 'u-text-danger' : 'u-text-success'
          const limitDiffText = isOverLimit
            ? `gastou a mais ${formatCurrency(data.total - limit)}`
            : `economizou ${formatCurrency(limit - data.total)}`
          const sortedTxs = [...data.txs].sort((a, b) => b.amount - a.amount)
          const ExpandIcon = isExpanded ? ChevronDown : ChevronRight

          return (
            <div key={cat} className="report-category-card panel u-mb-lg">
              <div onClick={() => setExpandedCats(prev => isExpanded ? prev.filter(x => x !== cat) : [...prev, cat])} className="u-cursor-pointer u-flex-between u-mb-sm">
                <div className="u-flex-center u-gap-sm">
                  <span className="u-flex-center"><ExpandIcon size={20} /></span>
                  <strong>{cat}</strong>
                </div>
                <div className="u-text-right">
                  <div className="u-font-bold">{formatCurrency(data.total)}</div>
                </div>
              </div>

              {limit > 0 && (
                <div className="u-flex-between u-text-sm u-mt-md">
                  <span className={limitTextClass}>Limite: {formatCurrency(limit)}</span>
                  <span className={`u-font-bold ${limitTextClass}`}>{limitDiffText}</span>
                </div>
              )}

              {isExpanded && (
                <div className="report-expense-list">
                  {sortedTxs.map(t => {
                    const plannedVisual = getPlannedVisualInfo(t)

                    return (
                      <div key={t.id} className="gasto-item report-expense-row report-expense-item">
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
                            {plannedVisual && (
                              <div className={`u-text-sm ${plannedVisual.className}`}>{plannedVisual.text}</div>
                            )}
                          </div>
                          <button type="button" onClick={() => onEdit(t)} className="btn small">
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
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

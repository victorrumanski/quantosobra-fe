import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { type PlannedBudgetItem, TransactionType, useFinanceData } from '../lib/finance'
import { useFinanceContext } from '../context/finance-context'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../utils/format'

export default function Planejamento() {
  const { session, month } = useFinanceContext()
  const { categories, budgets, transactions, mutations } = useFinanceData(month, session?.user?.id)
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

  const removeItem = (catId: string, itemId: string, itemName: string) => {
    const linkedCount = transactions.filter(t =>
      t.type === TransactionType.DESPESA
      && t.planned_item_id === itemId
      && (!t.category_id || t.category_id === catId)
    ).length

    if (linkedCount > 0) {
      alert(`Não é possível excluir este item planejado agora. Existem ${linkedCount} gasto(s) vinculado(s) a "${itemName || 'Item planejado'}" neste mês.`)
      return
    }

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

  const totalPlannedMonth = useMemo(() => {
    return Object.values(itemsByCategory).reduce((categoryTotal, items) => {
      return categoryTotal + items.reduce((itemTotal, item) => {
        const amount = Number(item.amount.replace(',', '.'))
        return itemTotal + (Number.isFinite(amount) ? amount : 0)
      }, 0)
    }, 0)
  }, [itemsByCategory])

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
      <section className="u-mb-lg">
        <div className="planning-header-grid">
          <div className="u-flex-col planning-header-text-col">
            <p className="u-text-muted u-m-0">
              Aqui você pode cadastrar seus gastos fixos e variáveis do mês.
              Assim, o sistema avisa quando algum gasto fixo, como condomínio ou financiamento, vier mais caro do que o planejado. Isso também ajuda a conferir se os valores que você pensa que gasta são realmente os que você gasta.
              Sabe aquele papo de “eu gasto somente 300 por mês com lanches”, mas no fim acaba gastando 800? Isso aqui vai ajudar.
            </p>
          </div>
          <div className="u-flex-col planning-header-action-col">
            <strong>Total planejado no mês: {formatCurrency(totalPlannedMonth)}</strong>
            <button className="btn-primary-large" onClick={onSave} disabled={mutations.saveBudgets.isPending}>
              {mutations.saveBudgets.isPending ? 'Salvando...' : 'Salvar Planejamento'}
            </button>
          </div>
        </div>
      </section>
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
                  <input type="text" placeholder="Nome do gasto" value={item.name} onChange={e => updateItem(c.id, item.id, 'name', e.target.value)} />
                  <input type="text" placeholder="0,00" value={item.amount} onChange={e => updateItem(c.id, item.id, 'amount', e.target.value)} />
                  <button type="button" className="btn danger small" onClick={() => removeItem(c.id, item.id, item.name)}>
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

      <div className="planning-copy-row u-mt-md">
        <button type="button" className="btn" onClick={onCopyToNextMonth} disabled={isCopyingNextMonth || mutations.saveBudgets.isPending}>
          {isCopyingNextMonth ? 'Copiando...' : 'Copiar dados para próximo mês'}
        </button>
      </div>
    </>
  )
}

import React, { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { TransactionType, type Transaction, useFinanceData } from '../lib/finance'
import { useFinanceContext } from '../context/finance-context'
import { formatCurrency } from '../utils/format'

export default function Receitas() {
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

    let res
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
      <div className="mobile-view-header mobile-view-header-center">
        <button onClick={onAdd} className="btn-primary-large">
          <Plus size={20} /> Nova Receita
        </button>
      </div>

      <section className="panel">
        <div className="account-filter-row u-mb-lg">
          <span className="account-filter-label">Total de receitas: {formatCurrency(totals.total)}</span>
          <select
            className="account-filter-select"
            value={activeAccountFilter}
            onChange={e => setActiveAccountFilter(e.target.value)}
          >
            <option value="Todas">Todas as Contas</option>
            {accounts.map(a => (
              <option key={a.id} value={a.name}>{a.name}</option>
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
                <th className="u-text-right">Valor</th>
                <th className="col-actions u-text-right">Ações</th>
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
                  <td className="u-text-right u-font-bold u-text-success">{formatCurrency(t.amount)}</td>
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
                <div className="form-actions-row">
                  <button type="submit" className="btn form-main-action-btn">{editingId ? 'Salvar Alterações' : 'Confirmar Receita'}</button>
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="btn danger form-danger-action-btn">
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

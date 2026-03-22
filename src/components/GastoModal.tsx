import React from 'react'
import { Trash2, X } from 'lucide-react'
import type { Account, Category, PlannedBudgetItem } from '../lib/finance'
import { formatCurrency } from '../utils/format'

export type GastoFormState = {
  day: string
  desc: string
  details: string
  cat: string
  acc: string
  amt: string
  plannedItemId: string
}

type GastoModalProps = {
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
}

export default function GastoModal({
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
}: GastoModalProps) {
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
            <div className="form-actions-row">
              <button type="submit" className="btn form-main-action-btn">{editingId ? 'Salvar Alterações' : 'Confirmar Gasto'}</button>
              {!editingId && allowConfirmPlusOne && (
                <button type="button" className="btn form-main-action-btn form-main-action-btn-success" onClick={e => onSubmit(e as any, true)}>Confirmar +1</button>
              )}
              {editingId && onDelete && (
                <button type="button" onClick={onDelete} className="btn danger form-danger-action-btn">
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

import React, { useState } from 'react'
import { BarChart3, CircleDollarSign, PiggyBank, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth() {
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
          <p className="u-text-muted u-text-base u-mt-md">
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
          <button type="submit" className="btn auth-submit-btn" disabled={loading}>
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar no sistema' : 'Criar minha conta'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="u-mt-lg u-cursor-pointer u-font-600 auth-switch-mode-btn"
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

import React, { useEffect, useState } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import { BarChart3, BanknoteArrowDown, BanknoteArrowUp, PiggyBank, Settings, Target, User } from 'lucide-react'
import { supabase } from './lib/supabase'
import { FinanceContext, useFinanceContext } from './context/finance-context'
import Auth from './pages/Auth'
import MeusGastos from './pages/MeusGastos'
import Receitas from './pages/Receitas'
import Relatorios from './pages/Relatorios'
import Planejamento from './pages/Planejamento'
import Configuracoes from './pages/Configuracoes'

function Layout({ children, month, setMonth }: { children: React.ReactNode; month: string; setMonth: (value: string) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = location.pathname
  const { session } = useFinanceContext()

  return (
    <div>
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

    if (loading && !session) return <div className="u-text-muted">Carregando...</div>
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

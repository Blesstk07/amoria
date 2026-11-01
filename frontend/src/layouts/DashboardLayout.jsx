import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Heart,
  House,
  Compass,
  MessageCircle,
  UserRound,
  Bell,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Globe,
} from 'lucide-react'

import './DashboardLayout.css'

const navigation = [
  { label: 'Tableau de bord', icon: House, path: '/dashboard' },
  { label: 'Découvrir', icon: Compass, path: '/discover' },
  { label: 'Mes likes', icon: Heart, path: '/likes' },
  { label: 'Messages', icon: MessageCircle, path: '/messages' },
  { label: 'Mon profil', icon: UserRound, path: '/profile' },
]

function DashboardLayout({ breadcrumb, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const navigate = useNavigate()

  const closeMenu = () => setMenuOpen(false)

  // Fermeture du menu mobile avec la touche Échap
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Déconnexion sécurisée (logique inchangée)
  const handleLogout = async () => {
    setLoggingOut(true)
    setLogoutError('')

    try {
      const csrfToken = sessionStorage.getItem('csrfToken')

      if (!csrfToken) {
        throw new Error(
          'Session de sécurité introuvable. Veuillez vous reconnecter.'
        )
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Impossible de vous déconnecter.')
      }

      sessionStorage.removeItem('csrfToken')
      navigate('/login', { replace: true })
    } catch (err) {
      setLogoutError(err.message || 'Une erreur est survenue.')
      setLoggingOut(false)
    }
  }

  return (
    <div className="dl">
      {menuOpen && (
        <div className="dl-overlay" onClick={closeMenu} aria-hidden="true" />
      )}

      <aside
        id="dl-sidebar"
        className={`dl-sidebar ${menuOpen ? 'open' : ''}`}
      >
        <div className="dl-sidebar-head">
          <Link to="/" className="dl-brand" onClick={closeMenu}>
            Amoria <Heart size={19} fill="currentColor" />
          </Link>

          <button
            type="button"
            className="dl-close"
            onClick={closeMenu}
            aria-label="Fermer le menu"
          >
            <X size={22} />
          </button>
        </div>

        <div className="dl-sidebar-label">MENU PRINCIPAL</div>

        <nav className="dl-nav" aria-label="Navigation principale">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                to={item.path}
                key={item.path}
                className="dl-nav-item"
                onClick={closeMenu}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={19} />
                    <span>{item.label}</span>
                    {isActive && <span className="dl-active-dot" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="dl-sidebar-bottom">
          <div className="dl-security-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Votre sécurité</strong>
              <span>Un espace conçu pour votre tranquillité.</span>
            </div>
          </div>

          <Link to="/" className="dl-nav-item" onClick={closeMenu}>
            <Globe size={19} />
            <span>Retour à l’accueil public</span>
          </Link>

          <button
            type="button"
            className="dl-nav-item dl-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={19} />
            <span>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
          </button>
        </div>
      </aside>

      <div className="dl-main">
        <header className="dl-topbar">
          <button
            className="dl-menu-toggle"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="dl-sidebar"
          >
            <Menu size={23} />
          </button>

          <div className="dl-breadcrumb">
            Mon espace <span>/</span> {breadcrumb}
          </div>

          <div className="dl-topbar-actions">
            <button
              type="button"
              className="dl-icon-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="dl-notification-dot" />
            </button>

            <Link
              to="/profile"
              className="dl-avatar"
              aria-label="Accéder à mon profil"
            >
              <UserRound size={20} />
            </Link>
          </div>
        </header>

        <main className="dl-content">
          {logoutError && (
            <div className="alert alert-error dl-logout-error" role="alert">
              {logoutError}
            </div>
          )}

          {children}

          <footer className="dl-footer">
            <span>© {new Date().getFullYear()} Amoria</span>
            <span>Des rencontres qui ont du sens. ♥</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
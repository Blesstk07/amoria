
import {
  Heart,
  House,
  Compass,
  MessageCircle,
  UserRound,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  MapPin,
  LoaderCircle,
  LogOut,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  // Récupérer les informations du membre connecté
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        const result = await response.json()

        if (response.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Impossible de charger votre espace.'
          )
        }

        setMember(result.data.member)
      } catch (err) {
        setError(err.message || 'Une erreur est survenue.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [navigate])

  // Déconnexion sécurisée
  const handleLogout = async () => {
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
        throw new Error(
          result.message || 'Impossible de vous déconnecter.'
        )
      }

      sessionStorage.removeItem('csrfToken')

      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    }
  }

  const navigation = [
    {
      label: 'Tableau de bord',
      icon: House,
      path: '/dashboard',
      active: true,
    },
    {
      label: 'Découvrir',
      icon: Compass,
      path: '/discover',
    },
    {
      label: 'Mes likes',
      icon: Heart,
      path: '/likes',
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
    },
    {
      label: 'Mon profil',
      icon: UserRound,
      path: '/profile',
    },
  ]

  const accountStatus = {
    ACTIVE: 'Compte actif',
    SUSPENDED: 'Compte suspendu',
    BANNED: 'Compte bloqué',
  }

  return (
    <div className="dashboard">

      {/* Barre latérale */}
      <aside className={`dashboard-sidebar ${menuOpen ? 'open' : ''}`}>
        <Link
          to="/"
          className="dashboard-brand"
          onClick={() => setMenuOpen(false)}
        >
          Amoria <Heart size={19} fill="currentColor" />
        </Link>

        <div className="dashboard-sidebar-label">
          MENU PRINCIPAL
        </div>

        <nav className="dashboard-navigation">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <Link
                to={item.path}
                key={item.label}
                className={`dashboard-nav-item ${
                  item.active ? 'active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.active && (
                  <span className="dashboard-active-dot" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-security-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Votre sécurité</strong>
              <span>
                Un espace conçu pour votre tranquillité.
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="dashboard-nav-item"
            onClick={() => setMenuOpen(false)}
          >
            <Settings size={19} />
            <span>Retour à l'accueil public</span>
          </Link>

          <button
            type="button"
            className="dashboard-nav-item dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="dashboard-main">

        <header className="dashboard-topbar">
          <button
            className="dashboard-menu-toggle"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ouvrir ou fermer le menu"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>

          <div className="dashboard-breadcrumb">
            Mon espace <span>/</span> Tableau de bord
          </div>

          <div className="dashboard-topbar-actions">
            <button
              type="button"
              className="dashboard-icon-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="dashboard-notification-dot" />
            </button>

            <Link
              to="/profile"
              className="dashboard-avatar"
              aria-label="Accéder à mon profil"
            >
              <UserRound size={20} />
            </Link>
          </div>
        </header>

        <div className="dashboard-content">

          {/* Chargement */}
          {loading && (
            <div className="dashboard-loading">
              <LoaderCircle size={25} className="dashboard-loader" />
              <span>
                Préparation de votre espace personnel...
              </span>
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <div className="dashboard-error" role="alert">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Contenu lorsque les données sont disponibles */}
          {!loading && member && (
            <>
              {/* Bienvenue */}
              <section className="dashboard-welcome">
                <div>
                  <span className="dashboard-eyebrow">
                    <Sparkles size={15} />
                    VOTRE ESPACE PERSONNEL
                  </span>

                  <h1>
                    Bienvenue, <em>{member.pseudonym}.</em>
                  </h1>

                  <p>
                    Chaque belle histoire commence par une découverte.
                    Prenez le temps de rencontrer des personnes qui vous correspondent.
                  </p>

                  <br />

                  <div className="dashboard-member-location">
                    <MapPin size={16} />
                    <span>
                      {member.city}
                      {member.country === 'CD' ? ', RD Congo' : ''}
                    </span>
                  </div>
                </div>

                <div className="dashboard-welcome-decoration">
                  <Heart size={66} fill="currentColor" />
                </div>
              </section>

              {/* Recherche */}
              <section className="dashboard-search-section">
                <div>
                  <h2>Votre prochaine belle rencontre</h2>
                  <p>
                    Découvrez des personnes qui partagent vos centres d'intérêt.
                  </p>
                </div>

                <Link
                  to="/profile"
                  className="dashboard-search-button"
                >
                  <UserRound size={18} />
                  Compléter mon profil
                  <ArrowUpRight size={17} />
                </Link>
              </section>

              {/* Informations du compte */}
              <section className="dashboard-stats">

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-icon rose">
                    <UserRound size={21} />
                  </div>

                  <div>
                    <span>Mon pseudonyme</span>
                    <strong>{member.pseudonym}</strong>
                    <small>Votre identité sur Amoria</small>
                  </div>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-icon purple">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <span>Statut du compte</span>
                    <strong>
                      {accountStatus[member.account_status] || 'Inconnu'}
                    </strong>

                    <small>
                      {member.email_verified_at
                        ? 'Adresse e-mail vérifiée'
                        : 'Adresse e-mail non vérifiée'}
                    </small>
                  </div>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-icon gold">
                    <MapPin size={21} />
                  </div>

                  <div>
                    <span>Ma localisation</span>
                    <strong>{member.city}</strong>
                    <small>Votre ville de résidence</small>
                  </div>
                </article>

              </section>

              {/* Découverte */}
              <section className="dashboard-discovery">
                <div className="dashboard-section-heading">
                  <div>
                    <span className="dashboard-eyebrow">
                      FAITES DE NOUVELLES DÉCOUVERTES
                    </span>

                    <h2>Des rencontres vous attendent.</h2>

                    <p>
                      Votre espace de découverte sera bientôt disponible.
                    </p>
                  </div>

                  <span className="dashboard-coming-soon">
                    EN PRÉPARATION
                  </span>
                </div>

                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon">
                    <Heart size={34} />
                    <Sparkles size={17} />
                  </div>

                  <h3>Votre prochaine histoire commence ici.</h3>

                  <p>
                    Nous préparons un espace de découverte pour vous
                    présenter des profils selon vos préférences et vos affinités.
                  </p>
                </div>
              </section>

              <footer className="dashboard-footer">
                <span>
                  © {new Date().getFullYear()} Amoria
                </span>

                <span>
                  Des rencontres qui ont du sens. ♥
                </span>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard

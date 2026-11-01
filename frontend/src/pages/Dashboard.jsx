import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  Sparkles,
  ShieldCheck,
  MapPin,
  UserRound,
  ArrowUpRight,
} from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import './Dashboard.css'

const accountStatus = {
  ACTIVE: 'Compte actif',
  SUSPENDED: 'Compte suspendu',
  BANNED: 'Compte bloqué',
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Préparation de votre espace personnel…
      </span>

      <div className="skeleton dashboard-skeleton-hero" />

      <div className="dashboard-stats">
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-block" />
      </div>
    </div>
  )
}

function Dashboard() {
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

  return (
    <DashboardLayout breadcrumb="Tableau de bord">
      {loading && <DashboardSkeleton />}

      {!loading && error && (
        <div className="alert alert-error dashboard-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && member && (
        <>
          {/* Bienvenue */}
          <section className="dashboard-welcome reveal">
            <div>
              <span className="dashboard-eyebrow">
                <Sparkles size={15} />
                VOTRE ESPACE PERSONNEL
              </span>

              <h1>
                Bienvenue, <em>{member.pseudonym}.</em>
              </h1>

              <p>
                Chaque belle histoire commence par une découverte. Prenez le
                temps de rencontrer des personnes qui vous correspondent.
              </p>

              <div className="dashboard-member-location">
                <MapPin size={16} />
                <span>
                  {member.city}
                  {member.country === 'CD' ? ', RD Congo' : ''}
                </span>
              </div>
            </div>

            <div className="dashboard-welcome-decoration" aria-hidden="true">
              <Heart size={66} fill="currentColor" />
            </div>
          </section>

          {/* Appel à compléter le profil */}
          <section
            className="dashboard-search-section reveal"
            style={{ '--i': 1 }}
          >
            <div>
              <h2>Votre prochaine belle rencontre</h2>
              <p>
                Découvrez des personnes qui partagent vos centres d’intérêt.
              </p>
            </div>

            <Link to="/profile" className="btn btn-primary">
              <UserRound size={18} />
              Compléter mon profil
              <ArrowUpRight size={17} />
            </Link>
          </section>

          {/* Informations du compte */}
          <section className="dashboard-stats">
            <article
              className="card card-interactive dashboard-stat-card reveal"
              style={{ '--i': 2 }}
            >
              <div className="dashboard-stat-icon rose">
                <UserRound size={21} />
              </div>

              <div>
                <span>Mon pseudonyme</span>
                <strong>{member.pseudonym}</strong>
                <small>Votre identité sur Amoria</small>
              </div>
            </article>

            <article
              className="card card-interactive dashboard-stat-card reveal"
              style={{ '--i': 3 }}
            >
              <div className="dashboard-stat-icon wine">
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

            <article
              className="card card-interactive dashboard-stat-card reveal"
              style={{ '--i': 4 }}
            >
              <div className="dashboard-stat-icon slate">
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
          <section
            className="dashboard-discovery reveal"
            style={{ '--i': 5 }}
          >
            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-eyebrow">
                  FAITES DE NOUVELLES DÉCOUVERTES
                </span>

                <h2>Des rencontres vous attendent.</h2>

                <p>Votre espace de découverte sera bientôt disponible.</p>
              </div>

              <span className="badge">EN PRÉPARATION</span>
            </div>

            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon">
                <Heart size={34} />
                <Sparkles size={17} />
              </div>

              <h3>Votre prochaine histoire commence ici.</h3>

              <p>
                Nous préparons un espace de découverte pour vous présenter des
                profils selon vos préférences et vos affinités.
              </p>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  )
}

export default Dashboard
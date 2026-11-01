import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Compass,
  LoaderCircle,
  MapPin,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import {
  getDiscoverProfiles,
  recordProfileView,
} from '../services/discoveryService'

import './Discover.css'

const MAX_VISIBLE_INTERESTS = 4

function formatLocation(profile) {
  const country = profile.country === 'CD' ? 'RD Congo' : profile.country

  return (
    [profile.city, country].filter(Boolean).join(', ') ||
    'Ville non renseignée'
  )
}

function DiscoverSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Nous recherchons des profils…
      </span>

      <div className="discover-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton discover-skeleton-card" />
        ))}
      </div>
    </div>
  )
}

function Discover() {
  const [profiles, setProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)

  const recordedViews = useRef(new Set())

  // Charger les profils depuis le backend
  const loadProfiles = useCallback(
    async ({ loadMore = false, cursor = null } = {}) => {
      if (loadMore) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
        setError('')
      }

      try {
        const result = await getDiscoverProfiles({
          limit: 12,
          after: loadMore ? cursor : null,
        })

        const newProfiles = result.profiles || []

        setProfiles((currentProfiles) => {
          if (!loadMore) {
            return newProfiles
          }

          const existingIds = new Set(
            currentProfiles.map((profile) => profile.profile_id)
          )

          return [
            ...currentProfiles,
            ...newProfiles.filter(
              (profile) => !existingIds.has(profile.profile_id)
            ),
          ]
        })

        setHasMore(Boolean(result.has_more))
        setNextCursor(result.next_cursor ?? null)
      } catch (err) {
        setError(err.message || 'Impossible de charger les profils.')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  // Chargement initial
  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  // Enregistrer les consultations des profils
  useEffect(() => {
    profiles.forEach((profile) => {
      const profileId = profile.profile_id

      if (!recordedViews.current.has(profileId)) {
        recordedViews.current.add(profileId)

        recordProfileView(profileId).catch((err) => {
          console.warn(
            `Impossible d'enregistrer la consultation du profil ${profileId}:`,
            err.message
          )
        })
      }
    })
  }, [profiles])

  // Charger la page suivante
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && nextCursor !== null) {
      loadProfiles({
        loadMore: true,
        cursor: nextCursor,
      })
    }
  }

  return (
    <DashboardLayout breadcrumb="Découvrir">
      <div className="discover-page">
        <header className="discover-header reveal">
          <span className="discover-eyebrow">
            <Compass size={15} />
            DÉCOUVERTE
          </span>

          <h1>Et si une belle rencontre commençait ici ?</h1>

          <p>
            Découvrez des personnes qui partagent vos envies et vos centres
            d’intérêt. Prenez le temps de faire connaissance.
          </p>
        </header>

        {isLoading && <DiscoverSkeleton />}

        {!isLoading && error && (
          <div className="alert alert-error discover-error" role="alert">
            <div>
              <strong>Impossible de charger les profils</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadProfiles()}
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && profiles.length === 0 && (
          <section className="card discover-empty reveal">
            <div className="discover-empty-icon" aria-hidden="true">
              <Compass size={34} />
              <Sparkles size={17} />
            </div>

            <h2>Aucun profil pour le moment</h2>

            <p>
              Nous n’avons pas encore trouvé de profil correspondant à vos
              préférences. Vous pouvez les modifier depuis votre profil.
            </p>

            <Link to="/profile" className="btn btn-primary">
              <SlidersHorizontal size={18} />
              Modifier mes préférences
            </Link>
          </section>
        )}

        {!isLoading && !error && profiles.length > 0 && (
          <>
            <section
              className="discover-grid"
              aria-label="Profils compatibles"
            >
              {profiles.map((profile, index) => {
                const visibleInterests = (profile.interests || []).slice(
                  0,
                  MAX_VISIBLE_INTERESTS
                )
                const hiddenCount =
                  (profile.interests?.length || 0) - visibleInterests.length

                return (
                  <article
                    className="card card-interactive discover-card reveal"
                    key={profile.profile_id}
                    style={{ '--i': index % 6 }}
                  >
                    <div className="discover-card-banner" aria-hidden="true" />

                    <div className="discover-card-body">
                      <div className="discover-avatar" aria-hidden="true">
                        {profile.pseudonym?.charAt(0).toUpperCase() || '?'}
                      </div>

                      <h2 className="discover-card-name">
                        {profile.pseudonym}
                        <span className="discover-card-age">
                          , {profile.age}
                        </span>
                      </h2>

                      <p className="discover-card-meta">
                        <MapPin size={15} />
                        <span>{formatLocation(profile)}</span>
                      </p>

                      {profile.profession && (
                        <p className="discover-card-meta discover-card-job">
                          <Briefcase size={15} />
                          <span>{profile.profession}</span>
                        </p>
                      )}

                      <p className="discover-card-bio">
                        {profile.biography ||
                          'Cette personne n’a pas encore ajouté de présentation.'}
                      </p>

                      {visibleInterests.length > 0 && (
                        <ul className="discover-interests">
                          {visibleInterests.map((interest) => (
                            <li
                              className="discover-interest"
                              key={interest.id}
                            >
                              {interest.name}
                            </li>
                          ))}

                          {hiddenCount > 0 && (
                            <li className="discover-interest discover-interest-more">
                              +{hiddenCount}
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>

            {hasMore && (
              <div className="discover-load-more">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <LoaderCircle size={18} className="discover-spin" />
                      Chargement…
                    </>
                  ) : (
                    'Voir plus de profils'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Discover
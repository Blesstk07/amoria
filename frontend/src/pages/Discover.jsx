
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getDiscoverProfiles,
  recordProfileView,
} from '../services/discoveryService'

const styles = `
  .discover-page {
    min-height: 100vh;
    padding: 48px 6%;
    background: #FFF8F4;
    color: #292329;
  }

  .discover-header {
    max-width: 1100px;
    margin: 0 auto 36px;
  }

  .discover-eyebrow {
    color: #8D304F;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .discover-title {
    margin: 10px 0;
    color: #292329;
    font-family: Georgia, serif;
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 500;
  }

  .discover-subtitle {
    max-width: 580px;
    color: #766B70;
    font-size: 15px;
    line-height: 1.7;
  }

  .discover-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .discover-card {
    overflow: hidden;
    border: 1px solid #F0DDE2;
    border-radius: 18px;
    background: #FFFFFF;
    box-shadow: 0 8px 28px rgba(75, 35, 48, 0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .discover-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px rgba(75, 35, 48, 0.11);
  }

  .discover-card-banner {
    display: flex;
    height: 150px;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #8D304F, #E8A9B9);
  }

  .discover-avatar {
    display: flex;
    width: 88px;
    height: 88px;
    align-items: center;
    justify-content: center;
    border: 3px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    background: #FFF8F4;
    color: #8D304F;
    font-family: Georgia, serif;
    font-size: 34px;
  }

  .discover-card-content {
    padding: 22px;
  }

  .discover-card-name {
    margin: 0;
    color: #292329;
    font-family: Georgia, serif;
    font-size: 25px;
    font-weight: 500;
  }

  .discover-card-location {
    margin-top: 7px;
    color: #8D304F;
    font-size: 13px;
  }

  .discover-card-profession {
    margin-top: 15px;
    color: #51464B;
    font-size: 14px;
    font-weight: 600;
  }

  .discover-card-bio {
    min-height: 44px;
    margin-top: 10px;
    color: #766B70;
    font-size: 14px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .discover-interests {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .discover-interest {
    padding: 7px 11px;
    border-radius: 20px;
    background: #F9E9ED;
    color: #8D304F;
    font-size: 12px;
  }

  .discover-state {
    max-width: 600px;
    margin: 65px auto;
    padding: 35px 24px;
    border: 1px solid #F0DDE2;
    border-radius: 18px;
    background: white;
    text-align: center;
  }

  .discover-state h2 {
    margin: 0 0 12px;
    font-family: Georgia, serif;
    font-size: 25px;
    font-weight: 500;
  }

  .discover-state p {
    color: #766B70;
    line-height: 1.6;
  }

  .discover-button {
    margin-top: 20px;
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    background: #8D304F;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .discover-button:hover {
    background: #70243D;
  }

  .discover-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .discover-load-more {
    display: flex;
    justify-content: center;
    margin: 36px auto;
  }

  @media (max-width: 600px) {
    .discover-page {
      padding: 32px 18px;
    }

    .discover-grid {
      grid-template-columns: 1fr;
      gap: 18px;
    }

    .discover-card-banner {
      height: 130px;
    }
  }
`

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
    <>
      <style>{styles}</style>

      <main className="discover-page">
        <header className="discover-header">
          <span className="discover-eyebrow">
            AMORIA · DÉCOUVERTE
          </span>

          <h1 className="discover-title">
            Et si une belle rencontre commençait ici ?
          </h1>

          <p className="discover-subtitle">
            Découvrez des personnes qui partagent vos envies et vos centres
            d'intérêt. Prenez le temps de faire connaissance.
          </p>
        </header>

        {isLoading && (
          <div className="discover-state">
            <h2>Nous recherchons des profils...</h2>
            <p>Un instant, nous préparons vos suggestions.</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="discover-state">
            <h2>Impossible de charger les profils</h2>
            <p>{error}</p>

            <button
              className="discover-button"
              onClick={() => loadProfiles()}
            >
              Réessayer
            </button>
          </div>
        )}

        {!isLoading && !error && profiles.length === 0 && (
          <div className="discover-state">
            <h2>Aucun profil pour le moment</h2>

            <p>
              Nous n'avons pas encore trouvé de profil correspondant à vos
              préférences. Vous pouvez les modifier depuis votre profil.
            </p>
          </div>
        )}

        {!isLoading && !error && profiles.length > 0 && (
          <>
            <section
              className="discover-grid"
              aria-label="Profils compatibles"
            >
              {profiles.map((profile) => (
                <article
                  className="discover-card"
                  key={profile.profile_id}
                >
                  <div className="discover-card-banner">
                    <div className="discover-avatar" aria-hidden="true">
                      {profile.pseudonym?.charAt(0).toUpperCase() || '?'}
                    </div>
                  </div>

                  <div className="discover-card-content">
                    <h2 className="discover-card-name">
                      {profile.pseudonym}, {profile.age}
                    </h2>

                    <div className="discover-card-location">
                      {profile.city || 'Ville non renseignée'}
                      {profile.country ? ` · ${profile.country}` : ''}
                    </div>

                    {profile.profession && (
                      <div className="discover-card-profession">
                        {profile.profession}
                      </div>
                    )}

                    <p className="discover-card-bio">
                      {profile.biography ||
                        'Cette personne n’a pas encore ajouté de présentation.'}
                    </p>

                    {profile.interests?.length > 0 && (
                      <div className="discover-interests">
                        {profile.interests.map((interest) => (
                          <span
                            className="discover-interest"
                            key={interest.id}
                          >
                            {interest.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>

            {hasMore && (
              <div className="discover-load-more">
                <button
                  className="discover-button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore
                    ? 'Chargement...'
                    : 'Voir plus de profils'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}

export default Discover

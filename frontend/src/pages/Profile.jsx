import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import ProfileForm from '../components/profile/ProfileForm'
import InterestsSelector from '../components/profile/InterestsSelector'
import PreferencesForm from '../components/profile/PreferencesForm'

import {
  getProfile,
  updateProfile,
  updatePreferences,
} from '../services/profileService'

import './Profile.css'

function ProfileSkeleton() {
  return (
    <div className="profile-content" aria-busy="true">
      <span className="sr-only" role="status">
        Chargement de votre profil…
      </span>
      <div className="skeleton profile-skeleton-card" />
      <div className="skeleton profile-skeleton-card" />
      <div className="skeleton profile-skeleton-card" />
    </div>
  )
}

function Profile() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [interests, setInterests] = useState([])
  const [preferences, setPreferences] = useState(null)

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formVersion, setFormVersion] = useState(0)

  const selectedIds = interests.map((interest) => interest.id)

  const loadProfile = async () => {
    try {
      const data = await getProfile()

      setProfile(data.profile)
      setInterests(data.interests || [])
      setPreferences(data.preferences)

      setFormVersion((version) => version + 1)
    } catch (err) {
      if (err.message.includes('connecté')) {
        navigate('/login')
        return
      }

      setError(err.message || 'Impossible de charger votre profil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  // Le message de réussite disparaît tout seul
  useEffect(() => {
    if (!success) return

    const timer = setTimeout(() => setSuccess(''), 6000)
    return () => clearTimeout(timer)
  }, [success])

  const handleRetry = () => {
    setError('')
    setLoading(true)
    loadProfile()
  }

  const handleProfileSave = async (formData) => {
    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      await updateProfile({
        ...formData,
        interests: selectedIds,
      })

      await loadProfile()
      setSuccess('Votre profil a été mis à jour avec succès.')
    } catch (err) {
      setError(err.message || 'Impossible de modifier votre profil.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleInterestsChange = (ids) => {
    setInterests(
      ids.map((id) => ({
        id,
        name: interests.find((interest) => interest.id === id)?.name
          || 'Centre d’intérêt',
      }))
    )
  }

  const handleInterestsSave = async () => {
    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      await updateProfile({
        pseudonym: profile.pseudonym,
        gender: profile.gender,
        country: profile.country,
        city: profile.city,
        profession: profile.profession,
        biography: profile.biography,
        interests: selectedIds,
      })

      await loadProfile()
      setSuccess('Vos centres d’intérêt ont été enregistrés.')
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer vos centres d’intérêt.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePreferencesSave = async (formData) => {
    setSavingPreferences(true)
    setError('')
    setSuccess('')

    try {
      await updatePreferences(formData)

      await loadProfile()
      setSuccess('Vos préférences ont été enregistrées.')
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer vos préférences.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const ready = !loading && profile && preferences

  return (
    <DashboardLayout breadcrumb="Mon profil">
      <div className="profile-page">
        <header className="profile-page-header reveal">
          <h1>Mon profil</h1>
          <p>Faites découvrir votre personnalité sur Amoria.</p>
        </header>

        {loading && <ProfileSkeleton />}

        {!loading && (!profile || !preferences) && (
          <div className="alert alert-error profile-load-error" role="alert">
            <p>{error || 'Impossible de récupérer les informations du profil.'}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRetry}
            >
              Réessayer
            </button>
          </div>
        )}

        {ready && (
          <>
            {(error || success) && (
              <div className="profile-messages">
                {error && (
                  <div className="alert alert-error" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="status">
                    {success}
                  </div>
                )}
              </div>
            )}

            <div className="profile-content">
              <section
                className="card profile-card reveal"
                style={{ '--i': 1 }}
              >
                <ProfileForm
                  key={`profile-${formVersion}`}
                  profile={profile}
                  onSave={handleProfileSave}
                  saving={savingProfile}
                />
              </section>

              <section
                className="card profile-card reveal"
                style={{ '--i': 2 }}
              >
                <InterestsSelector
                  selectedIds={selectedIds}
                  onChange={handleInterestsChange}
                />

                <div className="profile-save-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleInterestsSave}
                    disabled={savingProfile || selectedIds.length === 0}
                  >
                    {savingProfile ? (
                      <>
                        <LoaderCircle size={18} className="profile-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      'Enregistrer mes centres d’intérêt'
                    )}
                  </button>
                </div>
              </section>

              <section
                className="card profile-card reveal"
                style={{ '--i': 3 }}
              >
                <PreferencesForm
                  key={`preferences-${formVersion}`}
                  preferences={preferences}
                  onSave={handlePreferencesSave}
                  saving={savingPreferences}
                />
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Profile
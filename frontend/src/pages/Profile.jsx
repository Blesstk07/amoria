import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import ProfileForm from '../components/profile/ProfileForm'
import InterestsSelector from '../components/profile/InterestsSelector'
import PreferencesForm from '../components/profile/PreferencesForm'

import {
  getProfile,
  updateProfile,
  updatePreferences,
} from '../services/profileService'

import './Profile.css'

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

  if (loading) {
    return (
      <div className="profile-loading">
        Chargement de votre profil...
      </div>
    )
  }

  if (!profile || !preferences) {
    return (
      <div className="profile-loading">
        <p>{error || 'Impossible de récupérer les informations du profil.'}</p>
        <button onClick={loadProfile}>Réessayer</button>
      </div>
    )
  }

  return (
    <main className="profile-page">
      <header className="profile-page-header">
        <div>
          <Link to="/dashboard" className="profile-back-link">
            ← Retour au tableau de bord
          </Link>

          <h1>Mon profil</h1>
          <p>Faites découvrir votre personnalité sur Amoria.</p>
        </div>
      </header>

      {error && (
        <div className="profile-message error-message" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-message success-message" role="status">
          {success}
        </div>
      )}

      <div className="profile-content">
        <section className="profile-card">
          <ProfileForm
            key={`profile-${formVersion}`}
            profile={profile}
            onSave={handleProfileSave}
            saving={savingProfile}
          />
        </section>

        <section className="profile-card">
          <InterestsSelector
            selectedIds={selectedIds}
            onChange={handleInterestsChange}
          />

          <button
            type="button"
            className="profile-save-button"
            onClick={handleInterestsSave}
            disabled={savingProfile || selectedIds.length === 0}
          >
            {savingProfile
              ? 'Enregistrement...'
              : 'Enregistrer mes centres d’intérêt'}
          </button>
        </section>

        <section className="profile-card">
          <PreferencesForm
            key={`preferences-${formVersion}`}
            preferences={preferences}
            onSave={handlePreferencesSave}
            saving={savingPreferences}
          />
        </section>
      </div>
    </main>
  )
}

export default Profile

import { useState } from 'react'

function ProfileForm({ profile, onSave, saving }) {
  const [form, setForm] = useState({
    pseudonym: profile.pseudonym || '',
    gender: profile.gender || 'MAN',
    country: profile.country || 'CD',
    city: profile.city || '',
    profession: profile.profession || '',
    biography: profile.biography || '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onSave({
      ...form,
      profession: form.profession.trim() || null,
      biography: form.biography.trim() || null,
    })
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form-heading">
        <h2>Informations personnelles</h2>
        <p>Présentez-vous avec quelques informations.</p>
      </div>

      <div className="profile-form-grid">
        <div className="profile-field">
          <label htmlFor="pseudonym">Pseudonyme</label>
          <input
            id="pseudonym"
            name="pseudonym"
            type="text"
            minLength={2}
            maxLength={50}
            value={form.pseudonym}
            onChange={handleChange}
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="gender">Genre</label>
          <select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="MAN">Homme</option>
            <option value="WOMAN">Femme</option>
          </select>
        </div>

        <div className="profile-field">
          <label htmlFor="country">Code du pays</label>
          <input
            id="country"
            name="country"
            type="text"
            maxLength={2}
            value={form.country}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                country: event.target.value.toUpperCase(),
              }))
            }
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="city">Ville</label>
          <input
            id="city"
            name="city"
            type="text"
            maxLength={100}
            value={form.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="profile-field profile-field-full">
          <label htmlFor="profession">Profession</label>
          <input
            id="profession"
            name="profession"
            type="text"
            maxLength={100}
            placeholder="Ex. Étudiant en informatique"
            value={form.profession}
            onChange={handleChange}
          />
        </div>

        <div className="profile-field profile-field-full">
          <label htmlFor="biography">À propos de moi</label>
          <textarea
            id="biography"
            name="biography"
            rows={5}
            maxLength={1000}
            placeholder="Parlez un peu de vous..."
            value={form.biography}
            onChange={handleChange}
          />
          <small>{form.biography.length}/1000 caractères</small>
        </div>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
      </button>
    </form>
  )
}

export default ProfileForm

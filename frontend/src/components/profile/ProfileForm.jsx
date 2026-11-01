import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

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
        <div className="field">
          <label className="field-label" htmlFor="pseudonym">
            Pseudonyme
          </label>
          <input
            className="field-input"
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

        <div className="field">
          <label className="field-label" htmlFor="gender">
            Genre
          </label>
          <select
            className="field-input"
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

        <div className="field">
          <label className="field-label" htmlFor="country">
            Code du pays
          </label>
          <input
            className="field-input"
            id="country"
            name="country"
            type="text"
            maxLength={2}
            aria-describedby="country-hint"
            value={form.country}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                country: event.target.value.toUpperCase(),
              }))
            }
            required
          />
          <span className="field-hint" id="country-hint">
            2 lettres, par exemple CD pour la RD Congo.
          </span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="city">
            Ville
          </label>
          <input
            className="field-input"
            id="city"
            name="city"
            type="text"
            maxLength={100}
            value={form.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="field profile-field-full">
          <label className="field-label" htmlFor="profession">
            Profession
          </label>
          <input
            className="field-input"
            id="profession"
            name="profession"
            type="text"
            maxLength={100}
            placeholder="Ex. Étudiant en informatique"
            value={form.profession}
            onChange={handleChange}
          />
        </div>

        <div className="field profile-field-full">
          <label className="field-label" htmlFor="biography">
            À propos de moi
          </label>
          <textarea
            className="field-input"
            id="biography"
            name="biography"
            rows={5}
            maxLength={1000}
            placeholder="Parlez un peu de vous..."
            value={form.biography}
            onChange={handleChange}
          />
          <span className="field-hint profile-counter">
            {form.biography.length}/1000 caractères
          </span>
        </div>
      </div>

      <div className="profile-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (
            <>
              <LoaderCircle size={18} className="profile-spin" />
              Enregistrement…
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </button>
      </div>
    </form>
  )
}

export default ProfileForm
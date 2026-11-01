import { useState } from 'react'

function PreferencesForm({ preferences, onSave, saving }) {
  const [form, setForm] = useState({
    preferred_gender: preferences.preferred_gender || '',
    min_age: preferences.min_age ?? 18,
    max_age: preferences.max_age ?? 99,
    preferred_country: preferences.preferred_country || '',
    preferred_city: preferences.preferred_city || '',
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
      preferred_gender: form.preferred_gender || null,
      min_age: Number(form.min_age),
      max_age: Number(form.max_age),
      preferred_country: form.preferred_country.trim().toUpperCase() || null,
      preferred_city: form.preferred_city.trim() || null,
    })
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="profile-form-heading">
        <h2>Mes préférences de découverte</h2>
        <p>
          Définissez les profils que vous souhaitez découvrir sur Amoria.
        </p>
      </div>

      <div className="profile-form-grid">
        <div className="profile-field">
          <label htmlFor="preferred_gender">Genre recherché</label>
          <select
            id="preferred_gender"
            name="preferred_gender"
            value={form.preferred_gender}
            onChange={handleChange}
          >
            <option value="">Tous les genres</option>
            <option value="MAN">Hommes</option>
            <option value="WOMAN">Femmes</option>
          </select>
        </div>

        <div className="profile-field">
          <label htmlFor="min_age">Âge minimum</label>
          <input
            id="min_age"
            name="min_age"
            type="number"
            min="18"
            max="99"
            value={form.min_age}
            onChange={handleChange}
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="max_age">Âge maximum</label>
          <input
            id="max_age"
            name="max_age"
            type="number"
            min="18"
            max="99"
            value={form.max_age}
            onChange={handleChange}
            required
          />
        </div>

        <div className="profile-field">
          <label htmlFor="preferred_country">Pays préféré (facultatif)</label>
          <input
            id="preferred_country"
            name="preferred_country"
            type="text"
            maxLength={2}
            placeholder="Ex. CD"
            value={form.preferred_country}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                preferred_country: event.target.value.toUpperCase(),
              }))
            }
          />
        </div>

        <div className="profile-field profile-field-full">
          <label htmlFor="preferred_city">Ville préférée (facultatif)</label>
          <input
            id="preferred_city"
            name="preferred_city"
            type="text"
            maxLength={100}
            placeholder="Ex. Kinshasa"
            value={form.preferred_city}
            onChange={handleChange}
          />
        </div>
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer mes préférences'}
      </button>
    </form>
  )
}

export default PreferencesForm
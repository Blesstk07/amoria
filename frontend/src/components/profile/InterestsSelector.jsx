
import { useState } from 'react'
import { Check } from 'lucide-react'

const AVAILABLE_INTERESTS = [
  { id: 1, name: 'Voyages', emoji: '✈️' },
  { id: 2, name: 'Musique', emoji: '🎵' },
  { id: 3, name: 'Cinéma', emoji: '🎬' },
  { id: 4, name: 'Lecture', emoji: '📚' },
  { id: 5, name: 'Sport', emoji: '⚽' },
  { id: 6, name: 'Cuisine', emoji: '🍳' },
  { id: 7, name: 'Technologie', emoji: '💻' },
  { id: 8, name: 'Nature', emoji: '🌿' },
  { id: 9, name: 'Art et culture', emoji: '🎨' },
  { id: 10, name: 'Entrepreneuriat', emoji: '💡' },
  { id: 11, name: 'Photographie', emoji: '📷' },
  { id: 12, name: 'Spiritualité', emoji: '✨' },
]

function InterestsSelector({ selectedIds = [], onChange }) {
  const [selected, setSelected] = useState(selectedIds)

  const toggleInterest = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id]

    if (updated.length > 20) return

    setSelected(updated)
    onChange(updated)
  }

  return (
    <section className="interests-selector">
      <div className="profile-form-heading">
        <h2>Mes centres d'intérêt</h2>
        <p>
          Sélectionnez les activités et passions qui vous ressemblent.
        </p>
      </div>

      <div className="interests-grid">
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id)

          return (
            <button
              key={interest.id}
              type="button"
              className={`interest-option ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest.id)}
              aria-pressed={isSelected}
            >
              <span className="interest-emoji">{interest.emoji}</span>
              <span>{interest.name}</span>

              {isSelected && (
                <span className="interest-check">
                  <Check size={14} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="interests-counter">
        {selected.length} centre(s) sélectionné(s)
      </p>

      {selected.length === 0 && (
        <p className="interests-warning">
          Sélectionnez au moins un centre d'intérêt.
        </p>
      )}
    </section>
  )
}

export default InterestsSelector

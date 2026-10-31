
import {
  Heart,
  Eye,
  SlidersHorizontal,
  Undo2,
  Sparkles,
  Check,
  Crown
} from 'lucide-react'

import './Premium.css'

const benefits = [
  {
    icon: Eye,
    title: 'Voir les likes reçus',
    description: 'Découvrez les personnes qui ont déjà manifesté leur intérêt.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Filtres avancés',
    description: 'Affinez vos découvertes selon vos préférences.'
  },
  {
    icon: Undo2,
    title: 'Annuler un passage',
    description: 'Revenez sur un profil que vous avez passé par erreur.'
  },
  {
    icon: Heart,
    title: 'Plus de likes',
    description: 'Profitez d’une limite quotidienne de likes plus élevée.'
  },
  {
    icon: Sparkles,
    title: 'Mise en avant',
    description: 'Augmentez temporairement la visibilité de votre profil.'
  }
]

function Premium() {
  return (
    <section className="premium" id="premium">
      <div className="premium-container">

        <div className="premium-heading">
          <span className="section-eyebrow">Amoria Premium</span>

          <h2>
            Faites plus de place
            <span> aux belles rencontres.</span>
          </h2>

          <p>
            Profitez de fonctionnalités supplémentaires pour enrichir
            votre expérience et multiplier vos possibilités de rencontre.
          </p>
        </div>

        <div className="premium-card">

          <div className="premium-card-header">
            <div className="premium-crown">
              <Crown size={27} />
            </div>

            <span className="premium-label">L'expérience Premium</span>

            <h3>Chaque rencontre compte.</h3>

            <p>
              Découvrez davantage de possibilités avec les outils
              supplémentaires d'Amoria.
            </p>
          </div>

          <div className="premium-benefits">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon

              return (
                <article className="premium-benefit" key={index}>
                  <div className="premium-benefit-icon">
                    <Icon size={20} />
                  </div>

                  <div className="premium-benefit-text">
                    <h4>{benefit.title}</h4>
                    <p>{benefit.description}</p>
                  </div>

                  <Check className="premium-check" size={19} />
                </article>
              )
            })}
          </div>

          <div className="premium-footer">
            <div>
              <span className="premium-footer-title">
                Votre expérience, à votre rythme.
              </span>
              <span className="premium-footer-description">
                Commencez gratuitement et découvrez les options Premium.
              </span>
            </div>

            <a href="/register" className="premium-button">
              Découvrir Amoria
              <Crown size={17} />
            </a>
          </div>

        </div>

        <p className="premium-note">
          Les fonctionnalités essentielles de sécurité et de protection
          restent accessibles gratuitement à tous les membres.
        </p>

      </div>
    </section>
  )
}

export default Premium

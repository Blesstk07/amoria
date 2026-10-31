
import { Heart, Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react'
import './Concept.css'

const values = [
  {
    icon: Heart,
    number: '01',
    title: 'Des rencontres authentiques',
    description:
      'Derrière chaque profil se trouve une personne, une histoire et des aspirations. Amoria privilégie les échanges sincères plutôt que les apparences.'
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Des affinités qui comptent',
    description:
      'Vos centres d’intérêt, vos valeurs et vos préférences permettent de découvrir des personnes avec lesquelles vous pourriez réellement vous entendre.'
  },
  {
    icon: ShieldCheck,
    number: '03',
    title: 'La confiance avant tout',
    description:
      'La confidentialité, la modération et les outils de sécurité sont au cœur de notre expérience. Chacun doit pouvoir faire des rencontres sereinement.'
  }
]

function Concept() {
  return (
    <section className="concept" id="concept">
      <div className="concept-container">

        <div className="concept-heading">
          <span className="section-eyebrow">L'esprit Amoria</span>

          <h2>
            Plus qu'une rencontre,
            <span> une véritable connexion.</span>
          </h2>

          <p>
            Nous croyons que les plus belles relations commencent
            lorsque deux personnes ont réellement quelque chose à partager.
          </p>
        </div>

        <div className="concept-grid">
          {values.map((value) => {
            const Icon = value.icon

            return (
              <article className="concept-card" key={value.number}>
                <div className="concept-card-top">
                  <div className="concept-icon">
                    <Icon size={23} />
                  </div>

                  <span className="concept-number">
                    {value.number}
                  </span>
                </div>

                <h3>{value.title}</h3>

                <p>{value.description}</p>

                <div className="concept-card-decoration">
                  <ArrowUpRight size={20} />
                </div>
              </article>
            )
          })}
        </div>

        <div className="concept-bottom">
          <Heart size={17} fill="currentColor" />
          <span>Amoria, des rencontres qui ont du sens.</span>
        </div>

      </div>
    </section>
  )
}

export default Concept

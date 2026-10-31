
import {
  ShieldCheck,
  LockKeyhole,
  Ban,
  Flag,
  ArrowUpRight
} from 'lucide-react'

import './Security.css'

const protections = [
  {
    icon: ShieldCheck,
    title: 'Profils modérés',
    description:
      'Les photos et les profils font l’objet de contrôles afin de limiter les faux comptes et les contenus inappropriés.'
  },
  {
    icon: LockKeyhole,
    title: 'Vie privée protégée',
    description:
      'Vos informations personnelles sont protégées. Votre date de naissance complète reste privée.'
  },
  {
    icon: Ban,
    title: 'Blocage des utilisateurs',
    description:
      'Vous pouvez bloquer un membre à tout moment pour empêcher de nouvelles interactions avec lui.'
  },
  {
    icon: Flag,
    title: 'Signalement des abus',
    description:
      'Un outil de signalement permet de transmettre les comportements suspects à notre équipe de modération.'
  }
]

function Security() {
  return (
    <section className="security" id="securite">
      <div className="security-container">

        <div className="security-visual">
          <div className="security-image-wrapper">
            <img
              src="/images/amoria.jpg"
              alt="Univers visuel chaleureux d'Amoria"
              className="security-image"
            />

            <div className="security-image-badge">
              <ShieldCheck size={22} />
              <div>
                <strong>Votre sécurité</strong>
                <span>Une priorité permanente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="security-content">
          <span className="section-eyebrow">
            Sécurité et confiance
          </span>

          <h2>
            Rencontrez en toute
            <span> sérénité.</span>
          </h2>

          <p className="security-intro">
            Faire une rencontre devrait être une expérience positive.
            C'est pourquoi Amoria intègre la sécurité et le respect
            de la vie privée au cœur de sa conception.
          </p>

          <div className="security-list">
            {protections.map((item, index) => {
              const Icon = item.icon

              return (
                <article className="security-item" key={index}>
                  <div className="security-icon">
                    <Icon size={21} />
                  </div>

                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              )
            })}
          </div>

          <a href="/register" className="security-link">
            Rejoindre Amoria
            <ArrowUpRight size={18} />
          </a>
        </div>

      </div>
    </section>
  )
}

export default Security

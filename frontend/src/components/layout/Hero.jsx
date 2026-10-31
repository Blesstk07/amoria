
import { ArrowUpRight, Heart, ShieldCheck } from 'lucide-react'
import './Hero.css'

function Hero() {
  return (
    <section className="hero" id="accueil">
      <div className="hero-container">

        <div className="hero-content">
          <span className="hero-label">
            <Heart size={15} fill="currentColor" />
            Des rencontres autrement
          </span>

          <h1>
            Et si votre prochaine rencontre
            <span> changeait tout ?</span>
          </h1>

          <p className="hero-description">
            Amoria vous aide à rencontrer des personnes qui partagent
            vos valeurs, vos envies et votre vision d'une belle relation.
          </p>

          <div className="hero-actions">
            <a href="/register" className="hero-primary-button">
              Créer mon compte
              <ArrowUpRight size={18} />
            </a>

            <a href="#concept" className="hero-secondary-button">
              Découvrir Amoria
            </a>
          </div>

          <div className="hero-trust">
            <ShieldCheck size={18} />
            <span>Un espace pensé pour des rencontres authentiques et sécurisées.</span>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="/images/hero.jpg"
            alt="Une ambiance chaleureuse et romantique"
            className="hero-image"
          />

          <div className="hero-image-caption">
            <Heart size={16} fill="currentColor" />
            <span>Les belles histoires commencent quelque part.</span>
          </div>
        </div>

      </div>
    </section>
  )
}

export default Hero

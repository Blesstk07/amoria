import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'

import './PlaceholderPages.css'

function NotFound() {
  return (
    <main className="not-found">
      <div className="card not-found-card reveal">
        <Link to="/" className="not-found-brand">
          Amoria <Heart size={20} fill="currentColor" />
        </Link>

        <span className="not-found-code" aria-hidden="true">
          404
        </span>

        <h1>Cette page s’est égarée.</h1>
        <p>
          Le lien que vous avez suivi n’existe pas ou n’existe plus.
          Retrouvons ensemble le bon chemin.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Accueil
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Mon espace
          </Link>
        </div>
      </div>
    </main>
  )
}

export default NotFound
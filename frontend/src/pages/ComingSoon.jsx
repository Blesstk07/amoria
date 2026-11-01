import { Link } from 'react-router-dom'
import { Compass, Heart, MessageCircle, Sparkles, ArrowLeft } from 'lucide-react'

import DashboardLayout from '../layouts/DashboardLayout'
import './PlaceholderPages.css'

const sections = {
  discover: {
    breadcrumb: 'Découvrir',
    icon: Compass,
    title: 'Votre espace de découverte arrive bientôt.',
    description:
      'Nous préparons une façon simple et respectueuse de rencontrer des personnes qui partagent vos centres d’intérêt.',
  },
  likes: {
    breadcrumb: 'Mes likes',
    icon: Heart,
    title: 'Vos likes seront bientôt réunis ici.',
    description:
      'Vous retrouverez ici les personnes qui vous ont plu, et celles que vous avez séduites.',
  },
  messages: {
    breadcrumb: 'Messages',
    icon: MessageCircle,
    title: 'Votre messagerie arrive bientôt.',
    description:
      'Bientôt, vous pourrez échanger en toute sérénité avec les personnes qui comptent pour vous.',
  },
}

function ComingSoon({ section }) {
  const config = sections[section] || sections.discover
  const Icon = config.icon

  return (
    <DashboardLayout breadcrumb={config.breadcrumb}>
      <section className="card coming-soon reveal">
        <span className="badge">EN PRÉPARATION</span>

        <div className="coming-soon-icon" aria-hidden="true">
          <Icon size={34} />
          <Sparkles size={17} />
        </div>

        <h1>{config.title}</h1>
        <p>{config.description}</p>

        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </Link>
      </section>
    </DashboardLayout>
  )
}

export default ComingSoon
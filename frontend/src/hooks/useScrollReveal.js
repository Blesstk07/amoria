import { useLayoutEffect } from 'react'

// Éléments de la landing qui apparaissent progressivement au défilement.
// Aucune modification des composants n'est nécessaire.
const TARGETS = [
  '.concept-heading',
  '.concept-card',
  '.concept-bottom',
  '.security-visual',
  '.security-content',
  '.premium-heading',
  '.premium-card',
  '.premium-note',
  '.footer-main',
]

function useScrollReveal() {
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = Array.from(document.querySelectorAll(TARGETS.join(',')))
    const timers = []

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const element = entry.target

          element.classList.add('is-visible')
          observer.unobserve(element)

          // Une fois l'apparition terminée, on rend à l'élément ses
          // transitions d'origine (effets de survol des cartes, etc.).
          timers.push(
            setTimeout(() => {
              element.classList.remove('reveal-on-scroll', 'is-visible')
              element.style.removeProperty('--d')
            }, 1200)
          )
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    elements.forEach((element) => {
      // Léger décalage entre éléments frères (cartes en cascade)
      const index = Array.from(element.parentElement.children).indexOf(element)

      element.style.setProperty('--d', `${Math.min(index, 4) * 90}ms`)
      element.classList.add('reveal-on-scroll')
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      timers.forEach(clearTimeout)

      elements.forEach((element) => {
        element.classList.remove('reveal-on-scroll', 'is-visible')
        element.style.removeProperty('--d')
      })
    }
  }, [])
}

export default useScrollReveal
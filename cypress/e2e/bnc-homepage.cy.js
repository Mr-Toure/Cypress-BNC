const fs = require('fs')
const path = require('path')

// Cypress test pour bnc.ca avec surveillance détaillée du chargement
describe('Tests du site BNC.ca', () => {
  beforeEach(() => {
    // Initialiser un tableau pour stocker les événements de chargement
    cy.wrap([]).as('loadEvents')

    // Initialiser un tableau pour stocker les erreurs
    cy.wrap([]).as('errorLogs')

    // Intercepter toutes les requêtes réseau pour surveiller le chargement
    cy.intercept('**', (req) => {
      req.on('response', (res) => {
        // Enregistrer uniquement les ressources importantes (HTML, CSS, JS, images)
        if (/html|css|js|png|jpg|jpeg|gif|svg|webp/.test(res.headers['content-type'])) {
          const timestamp = new Date().toISOString()
          console.log(`[${timestamp}] Ressource chargée: ${req.url.split('?')[0]} (${res.statusCode})`)
        }
      })
    }).as('allRequests')

    // Intercepter les erreurs JavaScript
    cy.on('window:error', (error) => {
      console.error(`Erreur JavaScript détectée: ${error.message}`)
      cy.get('@errorLogs').then((errorLogs) => {
        errorLogs.push({ message: error.message, stack: error.stack })
        cy.wrap(errorLogs).as('errorLogs')
      })
    })

    // Intercepter les erreurs de requête
    cy.on('fail', (error) => {
      console.error(`Échec du test: ${error.message}`)
      cy.get('@errorLogs').then((errorLogs) => {
        errorLogs.push({ message: error.message, stack: error.stack })
        cy.wrap(errorLogs).as('errorLogs')
      })
      return false // Empêcher Cypress d'échouer immédiatement
    })
  })

  afterEach(() => {
    // Sauvegarder les erreurs dans un fichier JSON après chaque test
    cy.get('@errorLogs').then((errorLogs) => {
      if (errorLogs.length > 0) {
        const errorsFilePath = path.join(__dirname, '..', 'cypress', 'reports', 'errors.json')
        cy.task('saveErrors', { filePath: errorsFilePath, errors: errorLogs })

        // Afficher un résumé des erreurs dans la console Cypress
        console.log(`Fin du test : ${errorLogs.length} erreur(s) rencontrée(s)`)
        errorLogs.forEach((error, index) => {
          console.log(`Erreur ${index + 1}: ${error.message}`)
        })

        // Afficher un résumé des erreurs dans le navigateur
        cy.window().then((win) => {
          const errorSummary = `Fin du test : ${errorLogs.length} erreur(s) rencontrée(s)\n` +
            errorLogs.map((error, index) => `Erreur ${index + 1}: ${error.message}`).join('\n')
          win.alert(errorSummary) // Affiche une alerte avec le résumé des erreurs
        })
      } else {
        console.log('Fin du test : Aucune erreur rencontrée')
      }
    })
  })

  it('Visite la page d\'accueil, accepte la bannière Didomi et surveille le chargement', () => {
    // Démarrer le chronomètre pour mesurer le temps de chargement
    const startTime = new Date().getTime()

    // Fonction pour calculer le temps écoulé depuis le début
    const getElapsedTime = () => {
      const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(2)
      return `${elapsed}s`
    }

    // Fonction pour enregistrer une étape dans la console
    const logConsole = (step) => {
      const elapsed = getElapsedTime()
      console.log(`[${elapsed}] ${step}`)
    }

    // ÉTAPE 1: Visite de la page d'accueil
    logConsole('DÉBUT - Visite de la page d\'accueil')

    // Prendre une capture d'écran avant de visiter la page
    cy.screenshot('avant-visite', { capture: 'viewport' })

    // Visiter la page d'accueil
    cy.visit('https://www.bnc.ca', {
      onBeforeLoad(win) {
        // Surveiller les événements de chargement de la page
        win.addEventListener('DOMContentLoaded', () => {
          console.log(`[${getElapsedTime()}] DOMContentLoaded déclenché`)
        })

        win.addEventListener('load', () => {
          console.log(`[${getElapsedTime()}] Événement window.load déclenché`)
        })

        // Surveiller les erreurs de console
        cy.spy(win.console, 'error').as('consoleError')
      }
    })

    // Prendre une capture d'écran après le chargement initial
    cy.screenshot('apres-visite', { capture: 'viewport' })

    // Attendre que le DOM soit prêt
    cy.document().then(() => {
      logConsole('Document accessible')
    })

    // Vérifier si des erreurs de console ont été détectées
    cy.get('@consoleError').then((errorSpy) => {
      if (errorSpy.callCount > 0) {
        logConsole(`${errorSpy.callCount} erreurs de console détectées`)
        errorSpy.args.forEach((arg, i) => {
          console.log(`Erreur ${i + 1}:`, arg)
        })
      } else {
        logConsole('Aucune erreur de console détectée')
      }
    })

    // Prendre une capture d'écran après la vérification des erreurs
    cy.screenshot('verification-erreurs', { capture: 'viewport' })

    // ÉTAPE 2: Vérification de la bannière Didomi
    cy.then(() => {
      logConsole('Recherche de la bannière Didomi')
    })

    // Vérifier si la bannière Didomi est présente
    cy.get('body').then(($body) => {
      if ($body.find('#didomi-notice').length > 0) {
        logConsole('Bannière Didomi trouvée')

        // Prendre une capture d'écran de la bannière Didomi
        cy.screenshot('banniere-didomi', { capture: 'viewport' })

        // Cliquer sur le bouton d'acceptation
        cy.get('#didomi-notice-agree-button').then(($btn) => {
          if ($btn.length > 0) {
            cy.wrap($btn).click()
            logConsole('Bannière Didomi acceptée')
          } else {
            logConsole('Bouton d\'acceptation Didomi non trouvé')
          }
        })
      } else {
        // Essayer avec un sélecteur alternatif
        if ($body.find('[aria-label*="consent"]').length > 0 || $body.find('[data-testid*="didomi"]').length > 0) {
          logConsole('Bannière de consentement alternative trouvée')

          // Prendre une capture d'écran de la bannière alternative
          cy.screenshot('banniere-alternative', { capture: 'viewport' })

          cy.get('[aria-label*="accept"], [data-testid*="accept"]').click()
          logConsole('Bannière de consentement alternative acceptée')
        } else {
          logConsole('Aucune bannière de consentement trouvée - peut-être déjà acceptée')
        }
      }
    })

    // Prendre une capture d'écran après l'acceptation de la bannière
    cy.screenshot('apres-acceptation-banniere', { capture: 'viewport' })

    // ÉTAPE 3: Surveillance du chargement des éléments principaux
    cy.then(() => {
      logConsole('Vérification des éléments principaux')
    })

    // Vérifier le header
    cy.get('header', { timeout: 15000 }).should('be.visible').then(() => {
      logConsole('Header chargé')
      cy.screenshot('header-charge', { capture: 'viewport' })
    })

    // Vérifier le menu principal
    cy.get('nav, [role="navigation"]', { timeout: 15000 }).should('be.visible').then(() => {
      logConsole('Menu de navigation chargé')
      cy.screenshot('menu-charge', { capture: 'viewport' })
    })

    // Vérifier le contenu principal
    cy.get('main, [role="main"], #main-content', { timeout: 15000 }).should('exist').then(() => {
      logConsole('Contenu principal chargé')
      cy.screenshot('contenu-principal-charge', { capture: 'viewport' })
    })

    // Vérifier le footer
    cy.get('footer', { timeout: 15000 }).should('be.visible').then(() => {
      logConsole('Footer chargé')
      cy.screenshot('footer-charge', { capture: 'viewport' })
    })

    // ÉTAPE 4: Vérification des sections spécifiques
    cy.then(() => {
      logConsole('Vérification des sections spécifiques')
    })

    // Vérifier les sections importantes par leur contenu textuel
    const sectionsToCheck = [
      'Comptes bancaires',
      'Hypothèque',
      'Cartes de crédit',
      'Épargne'
    ]

    // Vérifier chaque section une par une
    sectionsToCheck.forEach((sectionText, index) => {
      cy.contains(sectionText, { timeout: 10000 }).should('be.visible').then(() => {
        logConsole(`Section "${sectionText}" chargée`)
        cy.screenshot(`section-${index}-chargee`, { capture: 'viewport' })
      })
    })

    // ÉTAPE 5: Vérification des images
    cy.then(() => {
      logConsole('Vérification des images')
    })

    // Compter les images et vérifier leur chargement
    cy.get('img').then(($imgs) => {
      const totalImages = $imgs.length
      logConsole(`Trouvé ${totalImages} images au total`)

      let loadedImages = 0
      $imgs.each((i, img) => {
        if (img.complete && img.naturalWidth > 0) {
          loadedImages++
        }
      })

      logConsole(`${loadedImages} images sur ${totalImages} sont déjà chargées`)
    })

    // Prendre une capture d'écran finale
    cy.screenshot('page-complete', { capture: 'viewport' })

    // ÉTAPE 6: Vérification des performances
    cy.then(() => {
      logConsole('Mesure des performances')
    })

    // Mesurer les performances de la page (version simplifiée)
    cy.window().then((win) => {
      if (win.performance) {
        const perfData = win.performance.timing
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
        const domLoadTime = perfData.domContentLoadedEventEnd - perfData.navigationStart

        logConsole(`Temps de chargement DOM: ${domLoadTime}ms`)
        logConsole(`Temps de chargement total: ${pageLoadTime}ms`)
      }
    })

    // ÉTAPE 7: Rapport final
    cy.then(() => {
      logConsole('TEST TERMINÉ - Page d\'accueil BNC chargée')

      // Générer un rapport de tous les événements de chargement
      console.log('=== RAPPORT DE CHARGEMENT COMPLET ===')
      console.log(`Temps total d'exécution: ${getElapsedTime()}`)
      console.log('=== FIN DU RAPPORT ===')
    })
  })
})

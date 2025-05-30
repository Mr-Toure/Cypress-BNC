const { defineConfig } = require('cypress')
const fs = require('fs')
const path = require('path')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.bnc.ca',
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 120000,
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: false, // Conserver les captures d'écran précédentes
    setupNodeEvents(on, config) {
      // Créer un dossier pour les rapports s'il n'existe pas
      const reportsFolder = path.join(__dirname, 'cypress', 'reports')
      if (!fs.existsSync(reportsFolder)) {
        fs.mkdirSync(reportsFolder, { recursive: true })
      }

      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })

      // Ignorer les erreurs de console
      on('task', {
        ignoreConsoleErrors() {
          Cypress.on('uncaught:exception', (err) => {
            console.warn('Erreur ignorée :', err.message)
            return false // Empêche Cypress de bloquer le test
          })
          return null
        }
      })

      on('task', {
        saveErrors({ filePath, errors }) {
          const fs = require('fs')
          const path = require('path')

          // Créer le dossier s'il n'existe pas
          const dir = path.dirname(filePath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }

          // Écrire les erreurs dans le fichier
          fs.writeFileSync(filePath, JSON.stringify(errors, null, 2))
          console.log(`Erreurs sauvegardées dans : ${filePath}`)
          return null
        }
      })

      // Événement après la fin du test pour générer un rapport
      on('after:spec', (spec, results) => {
        // Créer un rapport simple avec l'horodatage
        const timestamp = new Date().toISOString().replace(/:/g, '-')
        const reportPath = path.join(reportsFolder, `load-report-${timestamp}.txt`)

        // Extraire les logs de la console depuis les résultats
        const logs = results.tests
          .flatMap(test => test.attempts)
          .flatMap(attempt => attempt.console)
          .filter(log => log && log.type === 'log')
          .map(log => log.message)
          .join('\n')

        fs.writeFileSync(reportPath, logs)
        console.log(`Rapport de chargement sauvegardé dans: ${reportPath}`)
      })
    },
  },
})

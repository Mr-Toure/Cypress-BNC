const fs = require('fs')
const path = require('path')

// Fonction pour générer un rapport HTML à partir des captures d'écran et des erreurs
function generateVisualReport() {
  const screenshotsDir = path.join(__dirname, '..', 'cypress', 'screenshots')
  const errorsFile = path.join(__dirname, '..', 'cypress', 'reports', 'errors.json')

  if (!fs.existsSync(screenshotsDir)) {
    console.log('Dossier de captures d\'écran non trouvé')
    return
  }

  // Charger les erreurs si le fichier existe
  let errors = []
  if (fs.existsSync(errorsFile)) {
    errors = JSON.parse(fs.readFileSync(errorsFile, 'utf-8'))
  }

  // Trouver le dossier de test le plus récent
  const testFolders = fs.readdirSync(screenshotsDir)

  if (testFolders.length === 0) {
    console.log('Aucune capture d\'écran trouvée')
    return
  }

  // Trier par date de modification (le plus récent en premier)
  testFolders.sort((a, b) => {
    return fs.statSync(path.join(screenshotsDir, b)).mtime.getTime() -
           fs.statSync(path.join(screenshotsDir, a)).mtime.getTime()
  })

  const latestTestFolder = path.join(screenshotsDir, testFolders[0])

  // Trouver toutes les captures d'écran dans ce dossier
  const screenshots = fs.readdirSync(latestTestFolder)
    .filter(file => file.endsWith('.png'))
    .sort((a, b) => {
      // Trier par ordre chronologique en fonction du nom du fichier
      const timeA = a.match(/(\d+\.\d+s)/)?.[1] || a
      const timeB = b.match(/(\d+\.\d+s)/)?.[1] || b
      return timeA.localeCompare(timeB)
    })

  // Générer le HTML
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport visuel et erreurs</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #e31837; /* Rouge BNC */
      text-align: center;
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: 30px;
      margin: 40px 0;
    }
    .screenshot-container {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .screenshot-header {
      background-color: #f5f5f5;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
    }
    .screenshot-image {
      padding: 15px;
      text-align: center;
    }
    .screenshot-image img {
      max-width: 100%;
      height: auto;
      border: 1px solid #eee;
    }
    .errors {
      margin-top: 20px;
      padding: 10px;
      background-color: #ffe6e6;
      border: 1px solid #ffcccc;
      border-radius: 5px;
    }
    .error-item {
      margin-bottom: 10px;
    }
    .error-item strong {
      color: #e31837;
    }
  </style>
</head>
<body>
  <h1>Rapport visuel et erreurs</h1>

  <p>Ce rapport montre le déroulement visuel du chargement de la page d'accueil de BNC.ca.</p>

  <div class="timeline">
    ${screenshots.map((screenshot, index) => {
      const screenshotPath = path.join(latestTestFolder, screenshot)
      const screenshotRelativePath = path.relative(path.join(__dirname, '..'), screenshotPath)
      const screenshotName = screenshot.replace('.png', '').replace(/-/g, ' ')

      return `
    <div class="screenshot-container">
      <div class="screenshot-header">
        Étape ${index + 1}: ${screenshotName}
      </div>
      <div class="screenshot-image">
        <img src="../${screenshotRelativePath}" alt="${screenshotName}" />
      </div>
    </div>`
    }).join('')}
  </div>

  ${errors.length > 0 ? `
  <div class="errors">
    <h2>Erreurs détectées</h2>
    ${errors.map((error, index) => `
      <div class="error-item">
        <strong>Erreur ${index + 1}:</strong> ${error.message}
        <pre>${error.stack}</pre>
      </div>
    `).join('')}
  </div>
  ` : '<p>Aucune erreur détectée.</p>'}
</body>
</html>
  `

  // Écrire le fichier HTML
  const reportPath = path.join(__dirname, '..', 'cypress', 'reports', 'visual-report.html')
  fs.writeFileSync(reportPath, html)
  console.log(`Rapport généré : ${reportPath}`)
  return reportPath
}

generateVisualReport()

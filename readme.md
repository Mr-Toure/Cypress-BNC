# Tests End-to-End BNC.ca avec Cypress

Ce projet contient des tests end-to-end pour le site web bnc.ca utilisant Cypress. Les tests vérifient:
1. La visite de la page d'accueil
2. L'acceptation de la bannière de consentement Didomi
3. Le chargement complet de la page d'accueil
4. La surveillance et le rapport des erreurs à chaque étape

## Structure du projet

```
tests-e2e-bnc/
├── cypress/
│   ├── e2e/
│   │   └── bnc-homepage.cy.js
│   ├── fixtures/
│   │   └── example.json
│   ├── support/
│   │   ├── commands.js
│   │   └── e2e.js
│   ├── screenshots/
│   └── reports/
├── scripts/
│   └── generate-load-report.js
├── cypress.config.js
├── package.json
└── README.md
```

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

## Installation

1. Clonez ce dépôt ou créez un nouveau dossier pour votre projet:

```bash
mkdir tests-e2e-bnc
cd tests-e2e-bnc

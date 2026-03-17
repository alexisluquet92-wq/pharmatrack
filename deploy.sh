#!/bin/bash
set -e

echo "🚀 PharmaTrack - Déploiement automatique"
echo "========================================"

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "❌ Node.js requis. Installe-le sur nodejs.org"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git requis."; exit 1; }

# Clone or update repo
if [ -d "pharmatrack-deploy" ]; then
  echo "📁 Dossier existant, mise à jour..."
  cd pharmatrack-deploy
  git pull
else
  echo "📥 Clonage du repo..."
  git clone https://github.com/alexisluquet92-wq/pharmatrack.git pharmatrack-deploy
  cd pharmatrack-deploy
fi

echo "📦 Installation des dépendances..."
npm install

echo "🔨 Build de vérification..."
npm run build

echo ""
echo "✅ Prêt ! Lance maintenant :"
echo "   npx vercel --prod"
echo ""
echo "Ou pour un déploiement immédiat si Vercel CLI est installé :"
if command -v vercel >/dev/null 2>&1; then
  echo "Déploiement en cours..."
  vercel --prod
else
  echo "   npm i -g vercel && vercel --prod"
fi

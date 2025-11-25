#!/bin/bash
# Fix package-lock.json sync issue

echo "🔧 Fixing package-lock.json sync issue..."

# Navigate to server directory
cd server

# Remove old lock file
echo "📦 Removing old package-lock.json..."
rm -f package-lock.json

# Regenerate lock file
echo "📦 Regenerating package-lock.json..."
npm install

# Check if successful
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json regenerated successfully"
    
    # Go back to root
    cd ..
    
    # Stage changes
    echo "📝 Staging changes..."
    git add server/package-lock.json
    
    # Commit
    echo "💾 Committing changes..."
    git commit -m "Fix: Regenerate package-lock.json to sync with package.json"
    
    # Push
    echo "🚀 Pushing to GitHub..."
    git push origin main
    
    echo "✅ Done! Render should now rebuild successfully."
else
    echo "❌ Failed to generate package-lock.json"
    exit 1
fi

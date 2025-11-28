#!/bin/bash
# Script to switch from Neon Cloud to Local Database

echo "🔄 Switching to Local Database..."

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Read the current Neon URL to save it
NEON_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
echo "📦 Backed up Neon URL: NEON_DATABASE_URL"

# Update .env file with local database URL
# The local Docker container is running on port 5433
LOCAL_DB_URL="postgresql://postgres:postgres@localhost:5433/asset_tracking"

# Create a temporary file with updated values
awk -v local_url="$LOCAL_DB_URL" -v neon_url="$NEON_URL" '
BEGIN { 
  local_updated = 0
  database_updated = 0  
  neon_updated = 0
}
/^LOCAL_DATABASE_URL=/ {
  print "LOCAL_DATABASE_URL=\"" local_url "\""
  local_updated = 1
  next
}
/^DATABASE_URL=/ && !/^DATABASE_URL_BACKUP=/ {
  print "DATABASE_URL=\"" local_url "\""
  database_updated = 1
  next
}
/^NEON_DATABASE_URL=/ {
  print "NEON_DATABASE_URL=" neon_url
  neon_updated = 1
  next
}
{ print }
END {
  if (local_updated == 0) print "\nLOCAL_DATABASE_URL=\"" local_url "\""
  if (database_updated == 0) print "DATABASE_URL=\"" local_url "\""
  if (neon_updated == 0 && neon_url != "") print "NEON_DATABASE_URL=" neon_url
}
' .env > .env.tmp

# Replace .env with updated version
mv .env.tmp .env

echo "✅ Environment updated:"
echo "   LOCAL_DATABASE_URL → localhost:5433"
echo "   DATABASE_URL → localhost:5433"
echo "   NEON_DATABASE_URL → (saved for later)"
echo ""
echo "⚠️  Please restart your server: Ctrl+C and run 'npm run dev' again"

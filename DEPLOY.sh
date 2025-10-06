#!/bin/bash

# Deployment script for Secure URL Share
# This script swaps the schema to the production version before deployment

echo "🚀 Preparing for deployment..."

# Backup current schema
echo "📦 Backing up current schema..."
cp prisma/schema.prisma prisma/schema.backup.prisma

# Use production schema
echo "🔄 Switching to production schema..."
cp prisma/schema.production.prisma prisma/schema.prisma

# Stage changes
echo "📝 Staging changes..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Deploy with user management features"

# Push to trigger Vercel deployment
echo "🚢 Pushing to GitHub (this will trigger Vercel deployment)..."
git push origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Vercel will now:"
echo "  1. Apply database migrations"
echo "  2. Generate Prisma client with new schema"
echo "  3. Build and deploy the application"
echo ""
echo "Monitor deployment at: https://vercel.com"
echo ""
echo "After successful deployment:"
echo "  1. Log in with nealsoni00@gmail.com"
echo "  2. You will have SUPERADMIN access"
echo "  3. Test all new features"
echo ""

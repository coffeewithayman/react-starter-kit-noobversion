#!/bin/bash

# Vercel Deployment Script for React Starter Kit
# This script automatically sets up environment variables and deploys to Vercel

set -e

echo "🚀 Starting Vercel deployment process..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found. Please create it first."
    exit 1
fi

# Source the environment variables
source .env.local

# Check required variables
REQUIRED_VARS=("VITE_CONVEX_URL" "VITE_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY" "VITE_CLERK_FRONTEND_API_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set in .env.local"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Function to add environment variable to Vercel
add_env_var() {
    local var_name=$1
    local var_value=$2
    local environments=${3:-"production preview development"}
    
    echo "📝 Adding $var_name to Vercel..."
    
    # Check if variable already exists
    if vercel env ls | grep -q "$var_name"; then
        echo "⚠️  $var_name already exists, removing old version..."
        echo "$var_value" | vercel env rm "$var_name" production --yes 2>/dev/null || true
        echo "$var_value" | vercel env rm "$var_name" preview --yes 2>/dev/null || true
        echo "$var_value" | vercel env rm "$var_name" development --yes 2>/dev/null || true
    fi
    
    # Add new variable
    for env in $environments; do
        echo "$var_value" | vercel env add "$var_name" "$env"
    done
}

echo "🔧 Setting up Vercel environment variables..."

# Get the Vercel project URL for FRONTEND_URL
echo "📡 Getting Vercel project information..."
VERCEL_PROJECT_URL=$(vercel ls --scope team 2>/dev/null | grep "$(basename $PWD)" | head -1 | awk '{print $2}' || echo "")

if [ -z "$VERCEL_PROJECT_URL" ]; then
    echo "⚠️  Could not automatically detect Vercel URL. You may need to set FRONTEND_URL manually."
    FRONTEND_URL_VALUE=${FRONTEND_URL:-"https://your-app.vercel.app"}
else
    FRONTEND_URL_VALUE="https://$VERCEL_PROJECT_URL"
fi

# Add all environment variables
add_env_var "VITE_CONVEX_URL" "$VITE_CONVEX_URL"
add_env_var "VITE_CLERK_PUBLISHABLE_KEY" "$VITE_CLERK_PUBLISHABLE_KEY"
add_env_var "CLERK_SECRET_KEY" "$CLERK_SECRET_KEY"
add_env_var "VITE_CLERK_FRONTEND_API_URL" "$VITE_CLERK_FRONTEND_API_URL"
add_env_var "FRONTEND_URL" "$FRONTEND_URL_VALUE"

# Add optional environment variables if they exist
if [ -n "$OPENAI_API_KEY" ]; then
    add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
fi

if [ -n "$POLAR_ACCESS_TOKEN" ]; then
    add_env_var "POLAR_ACCESS_TOKEN" "$POLAR_ACCESS_TOKEN"
fi

if [ -n "$POLAR_ORGANIZATION_ID" ]; then
    add_env_var "POLAR_ORGANIZATION_ID" "$POLAR_ORGANIZATION_ID"
fi

if [ -n "$POLAR_WEBHOOK_SECRET" ]; then
    add_env_var "POLAR_WEBHOOK_SECRET" "$POLAR_WEBHOOK_SECRET"
fi

echo "✅ Environment variables configured successfully"

# Deploy to production
echo "🚀 Deploying to Vercel production..."
vercel --prod

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at: $FRONTEND_URL_VALUE"
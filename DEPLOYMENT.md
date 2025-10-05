# Deployment Guide

## Making the App Work on Multiple Domains

This app is designed to work seamlessly on any domain without code changes:
- `localhost:3000` (local development)
- `url.nealsoni.com` (custom domain)
- `secure-url-share.vercel.app` (Vercel production)
- `*.vercel.app` (Vercel preview deployments)

## Google OAuth Setup

The **most important step** for multi-domain support is configuring Google OAuth redirect URIs.

### Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Navigate to **Credentials** → Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

```
http://localhost:3000/api/auth/callback/google
https://url.nealsoni.com/api/auth/callback/google
https://secure-url-share.vercel.app/api/auth/callback/google
```

**For Vercel preview deployments**, you can either:
- Add each preview URL individually (e.g., `https://secure-url-share-git-main-yourname.vercel.app/api/auth/callback/google`)
- Or create a separate OAuth client for previews with wildcard support

### Step 2: Vercel Environment Variables

In your Vercel project settings → Environment Variables:

1. **DO NOT set `NEXTAUTH_URL`** - NextAuth will auto-detect the domain from the request
2. **Set these variables** (for Production, Preview, and Development):

```bash
NEXTAUTH_SECRET=your_secret_here_generate_with_openssl_rand_base64_32
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=nealsoni00@gmail.com
```

3. **Database variables** (automatically set by Vercel Postgres):
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`

### Step 3: Custom Domain Setup (url.nealsoni.com)

1. In Vercel project settings → Domains, add `url.nealsoni.com`
2. Follow Vercel's DNS configuration instructions
3. **Add the redirect URI** to Google Console (as shown in Step 1)
4. No code changes needed! The app will automatically work

## Local Development

For local development, create `.env.local`:

```bash
# Copy from .env.local.example
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_here"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
POSTGRES_URL="your_local_postgres_url"
POSTGRES_PRISMA_URL="your_local_postgres_url"
ADMIN_EMAIL="nealsoni00@gmail.com"
```

Make sure `http://localhost:3000/api/auth/callback/google` is in your Google Console redirect URIs.

## Troubleshooting

### Login doesn't work on url.nealsoni.com

**Most likely cause**: The redirect URI is not added to Google Console.

**Solution**:
1. Check Google Cloud Console → Credentials → OAuth 2.0 Client
2. Verify `https://url.nealsoni.com/api/auth/callback/google` is listed
3. If not, add it and try again (may take a few minutes to propagate)

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI used doesn't match any in Google Console.

**Solution**:
1. Look at the error message - it will show the exact URI being used
2. Copy that exact URI and add it to Google Console
3. Make sure there are no typos or trailing slashes

### NEXTAUTH_URL is set on Vercel

**Problem**: Setting `NEXTAUTH_URL` on Vercel locks the app to one domain.

**Solution**:
1. Go to Vercel → Project Settings → Environment Variables
2. Delete the `NEXTAUTH_URL` variable from all environments
3. Redeploy the app
4. NextAuth will now auto-detect the domain from each request

## How It Works

NextAuth v4 has built-in multi-domain support:

1. When a request comes in, NextAuth reads the `Host` header
2. It automatically constructs callback URLs using the request's domain
3. No hardcoded URLs needed in the app code
4. Each domain must still be authorized in Google OAuth settings

The only requirement is that all domains must be registered in your Google OAuth Client's authorized redirect URIs.

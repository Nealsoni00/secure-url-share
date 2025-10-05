# Vercel Environment Variables Setup

Since Vercel automatically provides `POSTGRES_URL` and `POSTGRES_PRISMA_URL` through the Prisma Postgres integration, you need to map these to your custom variable names.

## Step 1: Go to Vercel Project Settings

1. Open your project in Vercel Dashboard
2. Go to **Settings** → **Environment Variables**

## Step 2: Add Custom Variable Mappings

Add these environment variables for **Production**, **Preview**, and **Development**:

### URL_SHARING_POSTGRES_URL
- **Value**: Reference the auto-provided variable
- In the value field, enter: `${POSTGRES_URL}`
- Or manually copy the value from the auto-provided `POSTGRES_URL` variable

### URL_SHARING_PRISMA_DATABASE_URL
- **Value**: `${POSTGRES_PRISMA_URL}`
- Or manually copy the value from the auto-provided `POSTGRES_PRISMA_URL` variable

### URL_SHARING_DATABASE_URL (if needed)
- **Value**: Same as `URL_SHARING_POSTGRES_URL`

## Alternative: Direct Variable Names

If you prefer, you can also just copy the connection string values directly:

1. Look at the auto-provided `POSTGRES_URL` value in Vercel
2. Copy that value
3. Create a new environment variable named `URL_SHARING_POSTGRES_URL`
4. Paste the value
5. Repeat for `URL_SHARING_PRISMA_DATABASE_URL` using `POSTGRES_PRISMA_URL`

## Other Required Variables

Don't forget to also set:

```
NEXTAUTH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=nealsoni00@gmail.com
```

**Important**: Do NOT set `NEXTAUTH_URL` on Vercel - it auto-detects the domain.

## Verification

After setting the variables:
1. Go to **Deployments**
2. Click **Redeploy** on the latest deployment
3. Check the build logs to ensure no "Environment variable not found" errors

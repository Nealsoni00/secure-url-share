# Local Development Note

## Current Status

Your local development environment is using the **old database schema** because the database migration cannot be applied locally (database is not accessible from your machine).

## Schema Files

There are now **three schema files**:

1. **`prisma/schema.prisma`** - Current/Local schema (old, for local dev)
2. **`prisma/schema.production.prisma`** - Production schema (new, with all features)
3. **`prisma/schema.local.prisma`** - Backup of local schema

## What This Means

The Prisma client is using the old schema without:
- `Organization` model
- `UserRole` enum
- `User.role` field
- `User.organizationId` field

## Limitations in Local Development

While running locally, these features will **NOT work**:
- ❌ Organization auto-assignment
- ❌ User management pages (will show errors)
- ❌ Organization pages (will show errors)
- ❌ Superadmin panel (will show errors)
- ❌ Role-based permissions (everyone is treated as ADMINISTRATOR if `isAdmin` is true)

## What WILL Work Locally

- ✅ Basic authentication and login
- ✅ Creating and managing protected URLs
- ✅ Accessing protected URLs with passwords/names
- ✅ Dashboard and URL management
- ✅ Basic user profile (with limited data)

## How to Get Full Functionality

### Deploy to Vercel (Recommended)

Use the deployment script:

```bash
./DEPLOY.sh
```

This script will:
1. Swap to the production schema (`schema.production.prisma`)
2. Commit and push to GitHub
3. Trigger Vercel deployment

Or manually:

```bash
# Swap to production schema
cp prisma/schema.production.prisma prisma/schema.prisma

# Commit and push
git add .
git commit -m "Deploy with user management features"
git push origin main
```

Once deployed, Vercel will:
1. Apply the database migration automatically
2. Generate the new Prisma client with production schema
3. Enable all new features

### Important: After Deployment

If you want to continue local development after deployment, you'll need to swap back:

```bash
# Restore local schema
cp prisma/schema.local.prisma prisma/schema.prisma

# Regenerate client
npx prisma generate
```

### Alternative: Connect to Production Database

If you want to test locally with the new features:

1. **Update `.env`** to use the production database URL:
   ```bash
   URL_SHARING_POSTGRES_URL="your_production_postgres_url"
   ```

2. **Apply migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Revert auth.ts changes**:
   - After deployment, you can pull the updated `lib/auth.ts` from the deployed version
   - Or manually restore the organization and role logic

⚠️ **Warning**: This will make changes to your production database. Only do this if you understand the implications.

## After Deployment

Once you deploy to Vercel and the migration runs successfully:

1. The full organization and user management system will be active
2. You can test all features on the deployed site
3. If you want to test locally, you can connect to the production database

## Files in Backward Compatibility Mode

Currently modified for backward compatibility:
- `lib/auth.ts` - Simplified to use old schema

Files ready but not functional locally:
- `app/organization/page.tsx`
- `app/users/page.tsx`
- `app/superadmin/page.tsx`
- `app/profile/page.tsx`
- `app/api/organizations/*`
- `app/api/users/*`

## Testing Checklist

### ✅ Can Test Locally
- [ ] Login with Google OAuth
- [ ] Create protected URLs
- [ ] Generate access links
- [ ] Access URLs with password/name auth
- [ ] View dashboard
- [ ] Basic URL management

### ❌ Cannot Test Locally (Deploy to Vercel)
- [ ] Organization auto-assignment
- [ ] User management
- [ ] Role-based access
- [ ] Superadmin features
- [ ] Organization settings

## Next Steps

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add user management and organization features"
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

3. **Wait for Vercel deployment** (~2-3 minutes)

4. **Test on deployed site**:
   - Visit your Vercel URL
   - Log in with admin email
   - Test all new features

5. **Optional**: If you need local testing with full features, connect to production database (see above)

## Support

For full deployment instructions, see: `DEPLOYMENT_INSTRUCTIONS.md`
For migration details, see: `DATABASE_MIGRATION_GUIDE.md`
